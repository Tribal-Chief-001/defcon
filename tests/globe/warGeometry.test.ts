import { describe, expect, it } from 'vitest';
import type { Conflict, Range } from '../../src/conflicts/types';
import { circlePoints, cullLabels, distanceKm, focusDistance, haloRadiusPx, toWarConflicts, type WarLabelPos } from '../../src/globe/warGeometry';

describe('circlePoints', () => {
  it('lies on the great circle at the requested radius around the centre', () => {
    for (const [lat, lon, km] of [[48.7, 36.2, 200], [0, 0, 1000], [-17.7, 179.9, 500], [60, -170, 800]] as const) {
      const pts = circlePoints(lat, lon, km, 64);
      expect(pts).toHaveLength(64);
      for (const [pl, po] of pts) expect(distanceKm({ lat, lon }, { lat: pl, lon: po })).toBeCloseTo(km, 0);
    }
  });
  it('keeps longitudes inside -180..180 across the antimeridian and never produces NaN', () => {
    const pts = circlePoints(0, 179.9, 500, 32);
    expect(pts.some(([, lon]) => lon < -170)).toBe(true);
    expect(pts.every(([la, lo]) => Number.isFinite(la) && Number.isFinite(lo) && Math.abs(lo) <= 180 && Math.abs(la) <= 90)).toBe(true);
  });
  it('returns an empty ring for a bad radius or count', () => {
    expect(circlePoints(0, 0, -5, 16)).toEqual([]);
    expect(circlePoints(0, 0, Number.NaN, 16)).toEqual([]);
    expect(circlePoints(0, 0, 100, 2)).toEqual([]);
  });
});

describe('haloRadiusPx', () => {
  it('grows with deaths, stays within 10..34 px and is safe for bad input', () => {
    const r = [0, 1, 100, 10_000, 1_000_000, 1e12].map(haloRadiusPx);
    expect([...r].sort((a, b) => a - b)).toEqual(r);
    expect(Math.min(...r)).toBe(10);
    expect(Math.max(...r)).toBe(34);
    expect(haloRadiusPx(Number.NaN)).toBe(10);
    expect(haloRadiusPx(-5)).toBe(10);
  });
});

describe('focusDistance', () => {
  it('is close for a small conflict, farther for a wide one, always inside the camera limits', () => {
    expect(focusDistance(40)).toBeLessThan(focusDistance(500));
    expect(focusDistance(500)).toBeLessThan(focusDistance(2500));
    for (const km of [0, 40, 400, 2500, 9999, Number.NaN]) {
      const d = focusDistance(km);
      expect(d).toBeGreaterThanOrEqual(1.45);
      expect(d).toBeLessThanOrEqual(4);
    }
  });
});

const R = (best: number): Range => ({ best, low: best, high: best });
const c = (id: string, d90: number, geo: Conflict['geo'], trend: Conflict['trend'] = 'steady'): Conflict => ({
  id, name: id.toUpperCase(), kinds: ['state'], countries: [], deaths: { d30: R(0), d90: R(d90), d365: R(d90 * 4) }, events: { d30: 0, d90: 0, d365: 0 }, trend, lastDate: '2026-08-31',
  weekly: new Array<number>(52).fill(0), latest: [], provisionalShare: 0, geo,
});
const geo = (lat = 1, lon = 2): NonNullable<Conflict['geo']> => ({ lat, lon, spreadKm: 100, locatedShare: 1, cells: [[1, 2, 10]] });

describe('toWarConflicts', () => {
  it('keeps conflicts with deaths in the last 90 days and a place, ranked by 90-day deaths', () => {
    const list = toWarConflicts([c('a', 10, geo()), c('b', 500, geo()), c('quiet', 0, geo()), c('nowhere', 900, null)]);
    expect(list.map((x) => x.id)).toEqual(['b', 'a']);
    expect(list[0]).toMatchObject({ id: 'b', name: 'B', lat: 1, lon: 2, spreadKm: 100, deaths365: 2000, deaths90: 500, rank: 0 });
    expect(list[1]!.rank).toBe(1);
  });
  it('carries the trend and the hotspot cells and skips conflicts with a non-finite place', () => {
    const [x] = toWarConflicts([c('r', 50, geo(), 'rising')]);
    expect(x!.trend).toBe('rising');
    expect(x!.cells).toEqual([[1, 2, 10]]);
    expect(toWarConflicts([c('bad', 50, { ...geo(), lat: Number.NaN })])).toEqual([]);
  });
});

const L = (id: string, x: number, y: number, o: Partial<WarLabelPos> = {}): WarLabelPos => ({ id, name: id.toUpperCase(), x, y, r: 14, selected: false, rising: false, deaths90: 100, ...o });
describe('cullLabels', () => {
  it('drops a label that would overlap one already placed (the earlier, higher-ranked one wins)', () => {
    const out = cullLabels([L('a', 300, 300), L('b', 310, 304), L('c', 300, 500)], { minY: 0 });
    expect(out.map((l) => l.id)).toEqual(['a', 'c']);
  });
  it('keeps the selected label even if it comes last and drops what it overlaps', () => {
    const out = cullLabels([L('a', 300, 300), L('s', 305, 302, { selected: true })], { minY: 0 });
    expect(out.map((l) => l.id)).toEqual(['s']);
  });
  it('drops labels above the line (the top bar and the controls row) and off-screen ones', () => {
    const out = cullLabels([L('top', 300, 90), L('ok', 300, 300), L('left', -50, 300)], { minY: 118 });
    expect(out.map((l) => l.id)).toEqual(['ok']);
  });
});

