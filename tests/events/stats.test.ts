import { describe, expect, it } from 'vitest';
import { decodeSnapshot } from '../../src/events/snapshot';
import { globalStats } from '../../src/events/stats';
import { encodeSnapshot } from '../../scripts/events/encode';
import type { Ev } from '../../src/events/types';

const DAY = 86400;
const NOW = Date.UTC(2026, 9, 18, 9) / 1000;
let n = 0;
const ev = (o: Partial<Ev>): Ev => ({
  id: `e${n++}`, source: 'ucdp', alsoIds: [], timeS: NOW - 3600, lat: 10, lon: 20, precision: 1, country: 'AAA', kind: 'armed', deaths: 1, severity: 2, human: true,
  place: '', headline: '', actors: '', sources: [], firstSeenS: NOW, updatedS: NOW, ...o,
});
const snap = (events: Ev[]) => {
  const e = encodeSnapshot(events, { asOfS: NOW, generatedS: NOW, sources: [] });
  return decodeSnapshot(e.bin.buffer.slice(e.bin.byteOffset, e.bin.byteOffset + e.bin.byteLength) as ArrayBuffer, e.meta);
};

describe('globalStats (last 30 days)', () => {
  it('is null without a snapshot', () => {
    expect(globalStats(undefined, NOW)).toBeNull();
  });
  it('is zero events, no share and no countries for an empty snapshot (never NaN)', () => {
    expect(globalStats(snap([]), NOW)).toEqual({ events: 0, humanShare: null, countries: 0 });
  });
  it('counts events, the human-coded share and the distinct countries', () => {
    const s = snap([ev({ country: 'AAA' }), ev({ country: 'AAA', human: false }), ev({ country: 'BBB', human: false }), ev({ country: null, human: false })]);
    const r = globalStats(s, NOW)!;
    expect(r.events).toBe(4);
    expect(r.humanShare).toBeCloseTo(0.25, 5);
    expect(r.countries).toBe(2); // events over open water belong to no country
  });
  it('a snapshot of only auto-coded events has a 0 share, not null', () => {
    expect(globalStats(snap([ev({ human: false })]), NOW)).toMatchObject({ events: 1, humanShare: 0 });
  });
  it('ignores events older than 30 days, in the future, and with a non-finite time or place', () => {
    const s = snap([ev({ timeS: NOW - 31 * DAY }), ev({ timeS: NOW + 3 * DAY }), ev({ lat: NaN }), ev({})]);
    expect(globalStats(s, NOW)).toMatchObject({ events: 1, countries: 1 });
  });
});
