import { useEffect, useMemo, useRef, useState } from 'react';
import type { Conflict } from '../conflicts/types';
import { packCircles } from './pack';

export type BubbleItem = { id: string; name: string; value: number; trend: Conflict['trend'] };
const int = (n: number) => n.toLocaleString('en-US');
const LABEL_MIN_R = 40;

// Conflicts as bubbles whose AREA is the deaths in the last 365 days (the radius is not: a 100-fold war must not look 100 times wider than
// a tenth of it). Orange outline when rising, lime when selected. Every bubble is a button; the league table is the text equivalent.
export function Bubbles({ items, selected, onSelect, height = 300 }: { items: BubbleItem[]; selected: string | null; onSelect: (id: string) => void; height?: number }) {
  const box = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(640);
  useEffect(() => {
    const el = box.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([e]) => e && setW(Math.max(200, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const circles = useMemo(() => packCircles(items.map((i) => ({ id: i.id, value: i.value })), w, height), [items, w, height]);
  const byId = new Map(items.map((i) => [i.id, i]));
  return (
    <div ref={box} className="relative w-full" style={{ height }}>
      {circles.map((c) => {
        const it = byId.get(c.id)!;
        const on = it.id === selected;
        const rising = it.trend === 'rising';
        return (
          <button
            key={c.id}
            type="button"
            aria-pressed={on}
            aria-label={`${it.name}: ${int(it.value)} deaths in 365 days, activity ${it.trend}`}
            title={`${it.name}: ${int(it.value)}`}
            onClick={() => onSelect(it.id)}
            className={`absolute grid place-items-center overflow-hidden rounded-full border p-1 text-center font-[var(--font-body)] text-[12px] leading-tight hover:bg-white/10 ${on ? 'border-[var(--lime)] bg-[rgba(214,255,87,0.1)]' : rising ? 'border-[var(--orange)] bg-[rgba(255,77,0,0.1)]' : 'border-[var(--border-strong)] bg-white/[0.04]'}`}
            style={{ left: c.x - c.r, top: c.y - c.r, width: c.r * 2, height: c.r * 2 }}
          >
            {c.r >= LABEL_MIN_R ? <span className="line-clamp-3 break-words">{it.name}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
