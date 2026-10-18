import type { Range, World } from '../../src/conflicts/types';

export const R = (best: number, low = best - 1, high = best + 2): Range => ({ best, low, high });

export const worldFixture = (): World => ({
  deaths: { d30: R(300), d90: R(2000), d365: R(9000) },
  byKind: {
    state: { d90: R(1500), d365: R(7000) },
    'non-state': { d90: R(300), d365: R(1200) },
    'one-sided': { d90: R(200), d365: R(800) },
  },
  weekly: Array.from({ length: 52 }, (_, i) => i * 10),
  countries: [
    { id: 'UKR', name: 'Ukraine', deaths90: 1200, deaths365: 5000 },
    { id: null, name: 'Atlantis', deaths90: 50, deaths365: 80 },
  ],
  conflictsListed: 2,
  latest: [{ id: 'w1', date: '2026-08-31', place: 'Town, Region', country: 'Sudan', lat: 1, lon: 2, precision: 1, kind: 'one-sided', deaths: R(9, 7, 14), headline: 'Drone strike <b>hits</b> a camp', sources: ['Agency W'], provisional: true }],
});
