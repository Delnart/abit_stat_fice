'use client';
import { useState } from 'react';
import Header from '../../components/Header';
import { ScoreResults } from '../../components/ScoreCheck';
import { DemoBar, Footer } from '../../components/ui';
import { fscore } from '../../lib/format';
import type { Quota } from '../../lib/types';

const REQUIRED = [
  { key: 'ukr', label: 'Українська мова', k: 0.3 },
  { key: 'math', label: 'Математика', k: 0.5 },
  { key: 'hist', label: 'Історія України', k: 0.2 },
] as const;
// четвертий предмет — на вибір; К4max — максимальний коефіцієнт серед вибіркових
const CHOICE = [
  { label: 'Фізика', k: 0.4 },
  { label: 'Іноземна мова', k: 0.3 },
  { label: 'Хімія', k: 0.3 },
  { label: 'Українська література', k: 0.2 },
  { label: 'Біологія', k: 0.2 },
  { label: 'Географія', k: 0.2 },
];
const K4MAX = Math.max(...CHOICE.map((c) => c.k));

const parseScore = (v: string) => {
  const n = parseFloat(v.replace(',', '.'));
  return isFinite(n) && n >= 100 && n <= 200 ? n : null;
};

export default function CalcPage() {
  const [vals, setVals] = useState<Record<string, string>>({ ukr: '', math: '', hist: '', choice: '' });
  const [choiceIdx, setChoiceIdx] = useState(0);
  const [quota, setQuota] = useState<Quota>(null);

  // формула ФІОТ: КБ = Σ(Кі×Пі) / (К1+К2+К3 + (К4max+К4)/2)
  const k4 = CHOICE[choiceIdx].k;
  const req = REQUIRED.map((s) => ({ k: s.k, v: parseScore(vals[s.key]) }));
  const v4 = parseScore(vals.choice);
  const complete = v4 != null && req.every((p) => p.v != null);
  const score = complete
    ? (req.reduce((s, p) => s + p.k * p.v!, 0) + k4 * v4!) /
      (req.reduce((s, p) => s + p.k, 0) + (K4MAX + k4) / 2)
    : null;

  const input = (key: string, placeholder = '100–200') => (
    <input
      className="score-input calc-input" type="text" inputMode="decimal"
      value={vals[key]} placeholder={placeholder}
      onChange={(e) => setVals({ ...vals, [key]: e.target.value })}
      aria-invalid={vals[key].trim() !== '' && parseScore(vals[key]) == null}
    />
  );

  return (
    <>
      <DemoBar />
      <div className="wrap">
        <Header />
        <div className="view-in">
          <section className="panel" style={{ marginBottom: 16 }}>
            <div className="panel-title" style={{ marginBottom: 14 }}>Калькулятор конкурсного балу</div>

            <div className="calc-grid">
              {REQUIRED.map((s) => (
                <label className="calc-field" key={s.key}>
                  <span className="calc-label">{s.label} <i>×{s.k}</i></span>
                  {input(s.key)}
                </label>
              ))}
              <label className="calc-field">
                <span className="calc-label calc-choice-label">
                  <select
                    className="calc-select" value={choiceIdx}
                    onChange={(e) => setChoiceIdx(Number(e.target.value))}
                    aria-label="Четвертий предмет на вибір"
                  >
                    {CHOICE.map((c, i) => <option value={i} key={c.label}>{c.label}</option>)}
                  </select>
                  <i>×{CHOICE[choiceIdx].k}</i>
                </span>
                {input('choice')}
              </label>
            </div>

            <div className="calc-quota">
              <span style={{ fontSize: 12.5, color: 'var(--t2)' }}>Пільгова квота:</span>
              <div className="seg">
                <button aria-pressed={quota == null} onClick={() => setQuota(null)}>Немає</button>
                <button aria-pressed={quota === 1} onClick={() => setQuota(1)}>Квота 1</button>
                <button aria-pressed={quota === 2} onClick={() => setQuota(2)}>Квота 2</button>
              </div>
            </div>

            {score != null && (
              <div className="calc-result">
                <span style={{ color: 'var(--t2)', fontSize: 13 }}>Ваш конкурсний бал</span>
                <span className="apps-num" style={{ fontSize: 40 }}>{fscore(score)}</span>
              </div>
            )}
          </section>

          {score != null && (
            <section className="panel score-panel">
              <div className="panel-title" style={{ marginBottom: 12 }}>
                Позиція з балом {fscore(score)}{quota ? ` (квота ${quota})` : ''}
              </div>
              <ScoreResults score={Math.round(score * 1000) / 1000} quota={quota} />
            </section>
          )}
        </div>
        <Footer />
      </div>
    </>
  );
}
