import { describe, expect, it } from 'vitest';
import { buildDensity } from '../../src/globe/grain';
import type { EventAttrs } from '../../src/events/attributes';
import { latLonToVec3 } from '../../src/lib/geo';

const attrs = (evs: { lat: number; lon: number; size?: number; age?: number }[]): EventAttrs => ({
  position: Float32Array.from(evs.flatMap((e) => latLonToVec3(e.lat, e.lon, 1))),
  color: new Float32Array(evs.length * 3),
  size: Float32Array.from(evs.map((e) => e.size ?? 5)),
  age: Float32Array.from(evs.map((e) => e.age ?? 3600)),
  hollow: new Float32Array(evs.length),
  phase: new Float32Array(evs.length),
  count: evs.length,
});
const W = 180;
const H = 90;
const at = (d: Uint8Array, row: number, col: number) => d[row * W + col]!;

describe('buildDensity', () => {
  it('is all zeros for no events and never NaN', () => {
    const d = buildDensity([], 0);
    expect(d.length).toBe(W * H);
    expect(Array.from(d).every((v) => v === 0)).toBe(true);
    expect(buildDensity([attrs([])], 0).length).toBe(W * H);
  });
  it('lights the event cell most and its neighbours less', () => {
    const d = buildDensity([attrs([{ lat: 0.5, lon: 0.5 }])], 0);
    expect(at(d, 45, 90)).toBe(255);
    expect(at(d, 45, 91)).toBeGreaterThan(0);
    expect(at(d, 45, 91)).toBeLessThan(at(d, 45, 90));
    expect(at(d, 10, 10)).toBe(0);
  });
  it('wraps longitude at the antimeridian but not latitude at the poles', () => {
    const east = buildDensity([attrs([{ lat: 0.5, lon: 179.5 }])], 0);
    expect(at(east, 45, 179)).toBe(255);
    expect(at(east, 45, 0)).toBeGreaterThan(0);
    const pole = buildDensity([attrs([{ lat: 89.5, lon: 10.5 }])], 0);
    expect(at(pole, 89, 95)).toBe(255);
    expect(at(pole, 0, 95)).toBe(0);
  });
  it('ignores events after the playhead and fades with age at the playhead', () => {
    const young = attrs([{ lat: 0.5, lon: 0.5, age: 100 }]);
    expect(Array.from(buildDensity([young], 200)).every((v) => v === 0)).toBe(true); // happens 100 s after the playhead
    const mix = buildDensity([attrs([{ lat: 0.5, lon: 0.5, age: 0 }, { lat: 40.5, lon: 40.5, age: 29 * 86400 }])], 0);
    expect(at(mix, 45, 90)).toBeGreaterThan(at(mix, 65, 110));
    expect(at(mix, 65, 110)).toBeGreaterThanOrEqual(1);
  });
  it('caps a hot cell at 255 and keeps a lone event visible (at least 1)', () => {
    const many = Array.from({ length: 100 }, () => ({ lat: 0.5, lon: 0.5 }));
    const d = buildDensity([attrs([...many, { lat: -50.5, lon: -100.5 }])], 0);
    expect(at(d, 45, 90)).toBe(255);
    expect(at(d, 19, 39)).toBeGreaterThanOrEqual(1);
    expect(Math.max(...d)).toBe(255);
  });
  it('survives zero and NaN sizes and non-finite positions', () => {
    const d = buildDensity([attrs([{ lat: 0.5, lon: 0.5, size: 0 }, { lat: 10.5, lon: 10.5, size: NaN }, { lat: NaN, lon: 3 }, { lat: 20.5, lon: 20.5, size: 5 }])], 0);
    expect(d.length).toBe(W * H);
    expect(Array.from(d).every((v) => v >= 0 && v <= 255)).toBe(true);
    expect(at(d, 55, 100)).toBe(255);
    expect(at(d, 45, 90)).toBe(0);
  });
});
