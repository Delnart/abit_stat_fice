// Критерій Фази 2: «GET /api/cron/scrape наповнює базу, GET /api/offers віддає метрики».
// Замість Atlas — mongodb-memory-server; замість ЄДЕБО — локальний сервер із фікстурою.
import { createServer, type Server } from 'node:http';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const fixture = readFileSync(join(__dirname, '../../../fixtures/offer-1589232-2026-07-20.html'), 'utf8');

let mongo: MongoMemoryServer;
let edbo: Server;
let app: INestApplication;

beforeAll(async () => {
  edbo = createServer((req, res) => {
    if (req.url?.startsWith('/offer/')) {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end(fixture);
    } else {
      res.writeHead(404).end();
    }
  });
  await new Promise<void>((r) => edbo.listen(0, '127.0.0.1', r));
  const edboPort = (edbo.address() as any).port;

  mongo = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongo.getUri('vstup');
  process.env.EDBO_BASE_URL = `http://127.0.0.1:${edboPort}`;
  process.env.OFFER_IDS = '1589232';
  process.env.CRON_SECRET = 'test-secret';

  const { AppModule } = await import('../src/app.module');
  const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = mod.createNestApplication();
  await app.init();

  // конфіг місць, як його руками задають на старті кампанії
  await app.get(getModelToken('Offer')).create({
    offerId: '1589232', title: 'С4 Психологія (тест)', seatsMax: 20, seatsQ1: 2, seatsQ2: 2, enabled: true,
  });
});

afterAll(async () => {
  await app?.close();
  await mongo?.stop();
  edbo?.close();
});

describe('пайплайн скрейп → API', () => {
  it('крон без токена → 403', async () => {
    await request(app.getHttpServer()).get('/api/cron/scrape').expect(403);
    await request(app.getHttpServer()).get('/api/cron/scrape?token=wrong').expect(403);
  });

  it('крон із токеном парсить офер і пише в базу', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/cron/scrape?token=test-secret')
      .expect(200);
    expect(res.body.results).toEqual([{ id: '1589232', ok: true, total: 64 }]);
  });

  it('GET /api/offers віддає метрики у веб-контракті', async () => {
    const res = await request(app.getHttpServer()).get('/api/offers').expect(200);
    expect(res.body.offers).toHaveLength(1);
    const o = res.body.offers[0];
    expect(o.id).toBe('1589232');
    expect(o.name).toBe('С4 Психологія (тест)');
    expect(o.code).toBe('C4');
    expect(o.apps).toBe(64);
    expect(o.parseOk).toBe(true);
    // КВ1-заяв у фікстурі нема → 2 невикористані місця КВ1 перетікають у загальний: 20−0−2=18
    expect(o.budget).toEqual({ total: 20, q1: 2, q2: 2, gen: 18 });
    expect(o.cats.map((c: any) => c.label)).toEqual(['Квота 1', 'Квота 2', 'Загальний конкурс']);
    // старт кампанії: всі «Зареєстровано» → прогноз; официальних цифр ще нема
    expect(o.cats[2].fc).toBeTypeOf('number');
    expect(o.cats[2].of).toBeNull();
    expect(o.cats[0].fc).toBeNull(); // КВ1 заяв нема → відсутній
    expect(o.spark.at(-1)).toBe(64);
    expect(o.budgetClaims).toBe(44);
    expect(o.contract).toEqual({ seats: 67, apps: 20 }); // 64 заяв − 44 бюджетні
  });

  it('GET /api/offers/:id/applicants — квотники першими, реальні статуси', async () => {
    const res = await request(app.getHttpServer()).get('/api/offers/1589232/applicants').expect(200);
    expect(res.body).toHaveLength(64);
    expect(res.body[0].rank).toBe(1);
    // у фікстурі 4 заяви з КВ2 — вони мають відкривати список
    expect(res.body.slice(0, 4).every((r: any) => r.kv)).toBe(true);
    expect(res.body[4].kv).toBeNull();
    const rest = res.body.slice(4).map((r: any) => r.score);
    expect([...rest].sort((a, b) => b - a)).toEqual(rest);
    expect(res.body.every((r: any) => r.statusId === 1)).toBe(true);
    expect(res.body[0].status).toBe('Заява надійшла з сайту');
    expect(res.body.filter((r: any) => r.budget).length).toBe(44);
  });

  it('GET /api/offers/:id/history — вирівняні ряди', async () => {
    const res = await request(app.getHttpServer()).get('/api/offers/1589232/history').expect(200);
    expect(res.body.days.length).toBeGreaterThan(0);
    expect(res.body.apps.length).toBe(res.body.days.length);
    expect(res.body.apps.at(-1)).toBe(64);
  });

  it('GET /api/score-check — фактична позиція серед заяв', async () => {
    await request(app.getHttpServer()).get('/api/score-check?score=999').expect(400);
    const res = await request(app.getHttpServer()).get('/api/score-check?score=150').expect(200);
    const o = res.body.offers[0];
    expect(o.id).toBe('1589232');
    expect(o.budget.claims).toBe(44);
    expect(o.budget.seats).toBe(20);
    expect(o.budget.rank).toBeGreaterThan(0);
    expect(o.contract.claims).toBe(64);
    expect(o.contract.seats).toBe(67);
    // незалежна перевірка позиції: к-сть бюджетних із балом > 150 + 1
    const apps = await request(app.getHttpServer()).get('/api/offers/1589232/applicants');
    const expected = apps.body.filter((r: any) => r.budget && r.score > 150).length + 1;
    expect(o.budget.rank).toBe(expected);
  });

  it('healthz живий', async () => {
    const res = await request(app.getHttpServer()).get('/healthz').expect(200);
    expect(res.body).toEqual({ ok: true });
  });
});
