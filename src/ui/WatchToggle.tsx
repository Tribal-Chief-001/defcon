import { useEffect } from 'react';
import { MAX_WATCH, useWatchlist } from '../watchlist/watchlist';
import { announce } from './status';

// "Watch": adds this country to the watchlist (kept in this browser only). Opening a watched country's dossier marks it as seen.
export function WatchToggle({ countryId, name }: { countryId: string; name: string }) {
  const on = useWatchlist((s) => s.ids.includes(countryId.toUpperCase()));
  const toggle = useWatchlist((s) => s.toggle);
  const markSeen = useWatchlist((s) => s.markSeen);
  useEffect(() => {
    if (on) markSeen([countryId.toUpperCase()], Math.floor(Date.now() / 1000)); // you are looking at it now
  }, [countryId]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={`Watch ${name} for new events`}
      onClick={() => {
        const was = on;
        if (!toggle(countryId, Math.floor(Date.now() / 1000))) return announce(`The watchlist is full (${MAX_WATCH} countries)`);
        announce(was ? `Stopped watching ${name}` : `Watching ${name}. New events appear in the Watching panel.`);
      }}
      className={`rounded-full border px-3 py-1 font-[var(--font-mono)] text-[11px] uppercase tracking-[0.12em] ${on ? 'border-[var(--lime)] text-[var(--lime)]' : 'border-[var(--border-strong)] text-[var(--text-muted)] hover:text-[var(--lime)]'}`}
    >
      {on ? 'Watching' : 'Watch'}
    </button>
  );
}
