import { useEffect, useMemo, useState } from 'react';
import { loadIndex } from '../../dossier/load';
import { latestEvents } from '../../events/rails';
import { useEvents } from '../../events/store';
import { ago } from '../../lib/ago';
import { useNow } from '../../lib/useNow';

const KIND: Record<string, string> = { armed: 'Armed', civilian: 'Civilians' };

// The newest armed and civilian reports of the live snapshot (GDELT, auto-coded): one per country, never human-coded events. A snapshot
// older than 6 hours is ranked against its own time and says so, instead of claiming that nothing happened.
export function NewsReports({ onDive }: { onDive: (id: string) => void }) {
  const snap = useEvents((s) => s.recent);
  const nowS = useNow();
  const [names, setNames] = useState<Map<string, string>>(new Map());
  useEffect(() => {
    loadIndex().then((ix) => setNames(new Map(ix.map((e) => [e.id, e.name]))), () => {});
  }, []);
  const stale = !!snap && nowS - snap.meta.asOfS > 6 * 3600;
  const reports = useMemo(() => (snap ? latestEvents(snap, stale ? snap.meta.asOfS : nowS, 8, { kinds: ['armed', 'civilian'], human: false }) : null), [snap, nowS, stale]);
  return (
    <>
      {stale && snap ? <p className="mb-2 text-[13px] text-[var(--orange)]">The news data is from {new Date(snap.meta.asOfS * 1000).toISOString().slice(0, 16).replace('T', ' ')} UTC, not live.</p> : null}
      {reports === null ? (
        <p className="text-[14px] text-[var(--text-muted)]">No recent reports loaded.</p>
      ) : reports.length === 0 ? (
        <p className="text-[14px] text-[var(--text-muted)]">No armed or civilian reports in the last 7 days.</p>
      ) : (
        <ul aria-label="Newest reports" className="flex flex-col">
          {reports.map((e) => (
            <li key={e.index} className="flex flex-wrap items-baseline gap-x-3 border-t border-[var(--border)] py-2 text-[14px]">
              <span className="font-[var(--font-mono)] text-[12px] uppercase tracking-[0.12em] text-[var(--text-muted)]">{KIND[e.kind] ?? e.kind}</span>
              <button type="button" onClick={() => onDive(e.country)} className="hover:text-[var(--lime)]">
                {names.get(e.country) ?? e.country}
              </button>
              <span className="font-[var(--font-mono)] text-[12px] text-[var(--text-muted)]">{ago(nowS, e.timeS)} · auto-coded, not verified</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
