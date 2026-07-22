'use client';
// Шар даних: без NEXT_PUBLIC_API_URL працює на мок-даних макета,
// з ним — на REST NestJS (контракт із PLAN.md §6). SWR-полінг раз на хвилину.
import useSWR from 'swr';
import { mockApplicants, mockHistory, mockOffers, mockScoreCheck } from './mock';
import { useApp } from './providers';
import type { Applicant, HistoryPayload, OffersPayload, Quota, ScoreCheckPayload } from './types';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';
export const MOCK = !API;
export const REFRESH_MS = MOCK ? 12_000 : 60_000;

async function getJson<T>(path: string): Promise<T> {
  const r = await fetch(API + path);
  if (!r.ok) throw new Error(`API ${r.status}`);
  return r.json();
}

export function useOffers() {
  const { demo } = useApp();
  const key = MOCK ? ['offers', demo] : 'offers';
  const { data, isLoading, error } = useSWR<OffersPayload>(
    key,
    () => (MOCK ? Promise.resolve(mockOffers(demo)) : getJson('/api/offers')),
    { refreshInterval: REFRESH_MS, keepPreviousData: true },
  );
  const forcedLoading = MOCK && demo === 'loading';
  return {
    data: forcedLoading ? undefined : data,
    isLoading: forcedLoading || isLoading,
    error,
  };
}

export function useHistory(id: string) {
  const { data } = useSWR<HistoryPayload>(
    ['history', id],
    () => (MOCK ? Promise.resolve(mockHistory(id)) : getJson(`/api/offers/${id}/history`)),
    { refreshInterval: REFRESH_MS },
  );
  return data;
}

export function useScoreCheck(score: number | null, quota: Quota = null) {
  const { data } = useSWR<ScoreCheckPayload>(
    score != null ? ['score-check', score, quota] : null,
    () => (MOCK
      ? Promise.resolve(mockScoreCheck(score!, quota))
      : getJson(`/api/score-check?score=${score}${quota ? `&quota=${quota}` : ''}`)),
    { keepPreviousData: true },
  );
  return data;
}

export function useApplicants(id: string) {
  const { data } = useSWR<Applicant[]>(
    ['applicants', id],
    () => (MOCK ? Promise.resolve(mockApplicants(id)) : getJson(`/api/offers/${id}/applicants`)),
    { refreshInterval: REFRESH_MS },
  );
  return data;
}
