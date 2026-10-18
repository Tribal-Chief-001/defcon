import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { radarBus, type RadarView } from '../globe/radar';
import { prefersReducedMotion } from '../lib/motion';

const finePointer = () => typeof window !== 'undefined' && !!window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;

// Cursor = Radar: a thin cyan reticle with a lat/lon readout, following the pointer over the globe and snapping to the nearest event.
// Decorative (aria-hidden). Position and text are written straight to the element, so pointer moves cause no React render.
export function Reticle() {
  const [shown, setShown] = useState(false);
  const [snapped, setSnapped] = useState(false);
  const el = useRef<HTMLDivElement>(null);
  const latest = useRef<RadarView | null>(null);
  const reduced = prefersReducedMotion();

  const paint = () => {
    const v = latest.current;
    if (!el.current || !v) return;
    el.current.style.transform = `translate(${Math.round(v.x)}px, ${Math.round(v.y)}px)`;
    const text = el.current.querySelector('[data-readout]');
    if (text && text.textContent !== v.readout) text.textContent = v.readout;
  };
  useEffect(
    () =>
      radarBus.subscribe((v) => {
        latest.current = finePointer() ? v : null;
        setShown(latest.current !== null);
        setSnapped(!!latest.current?.snapped);
        paint();
      }),
    [],
  );
  useLayoutEffect(paint, [shown]);

  if (!shown) return null;
  return (
    <div
      data-reticle
      aria-hidden="true"
      ref={el}
      className="pointer-events-none absolute left-0 top-0 z-10"
      style={{ transition: snapped && !reduced ? 'transform 140ms cubic-bezier(0.16, 1, 0.3, 1)' : 'none' }}
    >
      <svg width="44" height="44" viewBox="-22 -22 44 44" className="absolute -left-[22px] -top-[22px] text-[var(--cyan)]">
        <circle r={snapped ? 9 : 13} fill="none" stroke="currentColor" strokeWidth="1" opacity="0.9" />
        <path d="M0 -21V-8M0 8V21M-21 0H-8M8 0H21" stroke="currentColor" strokeWidth="1" />
      </svg>
      <span data-readout className="absolute left-6 top-4 whitespace-nowrap font-[var(--font-mono)] text-[11.5px] uppercase tracking-[0.12em] text-[var(--cyan)] [paint-order:stroke_fill] [-webkit-text-stroke:3px_#000]" />
    </div>
  );
}
