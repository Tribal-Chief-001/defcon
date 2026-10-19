import { useEffect, useMemo, useRef } from 'react';
import type { ConflictsFile } from '../../conflicts/types';
import { conflictsInRegion, regionTotals, SOUTH_ASIA } from '../../regions';
import { IndexBoard } from './IndexBoard';
import { int, label, Section, TREND, trendWord } from './parts';

const NAMES = 'Afghanistan, Bangladesh, Bhutan, India, Maldives, Nepal, Pakistan and Sri Lanka';

// The South Asia lens of the War room: what the data says about the eight SAARC member states, from the data already loaded. It is a
// filter, not a map: nothing on the globe changes except the view.
export function RegionView({ f, onSelect, onDive, onMethod, returnFocus }: { f: ConflictsFile; onSelect: (id: string) => void; onDive: (id: string) => void; onMethod: () => void; returnFocus?: string | null }) {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    if (returnFocus) root.current?.querySelector<HTMLElement>(`[data-conflict-row="${CSS.escape(returnFocus)}"]`)?.focus(); // Back returns to the row it left
  }, [returnFocus]);
  const inRegion = useMemo(() => conflictsInRegion(f.conflicts, SOUTH_ASIA), [f.conflicts]);
  const totals = useMemo(() => regionTotals(f.conflicts, SOUTH_ASIA), [f.conflicts]);
  return (
    <section ref={root} aria-label="South Asia" className="pb-2">
      <h3 className="sr-only">South Asia</h3>
      <p className="mt-6 font-[var(--font-mono)] text-[11.5px] uppercase tracking-[0.18em] text-[var(--text-muted)]">South Asia · last 365 days to {f.dataEnd}</p>
      <p className="mt-2 font-[var(--font-body)] text-[clamp(44px,8vw,72px)] font-semibold leading-none tracking-tight">{int(totals.deaths365)}</p>
      <p className="mt-2 max-w-[60ch] text-[14px] text-[var(--text-muted)]">
        deaths in organised violence that UCDP locates in {NAMES}. Best estimates; a conflict that reaches beyond these countries counts only its deaths here.
      </p>

      <Section title="Countries">
        <ul aria-label="Countries of South Asia" className="flex flex-wrap gap-2">
          {totals.countries.map((k) => (
            <li key={k.id}>
              <button type="button" onClick={() => onDive(k.id)} className="rounded-full border border-[var(--border-strong)] px-3 py-1 font-[var(--font-mono)] text-[12px] hover:text-[var(--lime)]">
                {k.name} <span className="text-[var(--text-muted)]">{int(k.deaths365)}</span>
              </button>
            </li>
          ))}
        </ul>
        {totals.countries.length === 0 ? <p className="text-[14px] text-[var(--text-muted)]">No deaths located in these countries in the data.</p> : null}
      </Section>

      <Section title="Conflicts in South Asia">
        {inRegion.length === 0 ? (
          <p className="text-[14px] text-[var(--text-muted)]">No listed conflict has deaths in these countries.</p>
        ) : (
          <ul aria-label="Conflicts in South Asia" className="flex flex-col">
            {inRegion.map((c) => (
              <li key={c.id}>
                <button type="button" data-conflict-row={c.id} onClick={() => onSelect(c.id)} className="flex w-full items-baseline gap-3 border-t border-[var(--border)] px-1 py-2 text-left text-[14px] hover:bg-white/5">
                  <span className="flex-1">{c.name}</span>
                  <span className={`font-[var(--font-mono)] text-[11px] uppercase tracking-[0.12em] ${TREND[c.trend]}`}>{c.deaths.d90.best <= 0 ? 'no deaths in 90 d' : trendWord(c)}</span>
                  <span className="w-[88px] text-right font-[var(--font-mono)] text-[12.5px]" title="deaths in these countries, last 365 days">
                    {int(c.countries.filter((k) => k.id !== null && (SOUTH_ASIA as readonly string[]).includes(k.id)).reduce((s, k) => s + k.deaths365, 0))}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <IndexBoard onDive={onDive} onMethod={onMethod} ids={SOUTH_ASIA} />

      <p className={`${label} mt-8 max-w-[62ch] normal-case tracking-normal`}>
        The member states of SAARC. The lens only filters the data and moves the camera; the borders on the globe follow India{'’'}s official map and are not changed by it.
      </p>
    </section>
  );
}
