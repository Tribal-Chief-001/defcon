import { describe, expect, it } from 'vitest';
import { subsolarPoint, terminatorPoints } from '../../src/globe/sun';
import { latLonToVec3 } from '../../src/lib/geo';

const utc = (y: number, m: number, d: number, h = 0, min = 0) => Date.UTC(y, m - 1, d, h, min) / 1000;
const deg = (a: number[], b: number[]) => (Math.acos(Math.max(-1, Math.min(1, a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!))) * 180) / Math.PI;

describe('subsolarPoint', () => {
  it('has the Tropic of Cancer latitude at the June solstice and Capricorn at the December solstice', () => {
    expect(Math.abs(subsolarPoint(utc(2026, 6, 21, 8, 24)).lat - 23.44)).toBeLessThan(0.6);
    expect(Math.abs(subsolarPoint(utc(2026, 12, 21, 15, 50)).lat + 23.44)).toBeLessThan(0.6);
  });
  it('is on the equator at the March equinox', () => {
    expect(Math.abs(subsolarPoint(utc(2026, 3, 20, 14, 46)).lat)).toBeLessThan(0.6);
  });
  it('is near longitude 0 at 12:00 UTC (within the equation of time) and 90 degrees west of it at 18:00 UTC', () => {
    expect(Math.abs(subsolarPoint(utc(2026, 4, 15, 12)).lon)).toBeLessThan(5);
    expect(Math.abs(subsolarPoint(utc(2026, 4, 15, 18)).lon - -90)).toBeLessThan(5);
  });
  it('keeps longitude in [-180, 180] and latitude within the tropics for a year of days', () => {
    for (let d = 0; d < 366; d++) {
      const p = subsolarPoint(utc(2026, 1, 1) + d * 86400 + 7 * 3600);
      expect(p.lon).toBeGreaterThanOrEqual(-180);
      expect(p.lon).toBeLessThanOrEqual(180);
      expect(Math.abs(p.lat)).toBeLessThan(23.6);
    }
  });
  it('falls back to 0,0 for non-finite input', () => {
    expect(subsolarPoint(NaN)).toEqual({ lat: 0, lon: 0 });
  });
});

describe('terminatorPoints', () => {
  const sun = { lat: 20, lon: 40 };
  it('has n points, each 90 degrees from the sun', () => {
    const pts = terminatorPoints(sun, 180);
    expect(pts).toHaveLength(180);
    for (const [lat, lon] of pts) expect(Math.abs(deg(latLonToVec3(lat, lon), latLonToVec3(sun.lat, sun.lon)) - 90)).toBeLessThan(0.5);
  });
  it('never jumps more than a few degrees between neighbours except across the antimeridian', () => {
    const pts = terminatorPoints(sun, 180);
    for (let i = 1; i < pts.length; i++) {
      const a = latLonToVec3(pts[i - 1]![0], pts[i - 1]![1]);
      const b = latLonToVec3(pts[i]![0], pts[i]![1]);
      expect(deg(a, b)).toBeLessThan(3);
    }
  });
  it('returns finite points for a sun at a pole', () => {
    expect(terminatorPoints({ lat: 90, lon: 0 }, 60).flat().every(Number.isFinite)).toBe(true);
  });
});
