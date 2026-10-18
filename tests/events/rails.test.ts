import { describe, expect, it } from 'vitest';
import { decodeSnapshot } from '../../src/events/snapshot';
import { hotspots, latestEvents } from '../../src/events/rails';
import { encodeSnapshot } from '../../scripts/events/encode';
import type { Ev } from '../../src/events/types';

const DAY = 86400;
const NOW = Date.UTC(2026, 9, 18, 9) / 1000;
let n = 0;
const ev = (o: Partial<Ev>): Ev => ({
  id: `e${n++}`, source: 'ucdp', alsoIds: [], timeS: NOW - 3600, lat: 10, lon: 20, precision: 1, country: 'AAA', kind: 'armed', deaths: 1, severity: 3, human: true,
  place: '', headline: '', actors: '', sources: [], firstSeenS: NOW, updatedS: NOW, ...o,
});
const snap = (events: Ev[]) => {
  const e = encodeSnapshot(events, { asOfS: NOW, generatedS: NOW, sources: [] });
  return decodeSnapshot(e.bin.buffer.slice(e.bin.byteOffset, e.bin.byteOffset + e.bin.byteLength) as ArrayBuffer, e.meta);
};

describe('hotspots (last 7 days)', () => {
  it('is empty for an empty snapshot', () => {
    expect(hotspots(snap([]), NOW)).toEqual([]);
  });
  it('ranks countries by their tension score, with the event count and a 0..1 share of the top score', () => {
    const s = snap([
      ...Array.from({ length: 5 }, () => ev({ country: 'AAA', severity: 4 })),
      ...Array.from({ length: 2 }, () => ev({ country: 'BBB', severity: 2 })),
      ev({ country: 'CCC', severity: 1, kind: 'protest', human: false }),
    ]);
    const r = hotspots(s, NOW);
    expect(r.map((x) => x.country)).toEqual(['AAA', 'BBB', 'CCC']);
    expect(r.map((x) => x.events)).toEqual([5, 2, 1]);
    expect(r[0]!.share).toBe(1);
    expect(r[1]!.share).toBeGreaterThan(0);
    expect(r[1]!.share).toBeLessThan(1);
    expect(r.every((x) => x.score > 0)).toBe(true);
  });
  it('lists at most n, breaks ties by id, and skips countries with no scoring events in the window', () => {
    const s = snap([ev({ country: 'ZZZ' }), ev({ country: 'AAA' }), ev({ country: 'OLD', timeS: NOW - 9 * DAY }), ev({ country: 'OTH', kind: 'other' })]);
    const r = hotspots(s, NOW, 1);
    expect(r).toHaveLength(1);
    expect(r[0]!.country).toBe('AAA');
    expect(hotspots(s, NOW).map((x) => x.country)).toEqual(['AAA', 'ZZZ']);
  });
  it('ignores events over open water and in the future, and never yields NaN', () => {
    const s = snap([ev({ country: null }), ev({ country: 'AAA', timeS: NOW + DAY }), ev({ country: 'BBB' })]);
    const r = hotspots(s, NOW);
    expect(r.map((x) => x.country)).toEqual(['BBB']);
    expect(JSON.stringify(r)).not.toMatch(/null|NaN/);
  });
});

describe('latestEvents', () => {
  it('lists the newest first, at most one per country, within 7 days', () => {
    const s = snap([
      ev({ country: 'AAA', timeS: NOW - 7200 }),
      ev({ country: 'AAA', timeS: NOW - 600 }),
      ev({ country: 'BBB', timeS: NOW - 3600 }),
      ev({ country: 'OLD', timeS: NOW - 8 * DAY }),
    ]);
    const r = latestEvents(s, NOW);
    expect(r.map((x) => x.country)).toEqual(['AAA', 'BBB']);
    expect(r[0]!.timeS).toBe(NOW - 600);
  });
  it('skips open water, future events and non-finite coordinates, respects n, and carries what a row needs', () => {
    const s = snap([ev({ country: null }), ev({ country: 'F1', timeS: NOW + 3600 }), ev({ country: 'F2', lat: NaN }), ...Array.from({ length: 9 }, (_, i) => ev({ country: `C${i}` }))]);
    const r = latestEvents(s, NOW, 4);
    expect(r).toHaveLength(4);
    expect(r[0]).toEqual(expect.objectContaining({ kind: 'armed', severity: 3, human: true, lat: 10, lon: 20 }));
    expect(typeof r[0]!.index).toBe('number');
    expect(latestEvents(snap([]), NOW)).toEqual([]);
  });
  // review finding: the count shown must be of events that score (kind "other" weighs nothing)
  it('counts only events that count towards the score', () => {
    const s = snap([ev({ country: 'AAA' }), ev({ country: 'AAA', kind: 'other' }), ev({ country: 'AAA', kind: 'other' })]);
    expect(hotspots(s, NOW)[0]).toMatchObject({ country: 'AAA', events: 1 });
  });
});

describe('latestEvents with a kind filter', () => {
  it('filters before taking one event per country, so a newer protest does not hide an older attack', () => {
    const s = snap([ev({ country: 'AAA', kind: 'armed', timeS: NOW - 7200 }), ev({ country: 'AAA', kind: 'protest', timeS: NOW - 600 }), ev({ country: 'BBB', kind: 'protest' })]);
    const r = latestEvents(s, NOW, 6, { kinds: ['armed', 'civilian'] });
    expect(r.map((x) => [x.country, x.kind])).toEqual([['AAA', 'armed']]);
    expect(latestEvents(s, NOW, 6).map((x) => x.country)).toEqual(['AAA', 'BBB']); // no filter: unchanged behaviour
  });
});

describe('latestEvents with a human-coded filter', () => {
  it('keeps only human-coded or only auto-coded events, before taking one per country', () => {
    const s = snap([ev({ country: 'AAA', human: true, timeS: NOW - 7200 }), ev({ country: 'AAA', human: false, timeS: NOW - 600 }), ev({ country: 'BBB', human: true })]);
    expect(latestEvents(s, NOW, 6, { human: false }).map((x) => [x.country, x.human])).toEqual([['AAA', false]]);
    expect(latestEvents(s, NOW, 6, { human: true }).map((x) => x.country)).toEqual(['BBB', 'AAA']);
  });
});

