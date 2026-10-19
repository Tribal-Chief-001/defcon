import { create } from 'zustand';
import type { Snapshot } from '../events/snapshot';

// A watchlist of countries kept in this browser only (localStorage; nothing is sent anywhere). `seen[id]` is the time you last looked at a
// country (when you added it, opened it or marked it seen): events newer than that are "new". Alerts say "new events in the data", never
// "attack".
export const STORAGE_KEY = 'defcon.watchlist.v1';
export const MAX_WATCH = 20;
export type WatchState = { ids: string[]; seen: Record<string, number> };
const ID = /^[A-Z0-9]{3}$/;

export function parseWatch(raw: string | null): WatchState {
  const empty: WatchState = { ids: [], seen: {} };
  try {
    const j = JSON.parse(raw ?? '') as { ids?: unknown; seen?: unknown } | null;
    if (!j || !Array.isArray(j.ids)) return empty;
    const ids = [...new Set(j.ids.filter((x): x is string => typeof x === 'string').map((x) => x.toUpperCase()).filter((x) => ID.test(x)))].slice(0, MAX_WATCH);
    const seen: Record<string, number> = {};
    if (j.seen && typeof j.seen === 'object') for (const [k, v] of Object.entries(j.seen as Record<string, unknown>)) if (ids.includes(k) && typeof v === 'number' && Number.isFinite(v)) seen[k] = v;
    return { ids, seen };
  } catch {
    return empty;
  }
}

// the events newer than the last look per watched country (countries without a last look are skipped), most first; an event that is in
// two snapshots counts once and events from the future are ignored
export function newEventCounts(snaps: (Snapshot | undefined)[], state: WatchState, nowS: number): { id: string; count: number; latestS: number }[] {
  const out = new Map<string, { id: string; count: number; latestS: number }>();
  const keys = new Set<string>();
  for (const s of snaps) {
    if (!s) continue;
    for (let i = 0; i < s.n; i++) {
      const id = s.countries[s.country[i]!];
      const since = id ? state.seen[id] : undefined;
      const t = s.timeS[i]!;
      if (!id || since === undefined || !state.ids.includes(id) || t <= since || t > nowS + 3600) continue;
      const key = `${t}|${s.lat[i]}|${s.lon[i]}|${s.kind[i]}|${id}`;
      if (keys.has(key)) continue;
      keys.add(key);
      const g = out.get(id) ?? { id, count: 0, latestS: 0 };
      g.count++;
      g.latestS = Math.max(g.latestS, t);
      out.set(id, g);
    }
  }
  return [...out.values()].sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));
}

export function alertText(counts: { id: string; count: number; latestS?: number }[], names: Map<string, string>): string {
  const parts = counts.map((c) => ({ n: c.count, name: names.get(c.id) ?? c.id }));
  if (parts.length === 0) return '';
  const [first, ...rest] = parts;
  return [`${first!.n} new ${first!.n === 1 ? 'event' : 'events'} in ${first!.name}`, ...rest.map((p) => `${p.n} in ${p.name}`)].join(', ');
}

const save = (s: WatchState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* storage blocked or full: the list lives in memory for this visit */
  }
};
const read = (): WatchState => {
  try {
    return parseWatch(localStorage.getItem(STORAGE_KEY));
  } catch {
    return { ids: [], seen: {} };
  }
};

type Store = WatchState & { hydrate(): void; toggle(id: string, nowS: number): boolean; markSeen(ids: string[], nowS: number): void };
export const useWatchlist = create<Store>((set, get) => ({
  ...{ ids: [], seen: {} },
  hydrate: () => set(read()),
  // true when the list changed (false for a bad id or a full list)
  toggle: (raw, nowS) => {
    const id = raw.toUpperCase();
    if (!ID.test(id)) return false;
    const { ids, seen } = get();
    if (ids.includes(id)) {
      const { [id]: _gone, ...rest } = seen;
      const next = { ids: ids.filter((x) => x !== id), seen: rest };
      set(next);
      save(next);
      return true;
    }
    if (ids.length >= MAX_WATCH) return false;
    const next = { ids: [...ids, id], seen: { ...seen, [id]: nowS } };
    set(next);
    save(next);
    return true;
  },
  markSeen: (list, nowS) => {
    const { ids, seen } = get();
    const next = { ids, seen: { ...seen, ...Object.fromEntries(list.filter((x) => ids.includes(x)).map((x) => [x, nowS])) } };
    set(next);
    save(next);
  },
}));
