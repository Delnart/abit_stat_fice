'use client';
import type { Applicant } from '../lib/types';

const W = 720, H = 200, PL = 8, PR = 8, PT = 10, PB = 24;
const IW = W - PL - PR, IH = H - PT - PB, BINS = 22;

export default function Histogram({ rows, myScore }: { rows: Applicant[]; myScore: number | null }) {
  const scores = rows.map((r) => r.score);
  const mn = Math.floor(Math.min(...scores)), mx = Math.ceil(Math.max(...scores));
  const step = (mx - mn) / BINS;
  const counts = new Array(BINS).fill(0);
  scores.forEach((s) => {
    let b = Math.floor((s - mn) / step);
    if (b < 0) b = 0;
    if (b >= BINS) b = BINS - 1;
    counts[b]++;
  });
  const maxc = Math.max(...counts);
  const bw = IW / BINS;
  const meX = myScore != null ? PL + ((Math.max(mn, Math.min(mx, myScore)) - mn) / (mx - mn)) * IW : 0;

  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: 'auto', display: 'block', marginTop: 8 }} role="img" aria-label="Розподіл конкурсних балів">
        {counts.map((c, i) => {
          const bs = mn + i * step;
          const inMe = myScore != null && myScore >= bs && myScore < bs + step;
          const h = (c / maxc) * IH;
          return (
            <rect
              key={i}
              x={(PL + i * bw + 1).toFixed(1)} y={(PT + IH - h).toFixed(1)}
              width={Math.max(1, bw - 2).toFixed(1)} height={h.toFixed(1)}
              rx="1.5" fill={inMe ? 'var(--ac)' : 'var(--bd2)'}
            />
          );
        })}
        {[mn, Math.round((mn + mx) / 2), mx].map((v, i) => (
          <text
            key={v} x={(PL + ((v - mn) / (mx - mn)) * IW).toFixed(1)} y={H - 4}
            fill="var(--t3)" fontSize="11" fontFamily="var(--fm)"
            textAnchor={i === 0 ? 'start' : i === 2 ? 'end' : 'middle'}
          >{v}</text>
        ))}
        {myScore != null && (
          <>
            <line x1={meX} y1={6} x2={meX} y2={PT + IH} stroke="var(--ac)" strokeWidth="1.6" strokeDasharray="3 3" />
            <circle cx={meX} cy={6} r="3" fill="var(--ac)" />
          </>
        )}
      </svg>
      <div className="chart-x-cap">конкурсний бал →</div>
    </>
  );
}
