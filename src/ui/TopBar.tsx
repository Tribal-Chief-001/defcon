import type { ReactNode } from 'react';
import { globalStats } from '../events/stats';
import { useEvents } from '../events/store';
import { useNow } from '../lib/useNow';
import { AsOf } from './AsOf';
import { Logo } from './Logo';
import { PulseBorder } from './PulseBorder';

const int = (n: number) => n.toLocaleString('en-US');

// One headline number: a mono label above a numeral. "--" means unavailable (never 0 for missing).
function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-[var(--font-mono)] text-[11px] uppercase tracking-[var(--track)] text-[var(--text-muted)]">{label}</span>
      <span className="font-[var(--font-body)] text-[22px] font-semibold leading-none tracking-tight text-[var(--text)]">{value}</span>
      {note ? <span className="font-[var(--font-mono)] text-[11px] text-[var(--text-muted)]">{note}</span> : null}
    </div>
  );
}

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Live numbers from the recent snapshot only (the archive is older than 30 days by construction: counting it would show wrong zeros).
// The window in the first label is the data's real span; a 0 % human-coded share says where the human-coded data ends.
function GlobalStats() {
  const snap = useEvents((s) => s.recent);
  const nowS = useNow();
  const st = snap ? globalStats(snap, nowS) : null;
  const ucdp = snap?.meta.sources.find((x) => x.id === 'ucdp');
  const ucdpEnd = ucdp && Number.isFinite(ucdp.asOfS) ? new Date(ucdp.asOfS * 1000) : null;
  const zeroHuman = st && st.humanShare === 0 && st.events > 0;
  return (
    <div role="group" aria-label="Global statistics" className="pointer-events-none absolute left-1/2 hidden -translate-x-1/2 items-start gap-10 min-[1200px]:flex">
      <Stat label={st && st.events > 0 ? `Events · ${st.spanDays} d` : 'Events'} value={st ? int(st.events) : '--'} />
      <Stat
        label="Human-coded"
        value={st && st.humanShare !== null ? `${Math.round(st.humanShare * 100)}%` : '--'}
        note={zeroHuman && ucdpEnd ? `UCDP data ends ${ucdpEnd.getUTCDate()} ${MON[ucdpEnd.getUTCMonth()]}` : undefined}
      />
      <Stat label="Countries reported" value={st ? int(st.countries) : '--'} />
    </div>
  );
}

// The top bar: the wordmark on the left, live global numbers in the middle, data freshness on the right, the world's pulse along its
// bottom edge, and a row of controls below.
export function TopBar({ children }: { children?: ReactNode }) {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex bg-black/60 backdrop-blur-sm h-[calc(4.25rem+var(--safe-top))] items-center justify-between gap-6 pl-[max(4vw,var(--safe-left))] pr-[max(4vw,var(--safe-right))] pt-[var(--safe-top)]">
      <div className="flex items-center gap-3">
        <Logo />
        <h1 className="font-[var(--font-display)] text-[24px] font-extrabold leading-none tracking-tight">DEFCON</h1>
        <span className="hidden font-[var(--font-mono)] text-[11.5px] uppercase tracking-[var(--track)] text-[var(--text-muted)] sm:inline">Globe core</span>
      </div>
      <GlobalStats />
      <AsOf />
      <div className="pointer-events-auto absolute left-[max(4vw,var(--safe-left))] top-[calc(5.25rem+var(--safe-top))] flex items-center gap-2">{children}</div>
      <PulseBorder />
    </header>
  );
}
