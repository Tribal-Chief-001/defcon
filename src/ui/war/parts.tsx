import type { ReactNode } from 'react';
import type { Conflict, Range } from '../../conflicts/types';
import { fmtDate } from '../../lib/fmtDate';

export const int = (n: number) => n.toLocaleString('en-US');
export const span = (r: Range) => `${int(r.low)}–${int(r.high)}`;
export const date = fmtDate;
export const label = 'font-[var(--font-mono)] text-[11.5px] uppercase tracking-[0.18em] text-[var(--text-muted)]';
export const TREND: Record<Conflict['trend'], string> = { rising: 'text-[var(--orange)]', falling: 'text-[var(--text)]', steady: 'text-[var(--text-muted)]', 'low data': 'text-[var(--text-faint)]' };

// A section of the dashboard: a mono label with a hairline running to the edge, then the content.
export function Section({ title, children, note }: { title: string; children: ReactNode; note?: ReactNode }) {
  return (
    <div className="mt-10">
      <h4 className={`${label} mb-3 flex items-center gap-3`}>
        <span>{title}</span>
        <span aria-hidden="true" className="h-px flex-1 bg-[var(--border)]" />
      </h4>
      {note ? <p className="mb-3 max-w-[60ch] text-[13px] text-[var(--text-muted)]">{note}</p> : null}
      {children}
    </div>
  );
}
