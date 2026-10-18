import { fmtDate } from '../../lib/fmtDate';
import type { ConflictEvent, Range } from '../../conflicts/types';

const int = (n: number) => n.toLocaleString('en-US');
const span = (r: Range) => `${int(r.low)}–${int(r.high)}`;

// The newest human-coded events of the data: date, place, deaths with their range, the headline and the sources UCDP names.
export function EventList({ events }: { events: ConflictEvent[] }) {
  if (events.length === 0) return <p className="text-[14px] text-[var(--text-muted)]">No events with a usable location.</p>;
  return (
    <ul className="flex flex-col">
      {events.map((e) => (
        <li key={e.id} className="grid gap-1 border-t border-[var(--border)] py-3 text-[14px]">
          <span className="font-[var(--font-mono)] text-[12px] text-[var(--text-muted)]">
            {fmtDate(e.date)} · {e.place || e.country} · deaths {int(e.deaths.best)} ({span(e.deaths)})
            {e.provisional ? <span className="ml-2 uppercase tracking-[0.12em] text-[var(--orange)]">provisional</span> : null}
          </span>
          {e.headline ? <span>{e.headline}</span> : null}
          {e.sources.length ? <span className="font-[var(--font-mono)] text-[11.5px] text-[var(--text-muted)]">Sources: {e.sources.join(', ')}</span> : null}
        </li>
      ))}
    </ul>
  );
}
