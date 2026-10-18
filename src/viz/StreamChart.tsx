import { useMemo, useRef, useState } from 'react';
import type { Kind } from '../conflicts/types';
import { fmtDate } from '../lib/fmtDate';
import { addDays, areaPath, monthTicks, niceMax, scaleLinear, stackAreas, weekEnd } from './scale';

export type StreamEvent = { date: string; title: string; status: 'confirmed' | 'reported' | 'disputed'; theatre?: string };

const KINDS: { k: Kind; name: string; fill: string; op: number }[] = [
  { k: 'state', name: 'State-based', fill: 'var(--lime)', op: 0.78 },
  { k: 'non-state', name: 'Non-state', fill: 'var(--text)', op: 0.5 },
  { k: 'one-sided', name: 'One-sided', fill: 'var(--orange)', op: 0.85 },
];
const W = 640;
const PAD = { l: 44, r: 10, t: 16, b: 22 };
const clean = (a: number[]) => a.map((v) => (Number.isFinite(v) && v > 0 ? v : 0));
const int = (n: number) => n.toLocaleString('en-US');
const day = (iso: string) => Date.parse(`${iso}T00:00:00Z`) / 86400000;

// Weekly deaths stacked by kind of violence from a zero baseline over 52 weeks, with the key events of the timeline as stems on their
// dates. Events after the data end sit in a marked "after UCDP data" band, so they never float over an empty chart as if the deaths
// were zero. A scrub line (pointer or arrow keys) reads out the week.
export function StreamChart({ weeklyByKind, dataEnd, events = [], onEventClick, onEventHover, height = 220 }: { weeklyByKind: Record<Kind, number[]>; dataEnd: string; events?: StreamEvent[]; onEventClick?: (index: number) => void; onEventHover?: (index: number | null) => void; height?: number }) {
  const series = KINDS.map((k) => clean(weeklyByKind[k.k] ?? []));
  const n = 52;
  const stacks = useMemo(() => stackAreas(series), [weeklyByKind]); // eslint-disable-line react-hooks/exhaustive-deps
  const totals = Array.from({ length: n }, (_, i) => series.reduce((s, a) => s + (a[i] ?? 0), 0));
  const peak = Math.max(0, ...totals);
  const peakAt = totals.indexOf(peak);
  const yMax = niceMax(peak);

  const start = addDays(weekEnd(dataEnd, 0), -6);
  const placed = events.map((e, index) => ({ e, index })).filter(({ e }) => e.date >= start);
  const last = placed.reduce((m, { e }) => (e.date > m ? e.date : m), dataEnd);
  const endDay = Math.max(day(dataEnd), day(last)) + (last > dataEnd ? 4 : 0);
  const x = scaleLinear(day(start), endDay, PAD.l, W - PAD.r);
  const y = scaleLinear(0, yMax, height - PAD.b, PAD.t);
  const xs = Array.from({ length: n }, (_, i) => x(day(weekEnd(dataEnd, i))));
  const after = last > dataEnd;

  const [idx, setIdx] = useState<number | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const onMove = (clientX: number) => {
    const r = box.current?.getBoundingClientRect();
    if (!r || r.width === 0) return;
    const px = ((clientX - r.left) / r.width) * W;
    let best = 0;
    xs.forEach((v, i) => Math.abs(v - px) < Math.abs(xs[best]! - px) && (best = i));
    setIdx(best);
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') setIdx((i) => Math.max(0, (i ?? n) - 1));
    else if (e.key === 'ArrowRight') setIdx((i) => Math.min(n - 1, (i ?? -1) + 1));
    else if (e.key === 'Home') setIdx(0);
    else if (e.key === 'End') setIdx(n - 1);
    else if (e.key === 'Escape') setIdx(null);
    else return;
    e.preventDefault();
  };
  const tip = idx === null ? '' : `Week ending ${fmtDate(weekEnd(dataEnd, idx))} · ${KINDS.map((k, j) => `${k.name} ${int(series[j]![idx] ?? 0)}`).join(' · ')}`;

  return (
    <div
      role="group"
      aria-label="Deaths per week by kind of violence"
      tabIndex={0}
      onKeyDown={onKey}
      onBlur={() => setIdx(null)}
      className="rounded-[12px] outline-none focus-visible:ring-1 focus-visible:ring-[var(--lime)]"
    >
      <p className="sr-only">
        Deaths per week, weeks ending {fmtDate(weekEnd(dataEnd, 0))} to {fmtDate(dataEnd)}. {peak > 0 ? `Peak ${int(peak)} in the week ending ${fmtDate(weekEnd(dataEnd, peakAt))}.` : 'No deaths in the window.'} Use the arrow keys to read a week.
      </p>
      <div ref={box} className="relative" onPointerMove={(e) => onMove(e.clientX)} onPointerLeave={() => setIdx(null)}>
        <svg viewBox={`0 0 ${W} ${height}`} className="block w-full" aria-hidden="true">
          {[0, yMax / 2, yMax].map((t, i) => (
            <g key={i}>
              <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth="1" />
              <text data-ytick x={PAD.l - 6} y={y(t) + 4} textAnchor="end" className="fill-[var(--text-muted)] font-[var(--font-mono)] text-[11px]">
                {int(t)}
              </text>
            </g>
          ))}
          {after ? (
            <g>
              <rect x={x(day(dataEnd))} y={PAD.t} width={W - PAD.r - x(day(dataEnd))} height={height - PAD.b - PAD.t} fill="var(--text)" fillOpacity="0.04" />
              <text x={W - PAD.r - 4} y={PAD.t + 12} textAnchor="end" className="fill-[var(--text-muted)] font-[var(--font-mono)] text-[11px]">
                after UCDP data
              </text>
            </g>
          ) : null}
          {KINDS.map((k, j) => (
            <path key={k.k} data-kind={k.k} d={areaPath(xs, stacks[j]!.y0.map(y), stacks[j]!.y1.map(y))} fill={k.fill} fillOpacity={k.op} stroke={k.fill} strokeWidth="0.75" strokeOpacity="0.9" />
          ))}
          {monthTicks(dataEnd).map((t) => (
            <text key={t.i} x={xs[t.i]} y={height - 6} textAnchor="middle" className="fill-[var(--text-muted)] font-[var(--font-mono)] text-[11px]">
              {t.label}
            </text>
          ))}
          {placed.map(({ e, index }) => (
            <line key={index} x1={x(day(e.date))} x2={x(day(e.date))} y1={PAD.t + 6} y2={height - PAD.b} stroke={e.status === 'disputed' ? 'var(--orange)' : 'var(--text)'} strokeOpacity="0.55" strokeWidth="1" strokeDasharray={e.status === 'confirmed' ? undefined : '2 3'} />
          ))}
          {idx !== null ? <line x1={xs[idx]} x2={xs[idx]} y1={PAD.t} y2={height - PAD.b} stroke="var(--lime)" strokeWidth="1" /> : null}
        </svg>
        {placed.map(({ e, index }) => (
          <button
            key={index}
            type="button"
            aria-label={`${fmtDate(e.date)}: ${e.title} (${e.status})`}
            onClick={() => onEventClick?.(index)}
            onMouseEnter={() => onEventHover?.(index)}
            onMouseLeave={() => onEventHover?.(null)}
            onFocus={() => onEventHover?.(index)}
            onBlur={() => onEventHover?.(null)}
            className="absolute top-0 grid h-[22px] w-[22px] -translate-x-1/2 place-items-center"
            style={{ left: `${(x(day(e.date)) / W) * 100}%` }}
          >
            <span className={`block h-[9px] w-[9px] rounded-full border ${e.status === 'disputed' ? 'border-[var(--orange)] bg-[var(--orange)]' : e.status === 'confirmed' ? 'border-[var(--text)] bg-[var(--text)]' : 'border-[var(--text)] bg-black'}`} />
          </button>
        ))}
        <div role="status" className="pointer-events-none absolute bottom-7 left-12 right-3 font-[var(--font-mono)] text-[11.5px] text-[var(--lime)]">
          {tip}
        </div>
      </div>
      <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 font-[var(--font-mono)] text-[11.5px] text-[var(--text-muted)]">
        {KINDS.map((k) => (
          <li key={k.k} className="flex items-center gap-1.5">
            <span className="inline-block h-[8px] w-[8px]" style={{ background: k.fill, opacity: k.op }} /> {k.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
