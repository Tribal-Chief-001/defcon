import { useEffect, useMemo, useRef, useState } from 'react';
import { loadIndex } from '../dossier/load';
import { useEvents } from '../events/store';
import { newEventCounts, useWatchlist } from '../watchlist/watchlist';

const btn = 'rounded-full border border-[var(--border-strong)] px-2.5 py-0.5 font-[var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[var(--text-muted)] hover:text-[var(--lime)]';

// The top-bar "Watching" button and its panel: the watched countries with how many new events each has since you last looked. Kept in
// this browser only. Alerts are counts of new events in the data (human-coded and auto-coded), not warnings.
export function WatchPanel({ onOpen, nowS }: { onOpen: (id: string) => void; nowS?: number }) {
  const ids = useWatchlist((s) => s.ids);
  const seen = useWatchlist((s) => s.seen);
  const toggle = useWatchlist((s) => s.toggle);
  const markSeen = useWatchlist((s) => s.markSeen);
  const { recent, archive } = useEvents();
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const [names, setNames] = useState<Map<string, string>>(new Map());
  const [perm, setPerm] = useState<string>(() => (typeof Notification === 'undefined' ? 'unsupported' : Notification.permission));
  useEffect(() => {
    void loadIndex().then((ix) => setNames(new Map(ix.map((e) => [e.id, e.name]))), () => undefined);
  }, []);
  const now = nowS ?? Math.floor(Date.now() / 1000);
  const counts = useMemo(() => new Map(newEventCounts([recent, archive], { ids, seen }, now).map((c) => [c.id, c.count])), [recent, archive, ids, seen, now]);
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  if (ids.length === 0) return null;
  const name = (id: string) => names.get(id) ?? id;
  return (
    <div className="relative">
      <button ref={trigger} type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="rounded-full border border-[var(--border-strong)] bg-black/40 px-3 py-1.5 font-[var(--font-mono)] text-[11.5px] uppercase tracking-[0.15em] text-[var(--text-muted)] backdrop-blur-md hover:text-[var(--lime)]">
        {total > 0 ? `Watching (${total} new)` : `Watching (${ids.length})`}
      </button>
      {open ? (
        <section
          role="region"
          aria-label="Watching"
          onKeyDown={(e) => {
            if (e.key !== 'Escape') return;
            e.stopPropagation(); // Esc closes this panel only, not the dossier or the War room behind it
            setOpen(false);
            trigger.current?.focus();
          }}
          className="pointer-events-auto absolute left-0 top-[calc(100%+8px)] z-30 w-[min(340px,calc(100vw-8vw))] rounded-[20px] border border-[var(--border)] bg-black/80 p-4 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-[var(--font-mono)] text-[11.5px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Watching</h3>
            <button type="button" className={btn} onClick={() => markSeen(ids, now)}>
              Mark all seen
            </button>
          </div>
          <ul aria-label="Watched countries" className="mt-2 flex flex-col">
            {ids.map((id) => {
              const n = counts.get(id) ?? 0;
              return (
                <li key={id} className="border-t border-[var(--border)] py-2 text-[13px]">
                  <span className="block">
                    {name(id)} <span className="font-[var(--font-mono)] text-[12px] text-[var(--text-muted)]">{n > 0 ? `${n} new ${n === 1 ? 'event' : 'events'}` : 'nothing new'}</span>
                  </span>
                  <span className="mt-1 flex flex-wrap gap-2">
                    <button type="button" className={btn} aria-label={`Open ${name(id)}`} onClick={() => onOpen(id)}>
                      Open
                    </button>
                    <button type="button" className={btn} aria-label={`Mark ${name(id)} as seen`} onClick={() => markSeen([id], now)}>
                      Seen
                    </button>
                    <button type="button" className={btn} aria-label={`Remove ${name(id)}`} onClick={() => toggle(id, now)}>
                      Remove
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
          {perm === 'default' ? (
            <button type="button" className={`${btn} mt-3`} onClick={() => {
                // older Safari returns nothing (callback style): read the permission afterwards in either case
                void Promise.resolve(Notification.requestPermission()).then(() => setPerm(Notification.permission), () => setPerm(Notification.permission));
              }}>
              Enable notifications
            </button>
          ) : perm === 'granted' ? (
            <p className="mt-3 text-[12px] text-[var(--text-muted)]">Notifications are on: a new event in a watched country shows one when this tab is in the background.</p>
          ) : perm === 'denied' ? (
            <p className="mt-3 text-[12px] text-[var(--text-muted)]">Notifications are blocked in your browser.</p>
          ) : null}
          <p className="mt-3 text-[12px] leading-relaxed text-[var(--text-faint)]">Kept in this browser only. Counts are new events in the data (human-coded and auto-coded news reports); they are not warnings.</p>
        </section>
      ) : null}
    </div>
  );
}
