import { describe, expect, it } from 'vitest';
import type { Conflict } from '../src/conflicts/types';
import { conflictsInRegion, regionTotals, SOUTH_ASIA } from '../src/regions';

const R = (best: number) => ({ best, low: best, high: best });
const c = (id: string, countries: { id: string | null; name: string; deaths365: number }[]): Conflict => ({ id, name: id, kinds: ['state'], countries, deaths: { d30: R(1), d90: R(2), d365: R(10) }, events: { d30: 1, d90: 1, d365: 1 }, trend: 'steady', lastDate: '2026-08-30', weekly: [], latest: [], provisionalShare: 0, geo: null });

describe('SOUTH_ASIA', () => {
  it('is the eight SAARC member states as three-letter ids', () => {
    expect([...SOUTH_ASIA].sort()).toEqual(['AFG', 'BGD', 'BTN', 'IND', 'LKA', 'MDV', 'NPL', 'PAK']);
  });
});

describe('conflictsInRegion and regionTotals', () => {
  const list = [
    c('a', [{ id: 'PAK', name: 'Pakistan', deaths365: 300 }, { id: 'AFG', name: 'Afghanistan', deaths365: 100 }]),
    c('b', [{ id: 'UKR', name: 'Ukraine', deaths365: 900 }]),
    c('c', [{ id: 'IND', name: 'India', deaths365: 50 }, { id: 'MMR', name: 'Myanmar', deaths365: 70 }]),
    c('d', [{ id: null, name: 'Atlantis', deaths365: 5 }]),
  ];
  it('keeps the conflicts that have deaths in a member state', () => {
    expect(conflictsInRegion(list, SOUTH_ASIA).map((x) => x.id)).toEqual(['a', 'c']);
  });
  it('sums the deaths located in the member states only (not the whole conflict), per country, most first', () => {
    const t = regionTotals(list, SOUTH_ASIA);
    expect(t.deaths365).toBe(450); // 300 + 100 + 50: Myanmar's 70 and Ukraine's 900 are outside
    expect(t.countries).toEqual([
      { id: 'PAK', name: 'Pakistan', deaths365: 300 },
      { id: 'AFG', name: 'Afghanistan', deaths365: 100 },
      { id: 'IND', name: 'India', deaths365: 50 },
    ]);
  });
  it('is empty for no conflicts', () => {
    expect(regionTotals([], SOUTH_ASIA)).toEqual({ deaths365: 0, countries: [] });
    expect(conflictsInRegion([], SOUTH_ASIA)).toEqual([]);
  });
});
