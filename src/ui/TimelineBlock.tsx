import { fmtDate } from '../lib/fmtDate';
import type { TimelineEntry } from '../timeline/types';

export type TimelineRow = { entry: TimelineEntry; theatre?: string };
const STATUS_STYLE: Record<TimelineEntry['status'], string> = { confirmed: 'text-[var(--text)]', reported: 'text-[var(--text-muted)]', disputed: 'text-[var(--orange)]' };
const label = 'font-[var(--font-mono)] text-[11.5px] uppercase tracking-[0.18em] text-[var(--text-muted)]';

// Key events curated from news sources, newest first. Each entry shows its status and links its sources; the legend says what the
// statuses mean and when the list was last checked, so it is never read as live.
export function TimelineBlock({ rows, checkedAt, showTheatre = false, limit, limits, notes = [] }: { rows: TimelineRow[]; checkedAt: string; showTheatre?: boolean; limit?: number; limits?: string; notes?: string[] }) {
  if (rows.length === 0) return null;
  const sorted = rows
    .map((r, i) => ({ r, i }))
    .sort((a, b) => b.r.entry.date.localeCompare(a.r.entry.date) || a.i - b.i)
    .map((x) => x.r)
    .slice(0, limit ?? rows.length);
  return (
    <section role="region" aria-label="Key events, sourced">
      <h4 className={`${label} mb-1`}>Key events (sourced)</h4>
      <p className="mb-2 text-[13px] text-[var(--text-muted)]">
        Checked {fmtDate(checkedAt)}. Confirmed: two independent outlets report the event. Reported: one source. Disputed: sources or parties differ. Figures and claims are attributed to whoever made them and are not verified. Curated from news reports, not from UCDP.
      </p>
      {limits ? <p className="mb-2 text-[13px] text-[var(--text-muted)]">{limits}</p> : null}
      {notes.map((n) => (
        <p key={n} className="mb-2 text-[13px] text-[var(--text-muted)]">
          {n}
        </p>
      ))}
      <ul aria-label="Key events" className="flex flex-col">
        {sorted.map(({ entry: e, theatre }) => (
          <li key={`${e.date}-${e.title}`} className="grid gap-1 border-t border-[var(--border)] py-3 text-[14px]">
            <span className="font-[var(--font-mono)] text-[12px] text-[var(--text-muted)]">
              {fmtDate(e.date)}
              {showTheatre && theatre ? ` · ${theatre}` : ''} · <span className={`uppercase tracking-[0.12em] ${STATUS_STYLE[e.status]}`}>{e.status}</span>
            </span>
            <span className="font-semibold">{e.title}</span>
            <span>{e.summary}</span>
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
          </li>
        ))}
      </ul>
    </section>
  );
}
