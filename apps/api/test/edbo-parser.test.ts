import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ParseError, parseOfferHtml } from '../src/scraper/edbo-parser';

const FIXTURE = join(__dirname, '../../../fixtures/offer-1589232-2026-07-20.html');
const html = readFileSync(FIXTURE, 'utf8');

describe('parseOfferHtml (фікстура 1589232, 2026-07-20)', () => {
  const parsed = parseOfferHtml(html);

  it('дістає всі 64 заяви', () => {
    expect(parsed.requests).toHaveLength(64);
  });

  it('нормалізує поля першої заяви', () => {
    const r = parsed.requests[0];
    expect(r.id).toBe(16453184);
    expect(r.score).toBe(149.054);
    expect(r.priority).toBe(2);
    expect(r.statusId).toBe(1);
    expect(r.q1).toBe(false);
    expect(r.q2).toBe(true);
    expect(r.budget).toBe(true);
    expect(r.original).toBe(false);
    expect(r.subjects.map((s) => s.name)).toContain('Математика');
    expect(r.subjects.find((s) => s.name === 'Математика')!.coefficient).toBe(0.4);
  });

  it('маркери по всьому списку сходяться з фікстурою', () => {
    expect(parsed.requests.filter((r) => r.q2).length).toBe(4);
    expect(parsed.requests.filter((r) => r.q1).length).toBe(0);
    expect(parsed.requests.filter((r) => r.budget).length).toBe(44);
    expect(parsed.requests.filter((r) => r.original).length).toBe(0);
    expect(parsed.requests.every((r) => r.statusId === 1)).toBe(true);
  });

  it('дістає метадані офера', () => {
    expect(parsed.meta.specialityCode).toBe('C4');
    expect(parsed.meta.specialityName).toBe('Психологія');
    expect(parsed.meta.orderBudget).toBeNull();
    expect(parsed.meta.orderContract).toBe(67);
    expect(parsed.meta.name).toContain('Психологія');
  });

  it('падає з ParseError на чужому HTML (алерт про зміну формату)', () => {
    expect(() => parseOfferHtml('<html><body>нема чанків</body></html>')).toThrow(ParseError);
    expect(() => parseOfferHtml('self.__next_f.push([1,"без реквестів"])')).toThrow(ParseError);
  });
});
