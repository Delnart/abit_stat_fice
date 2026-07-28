'use client';
import Link from 'next/link';
import { fi, fscore, timeHM } from '../lib/format';
import type { CatStat, Offer } from '../lib/types';
import AnimatedNumber from './AnimatedNumber';

/** короткий шифр спеціальності для назв «підряд»: F2 Інженерія програмного забезпечення */
export const GROUP_CODE: Record<string, string> = { f2: 'F2', f2i: 'F2', f6: 'F6', f7: 'F7' };

export function Sparkline({ values, w = 150, h = 34 }: { values: number[]; w?: number; h?: number }) {
  const mn = Math.min(...values), mx = Math.max(...values);
  const dx = w / (values.length - 1);
  const Y = (x: number) => h - 2 - ((x - mn) / ((mx - mn) || 1)) * (h - 4);
  const pts = values.map((x, i) => (i * dx).toFixed(1) + ',' + Y(x).toFixed(1));
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: h, display: 'block', overflow: 'visible' }} aria-hidden="true">
      <polygon points={`0,${h} ${pts.join(' ')} ${w},${h}`} fill="var(--acw)" />
      <polyline points={pts.join(' ')} fill="none" stroke="var(--ac)" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={w} cy={Y(values[values.length - 1]).toFixed(1)} r="2.4" fill="var(--ac)" />
    </svg>
  );
}

/** Офіційний прохідний категорії (рендериться лише після оприлюднення рекомендацій) */
export function CatRow({ cat }: { cat: CatStat }) {
  const full = cat.passed >= cat.seats;
  return (
    <div className="catrow">
      <div className="lbl">
        <b>{cat.label}</b>
        <i>{cat.passed} / {cat.seats}</i>
      </div>
      <div className="bar">
        <i style={{ width: Math.min(100, Math.round((cat.passed / cat.seats) * 100)) + '%', opacity: full ? 1 : 0.55 }} />
      </div>
      <div className="val">
        {cat.of == null ? (
          <>
            <div className="missing">відсутній</div>
            <div className="free-note">є вільні місця</div>
          </>
        ) : (
          <div className="score-num">{fscore(cat.of)}</div>
        )}
      </div>
    </div>
  );
}

export default function OfferCard({ offer }: { offer: Offer }) {
  // Показуємо офіційні результати тільки після 1 серпня 2026, щоб старі тестові дані не ламали UI
  const hasOfficial = offer.cats.some((c) => c.of != null) && new Date() > new Date('2026-08-01');
  return (
    <Link href={`/offer/${offer.id}/`} className="card">
      {!offer.parseOk && (
        <div className="card-err">
          <span style={{ fontWeight: 700 }}>⚠</span>
          <span>Не вдалося оновити · дані станом на {timeHM(offer.fetchedAt)}</span>
        </div>
      )}
      <div className="card-top">
        <div className="offer-name" style={{ minWidth: 0 }}>
          {(GROUP_CODE[offer.group ?? ''] ?? offer.code) + ' ' + offer.name}
        </div>
        <span className="pill">{offer.form ?? '—'}</span>
      </div>

      <div className="apps-row">
        <AnimatedNumber value={offer.apps} className="apps-num" />
        <span className="delta-chip" key={offer.today} title="приріст заяв за добу">
          <span style={{ fontSize: 10 }}>▲</span>{fi(offer.today)}
        </span>
      </div>

      {offer.budget.total > 0 ? (
        <>
          <div className="mini4">
            <div><b>{offer.budget.total}</b><span>бюджет, місць</span></div>
            <div><b>{offer.contract?.seats ?? '—'}</b><span>контракт, місць</span></div>
            <div><b>{offer.budget.q1 > 0 ? offer.budget.q1 : '—'}</b><span>квота 1</span></div>
            <div><b>{offer.budget.q2 > 0 ? offer.budget.q2 : '—'}</b><span>квота 2</span></div>
          </div>
          {offer.budgetClaims != null && (
            <div className="claims-line">
              заяв на бюджет: <b className="mono">{fi(offer.budgetClaims)}</b> · контракт: <b className="mono">{fi(offer.contract?.apps ?? offer.apps - offer.budgetClaims)}</b>
            </div>
          )}
          {hasOfficial && (
            <div className="cats">
              {offer.cats.map((c) => <CatRow cat={c} key={c.label} />)}
            </div>
          )}
        </>
      ) : (
        /* бюджет на пропозиції не передбачено — показуємо лише контракт */
        <div className="mini4 mini2">
          <div><b>{offer.contract?.seats ?? '—'}</b><span>контракт, місць</span></div>
          <div><b className="mono">{fi(offer.contract?.apps ?? offer.apps)}</b><span>заяв на контракт</span></div>
        </div>
      )}

      {offer.prev2025 && (
        <div className="prev-line" title="За розрахунком нашого бота станом на 05.08.2025">
          Вступ-2025: <b className="mono">{fi(offer.prev2025.apps)}</b> заяв
          {offer.prev2025.cutoff != null && <> · прохідний <b className="mono">{offer.prev2025.cutoff}</b></>}
        </div>
      )}

      {offer.spark.length > 1 && (
        <div style={{ marginTop: 2 }}>
          <div className="spark-cap"><span>динаміка заяв</span></div>
          <Sparkline values={offer.spark} />
        </div>
      )}
    </Link>
  );
}
