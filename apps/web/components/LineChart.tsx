'use client';
import { useState } from 'react';
import { fi } from '../lib/format';
import type { HistoryPayload } from '../lib/types';

const W = 720, H = 240, PL = 44, PR = 12, PT = 16, PB = 26;
const IW = W - PL - PR, IH = H - PT - PB;

export default function LineChart({ history }: { history: HistoryPayload }) {
  const [hover, setHover] = useState<number | null>(null);
  const isScore = false;
  const vals = history.apps;
  const n = vals.length;

  let mn = Math.min(...vals), mx = Math.max(...vals);
  const pad = (mx - mn) * 0.12 || 1;
  mn -= pad; mx += pad;
  const X = (i: number) => PL + (i / (n - 1)) * IW;
  const Y = (v: number) => PT + IH - ((v - mn) / ((mx - mn) || 1)) * IH;

  if (n < 2) {
    return <div className="tbl-empty">Замало точок для графіка — дані накопичуються з кожним оновленням.</div>;
  }

  const pts = vals.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`);
  const line = pts.join(' ');
  const area = `${PL},${PT + IH} ${line} ${X(n - 1).toFixed(1)},${PT + IH}`;
  const seen = new Set<string>();
  const yticks = [0, 0.25, 0.5, 0.75, 1]
    .map((f) => {
      const v = mn + (mx - mn) * f;
      return { y: Y(v), label: isScore ? v.toFixed(1) : fi(v) };
    })
    .filter((t) => !seen.has(t.label) && seen.add(t.label)); // малий діапазон → без дублікатів
  const xt = [...new Set([0, (n - 1) >> 2, (n - 1) >> 1, ((n - 1) * 3) >> 2, n - 1])]
    .map((i, _, arr) => ({
      x: X(i),
      label: history.days[i],
      // крайні підписи не обрізаються об край
      anchor: (i === 0 ? 'start' : i === arr[arr.length - 1] ? 'end' : 'middle') as 'start' | 'middle' | 'end',
    }));

  const move = (clientX: number, el: SVGSVGElement) => {
    const r = el.getBoundingClientRect();
    const f = (clientX - r.left) / r.width;
    setHover(Math.max(0, Math.min(n - 1, Math.round(f * (n - 1)))));
  };

  return (
    <div className="chart-wrap">
      <svg
        viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
        style={{ width: '100%', height: 'auto', display: 'block', touchAction: 'none' }}
        onMouseMove={(e) => move(e.clientX, e.currentTarget)}
        onTouchMove={(e) => move(e.touches[0].clientX, e.currentTarget)}
        onMouseLeave={() => setHover(null)}
        onTouchEnd={() => setHover(null)}
        role="img" aria-label={isScore ? 'Динаміка прохідного балу' : 'Динаміка кількості заяв'}
      >
        {yticks.map((t, i) => (
          <g key={i}>
            <line x1={PL} y1={t.y} x2={W - PR} y2={t.y} stroke="var(--bd)" strokeWidth="1" />
            <text x={6} y={t.y + 3.5} fill="var(--t3)" fontSize="11" fontFamily="var(--fm)">{t.label}</text>
          </g>
        ))}
        {xt.map((t, i) => (
          <text key={i} x={t.x} y={H - 4} fill="var(--t3)" fontSize="11" fontFamily="var(--fm)" textAnchor={t.anchor}>{t.label}</text>
        ))}
        <polygon points={area} fill="var(--acw)" />
        <polyline points={line} fill="none" stroke="var(--ac)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={X(n - 1)} cy={Y(vals[n - 1])} r="3.4" fill="var(--ac)" />
        {hover != null && (
          <>
            <line x1={X(hover)} y1={12} x2={X(hover)} y2={PT + IH} stroke="var(--bd2)" strokeWidth="1" />
            <circle cx={X(hover)} cy={Y(vals[hover])} r="4" fill="var(--ac)" stroke="var(--s1)" strokeWidth="2" />
          </>
        )}
      </svg>
      {hover != null && (
        <div className="chart-tipbox" style={{ left: `${(X(hover) / W) * 100}%` }}>
          <span style={{ color: 'var(--t3)', fontFamily: 'var(--fm)' }}>{history.days[hover]}</span>{' · '}
          <b className="mono">{isScore ? vals[hover].toFixed(3) : fi(vals[hover])}</b>
        </div>
      )}
    </div>
  );
}
