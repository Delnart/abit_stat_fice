'use client';
import { useEffect, useRef, useState } from 'react';
import { fscore } from '../lib/format';
import type { Applicant } from '../lib/types';

// колір/гліф за person_request_status_id ЄДЕБО
const glyphFor = (id: number) => ([11, 13, 14].includes(id) ? '●' : [8, 9, 12].includes(id) ? '×' : '○');
const colorFor = (id: number) =>
  [11, 13, 14].includes(id) ? 'var(--ok)' : [8, 9, 12].includes(id) ? 'var(--t3)' : 'var(--t2)';

type Row = { isMe: true; score: number } | (Applicant & { isMe?: false });

export function useIsMobile() {
  const [m, setM] = useState(false);
  useEffect(() => {
    const mq = matchMedia('(max-width: 719px)');
    const f = () => setM(mq.matches);
    f();
    mq.addEventListener('change', f);
    return () => mq.removeEventListener('change', f);
  }, []);
  return m;
}

export default function RankTable({ rows, myScore }: { rows: Applicant[]; myScore: number | null }) {
  const mobile = useIsMobile();
  const [search, setSearch] = useState('');
  const [fl, setFl] = useState({ budget: false, kv: false });
  const [scrollTop, setScrollTop] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const q = search.trim().replace(',', '.');
  let list: Applicant[] = rows;
  if (q) list = list.filter((r) => String(r.rank).startsWith(q) || r.score.toFixed(3).startsWith(q));
  if (fl.budget) list = list.filter((r) => r.budget);
  if (fl.kv) list = list.filter((r) => r.kv);

  const filtered = q !== '' || fl.budget || fl.kv;
  let disp: Row[] = list;
  if (myScore != null && !filtered) {
    const idx = list.filter((r) => r.score > myScore).length;
    disp = [...list.slice(0, idx), { isMe: true, score: myScore }, ...list.slice(idx)];
  }

  // ponytail: ручне віконце зі спейсерами — react-window не потрібен до ~2000 рядків
  const rowH = mobile ? 92 : 40;
  const vh = mobile ? 440 : 520;
  const total = disp.length;
  const start = Math.max(0, Math.floor(scrollTop / rowH) - 6);
  const end = Math.min(total, start + Math.ceil(vh / rowH) + 12);
  const slice = disp.slice(start, end);

  const resetScroll = () => { setScrollTop(0); if (scrollRef.current) scrollRef.current.scrollTop = 0; };

  return (
    <div className="panel">
      <div className="panel-head" style={{ marginBottom: 12 }}>
        <div className="panel-title">Рейтинговий список<span> · {rows.length} заявників</span></div>
        <input
          className="search-input" type="text" value={search}
          onChange={(e) => { setSearch(e.target.value); resetScroll(); }}
          placeholder="Пошук за № або балом…" aria-label="Пошук у рейтинговому списку"
        />
      </div>
      <div className="fchips">
        <button className="fchip" aria-pressed={fl.budget} onClick={() => { setFl({ ...fl, budget: !fl.budget }); resetScroll(); }}>претенденти на бюджет</button>
        <button className="fchip" aria-pressed={fl.kv} onClick={() => { setFl({ ...fl, kv: !fl.kv }); resetScroll(); }}>пільгові квоти</button>
      </div>

      {total === 0 ? (
        <div className="tbl-empty">Нічого не знайдено за заданими умовами.</div>
      ) : (
        <>
          {!mobile && (
            <div className="thead">
              <span>№</span><span>Бал</span><span>Пріор.</span><span>Квота</span><span>Статус (ЄДЕБО)</span>
            </div>
          )}
          <div
            ref={scrollRef} className="tscroll" style={{ height: vh }}
            onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
          >
            <div style={{ height: start * rowH }} />
            {slice.map((r) =>
              r.isMe ? (
                mobile ? (
                  <div className="mrow me" style={{ height: rowH - 8 }} key="me">
                    <div className="me-line" style={{ fontSize: 13 }}>
                      <i />Ваш бал <span className="mono">{fscore(r.score)}</span> — приблизно тут
                    </div>
                  </div>
                ) : (
                  <div className="trow me" style={{ height: rowH }} key="me">
                    <span className="me-line"><i />Ваш бал <span className="mono">{fscore(r.score)}</span> — приблизно тут у списку</span>
                  </div>
                )
              ) : mobile ? (
                <div className="mrow" key={r.rank} style={{ height: rowH - 8 }}>
                  <div className="mrow-top">
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                      <span className="mono" style={{ fontSize: 12, color: 'var(--t3)' }}>№{r.rank}</span>
                      <span className="mono" style={{ fontSize: 19, fontWeight: 650 }}>{fscore(r.score)}</span>
                    </div>
                    <span className="st-cell" style={{ color: colorFor(r.statusId) }}>
                      <span aria-hidden="true">{glyphFor(r.statusId)}</span>
                      <span className="st-name">{r.status}</span>
                    </span>
                  </div>
                  <div className="mrow-meta">
                    {r.priority != null && <span className="prio">пріоритет {r.priority}</span>}
                    <span className="prio">{r.budget ? 'бюджет' : 'контракт'}</span>
                    {r.kv && <span className="kv-chip">{r.kv}</span>}
                  </div>
                </div>
              ) : (
                <div className="trow" key={r.rank} style={{ height: rowH }}>
                  <span className="mono" style={{ color: 'var(--t2)' }}>{r.rank}</span>
                  <span className="mono" style={{ fontWeight: 600 }}>{fscore(r.score)}</span>
                  <span className="mono" style={{ color: 'var(--t2)' }}>{r.priority ?? '—'}</span>
                  <span>{r.kv && <span className="kv-chip">{r.kv}</span>}</span>
                  <span className="st-cell" style={{ color: colorFor(r.statusId) }}>
                    <span aria-hidden="true">{glyphFor(r.statusId)}</span>
                    <span className="st-name">{r.status}{r.budget ? '' : ' · контракт'}</span>
                  </span>
                </div>
              ),
            )}
            <div style={{ height: Math.max(0, (total - end) * rowH) }} />
          </div>
        </>
      )}
    </div>
  );
}
