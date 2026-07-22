'use client';
import { useEffect, useRef, useState } from 'react';
import { fi } from '../lib/format';

/** Плавний перерахунок числа без стрибків лейауту (tabular-nums + rAF-твін 750 мс) */
export default function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const [disp, setDisp] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    const from = prev.current;
    prev.current = value;
    if (from === value) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setDisp(value); return; }
    let raf = 0;
    const t0 = performance.now(), D = 750;
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / D);
      const e = 1 - Math.pow(1 - p, 3);
      setDisp(Math.round(from + (value - from) * e));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <span className={className}>{fi(disp)}</span>;
}
