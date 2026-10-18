import { describe, expect, it } from 'vitest';
import { formatReadout, snapTarget } from '../../src/globe/radar';

describe('snapTarget', () => {
  const cur = { x: 100, y: 100 };
  it('picks the nearest candidate within 28 px', () => {
    const t = snapTarget(cur, [{ x: 130, y: 100, km: 5 }, { x: 110, y: 100, km: 9 }]);
    expect(t).toEqual({ x: 110, y: 100, km: 9 });
  });
  it('returns null beyond the snap radius and for an empty list', () => {
    expect(snapTarget(cur, [{ x: 140, y: 100, km: 1 }])).toBeNull();
    expect(snapTarget(cur, [])).toBeNull();
  });
  it('prefers the smaller distance in km on an equal screen distance', () => {
    expect(snapTarget(cur, [{ x: 110, y: 100, km: 20 }, { x: 100, y: 110, km: 8 }])!.km).toBe(8);
  });
  it('is null for non-finite input', () => {
    expect(snapTarget({ x: NaN, y: 1 }, [{ x: 1, y: 1, km: 1 }])).toBeNull();
    expect(snapTarget(cur, [{ x: NaN, y: 1, km: 1 }])).toBeNull();
  });
});

describe('formatReadout', () => {
  it('formats hemispheres and adds the event distance when snapped', () => {
    expect(formatReadout(28.61, 77.21, null)).toBe('28.61N 77.21E');
    expect(formatReadout(-33.87, -151.2, null)).toBe('33.87S 151.20W');
    expect(formatReadout(28.61, 77.21, 12.4)).toBe('28.61N 77.21E // EVENT 12 KM');
    expect(formatReadout(0, 0, 0.2)).toBe('0.00N 0.00E // EVENT 0 KM');
  });
  it('shows -- for non-finite coordinates', () => {
    expect(formatReadout(NaN, 10, null)).toBe('--');
  });
});
