import { useEffect } from 'react';
import { useEvents } from '../events/store';
import type { Snapshot } from '../events/snapshot';
import { useTime } from '../time/store';
import { allowPing, sonar } from './sonar';
import { useSound } from './store';

type Ping = { severity: number; lon: number };
const top = (list: Ping[], max: number) => list.sort((a, b) => b.severity - a.severity).slice(0, max);

// Events that arrived with a refreshed snapshot (newer than the previous snapshot's newest), most severe first.
export function newEvents(prev: Snapshot | undefined, next: Snapshot, max = 4): Ping[] {
  if (!prev || prev.meta.sha256 === next.meta.sha256) return [];
  let newest = 0;
  for (let i = 0; i < prev.n; i++) newest = Math.max(newest, prev.timeS[i]!);
  const out: Ping[] = [];
  for (let i = 0; i < next.n; i++) if (next.timeS[i]! > newest) out.push({ severity: next.severity[i]!, lon: next.lon[i]! });
  return top(out, max);
}

// Events the playhead passed while moving from `fromS` to `toS` (exclusive, inclusive), most severe first.
export function eventsBetween(snaps: (Snapshot | undefined)[], fromS: number, toS: number, max = 2): Ping[] {
  if (!Number.isFinite(fromS) || !Number.isFinite(toS) || toS <= fromS) return [];
  const out: Ping[] = [];
  for (const s of snaps) {
    if (!s) continue;
    for (let i = 0; i < s.n; i++) {
      const t = s.timeS[i]!;
      if (t > fromS && t <= toS) out.push({ severity: s.severity[i]!, lon: s.lon[i]! });
    }
  }
  return top(out, max);
}

const fire = (pings: Ping[]) => {
  if (!useSound.getState().enabled || document.hidden) return;
  pings.forEach((p, i) => window.setTimeout(() => allowPing() && sonar.ping(p.severity, p.lon), i * 150));
};

// Pings for: events arriving with a refresh, events passing under the playhead during Play, and the Night Watch target on arrival.
export function useSoundTriggers(watchTarget: { index: number; severity: number; lon: number } | null) {
  useEffect(
    () =>
      useEvents.subscribe((st, prev) => {
        if (st.recent && st.recent !== prev.recent) fire(newEvents(prev.recent, st.recent));
      }),
    [],
  );
  useEffect(() => {
    let head = Date.now() / 1000 - useTime.getState().backS;
    let lastScan = 0;
    return useTime.subscribe((st) => {
      const now = Date.now();
      const to = now / 1000 - st.backS;
      if (!st.playing) return void (head = to);
      if (now - lastScan < 100 || !useSound.getState().enabled) return;
      lastScan = now;
      const { recent, archive } = useEvents.getState();
      fire(eventsBetween([recent, archive], head, to));
      head = to;
    });
  }, []);
  useEffect(() => {
    if (watchTarget) fire([{ severity: watchTarget.severity, lon: watchTarget.lon }]);
  }, [watchTarget?.index, watchTarget?.severity, watchTarget?.lon]);
}
