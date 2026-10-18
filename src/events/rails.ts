import type { Snapshot } from './snapshot';
import { tension } from './tension';
import { TENSION } from './tension';
import { KINDS, type Kind } from './types';

const DAY = 86400;

// The most active countries of the last 7 days, ranked by Defcon's own score (see tension.ts, so protests weigh less than violence and
// auto-coded events count half). `share` is the score relative to the top country, for a bar. Open water and the future never count.
export function hotspots(s: Snapshot, nowS: number, n = 6): { country: string; events: number; share: number; score: number }[] {
  const counts = new Map<string, number>();
  for (let i = 0; i < s.n; i++) {
    const t = s.timeS[i]!;
    const c = s.countries[s.country[i]!];
    const kind = KINDS[s.kind[i]!];
    if (!c || !kind || TENSION.weights[kind] === 0 || !Number.isFinite(t) || t > nowS || t < nowS - 7 * DAY) continue; // only events that count towards the score
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  const rows: { country: string; events: number; score: number }[] = [];
  for (const [country, events] of counts) {
    const score = tension(s, nowS, { country }).score;
    if (score > 0 && Number.isFinite(score)) rows.push({ country, events, score });
  }
  rows.sort((a, b) => b.score - a.score || a.country.localeCompare(b.country));
  const top = rows[0]?.score ?? 1;
  return rows.slice(0, n).map((r) => ({ ...r, share: r.score / top }));
}

export type LatestEvent = { index: number; country: string; kind: Kind; severity: number; human: boolean; timeS: number; lat: number; lon: number };

// The newest events of the last 7 days, one per country so a busy country does not fill the list; open water, the future and bad
// coordinates are skipped.
export function latestEvents(s: Snapshot, nowS: number, n = 6): LatestEvent[] {
  const best = new Map<string, LatestEvent>();
  for (let i = 0; i < s.n; i++) {
    const timeS = s.timeS[i]!;
    const country = s.countries[s.country[i]!];
    const lat = s.lat[i]!;
    const lon = s.lon[i]!;
    const kind = KINDS[s.kind[i]!];
    if (!country || !kind || !Number.isFinite(timeS) || timeS > nowS || timeS < nowS - 7 * DAY || !Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const cur = best.get(country);
    if (!cur || timeS > cur.timeS) best.set(country, { index: i, country, kind, severity: s.severity[i]!, human: s.human[i] === 1, timeS, lat, lon });
  }
  return [...best.values()].sort((a, b) => b.timeS - a.timeS || a.country.localeCompare(b.country)).slice(0, n);
}
