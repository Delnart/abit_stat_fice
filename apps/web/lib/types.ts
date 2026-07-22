export type DemoState = 'normal' | 'loading' | 'stale' | 'error' | 'empty';

export interface Budget { total: number; q1: number; q2: number; gen: number }
export interface ContractInfo { seats: number | null; apps: number | null }
export interface Prev2025 { apps: number; cutoff: number | null }

export interface CatStat {
  label: string;
  passed: number;
  seats: number;
  /** розрахунковий поріг (не показуємо — прогнози прибрані з UI) */
  fc: number | null;
  /** офіційний прохідний після оприлюднення рекомендацій; до того null */
  of: number | null;
}

export interface Offer {
  id: string;
  code: string;
  spec: string;
  name: string;
  group?: string | null;
  form?: string | null;
  prev2025?: Prev2025 | null;
  apps: number;
  today: number;
  budget: Budget;
  budgetClaims?: number | null;
  contract?: ContractInfo | null;
  cats: CatStat[];
  spark: number[];
  parseOk: boolean;
  fetchedAt: string;
}

export interface OffersPayload { updatedAt: string; offers: Offer[] }

export interface HistoryPayload { days: string[]; apps: number[] }

export interface Applicant {
  rank: number;
  score: number;
  priority: number | null;
  kv: string | null;
  budget: boolean;
  statusId: number;
  status: string;
  original: boolean;
}

export interface ScoreCheckOffer {
  id: string;
  name: string;
  group: string | null;
  form: string | null;
  prev2025: Prev2025 | null;
  budget: { rank: number; claims: number; seats: number } | null;
  contract: { rank: number; claims: number; seats: number | null };
}
export interface ScoreCheckPayload { score: number; offers: ScoreCheckOffer[] }
export type Quota = 1 | 2 | null;
