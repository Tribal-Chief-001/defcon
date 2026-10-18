import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '../lib/motion';

// A number that counts up to `value` over `ms` (ease-out). Under prefers-reduced-motion, or for a non-finite value, it is the value at once.
export function useCountUp(value: number, ms = 900): number {
  const reduced = prefersReducedMotion();
  const [shown, setShown] = useState<number>(() => (reduced || !Number.isFinite(value) ? value : 0));
  const last = useRef(shown);
  useEffect(() => {
    if (reduced || !Number.isFinite(value)) {
      last.current = value;
      setShown(value);
      return;
    }
    const from = Number.isFinite(last.current) ? last.current : 0;
    const t0 = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / ms);
      const v = t >= 1 ? value : Math.round(from + (value - from) * (1 - (1 - t) ** 3));
      last.current = v;
      setShown(v);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, ms, reduced]);
  return shown;
}
