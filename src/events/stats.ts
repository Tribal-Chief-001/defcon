import type { Snapshot } from './snapshot';

const DAY = 86400;

// Headline numbers for the top bar: events in the last 30 days, the share of them that is human-coded (UCDP), and how many countries
// have at least one. Events in the future, older than 30 days, or with a non-finite time or place do not count; events over open water
// belong to no country. `spanDays` is the real span of the counted events in whole days (at most 30): the data may cover far less than
// the 30 days it is searched over, and the label must say so. null without a snapshot; a share of null means there are no events to take a share of.
export function globalStats(s: Snapshot | undefined, nowS: number): { events: number; humanShare: number | null; countries: number; spanDays: number } | null {
  if (!s) return null;
  let events = 0;
  let human = 0;
  let oldest = nowS;
  const countries = new Set<number>();
  for (let i = 0; i < s.n; i++) {
    const t = s.timeS[i]!;
    if (!Number.isFinite(t) || t > nowS || t < nowS - 30 * DAY) continue;
    if (!Number.isFinite(s.lat[i]!) || !Number.isFinite(s.lon[i]!)) continue;
    events++;
    oldest = Math.min(oldest, t);
    if (s.human[i] === 1) human++;
    if (s.country[i]) countries.add(s.country[i]!); // index 0 is "no country"
  }
  return { events, humanShare: events > 0 ? human / events : null, countries: countries.size, spanDays: events > 0 ? Math.max(1, Math.min(30, Math.ceil((nowS - oldest) / DAY))) : 0 };
}
