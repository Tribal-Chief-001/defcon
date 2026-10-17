import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Topology } from 'topojson-specification';
import { buildBorderPositions } from '../../src/globe/borderGeometry';
import { vec3ToLatLon } from '../../src/lib/geo';

const low = JSON.parse(readFileSync('public/data/borders.low.topo.json', 'utf8')) as Topology;

describe('buildBorderPositions', () => {
  it('on the low-detail data: pairs of vertices, no NaN, every vertex on the sphere', () => {
    const p = buildBorderPositions(low, 1);
    expect(p.length).toBeGreaterThan(0);
    expect(p.length % 6).toBe(0);
    let maxErr = 0;
    for (let i = 0; i < p.length; i += 3) {
      const len = Math.hypot(p[i]!, p[i + 1]!, p[i + 2]!);
      expect(Number.isNaN(len)).toBe(false);
      maxErr = Math.max(maxErr, Math.abs(len - 1));
    }
    expect(maxErr).toBeLessThan(1e-6);
  });

  // Review Focus 2: an arc from lon 179 to lon -179 must go the short way through lon 180, never across the sphere.
  const antimeridian: Topology = {
    type: 'Topology',
    arcs: [[[179, 0], [-179, 0]]],
    objects: { countries: { type: 'LineString', arcs: [0] } },
  };
  it('subdivides across the antimeridian along the short great-circle path', () => {
    const p = buildBorderPositions(antimeridian, 1, 1);
    expect(p.length / 6).toBeGreaterThanOrEqual(2);
    const lons: number[] = [];
    let maxSegDeg = 0;
    for (let i = 0; i < p.length; i += 6) {
      const a = [p[i]!, p[i + 1]!, p[i + 2]!];
      const b = [p[i + 3]!, p[i + 4]!, p[i + 5]!];
      const dot = a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
      maxSegDeg = Math.max(maxSegDeg, (Math.acos(Math.min(1, dot)) * 180) / Math.PI);
      lons.push(vec3ToLatLon(a[0]!, a[1]!, a[2]!).lon);
    }
    expect(maxSegDeg).toBeLessThanOrEqual(1.0001);
    expect(lons.some((l) => Math.abs(l) > 179.4)).toBe(true);
    expect(lons.every((l) => Math.abs(l) > 178.9)).toBe(true); // never wanders through lon 0
  });
});
