import type { Snapshot } from '../events/snapshot';
import { KINDS, type Kind } from '../events/types';

const DAY = 86400;
export const IDLE_BEFORE_WATCH_S = 20;
export const TARGET_DWELL_S = 9;

export type WatchTarget = { index: number; lat: number; lon: number; severity: number; timeS: number; kind: Kind; human: boolean; country: string };

// The most significant recent events to show: last 7 days, ranked by severity, then human-coded first, then newest; one per country.
export function watchTargets(s: Snapshot, nowS: number, n = 5): WatchTarget[] {
  const all: WatchTarget[] = [];
  for (let i = 0; i < s.n; i++) {
    const timeS = s.timeS[i]!;
    const lat = s.lat[i]!;
    const lon = s.lon[i]!;
    const kind = KINDS[s.kind[i]!];
    if (!kind || !Number.isFinite(lat) || !Number.isFinite(lon) || timeS > nowS || timeS < nowS - 7 * DAY) continue;
    all.push({ index: i, lat, lon, severity: s.severity[i]!, timeS, kind, human: s.human[i] === 1, country: s.countries[s.country[i]!] ?? '' });
  }
  all.sort((a, b) => b.severity - a.severity || Number(b.human) - Number(a.human) || b.timeS - a.timeS);
  const seen = new Set<string>();
  const out: WatchTarget[] = [];
  for (const t of all) {
    if (seen.has(t.country)) continue;
    seen.add(t.country);
    out.push(t);
    if (out.length >= n) break;
  }
  return out;
}

export type WatchState = { phase: 'idle' | 'watching'; target: number; since: number; idleSince: number; blocked: boolean };
export type WatchEvent = { type: 'tick'; nowS: number } | { type: 'input'; nowS: number } | { type: 'blocked'; value: boolean; nowS: number };

export const initialWatch = (nowS: number): WatchState => ({ phase: 'idle', target: 0, since: nowS, idleSince: nowS, blocked: false });

// After 20 s without input (and while nothing else needs the screen) it starts watching and moves to the next target every 9 s;
// any input, or something else needing the screen, returns to idle and restarts the 20 s.
export function nextState(s: WatchState, e: WatchEvent): WatchState {
  switch (e.type) {
    case 'input':
      return { ...s, phase: 'idle', idleSince: e.nowS };
    case 'blocked':
      return e.value === s.blocked ? s : { ...s, blocked: e.value, phase: e.value ? 'idle' : s.phase, idleSince: e.nowS };
    case 'tick':
      if (s.phase === 'idle') return !s.blocked && e.nowS - s.idleSince >= IDLE_BEFORE_WATCH_S ? { ...s, phase: 'watching', target: 0, since: e.nowS } : s;
      return e.nowS - s.since >= TARGET_DWELL_S ? { ...s, target: s.target + 1, since: e.nowS } : s;
  }
}

const KIND_CAPTION: Record<Kind, string> = { armed: 'ARMED CONFLICT', civilian: 'VIOLENCE AGAINST CIVILIANS', riot: 'RIOT', protest: 'PROTEST', other: 'EVENT' };

export function caption(t: { place: string; timeS: number; kind: Kind }): string {
  const when = new Date(t.timeS * 1000).toISOString().slice(0, 16).replace('T', ' ');
  return `${t.place.trim().toUpperCase() || 'UNKNOWN LOCATION'} // ${when} UTC // ${KIND_CAPTION[t.kind]}`;
}
