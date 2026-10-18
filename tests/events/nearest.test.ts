import { describe, expect, it } from 'vitest';
import { createEventIndex } from '../../src/events';
import { decodeSnapshot } from '../../src/events/snapshot';
import { encodeSnapshot } from '../../scripts/events/encode';
import type { Ev } from '../../src/events/types';

const NOW = Date.UTC(2026, 9, 18, 12) / 1000;
const ev = (id: string, lat: number, lon: number): Ev => ({
  id, source: 'ucdp', alsoIds: [], timeS: NOW, lat, lon, precision: 1, country: null, kind: 'armed', deaths: 1, severity: 2, human: true,
  place: id, headline: '', actors: '', sources: [], firstSeenS: NOW, updatedS: NOW,
});
const snap = (events: Ev[]) => {
  const e = encodeSnapshot(events, { asOfS: NOW, generatedS: NOW, sources: [] });
  return { s: decodeSnapshot(e.bin.buffer.slice(e.bin.byteOffset, e.bin.byteOffset + e.bin.byteLength) as ArrayBuffer, e.meta), order: e.details };
};
// snapshot index of the event whose place is `id` (events share a timestamp, so they are ordered by id)
const idxOf = (ids: string[], id: string) => [...ids].sort().indexOf(id);

describe('createEventIndex.nearest', () => {
  const ids = ['a', 'b', 'c'];
  const { s } = snap([ev('a', 10, 10), ev('b', 10.05, 10.05), ev('c', 40, 40)]);
  const ix = createEventIndex(s);

  it('returns the closest event within maxKm', () => {
    expect(ix.nearest(10.04, 10.04, 50)).toBe(idxOf(ids, 'b'));
    expect(ix.nearest(10.0, 10.0, 50)).toBe(idxOf(ids, 'a'));
  });
  it('returns -1 when nothing is within maxKm', () => {
    expect(ix.nearest(25, 25, 50)).toBe(-1);
    expect(ix.nearest(10.5, 10.5, 5)).toBe(-1);
  });
  it('finds an event across the antimeridian', () => {
    const { s: s2 } = snap([ev('w', 0, 179.95)]);
    expect(createEventIndex(s2).nearest(0, -179.95, 20)).toBe(0);
  });
  it('finds events near the poles without blowing up', () => {
    const { s: s3 } = snap([ev('p', 89.9, 10)]);
    expect(createEventIndex(s3).nearest(89.95, -170, 50)).toBe(0);
  });
  it('handles an empty snapshot and skips events with NaN coordinates', () => {
    expect(createEventIndex(snap([]).s).nearest(0, 0, 100)).toBe(-1);
    const { s: s4 } = snap([ev('n', NaN, 5), ev('m', 5, 5)]);
    expect(createEventIndex(s4).nearest(5, 5, 10)).toBe(idxOf(['n', 'm'], 'm'));
  });
});
