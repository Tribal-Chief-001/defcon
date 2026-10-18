import { describe, expect, it } from 'vitest';
import { decodeSnapshot } from '../../src/events/snapshot';
import { encodeSnapshot } from '../../scripts/events/encode';
import { caption, initialWatch, nextState, watchTargets } from '../../src/watch/nightWatch';
import type { Ev } from '../../src/events/types';

const DAY = 86400;
const NOW = Date.UTC(2026, 9, 18, 5, 0, 0) / 1000;
let n = 0;
const ev = (o: Partial<Ev>): Ev => ({
  id: `e${n++}`, source: 'ucdp', alsoIds: [], timeS: NOW - 3600, lat: 10, lon: 20, precision: 1, country: 'AAA', kind: 'armed', deaths: 1, severity: 3, human: true,
  place: '', headline: '', actors: '', sources: [], firstSeenS: NOW, updatedS: NOW, ...o,
});
const snap = (events: Ev[]) => {
  const e = encodeSnapshot(events, { asOfS: NOW, generatedS: NOW, sources: [] });
  return decodeSnapshot(e.bin.buffer.slice(e.bin.byteOffset, e.bin.byteOffset + e.bin.byteLength) as ArrayBuffer, e.meta);
};

describe('watchTargets', () => {
  it('ranks severity first, then human-coded, then newest, with at most one per country', () => {
    const t = watchTargets(
      snap([
        ev({ country: 'AAA', severity: 5, timeS: NOW - 7200 }),
        ev({ country: 'AAA', severity: 5, timeS: NOW - 100 }), // same country: only the better one stays
        ev({ country: 'BBB', severity: 4, human: false }),
        ev({ country: 'CCC', severity: 4, human: true }),
        ev({ country: 'DDD', severity: 4, human: true, timeS: NOW - 60 }),
      ]),
      NOW,
    );
    expect(t.map((x) => x.severity)).toEqual([5, 4, 4, 4]);
    expect(t.map((x) => x.human)).toEqual([true, true, true, false]);
    expect(t[0]!.timeS).toBe(NOW - 100);
    expect(t[1]!.timeS).toBe(NOW - 60); // newer human-coded severity 4 first
  });
  it('ignores events older than 7 days, non-finite coordinates, and returns at most n', () => {
    const s = snap([ev({ country: 'A1', timeS: NOW - 8 * DAY, severity: 5 }), ev({ country: 'A2', lat: NaN }), ...Array.from({ length: 9 }, (_, i) => ev({ country: `Z${i}` }))]);
    const t = watchTargets(s, NOW, 5);
    expect(t).toHaveLength(5);
    expect(t.every((x) => Number.isFinite(x.lat) && x.timeS >= NOW - 7 * DAY)).toBe(true);
  });
  it('is empty for an empty snapshot', () => {
    expect(watchTargets(snap([]), NOW)).toEqual([]);
  });
});

describe('nextState', () => {
  const at = (s: number) => NOW + s;
  it('goes watching after 20 s without input and cycles targets every 9 s', () => {
    let s = initialWatch(at(0));
    s = nextState(s, { type: 'tick', nowS: at(19) });
    expect(s.phase).toBe('idle');
    s = nextState(s, { type: 'tick', nowS: at(20) });
    expect(s).toMatchObject({ phase: 'watching', target: 0 });
    s = nextState(s, { type: 'tick', nowS: at(28) });
    expect(s.target).toBe(0);
    s = nextState(s, { type: 'tick', nowS: at(29) });
    expect(s.target).toBe(1);
    s = nextState(s, { type: 'tick', nowS: at(38) });
    expect(s.target).toBe(2);
  });
  it('returns to idle on any input and waits another 20 s', () => {
    let s = nextState(initialWatch(at(0)), { type: 'tick', nowS: at(20) });
    s = nextState(s, { type: 'input', nowS: at(21) });
    expect(s.phase).toBe('idle');
    expect(nextState(s, { type: 'tick', nowS: at(40) }).phase).toBe('idle');
    expect(nextState(s, { type: 'tick', nowS: at(41) }).phase).toBe('watching');
  });
  it('never starts while blocked, stops when it becomes blocked, and waits 20 s after unblocking', () => {
    let s = nextState(initialWatch(at(0)), { type: 'blocked', value: true, nowS: at(1) });
    expect(nextState(s, { type: 'tick', nowS: at(100) }).phase).toBe('idle');
    s = nextState(initialWatch(at(0)), { type: 'tick', nowS: at(20) });
    s = nextState(s, { type: 'blocked', value: true, nowS: at(22) });
    expect(s.phase).toBe('idle');
    s = nextState(s, { type: 'blocked', value: false, nowS: at(30) });
    expect(nextState(s, { type: 'tick', nowS: at(49) }).phase).toBe('idle');
    expect(nextState(s, { type: 'tick', nowS: at(50) }).phase).toBe('watching');
  });
});

describe('caption', () => {
  it('states place, UTC time and type', () => {
    expect(caption({ place: 'Kyiv, Ukraine', timeS: Date.UTC(2026, 9, 18, 4, 12) / 1000, kind: 'armed' })).toBe('KYIV, UKRAINE // 2026-10-18 04:12 UTC // ARMED CONFLICT');
  });
  it('labels every kind and falls back for an empty place', () => {
    const t = Date.UTC(2026, 0, 2, 3, 4) / 1000;
    expect(caption({ place: '', timeS: t, kind: 'civilian' })).toBe('UNKNOWN LOCATION // 2026-01-02 03:04 UTC // VIOLENCE AGAINST CIVILIANS');
    expect(caption({ place: 'X', timeS: t, kind: 'riot' })).toMatch(/RIOT$/);
    expect(caption({ place: 'X', timeS: t, kind: 'protest' })).toMatch(/PROTEST$/);
    expect(caption({ place: 'X', timeS: t, kind: 'other' })).toMatch(/EVENT$/);
  });
});
