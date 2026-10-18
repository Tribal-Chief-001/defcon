import type { ReactNode } from 'react';
import { globalStats } from '../events/stats';
import { useEvents } from '../events/store';
import { AsOf } from './AsOf';
import { PulseBorder } from './PulseBorder';

const int = (n: number) => n.toLocaleString('en-US');

// One headline number: a mono label above a numeral. "--" means unavailable (never 0 for missing).
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-[var(--font-mono)] text-[11px] uppercase tracking-[var(--track)] text-[var(--text-muted)]">{label}</span>
      <span className="font-[var(--font-body)] text-[22px] font-semibold leading-none tracking-tight text-[var(--text)]">{value}</span>
    </div>
  );
}

function GlobalStats() {
  const snap = useEvents((s) => s.recent ?? s.archive);
  const st = snap ? globalStats(snap, Math.floor(Date.now() / 1000)) : null;
  return (
    <div role="group" aria-label="Global statistics" className="pointer-events-none absolute left-1/2 hidden -translate-x-1/2 items-end gap-10 lg:flex">
      <Stat label="Events · 30 d" value={st ? int(st.events) : '--'} />
      <Stat label="Human-coded · 30 d" value={st && st.humanShare !== null ? `${Math.round(st.humanShare * 100)}%` : '--'} />
      <Stat label="Countries affected" value={st ? int(st.countries) : '--'} />
    </div>
  );
}

// The top bar: the wordmark on the left, live global numbers in the middle, data freshness on the right, the world's pulse along its
// bottom edge, and a row of controls below.
export function TopBar({ children }: { children?: ReactNode }) {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex bg-black/60 backdrop-blur-md h-[calc(4.25rem+var(--safe-top))] items-center justify-between gap-6 pl-[max(4vw,var(--safe-left))] pr-[max(4vw,var(--safe-right))] pt-[var(--safe-top)]">
      <div className="flex items-baseline gap-3">
        <span className="h-2 w-2 translate-y-[-2px] rounded-full bg-[var(--lime)]" aria-hidden="true" />
        <span className="font-[var(--font-display)] text-[24px] font-extrabold leading-none tracking-tight">DEFCON</span>
        <span className="hidden font-[var(--font-mono)] text-[11.5px] uppercase tracking-[var(--track)] text-[var(--text-muted)] sm:inline">Globe core</span>
      </div>
      <GlobalStats />
      <AsOf />
      <div className="pointer-events-auto absolute left-[max(4vw,var(--safe-left))] top-[calc(5.25rem+var(--safe-top))] flex items-center gap-2">{children}</div>
      <PulseBorder />
    </header>
  );
}
