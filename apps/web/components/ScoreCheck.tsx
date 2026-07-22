'use client';
// «Куди проходжу з моїм балом?» — фактична позиція серед уже поданих заяв, без прогнозів
import { useState } from 'react';
import { useScoreCheck } from '../lib/api';
import { fi } from '../lib/format';
import type { Quota } from '../lib/types';
import { GROUP_CODE } from './OfferCard';

export function ScoreResults({ score, quota }: { score: number; quota: Quota }) {
  const data = useScoreCheck(score, quota);
  if (!data) return null;
  const budgetLabel = quota ? `Квота ${quota}` : 'Бюджет';
  return (
    <>
      <div className="sc-head">
        <span>Пропозиція</span><span>{budgetLabel}</span><span>Контракт</span>
      </div>
      {data.offers.map((o) => (
        <div className="sc-row" key={o.id}>
          <div className="sc-name">
            <span className="sc-title">{(GROUP_CODE[o.group ?? ''] ?? '') + ' ' + o.name}</span>
            <span className="pill">{o.form}</span>
          </div>
          <div className="sc-cell" data-label={budgetLabel}>
            {o.budget ? (
              <>
                <span className={'sc-badge ' + (o.budget.rank <= o.budget.seats ? 'in' : 'out')}>
                  {o.budget.rank <= o.budget.seats ? '✓ зараз у межах місць' : 'зараз поза місцями'}
                </span>
                <span className="sc-pos">
                  ви <b className="mono">{fi(o.budget.rank)}-й</b> із <b className="mono">{fi(o.budget.claims)}</b> претендентів
                </span>
                <span className="sc-pos">
                  {quota ? 'квотних місць' : 'бюджетних місць'}: <b className="mono">{o.budget.seats}</b>
                </span>
                {!quota && o.prev2025?.cutoff != null && (
                  <span className="sc-prev" style={{ color: score >= o.prev2025.cutoff ? 'var(--ok)' : 'var(--t3)' }}>
                    {score >= o.prev2025.cutoff ? '✓ ваш бал вищий за прохідний-2025 (' : 'торік прохідний був вищим (' }{o.prev2025.cutoff})
                  </span>
                )}
              </>
            ) : (
              <span className="sc-pos" style={{ color: 'var(--t3)' }}>
                {quota ? 'квотних місць немає' : 'бюджет не передбачено'}
              </span>
            )}
          </div>
          <div className="sc-cell" data-label="Контракт">
            <span className="sc-pos">
              ви <b className="mono">{fi(o.contract.rank)}-й</b> із <b className="mono">{fi(o.contract.claims)}</b> претендентів
            </span>
            {o.contract.seats != null && (
              <span className="sc-pos">контрактних місць: <b className="mono">{o.contract.seats}</b></span>
            )}
          </div>
        </div>
      ))}
      <div className="sc-note">
        Це позиція вашого бала серед заяв, поданих на цю мить, — не гарантія і не прогноз вступу.
        Заяви ще подаються, а рекомендації ЄДЕБО розішле ~6 серпня.
      </div>
    </>
  );
}

export default function ScoreCheck() {
  const [val, setVal] = useState('');
  const parsed = parseFloat(val.replace(',', '.'));
  const score = isFinite(parsed) && parsed >= 100 && parsed <= 200 ? parsed : null;

  return (
    <section className="panel score-panel">
      <div className="panel-head" style={{ marginBottom: score != null ? 12 : 4 }}>
        <div>
          <div className="panel-title">Куди проходжу з моїм балом?</div>
          <div className="hint" style={{ color: 'var(--t3)', fontSize: 12.5 }}>
            не знаєте свій бал? — <a href="/calc/" style={{ color: 'var(--ac)' }}>порахуйте</a>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label htmlFor="scoreCheck" style={{ fontSize: 13, color: 'var(--t2)', whiteSpace: 'nowrap' }}>Мій бал</label>
          <input
            id="scoreCheck" className="score-input" type="text" inputMode="decimal"
            value={val} onChange={(e) => setVal(e.target.value)} placeholder="напр. 154.500"
          />
        </div>
      </div>
      {score != null && <ScoreResults score={score} quota={null} />}
    </section>
  );
}
