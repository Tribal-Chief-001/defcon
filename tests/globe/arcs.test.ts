import { describe, expect, it } from 'vitest';
import { arcPoints, dashedSegments, solidSegments } from '../../src/globe/arcs';
import { latLonToVec3 } from '../../src/lib/geo';

const len = (p: number[]) => Math.hypot(p[0]!, p[1]!, p[2]!);
const angle = (a: number[], b: number[]) => Math.acos(Math.max(-1, Math.min(1, (a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!) / (len(a) * len(b)))));

describe('arcPoints', () => {
  const a = { lat: 48.85, lon: 2.35 };
  const b = { lat: 38.9, lon: -77 };
  it('starts and ends on the unit sphere at the given points', () => {
    const pts = arcPoints(a, b);
    expect(pts[0]!.map((v, i) => v - latLonToVec3(a.lat, a.lon)[i]!).every((d) => Math.abs(d) < 1e-6)).toBe(true);
    expect(pts.at(-1)!.map((v, i) => v - latLonToVec3(b.lat, b.lon)[i]!).every((d) => Math.abs(d) < 1e-6)).toBe(true);
  });
  it('lifts the middle above the sphere but never beyond 1 + lift', () => {
    const pts = arcPoints(a, b, 48, 0.18);
    const mid = len(pts[24]!);
    expect(mid).toBeGreaterThan(1.02);
    expect(Math.max(...pts.map(len))).toBeLessThanOrEqual(1.18 + 1e-6);
  });
  it('returns only finite points for an antipodal pair and a single point for identical points', () => {
    const anti = arcPoints({ lat: 0, lon: 0 }, { lat: 0, lon: 180 });
    expect(anti.length).toBeGreaterThan(2);
    expect(anti.flat().every(Number.isFinite)).toBe(true);
    expect(arcPoints(a, a)).toHaveLength(1);
  });
  it('takes the short way across the antimeridian', () => {
    const pts = arcPoints({ lat: 0, lon: 179 }, { lat: 0, lon: -179 });
    for (let i = 1; i < pts.length; i++) expect(angle(pts[i - 1]!, pts[i]!)).toBeLessThan((3 * Math.PI) / 180);
  });
});

describe('segments', () => {
  const pts = arcPoints({ lat: 0, lon: 0 }, { lat: 0, lon: 60 }, 48);
  it('solid segments join every consecutive pair', () => {
    expect(solidSegments(pts).length).toBe((pts.length - 1) * 6);
  });
  it('dashed segments use fewer vertices than solid ones, in whole pairs', () => {
    const d = dashedSegments(pts, 3, 2);
    expect(d.length).toBeLessThan(solidSegments(pts).length);
    expect(d.length % 6).toBe(0);
    expect(d.length).toBeGreaterThan(0);
  });
  it('is empty for fewer than two points', () => {
    expect(solidSegments([[1, 0, 0]]).length).toBe(0);
    expect(dashedSegments([], 3, 2).length).toBe(0);
  });
});
