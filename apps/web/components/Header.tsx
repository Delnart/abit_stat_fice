'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '../lib/providers';

export default function Header() {
  const { theme, toggleTheme, demo } = useApp();
  const path = usePathname();
  const stale = demo === 'stale';
  const onCalc = path.startsWith('/calc');

  return (
    <header className="hdr">
      <div className="hdr-brand">
        <Link href="/" aria-label="На головну" style={{ display: 'block', flex: '0 0 auto' }}>
          <img src="/logo-white.png" alt="FICE" className="only-dark hdr-logo-img" />
          <img src="/logo.png" alt="FICE" className="only-light hdr-logo-img" />
        </Link>
        <div style={{ minWidth: 0 }}>
          <div className="hdr-title">Вступ ФІОТ</div>
          <div className="hdr-sub">Студрада ФІОТ · статистика в реальному часі · 2026</div>
        </div>
        <nav className="hdr-nav">
          <Link href="/" aria-current={onCalc ? undefined : 'page'}>Дашборд</Link>
          <Link href="/calc/" aria-current={onCalc ? 'page' : undefined}>Калькулятор балу</Link>
        </nav>
      </div>
      <div className="hdr-right">
        <span
          className={'live-pill' + (stale ? ' warn' : '')}
          title="Сайт перевіряє дані щохвилини. ЄДЕБО оновлює списки заяв кілька разів на день. Джерело: vstup.edbo.gov.ua"
        >
          <span className="live-dot"><i /><i className="ring" /></span>
          {stale ? 'Пауза' : 'Наживо'}
        </span>
        <button className="theme-btn" onClick={toggleTheme} aria-label="Перемкнути тему">
          {theme === 'dark' ? '◑' : '◐'}
        </button>
      </div>
    </header>
  );
}
