'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { DemoState } from './types';

interface AppCtx {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  demo: DemoState;
  setDemo: (s: DemoState) => void;
}

const Ctx = createContext<AppCtx | null>(null);

export function Providers({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [demo, setDemo] = useState<DemoState>('normal');

  useEffect(() => {
    try {
      const t = localStorage.getItem('vf-theme');
      if (t === 'light' || t === 'dark') setTheme(t);
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('vf-theme', theme); } catch {}
  }, [theme]);

  return (
    <Ctx.Provider value={{
      theme,
      toggleTheme: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
      demo,
      setDemo,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useApp(): AppCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp поза Providers');
  return v;
}
