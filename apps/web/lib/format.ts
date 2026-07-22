/** 1932 → "1 932" (вузький нерозривний пробіл) */
export const fi = (n: number) =>
  String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

export const fscore = (n: number) => n.toFixed(3);

export function agoLabel(ts: number, now: number): string {
  const s = (now - ts) / 1000;
  if (s < 25) return 'щойно';
  if (s < 90) return 'хвилину тому';
  return Math.round(s / 60) + ' хв тому';
}

export function timeHM(iso: string): string {
  const d = new Date(iso);
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}
