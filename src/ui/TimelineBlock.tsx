import { useEffect, useRef } from 'react';
import { fmtDate } from '../lib/fmtDate';
import { prefersReducedMotion } from '../lib/motion';
import { rowKey } from '../timeline/key';
import type { TimelineEntry } from '../timeline/types';

export type TimelineRow = { entry: TimelineEntry; theatre?: string; pinIndex?: number };
export type TimelineProps = {
  rows: TimelineRow[];
  checkedAt: string;
  nowS?: number; // for tests: the age of the check is read against this instead of the clock
  showTheatre?: boolean;
  limit?: number;
  limits?: string;
  notes?: string[];
  highlight?: string; // `${date}|${title}` of an entry to mark and scroll to (clicked on the chart)
  onShowOnMap?: (at: NonNullable<TimelineEntry['at']>, pinIndex: number | undefined) => void;
  onHoverPin?: (pinIndex: number | null) => void;
};
const STATUS_STYLE: Record<TimelineEntry['status'], string> = { confirmed: 'text-[var(--text)]', reported: 'text-[var(--text-muted)]', disputed: 'text-[var(--orange)]' };
const NODE: Record<TimelineEntry['status'], string> = { confirmed: 'border-[var(--text)] bg-[var(--text)]', reported: 'border-[var(--text)] bg-black', disputed: 'border-[var(--orange)] bg-[var(--orange)]' };
const label = 'font-[var(--font-mono)] text-[11.5px] uppercase tracking-[0.18em] text-[var(--text-muted)]';
export { rowKey } from '../timeline/key';

// Key events curated from news sources as an editorial timeline, newest first: a big date, a spine with a status node, the title, the
// attributed summary and the linked sources. Entries with a place can be shown on the globe; hovering one pulses its pin. The legend
// says when the list was checked and what the statuses mean, so it is never read as live.
export function TimelineBlock({ rows, checkedAt, showTheatre = false, limit, limits, notes = [], highlight, onShowOnMap, onHoverPin, nowS }: TimelineProps) {
  const refs = useRef(new Map<string, HTMLLIElement>());
  useEffect(() => {
    if (!highlight) return;
    refs.current.get(highlight)?.scrollIntoView?.({ block: 'nearest', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }, [highlight]);
  if (rows.length === 0) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(checkedAt);
  const age = m ? Math.floor(((nowS ?? Date.now() / 1000) - Date.UTC(+m[1]!, +m[2]! - 1, +m[3]!) / 1000) / 86400) : Number.NaN;
  const sorted = rows
    .map((r, i) => ({ r, i }))
    .sort((a, b) => b.r.entry.date.localeCompare(a.r.entry.date) || a.i - b.i)
    .map((x) => x.r)
    .slice(0, limit ?? rows.length);
  return (
    <section aria-label="Key events, sourced">
      <h4 className={`${label} mb-1`}>Key events (sourced)</h4>
      <p className="mb-2 text-[13px] text-[var(--text-muted)]">
        Checked {fmtDate(checkedAt)}{age > 30 ? ` (${age} days ago: events after that date are not listed)` : ''}. Confirmed: two independent outlets report the event. Reported: one source. Disputed: sources or parties differ. Figures and claims are attributed to whoever made them and are not verified. Curated from news reports, not from UCDP.
      </p>
      {limits ? <p className="mb-2 text-[13px] text-[var(--text-muted)]">{limits}</p> : null}
      {notes.map((n) => (
        <p key={n} className="mb-2 text-[13px] text-[var(--text-muted)]">
          {n}
        </p>
      ))}
      <ul aria-label="Key events" className="mt-3 flex flex-col">
        {sorted.map(({ entry: e, theatre, pinIndex }) => {
          const key = rowKey(e);
          const [y, m, d] = e.date.split('-');
          const on = highlight === key;
          return (
            <li
              key={`${key}-${theatre ?? ''}`}
              ref={(el) => void (el ? refs.current.set(key, el) : refs.current.delete(key))}
              data-highlight={on ? 'true' : undefined}
              onMouseEnter={() => onHoverPin?.(pinIndex ?? null)}
              onMouseLeave={() => onHoverPin?.(null)}
              className={`grid grid-cols-[64px_14px_1fr] gap-x-3 rounded-[12px] px-1 ${on ? 'bg-[rgba(214,255,87,0.07)]' : ''}`}
            >
              <time dateTime={e.date} className="pt-3 text-right">
                <span className="block font-[var(--font-display)] text-[28px] font-extrabold leading-none tracking-tight">{Number(d)}</span>{' '}
                <span className="block font-[var(--font-mono)] text-[11px] uppercase leading-snug tracking-[0.08em] text-[var(--text-muted)]">
                  {fmtDate(e.date).split(' ')[1]} {y}
                </span>
                <span className="sr-only">{` (${m})`}</span>
              </time>
              <span aria-hidden="true" className="relative flex justify-center">
                <span className="absolute inset-y-0 w-px bg-[var(--border-strong)]" />
                <span className={`relative mt-[18px] block h-[9px] w-[9px] rounded-full border ${NODE[e.status]}`} />
              </span>
              <div className="grid gap-1.5 pb-6 pt-3 text-[14px]">
                <span className="font-[var(--font-mono)] text-[11.5px] text-[var(--text-muted)]">
                  {showTheatre && theatre ? `${theatre} · ` : ''}
                  <span className={`uppercase tracking-[0.12em] ${STATUS_STYLE[e.status]}`}>{e.status}</span>
                  {e.at ? ` · ${e.at.place}` : ''}
                </span>
                <span className="font-[var(--font-display)] text-[17px] font-bold leading-snug">{e.title}</span>
                <span className="text-[var(--text)]">{e.summary}</span>
                <span className="font-[var(--font-mono)] text-[11.5px] text-[var(--text-muted)]">
                  Sources:{' '}
                  {e.sources.map((s, i) => (
                    <span key={s.url}>
                      {i > 0 ? ', ' : ''}
                      <a href={s.url} target="_blank" rel="noopener noreferrer" aria-label={`${s.outlet}: ${s.title} (opens in a new tab)`} className="underline decoration-[var(--border-strong)] underline-offset-2 hover:text-[var(--lime)]">
                        {s.outlet}
                      </a>
                    </span>
                  ))}
                </span>
                {e.at && onShowOnMap ? (
                  <button type="button" onClick={() => onShowOnMap(e.at!, pinIndex)} className="mt-0.5 w-fit font-[var(--font-mono)] text-[11.5px] uppercase tracking-[0.15em] text-[var(--lime)] underline decoration-[var(--border-strong)] underline-offset-4 hover:decoration-[var(--lime)]" aria-label={`Show on the map: ${e.title}`}>
                    Show on the map
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
