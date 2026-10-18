export type Freshness = { state: 'live' | 'recent' | 'stale'; label: string };

const hhmm = (s: number) => (Number.isFinite(s) ? new Date(s * 1000).toISOString().slice(11, 16) : '--:--');

// Thresholds follow the publish cadence (every 3 hours, docs/DEPLOY.md): live <= 4 h, recent <= 12 h, otherwise stale.
export const LIVE_S = 4 * 3600;
export const RECENT_S = 12 * 3600;
// A time in the future (clock skew) counts as live.
export function freshness(asOfS: number, nowS: number): Freshness {
  const age = nowS - asOfS;
  const state = !Number.isFinite(age) ? 'stale' : age <= LIVE_S ? 'live' : age <= RECENT_S ? 'recent' : 'stale';
  return { state, label: `DATA AS OF ${hhmm(asOfS)} UTC` };
}
