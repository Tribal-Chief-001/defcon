import { describe, expect, it } from 'vitest';
import { pickEvent } from '../../src/events/pickEvent';
import { decodeSnapshot } from '../../src/events/snapshot';
import { encodeSnapshot } from '../../scripts/events/encode';
import type { Ev } from '../../src/events/types';

const T = Date.UTC(2026, 9, 18, 12) / 1000;
const ev = (id: string, lat: number, lon: number): Ev => ({
  id, source: 'ucdp', alsoIds: [], timeS: T, lat, lon, precision: 1, country: null, kind: 'armed', deaths: 1, severity: 2, human: true,
  place: id, headline: '', actors: '', sources: [], firstSeenS: T, updatedS: T,
});
const snap = (events: Ev[]) => {
  const e = encodeSnapshot(events, { asOfS: T, generatedS: T, sources: [] });
  return decodeSnapshot(e.bin.buffer.slice(e.bin.byteOffset, e.bin.byteOffset + e.bin.byteLength) as ArrayBuffer, e.meta);
};

describe('pickEvent', () => {
  const recent = snap([ev('r', 10, 10)]);
  const archive = snap([ev('a', 10.02, 10.02), ev('far', 50, 50)]);
  it('returns the closest event across both snapshots, with the snapshot name', () => {
    expect(pickEvent(recent, archive, 10.019, 10.019, 50)).toMatchObject({ name: 'archive', index: 0 });
    expect(pickEvent(recent, archive, 10.001, 10.001, 50)).toMatchObject({ name: 'recent', index: 0 });
  });
  it('returns null when nothing is within maxKm', () => {
    expect(pickEvent(recent, archive, 30, 30, 50)).toBeNull();
  });
  it('works with only one snapshot loaded, or none', () => {
    expect(pickEvent(undefined, archive, 50, 50, 10)).toMatchObject({ name: 'archive' });
    expect(pickEvent(undefined, undefined, 0, 0, 100)).toBeNull();
  });
});
