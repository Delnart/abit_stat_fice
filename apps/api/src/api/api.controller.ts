import { BadRequestException, Controller, ForbiddenException, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { SkipThrottle } from '@nestjs/throttler';
import { Model } from 'mongoose';
import type { EdboRequest } from '../scraper/edbo-parser';
import { ScrapeService } from '../scraper/scrape.service';
import { rankCompare, REJECTED, STATUS_TEXT } from '../scraper/stats-calculator';

const dayKey = (d: Date) => `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;

/** контрактних місць = order_contract, а якщо ЄДЕБО його не дає — ліцензійний обсяг мінус бюджет */
function contractSeats(doc: any): number | null {
  if (doc.orderContract != null) return doc.orderContract;
  if (doc.orderLicense != null) return Math.max(0, doc.orderLicense - (doc.seatsMax ?? 0));
  return null;
}

@Controller()
export class ApiController {
  constructor(
    @InjectModel('Offer') private readonly offers: Model<any>,
    @InjectModel('ApplicantsLatest') private readonly latest: Model<any>,
    @InjectModel('Snapshot') private readonly snapshots: Model<any>,
    private readonly scrape: ScrapeService,
  ) {}

  @Get('healthz')
  @SkipThrottle()
  health() {
    return { ok: true };
  }

  /** Тригер парсингу + keep-alive (cron-job.org). Захищений CRON_SECRET. */
  @Get('api/cron/scrape')
  @SkipThrottle()
  async cron(@Query('token') token?: string) {
    const secret = process.env.CRON_SECRET;
    if (!secret || token !== secret) throw new ForbiddenException();
    return this.scrape.runAll();
  }

  /** Головний ендпоінт дашборда — контракт = apps/web/lib/types.ts */
  @Get('api/offers')
  async list() {
    const docs = await this.offers.find({ enabled: true }).sort({ sortOrder: 1 }).lean();
    let updatedAt = new Date(0);

    const outPromises = docs.map(async (doc: any) => {
      const id = doc.offerId;
      
      const [last, lastAny, latest, sparkDocs] = await Promise.all([
        this.snapshots.findOne({ offerId: id, parseOk: true }).sort({ ts: -1 }).lean().exec(),
        this.snapshots.findOne({ offerId: id }).sort({ ts: -1 }).lean().exec(),
        this.latest.findOne({ offerId: id }).lean().exec(),
        this.snapshots.find({ offerId: id, parseOk: true }).sort({ ts: -1 }).limit(20).lean().exec()
      ]) as [any, any, any, any[]];

      if (!last || !latest) return null; // ще жодного вдалого парсу

      const fetchedAt: Date = latest.fetchedAt;

      // приріст за добу: різниця з найпізнішим снапшотом старшим за 24 год (або найпершим)
      const dayAgo = new Date(Date.now() - 24 * 3600_000);
      let base = await this.snapshots.findOne({ offerId: id, parseOk: true, ts: { $lte: dayAgo } }).sort({ ts: -1 }).lean().exec() as any;
      if (!base) {
        base = await this.snapshots.findOne({ offerId: id, parseOk: true }).sort({ ts: 1 }).lean().exec() as any;
      }
      
      const today = Math.max(0, last.total - (base?.total ?? last.total));

      // спарклайн: останні ≤20 снапшотів (крон ~кожні 10 хв) — реальна динаміка
      const spark = sparkDocs.map((s) => s.total).reverse();

      const cat = (label: string, c: any) => ({
        label, passed: c?.passed ?? 0, seats: c?.seats ?? 0,
        fc: c?.cutoff ?? null,
        of: last.forecast ? null : c?.cutoff ?? null,
      });

      return {
        id,
        code: doc.code ?? '',
        spec: doc.specialityName ?? '',
        name: doc.title ?? doc.specialityName ?? id,
        group: doc.group ?? null,
        form: doc.form ?? null,
        prev2025: doc.prev2025 ?? null,
        apps: last.total,
        today,
        budget: { total: doc.seatsMax, q1: last.q1?.seats ?? 0, q2: last.q2?.seats ?? 0, gen: last.general?.seats ?? 0 },
        budgetClaims: last.budgetClaims ?? null,
        contract: { seats: contractSeats(doc), apps: last.contractOnly ?? null },
        cats: [cat('Квота 1', last.q1), cat('Квота 2', last.q2), cat('Загальний конкурс', last.general)],
        spark,
        parseOk: lastAny ? lastAny.parseOk !== false : true,
        fetchedAt: fetchedAt.toISOString(),
      };
    });

    const results = await Promise.all(outPromises);
    const out = results.filter((r) => r !== null);

    for (const res of out) {
      if (!res) continue;
      const d = new Date(res.fetchedAt);
      if (d > updatedAt) updatedAt = d;
    }

    return { updatedAt: (updatedAt.getTime() ? updatedAt : new Date()).toISOString(), offers: out };
  }

  @Get('api/offers/:id/history')
  async history(@Param('id') id: string, @Query('days') daysQ = '30') {
    const n = Math.min(90, Math.max(1, parseInt(daysQ, 10) || 30));
    const from = new Date(Date.now() - n * 86_400_000);
    const snaps = await this.snapshots
      .find({ offerId: id, parseOk: true, ts: { $gte: from } }).sort({ ts: 1 }).lean() as any[];

    const byDay = new Map<string, any>();
    for (const s of snaps) byDay.set(dayKey(s.ts), s); // остання точка дня перемагає
    const days: string[] = [];
    const apps: number[] = [];
    for (const [day, s] of byDay) {
      days.push(day);
      apps.push(s.total);
    }
    return { days, apps };
  }

  @Get('api/offers/:id/applicants')
  async applicants(@Param('id') id: string) {
    const latest = await this.latest.findOne({ offerId: id }).lean() as any;
    if (!latest) throw new NotFoundException();
    const requests = latest.requests as EdboRequest[];
    // квотники — на початку списку (вони конкурують на квотні місця першими), далі решта за балом
    const quotaFirst = (a: EdboRequest, b: EdboRequest) => {
      const qa = a.q1 || a.q2 ? 0 : 1;
      const qb = b.q1 || b.q2 ? 0 : 1;
      return qa !== qb ? qa - qb : rankCompare(a, b);
    };
    return [...requests].sort(quotaFirst).map((r, i) => ({
      rank: i + 1,
      score: r.score,
      priority: r.priority,
      kv: r.q1 ? 'КВ1' : r.q2 ? 'КВ2' : null,
      budget: r.budget,
      statusId: r.statusId,
      status: STATUS_TEXT[r.statusId] ?? `Статус ${r.statusId}`,
      original: r.original,
    }));
  }

  /** «Куди проходжу з балом N» — фактична позиція серед поданих заяв, без прогнозів.
   *  quota=1|2 — позиція серед заяв відповідної квоти на квотні місця. */
  @Get('api/score-check')
  async scoreCheck(@Query('score') scoreQ?: string, @Query('quota') quotaQ?: string) {
    const score = parseFloat((scoreQ ?? '').replace(',', '.'));
    if (!isFinite(score) || score < 100 || score > 200) {
      throw new BadRequestException('score має бути числом 100–200');
    }
    const quota = quotaQ === '1' ? 1 : quotaQ === '2' ? 2 : null;
    const docs = await this.offers.find({ enabled: true }).sort({ sortOrder: 1 }).lean();
    const out: any[] = [];
    for (const doc of docs as any[]) {
      const latest = await this.latest.findOne({ offerId: doc.offerId }).lean() as any;
      if (!latest) continue;
      const requests = (latest.requests as EdboRequest[]).filter((r) => !REJECTED.has(r.statusId));
      let budgetList = requests.filter((r) => r.budget);
      let seats = doc.seatsMax ?? 0;
      if (quota === 1) { budgetList = budgetList.filter((r) => r.q1); seats = doc.seatsQ1 ?? 0; }
      if (quota === 2) { budgetList = budgetList.filter((r) => r.q2); seats = doc.seatsQ2 ?? 0; }
      const pos = (list: EdboRequest[]) => list.filter((r) => r.score > score).length + 1;
      out.push({
        id: doc.offerId,
        name: doc.title ?? doc.specialityName ?? doc.offerId,
        group: doc.group ?? null,
        form: doc.form ?? null,
        prev2025: doc.prev2025 ?? null,
        budget: seats > 0
          ? { rank: pos(budgetList), claims: budgetList.length, seats }
          : null,
        contract: { rank: pos(requests), claims: requests.length, seats: contractSeats(doc) },
      });
    }
    return { score, quota, offers: out };
  }
}
