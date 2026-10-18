import type { Kind } from './types';

type Level = 1 | 2 | 3 | 4 | 5;
type Input = { kind: Kind; deaths: number | null; human: boolean; goldstein?: number; numSources?: number };

const BASE: Record<Kind, Level> = { armed: 1, civilian: 1, riot: 2, protest: 1, other: 1 };
const cap = (n: number, max: number): Level => Math.max(1, Math.min(max, Math.round(n))) as Level;

// Fatality bins for human-coded events: 0 -> 1, 1-4 -> 2, 5-24 -> 3, 25-99 -> 4, 100+ -> 5.
const byDeaths = (deaths: number | null): Level => {
  if (deaths === null || !Number.isFinite(deaths) || deaths <= 0) return 1;
  if (deaths < 5) return 2;
  if (deaths < 25) return 3;
  if (deaths < 100) return 4;
  return 5;
};

// See docs/SEVERITY.md. Auto-coded events carry no fatality counts, so they never exceed 3.
export function severity({ kind, deaths, human, goldstein, numSources }: Input): Level {
  if (human) {
    const base = BASE[kind];
    return kind === 'armed' || kind === 'civilian' ? byDeaths(deaths) : (Math.max(base, byDeaths(deaths)) as Level);
  }
  if (kind === 'armed' || kind === 'civilian') return cap(2 + (typeof goldstein === 'number' && goldstein <= -9.5 ? 1 : 0), 3);
  const wide = typeof numSources === 'number' && numSources >= 10 ? 1 : 0;
  return cap(BASE[kind] + wide, 3);
}
