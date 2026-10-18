export type Freshness = { state: 'live' | 'recent' | 'stale'; label: string };

const hhmm = (s: number) => new Date(s * 1000).toISOString().slice(11, 16);

// live <= 45 min, recent <= 3 h, otherwise stale. A time in the future (clock skew) counts as live.
export function freshness(asOfS: number, nowS: number): Freshness {
  const age = nowS - asOfS;
  const state = age <= 45 * 60 ? 'live' : age <= 3 * 3600 ? 'recent' : 'stale';
  return { state, label: `DATA AS OF ${hhmm(asOfS)} UTC` };
}
