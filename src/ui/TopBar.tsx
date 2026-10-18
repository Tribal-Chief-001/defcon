import type { ReactNode } from 'react';
import { AsOf } from './AsOf';
import { PulseBorder } from './PulseBorder';

// The top bar: brand on the left, data freshness on the right, the world's pulse along its bottom edge, and a row of controls below.
export function TopBar({ children }: { children?: ReactNode }) {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex h-14 items-center justify-between gap-4 px-[4vw]">
      <p className="font-[var(--font-mono)] text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
        <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[var(--lime)]" />
        Defcon // globe core
      </p>
      <AsOf />
      <div className="pointer-events-auto absolute left-[4vw] top-[4.25rem] flex items-center gap-2">{children}</div>
      <PulseBorder />
    </header>
  );
}
