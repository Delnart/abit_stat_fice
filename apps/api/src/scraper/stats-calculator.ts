// Чистий розрахунок статистики по оферу (правила Вступ-2026, PLAN.md §5):
// пооферна симуляція кишень КВ1 → КВ2 → загальний конкурс.
// До оголошення рекомендацій це оцінка зверху → forecast: true.
import type { EdboRequest } from './edbo-parser';

// person_request_status_id ЄДЕБО
const ACTIVE = new Set([6, 11, 14]);   // Допущено / Рекомендовано (бюджет) / До наказу
const PENDING = new Set([1, 5]);       // Надійшла з сайту / Зареєстровано
export const REJECTED = new Set([4, 7, 8, 9, 12]);  // Відмовлено / Скасовано / Виключено

export const STATUS_TEXT: Record<number, string> = {
  1: 'Заява надійшла з сайту',
  4: 'Скасовано (втрата пріоритету)',
  5: 'Зареєстровано',
  6: 'Допущено',
  7: 'Відмова',
  8: 'Відмова закладом',
  9: 'Скасовано вступником',
  11: 'Рекомендовано (бюджет)',
  12: 'Виключено',
  13: 'Рекомендовано (контракт)',
  14: 'До наказу',
};

export interface Seats { max: number; q1: number; q2: number }
export interface CatResult { seats: number; passed: number; cutoff: number | null }
export interface OfferStats {
  total: number;         // усі заяви
  budgetClaims: number;  // претенденти на бюджет у симуляції
  forecast: boolean;     // у симуляції були «Зареєстровано» → оцінка зверху
  q1: CatResult;
  q2: CatResult;
  general: CatResult;
  /** ранги person_request_id, що пройшли (для мапінгу статусів у списку) */
  passedIds: Set<number>;
}

/** Квота = 10 % макс. обсягу, округлення, мінімум 1 місце (якщо бюджет взагалі є) */
export function quotaSeats(max: number): number {
  return max > 0 ? Math.max(1, Math.round(max * 0.1)) : 0;
}

/** Порівнює заявки за балом і пріоритетом. abit-poisk не надає коефіцієнтів, тому предметні бали ігноруються */
export function rankCompare(a: EdboRequest, b: EdboRequest): number {
  if (b.score !== a.score) return b.score - a.score;
  const pa = a.priority ?? 99, pb = b.priority ?? 99;
  return pa - pb;
}

function pocket(list: EdboRequest[], seats: number): CatResult {
  const passed = Math.min(list.length, seats);
  // розрахунок відсікання за останнім зарахованим; якщо недобір — прохідний невідомий
  const cutoff = seats > 0 && passed === seats ? list[passed - 1].score : null;
  return { seats, passed, cutoff };
}

export function calcStats(requests: EdboRequest[], seats: Seats): OfferStats {
  const eligible = requests
    .filter((r) => r.budget && !REJECTED.has(r.statusId) && (ACTIVE.has(r.statusId) || PENDING.has(r.statusId)))
    .sort(rankCompare);

  const forecast = eligible.some((r) => PENDING.has(r.statusId));

  const q1List = eligible.filter((r) => r.q1).slice(0, seats.q1);
  const q1Ids = new Set(q1List.map((r) => r.id));
  const q2List = eligible.filter((r) => r.q2 && !q1Ids.has(r.id)).slice(0, seats.q2);
  const q2Ids = new Set(q2List.map((r) => r.id));

  // невикористані місця квот не згорають — віддаються загальному конкурсу
  const genSeats = Math.max(0, seats.max - q1List.length - q2List.length);
  const genList = eligible.filter((r) => !q1Ids.has(r.id) && !q2Ids.has(r.id)).slice(0, genSeats);

  return {
    total: requests.length,
    budgetClaims: eligible.length,
    forecast,
    q1: pocket(q1List, seats.q1),
    q2: pocket(q2List, seats.q2),
    general: pocket(genList, genSeats),
    passedIds: new Set([...q1Ids, ...q2Ids, ...genList.map((r) => r.id)]),
  };
}
