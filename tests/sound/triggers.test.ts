import { describe, expect, it } from 'vitest';
import { decodeSnapshot } from '../../src/events/snapshot';
import { encodeSnapshot } from '../../scripts/events/encode';
import { eventsBetween, newEvents } from '../../src/sound/triggers';
import type { Ev } from '../../src/events/types';

const NOW = Date.UTC(2026, 9, 18, 5) / 1000;
let n = 0;
const ev = (timeS: number, severity: Ev['severity'], lon = 10): Ev => ({
  id: `e${n++}`, source: 'ucdp', alsoIds: [], timeS, lat: 1, lon, precision: 1, country: 'AAA', kind: 'armed', deaths: 1, severity, human: true,
  place: '', headline: '', actors: '', sources: [], firstSeenS: timeS, updatedS: timeS,
});
const snap = (events: Ev[], tag = 'a') => {
  const e = encodeSnapshot(events, { asOfS: NOW, generatedS: NOW, sources: [{ id: 'ucdp', name: tag, version: tag, asOfS: NOW, url: 'https://x', license: 'x' }] });
  return decodeSnapshot(e.bin.buffer.slice(e.bin.byteOffset, e.bin.byteOffset + e.bin.byteLength) as ArrayBuffer, e.meta);
};

describe('newEvents', () => {
  it('is empty for the first load and for an unchanged snapshot', () => {
    const a = snap([ev(NOW - 100, 3)]);
    expect(newEvents(undefined, a)).toEqual([]);
    expect(newEvents(a, a)).toEqual([]);
  });
  it('returns the newest arrivals, highest severity first, at most max', () => {
    const prev = snap([ev(NOW - 1000, 3)]);
    const next = snap([ev(NOW - 1000, 3), ev(NOW - 50, 2, 30), ev(NOW - 40, 5, -60), ev(NOW - 30, 4, 90)], 'b');
    expect(newEvents(prev, next, 2)).toEqual([{ severity: 5, lon: -60 }, { severity: 4, lon: 90 }]);
  });
});

describe('eventsBetween', () => {
  const a = snap([ev(100, 2), ev(200, 5, 20), ev(300, 3), ev(400, 4)]);
  it('returns events in (from, to], highest severity first, at most max', () => {
    expect(eventsBetween([a], 100, 400, 2)).toEqual([{ severity: 5, lon: 20 }, { severity: 4, lon: 10 }]);
    expect(eventsBetween([a], 100, 100)).toEqual([]);
  });
  it('searches several snapshots, tolerates missing ones, and returns nothing for a backwards or non-finite range', () => {
    expect(eventsBetween([undefined, a], 0, 150).length).toBe(1);
    expect(eventsBetween([a], 400, 100)).toEqual([]);
    expect(eventsBetween([a], NaN, 100)).toEqual([]);
  });
});
