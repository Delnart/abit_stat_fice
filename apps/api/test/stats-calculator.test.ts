import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { EdboRequest } from '../src/scraper/edbo-parser';
import { parseOfferHtml } from '../src/scraper/edbo-parser';
import { calcStats, quotaSeats } from '../src/scraper/stats-calculator';

const req = (o: Partial<EdboRequest>): EdboRequest => ({
  id: Math.floor(Math.random() * 1e9),
  statusId: 6,
  score: 150,
  priority: 1,
  q1: false,
  q2: false,
  budget: true,
  original: false,
  subjects: [],
  ...o,
});

describe('quotaSeats', () => {
  it('10 % з округленням, мінімум 1', () => {
    expect(quotaSeats(220)).toBe(22);
    expect(quotaSeats(45)).toBe(5);   // 4.5 → 5
    expect(quotaSeats(3)).toBe(1);    // 0.3 → мін. 1
    expect(quotaSeats(0)).toBe(0);
  });
});

describe('calcStats', () => {
  it('повна кишеня → прохідний = бал останнього; неповна → відсутній', () => {
    const rs = [
      req({ id: 1, score: 190 }),
      req({ id: 2, score: 180 }),
      req({ id: 3, score: 170 }),
    ];
    const s = calcStats(rs, { max: 2, q1: 0, q2: 0 });
    expect(s.general.passed).toBe(2);
    expect(s.general.cutoff).toBe(180);

    const s2 = calcStats(rs.slice(0, 1), { max: 2, q1: 0, q2: 0 });
    expect(s2.general.passed).toBe(1);
    expect(s2.general.cutoff).toBeNull();
  });

  it('невикористані квотні місця йдуть у загальний конкурс', () => {
    // 4 місця, кв1=1, кв2=1, але квотних заяв нема → загальний отримує всі 4
    const rs = [190, 185, 180, 175, 170].map((v, i) => req({ id: i + 1, score: v }));
    const s = calcStats(rs, { max: 4, q1: 1, q2: 1 });
    expect(s.q1.passed).toBe(0);
    expect(s.q1.cutoff).toBeNull();
    expect(s.general.seats).toBe(4);
    expect(s.general.passed).toBe(4);
    expect(s.general.cutoff).toBe(175);
  });

  it('квотник займає кишеню квоти і не їсть місце загального', () => {
    const rs = [
      req({ id: 1, score: 190, q1: true }),
      req({ id: 2, score: 185 }),
      req({ id: 3, score: 180 }),
    ];
    const s = calcStats(rs, { max: 3, q1: 1, q2: 0 });
    expect(s.q1.passed).toBe(1);
    expect(s.q1.cutoff).toBe(190);
    expect(s.general.seats).toBe(2); // 3 − 1 зайняте квотою
    expect(s.general.passed).toBe(2);
    expect(s.general.cutoff).toBe(180);
    expect([...s.passedIds].sort()).toEqual([1, 2, 3]);
  });

  it('тай-брейк: рівний бал → менший пріоритет виграє → вищий головний предмет', () => {
    const rs = [
      req({ id: 1, score: 180, priority: 3 }),
      req({ id: 2, score: 180, priority: 1 }),
      req({ id: 3, score: 180, priority: 1, subjects: [{ name: 'Математика', coefficient: 0.5, score: 190 }] }),
    ];
    const s = calcStats(rs, { max: 2, q1: 0, q2: 0 });
    expect(s.passedIds.has(3)).toBe(true); // пріоритет 1 + сильніший предмет
    expect(s.passedIds.has(2)).toBe(true);
    expect(s.passedIds.has(1)).toBe(false);
  });

  it('відхилені і контрактники не беруть участі; «Зареєстровано» → forecast', () => {
    const rs = [
      req({ id: 1, score: 199, statusId: 9 }),            // скасовано
      req({ id: 2, score: 198, budget: false }),          // контракт
      req({ id: 3, score: 150, statusId: 1 }),            // зареєстровано
      req({ id: 4, score: 140, statusId: 6 }),            // допущено
    ];
    const s = calcStats(rs, { max: 2, q1: 0, q2: 0 });
    expect(s.total).toBe(4);
    expect(s.budgetClaims).toBe(2);
    expect(s.forecast).toBe(true);
    expect(s.general.cutoff).toBe(140);
  });

  it('інтеграційно на фікстурі: 44 бюджетні, прогноз, кишені сходяться', () => {
    const html = readFileSync(join(__dirname, '../../../fixtures/offer-1589232-2026-07-20.html'), 'utf8');
    const { requests } = parseOfferHtml(html);
    const s = calcStats(requests, { max: 20, q1: 2, q2: 2 });
    expect(s.total).toBe(64);
    expect(s.budgetClaims).toBe(44);
    expect(s.forecast).toBe(true);
    // 4 заяви з КВ2 у фікстурі, кишеня на 2 → повна, у КВ1 заяв нема
    expect(s.q1.passed).toBe(0);
    expect(s.q1.cutoff).toBeNull();
    expect(s.q2.passed).toBe(2);
    expect(s.q2.cutoff).not.toBeNull();
    // загальний: 20 − 0 − 2 = 18 місць
    expect(s.general.seats).toBe(18);
    expect(s.general.passed).toBe(18);
    // прохідний = 18-й бал серед небюджетно-квотних — звіримо незалежним сортом
    const eligible = requests.filter((r) => r.budget).sort((a, b) => b.score - a.score);
    const q2ids = new Set(eligible.filter((r) => r.q2).slice(0, 2).map((r) => r.id));
    const gen = eligible.filter((r) => !q2ids.has(r.id));
    expect(s.general.cutoff).toBe(gen[17].score);
  });
});
