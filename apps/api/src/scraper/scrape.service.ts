import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EdboClient, sleep } from './edbo-client';
import { parseOfferHtml } from './edbo-parser';
import { calcStats, quotaSeats } from './stats-calculator';

@Injectable()
export class ScrapeService {
  private readonly log = new Logger(ScrapeService.name);
  private running = false;

  constructor(
    @InjectModel('Offer') private readonly offers: Model<any>,
    @InjectModel('ApplicantsLatest') private readonly latest: Model<any>,
    @InjectModel('Snapshot') private readonly snapshots: Model<any>,
    private readonly client: EdboClient,
  ) {}

  offerIds(): string[] {
    return (process.env.OFFER_IDS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  }

  /** Повний прохід по всіх оферах; помилка одного не валить решту */
  async runAll() {
    if (this.running) return { skipped: true };
    this.running = true;
    try {
      const results: any[] = [];
      const ids = this.offerIds();
      for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        try {
          results.push(await this.scrapeOne(id));
        } catch (e: any) {
          this.log.error(`offer ${id}: ${e.message ?? e}`);
          await this.snapshots.create({ offerId: id, ts: new Date(), parseOk: false });
          results.push({ id, ok: false, error: String(e.message ?? e) });
        }
        if (i < ids.length - 1) await sleep(1000); // тихий профіль: 1 запит/сек
      }
      return { skipped: false, results };
    } finally {
      this.running = false;
    }
  }

  private async scrapeOne(id: string) {
    const html = await this.client.fetchOffer(id);
    const { meta, requests } = parseOfferHtml(html);

    const doc = await this.offers.findOne({ offerId: id }).lean();
    // обсяг: ЄДЕБО — джерело правди; ручний конфіг у Mongo — лише поки order_budget порожній
    const seatsMax = meta.orderBudget ?? (doc as any)?.seatsMax ?? 0;
    const q1 = (doc as any)?.seatsQ1 || quotaSeats(seatsMax);
    const q2 = (doc as any)?.seatsQ2 || quotaSeats(seatsMax);
    const stats = calcStats(requests, { max: seatsMax, q1, q2 });

    const now = new Date();
    await this.offers.updateOne(
      { offerId: id },
      {
        $set: {
          code: meta.specialityCode,
          specialityName: meta.specialityName,
          universityName: meta.universityName,
          seatsMax, seatsQ1: q1, seatsQ2: q2,
          orderContract: meta.orderContract,
          orderLicense: meta.orderLicense,
        },
        $setOnInsert: { title: meta.name, enabled: true },
      },
      { upsert: true },
    );
    await this.latest.updateOne(
      { offerId: id },
      { $set: { fetchedAt: now, requests } },
      { upsert: true },
    );
    await this.snapshots.create({
      offerId: id, ts: now,
      total: stats.total, budgetClaims: stats.budgetClaims,
      contractOnly: requests.filter((r) => !r.budget).length,
      forecast: stats.forecast,
      q1: stats.q1, q2: stats.q2, general: stats.general, parseOk: true,
    });
    this.log.log(`offer ${id}: заяв ${stats.total}, бюджетних ${stats.budgetClaims}`);
    return { id, ok: true, total: stats.total };
  }
}
