import { freshness } from '../events/freshness';
import { useEvents } from '../events/store';

// "Data as of" label with a state pill. Always visible (spec: no fake data; the viewer must know how old it is).
export function AsOf({ nowS = Math.floor(Date.now() / 1000) }: { nowS?: number }) {
  const { recent, archive, status, error } = useEvents();
  const snap = recent ?? archive;
  const f = snap ? freshness(snap.meta.asOfS, nowS) : null;
  const pill = !snap ? 'NO DATA' : !recent ? 'ARCHIVE' : f!.state.toUpperCase();
  const alert = pill === 'STALE' || pill === 'NO DATA';
  return (
    <div className="pointer-events-none flex flex-col items-end gap-1.5 font-[var(--font-mono)] text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
      <div className="flex items-center gap-2">
        <span>{f ? f.label : 'NO EVENT DATA'}</span>
        <span className={`rounded-full border px-2.5 py-1 ${alert ? 'border-[var(--orange)] text-[var(--orange)]' : 'border-[var(--border-strong)] text-[var(--lime)]'}`}>{pill}</span>
      </div>
      {status === 'error' && snap ? <span className="text-[var(--orange)]">refresh failed, showing last data</span> : null}
      {status === 'error' && !snap ? <span title={error}>run npm run data:build</span> : null}
    </div>
  );
}
