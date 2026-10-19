import { useEffect, useRef, useState } from 'react';
import { loadIndex } from '../dossier/load';
import { useEvents } from '../events/store';
import { alertText, newEventCounts, useWatchlist } from '../watchlist/watchlist';
import { announce } from './status';

// Renders nothing: when new events in a watched country arrive it announces them politely and, only if the person allowed it and the page
// is in the background, shows a browser notification. What was already announced is not announced again.
export function WatchAlerts() {
  const ids = useWatchlist((s) => s.ids);
  const seen = useWatchlist((s) => s.seen);
  const { recent, archive } = useEvents();
  const [names, setNames] = useState<Map<string, string> | null>(null); // null until the names are known: an alert says "Ukraine", not "UKR"
  const last = useRef<Record<string, number>>({});
  useEffect(() => {
    void loadIndex().then((ix) => setNames(new Map(ix.map((e) => [e.id, e.name]))), () => setNames(new Map()));
  }, []);
  useEffect(() => {
    if (!names) return;
    const counts = newEventCounts([recent, archive], { ids, seen }, Math.floor(Date.now() / 1000));
    const grew = counts.some((c) => c.count > (last.current[c.id] ?? 0));
    last.current = Object.fromEntries(counts.map((c) => [c.id, c.count]));
    if (!grew) return;
    const text = alertText(counts, names);
    announce(text);
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && document.hidden) new Notification('Defcon', { body: text, tag: 'defcon-watch' });
  }, [recent, archive, ids, seen, names]);
  return null;
}
