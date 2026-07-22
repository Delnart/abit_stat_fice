// Мок-дані (працюють лише поки NEXT_PUBLIC_API_URL не задано);
// шейпи відповідей = контракт NestJS API.
import type { Applicant, DemoState, HistoryPayload, Offer, OffersPayload, ScoreCheckPayload } from './types';

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hsh(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

type Seed = Omit<Offer, 'parseOk' | 'fetchedAt'>;
const P2025: Record<string, Offer['prev2025']> = {
  f2: { apps: 2159, cutoff: 164 },
  f2i: { apps: 466, cutoff: 150.667 },
  f6: { apps: 1019, cutoff: 145.852 },
  f7: { apps: 802, cutoff: 146 },
};
const GROUP_OF: Record<string, string> = { f2: 'f2', f3: 'f2i', f6: 'f7', f7: 'f6' };
const mk = (
  id: string, code: string, spec: string, name: string,
  apps: number, today: number, budget: Offer['budget'],
  cats: Offer['cats'], spark: number[],
): Seed => {
  const budgetClaims = Math.round(apps * 0.62);
  return {
    id, code, spec, name, apps, today, budget, cats, spark,
    group: GROUP_OF[id], form: 'денна', prev2025: P2025[GROUP_OF[id]] ?? null,
    budgetClaims, contract: { seats: 120, apps: apps - budgetClaims },
  };
};

const SEED: Seed[] = [
  mk('f2', 'F2', '121', 'Інженерія програмного забезпечення', 1932, 124,
    { total: 45, q1: 5, q2: 5, gen: 35 },
    [
      { label: 'Квота 1', passed: 4, seats: 5, fc: 175.9, of: null },
      { label: 'Квота 2', passed: 5, seats: 5, fc: 172.4, of: null },
      { label: 'Загальний конкурс', passed: 35, seats: 35, fc: 189.1, of: null },
    ],
    [1560, 1601, 1655, 1704, 1762, 1848, 1932]),
  mk('f3', 'F3', '121', 'Програмування комп’ютерних ігор', 1204, 86,
    { total: 25, q1: 3, q2: 2, gen: 20 },
    [
      { label: 'Квота 1', passed: 3, seats: 3, fc: 178.0, of: null },
      { label: 'Квота 2', passed: 2, seats: 2, fc: 170.0, of: null },
      { label: 'Загальний конкурс', passed: 20, seats: 20, fc: 184.6, of: null },
    ],
    [980, 1022, 1058, 1091, 1135, 1178, 1204]),
  mk('f6', 'F6', '123', 'Комп’ютерна інженерія', 968, 51,
    { total: 60, q1: 6, q2: 4, gen: 50 },
    [
      { label: 'Квота 1', passed: 5, seats: 6, fc: 171.2, of: null },
      { label: 'Квота 2', passed: 2, seats: 4, fc: null, of: null },
      { label: 'Загальний конкурс', passed: 48, seats: 50, fc: 170.9, of: null },
    ],
    [812, 835, 861, 889, 915, 944, 968]),
  mk('f7', 'F7', '126', 'Інформаційні системи та технології', 742, 38,
    { total: 40, q1: 4, q2: 3, gen: 33 },
    [
      { label: 'Квота 1', passed: 4, seats: 4, fc: 172.5, of: null },
      { label: 'Квота 2', passed: 3, seats: 3, fc: 166.9, of: null },
      { label: 'Загальний конкурс', passed: 33, seats: 33, fc: 174.2, of: null },
    ],
    [604, 626, 651, 672, 698, 720, 742]),
];

let live: Seed[] = SEED.map((o) => ({ ...o, cats: o.cats.map((c) => ({ ...c })), spark: [...o.spark] }));
let lastTick = 0;
let updatedAt = Date.now();

function errFetchedAt(): string {
  const d = new Date();
  d.setHours(14, 22, 0, 0);
  return d.toISOString();
}

function bump() {
  const rr = rng(Date.now() >>> 0);
  live = live.map((o) => {
    const b = 3 + Math.floor(rr() * 15);
    const apps = o.apps + b;
    return { ...o, apps, today: o.today + b, spark: [...o.spark.slice(1), apps] };
  });
  updatedAt = Date.now();
  seriesCache.clear();
}

export function mockOffers(demo: DemoState): OffersPayload {
  if (demo === 'empty') return { updatedAt: new Date().toISOString(), offers: [] };
  if (demo === 'normal' && Date.now() - lastTick > 3000) {
    if (lastTick !== 0) bump();
    lastTick = Date.now();
  }
  const stale = demo === 'stale';
  const ts = stale ? Date.now() - 34 * 60_000 : updatedAt;
  return {
    updatedAt: new Date(ts).toISOString(),
    offers: live.map((o) => ({
      ...o,
      parseOk: !(demo === 'error' && o.id === 'f6'),
      fetchedAt: demo === 'error' && o.id === 'f6' ? errFetchedAt() : new Date(ts).toISOString(),
    })),
  };
}

const seriesCache = new Map<string, HistoryPayload>();
export function mockHistory(id: string): HistoryPayload {
  const hit = seriesCache.get(id);
  if (hit) return hit;
  const o = live.find((x) => x.id === id) ?? live[0];
  const r = rng(hsh(o.id) ^ 99);
  const days = 30;
  const apps: number[] = [];
  const labels: string[] = [];
  let base = o.apps * 0.42;
  const today = new Date();
  for (let i = 0; i < days; i++) {
    base += (o.apps - base) * 0.13 + r() * o.apps * 0.008;
    apps.push(Math.round(Math.min(o.apps, base)));
    const d = new Date(today);
    d.setDate(d.getDate() - (days - 1 - i));
    labels.push(String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0'));
  }
  apps[days - 1] = o.apps;
  const out = { days: labels, apps };
  seriesCache.set(id, out);
  return out;
}

const STATUS_TEXT: Record<number, string> = {
  1: 'Заява надійшла з сайту', 5: 'Зареєстровано', 6: 'Допущено', 9: 'Скасовано вступником',
};

const rowsCache = new Map<string, Applicant[]>();
export function mockApplicants(id: string): Applicant[] {
  const hit = rowsCache.get(id);
  if (hit) return hit;
  const o = live.find((x) => x.id === id) ?? live[0];
  const r = rng(hsh(o.id));
  const n = 200, top = 196.8, bot = 139.5;
  const arr: Omit<Applicant, 'rank'>[] = [];
  for (let i = 0; i < n; i++) {
    const f = i / (n - 1);
    let sc = top - (top - bot) * Math.pow(f, 1.18) + (r() - 0.5) * 1.4;
    sc = Math.max(bot, Math.min(top, sc));
    const pr = r();
    const kr = r();
    const st = r();
    const statusId = st < 0.7 ? 6 : st < 0.95 ? 5 : 9;
    arr.push({
      score: sc,
      priority: pr < 0.5 ? 1 : pr < 0.72 ? 2 : pr < 0.86 ? 3 : pr < 0.95 ? 4 : 5,
      kv: kr < 0.05 ? 'КВ1' : kr < 0.092 ? 'КВ2' : null,
      budget: r() < 0.62,
      statusId,
      status: STATUS_TEXT[statusId],
      original: r() < 0.3,
    });
  }
  // квотники — на початку списку, далі решта за балом
  arr.sort((a, b) => {
    const qa = a.kv ? 0 : 1, qb = b.kv ? 0 : 1;
    return qa !== qb ? qa - qb : b.score - a.score;
  });
  const out = arr.map((x, i) => ({ ...x, rank: i + 1 }));
  rowsCache.set(id, out);
  return out;
}

export function mockScoreCheck(score: number, quota: 1 | 2 | null = null): ScoreCheckPayload {
  return {
    score,
    offers: live.map((o) => {
      const rows = mockApplicants(o.id).filter((r) => r.statusId !== 9);
      let budgetList = rows.filter((r) => r.budget);
      let seats = o.budget.total;
      if (quota) {
        budgetList = budgetList.filter((r) => r.kv === `КВ${quota}`);
        seats = quota === 1 ? o.budget.q1 : o.budget.q2;
      }
      const pos = (list: typeof rows) => list.filter((r) => r.score > score).length + 1;
      return {
        id: o.id, name: o.name, group: o.group ?? null, form: o.form ?? null,
        prev2025: o.prev2025 ?? null,
        budget: seats > 0 ? { rank: pos(budgetList), claims: budgetList.length, seats } : null,
        contract: { rank: pos(rows), claims: rows.length, seats: o.contract?.seats ?? null },
      };
    }),
  };
}
