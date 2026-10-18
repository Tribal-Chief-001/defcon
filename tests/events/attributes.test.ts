import { describe, expect, it } from 'vitest';
import { buildAttributes } from '../../src/events/attributes';
import { decodeSnapshot } from '../../src/events/snapshot';
import { encodeSnapshot } from '../../scripts/events/encode';
import type { Ev } from '../../src/events/types';

const NOW = Date.UTC(2026, 9, 18, 12) / 1000;
const ev = (id: string, o: Partial<Ev>): Ev => ({
  id, source: 'ucdp', alsoIds: [], timeS: NOW - 3600, lat: 10, lon: 20, precision: 1, country: 'IND', kind: 'armed', deaths: 1, severity: 2, human: true,
  place: '', headline: '', actors: '', sources: [], firstSeenS: NOW, updatedS: NOW, ...o,
});
const snap = (events: Ev[]) => {
  const e = encodeSnapshot(events, { asOfS: NOW, generatedS: NOW, sources: [] });
  return decodeSnapshot(e.bin.buffer.slice(e.bin.byteOffset, e.bin.byteOffset + e.bin.byteLength) as ArrayBuffer, e.meta);
};
const ORANGE = [1, 0x4d / 255, 0];
const BONE = [0xed / 255, 0xed / 255, 0xe9 / 255];
const allFinite = (a: Float32Array) => a.every((v) => Number.isFinite(v));

describe('buildAttributes', () => {
  // Review Focus 4: no NaN may reach the GPU buffers.
  const s = snap([
    ev('a', { severity: 5, lat: 10, lon: 20, timeS: NOW - 7200 }),
    ev('b', { kind: 'protest', human: false, severity: 1, lat: -30, lon: 100 }),
    ev('c', { lat: NaN }),
    ev('d', { lat: 90, lon: 180, severity: 3 }),
  ]);
  const a = buildAttributes(s, 1.004, NOW);

  it('skips events with non-finite coordinates and reports the real count', () => {
    expect(a.count).toBe(3);
    expect(a.position.length).toBe(9);
    expect(a.color.length).toBe(9);
    expect(a.size.length).toBe(3);
  });
  it('never puts NaN or Infinity in any buffer', () => {
    for (const buf of [a.position, a.color, a.size, a.age, a.hollow, a.phase]) expect(allFinite(buf)).toBe(true);
  });
  it('keeps every position on the sphere of the given radius (including the pole at the antimeridian)', () => {
    for (let i = 0; i < a.count; i++) expect(Math.abs(Math.hypot(a.position[i * 3]!, a.position[i * 3 + 1]!, a.position[i * 3 + 2]!) - 1.004)).toBeLessThan(1e-5);
  });
  it('colours violence orange and protests bone', () => {
    const idx = (id: number) => id * 3;
    // events are sorted by time then id: a (7200 s old), then b, d (3600 s old)
    expect([...a.color.slice(idx(0), idx(0) + 3)]).toEqual(ORANGE.map((v) => Math.fround(v)));
    expect([...a.color.slice(idx(1), idx(1) + 3)]).toEqual(BONE.map((v) => Math.fround(v)));
  });
  it('sizes by severity: 1 -> 3 px, 5 -> 9 px, increasing', () => {
    expect([...a.size]).toEqual([9, 3, 6]);
  });
  it('marks auto-coded events hollow and gives each event its age in seconds', () => {
    expect([...a.hollow]).toEqual([0, 1, 0]);
    expect([...a.age]).toEqual([7200, 3600, 3600]);
  });
  it('handles an empty snapshot', () => {
    const e = buildAttributes(snap([]), 1.004, NOW);
    expect(e.count).toBe(0);
    expect(e.position.length).toBe(0);
  });
});
