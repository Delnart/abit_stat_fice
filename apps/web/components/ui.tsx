'use client';
// Дрібні шматки UI: банер застарілості, порожній стан, скелетони, футер, демо-панель
import { MOCK } from '../lib/api';
import { useApp } from '../lib/providers';
import type { DemoState } from '../lib/types';

export function StaleBanner() {
  return (
    <div className="stale-banner" role="status">
      <span style={{ flex: '0 0 auto', fontWeight: 700 }}>⚠</span>
      <span>
        <b>Дані оновлено 34 хв тому.</b> Можливі затримки з боку порталу ЄДЕБО — показано останні
        відомі значення. Ми продовжуємо спроби оновлення.
      </span>
    </div>
  );
}

export function EmptyPanel() {
  return (
    <div className="empty-panel">
      <div className="empty-icon">◷</div>
      <div className="empty-title">Вступна кампанія ще не почалася</div>
      <div className="empty-text">
        Прийом заяв на бакалаврат відкриється <b style={{ color: 'var(--tx)' }}>19 липня о 12:00</b>.
        Щойно портал ЄДЕБО почне приймати заяви, тут з’явиться жива статистика конкурсу.
      </div>
      <div className="empty-src">джерело: vstup.edbo.gov.ua</div>
    </div>
  );
}

export function SkeletonCards() {
  return (
    <div className="cards" aria-hidden="true">
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div className="sk-card" key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div className="sk" style={{ width: '60%', height: 15 }} />
            <div className="sk" style={{ width: 52, height: 18, borderRadius: 999 }} />
          </div>
          <div className="sk" style={{ width: 120, height: 34, borderRadius: 8 }} />
          <div className="sk" style={{ height: 50, borderRadius: 8 }} />
          <div className="sk" style={{ height: 96, borderRadius: 8 }} />
        </div>
      ))}
    </div>
  );
}

export function Footer() {
  return (
    <div className="footer">
      <div className="footer-brand">
        <img src="/logo-white.png" alt="FICE" className="only-dark" style={{ height: 30 }} />
        <img src="/logo.png" alt="FICE" className="only-light" style={{ height: 30 }} />
        <span>Створено Студрадою ФІОТ</span>
      </div>
      Неофіційний дашборд · дані парсяться з порталу ЄДЕБО кожні 10 хв
      <br />
      Це проєкт спільноти, не є офіційним джерелом. Звіряйтеся з <b>vstup.edbo.gov.ua</b>.
    </div>
  );
}

const DEMO_STATES: { key: DemoState; label: string }[] = [
  { key: 'normal', label: 'Норма' },
  { key: 'loading', label: 'Завантаження' },
  { key: 'stale', label: 'Застаріло' },
  { key: 'error', label: 'Помилка' },
  { key: 'empty', label: 'Порожньо' },
];

/** Панель перемикання станів — рендериться лише в мок-режимі (без NEXT_PUBLIC_API_URL) */
export function DemoBar() {
  const { demo, setDemo } = useApp();
  if (!MOCK) return null;
  return (
    <div className="demo-bar">
      <span className="demo-cap">демо-керування</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span className="demo-lbl">стан</span>
        <div className="seg" style={{ flexWrap: 'wrap' }}>
          {DEMO_STATES.map((s) => (
            <button key={s.key} aria-pressed={demo === s.key} onClick={() => setDemo(s.key)}>
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
