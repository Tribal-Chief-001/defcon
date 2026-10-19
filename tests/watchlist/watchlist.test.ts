// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Snapshot } from '../../src/events/snapshot';
import { alertText, MAX_WATCH, newEventCounts, parseWatch, STORAGE_KEY, useWatchlist } from '../../src/watchlist/watchlist';

// a minimal snapshot: events of the given countries at the given times
const snap = (events: { c: string; t: number }[], countries = ['', 'UKR', 'IND']): Snapshot => ({ n: events.length, timeS: Uint32Array.from(events.map((e) => e.t)), lat: new Float32Array(events.length), lon: new Float32Array(events.length), detailIdx: new Uint32Array(events.length), country: Uint16Array.from(events.map((e) => countries.indexOf(e.c))), kind: new Uint8Array(events.length), severity: new Uint8Array(events.length), precision: new Uint8Array(events.length), human: new Uint8Array(events.length), countries, meta: { asOfS: 0 } as never });
const NOW = 1_790_000_000;

describe('parseWatch (the stored list is untrusted)', () => {
  it('reads a valid list and drops everything else', () => {
    expect(parseWatch(JSON.stringify({ ids: ['UKR', 'ind', 'bad!', 'TOOLONG', 5], seen: { UKR: NOW, IND: 'x', ZZZ: NOW, '<x>': 1 } }))).toEqual({ ids: ['UKR', 'IND'], seen: { UKR: NOW } });
  });
  it('is empty for no value, bad JSON and wrong shapes', () => {
    for (const raw of [null, '', 'nope', '[]', '{"ids":"UKR"}', 'null', '5']) expect(parseWatch(raw)).toEqual({ ids: [], seen: {} });
  });
  it('keeps at most 20 countries and no duplicates', () => {
    const ids = Array.from({ length: 30 }, (_, i) => `A${String(i).padStart(2, '0')}`);
    expect(parseWatch(JSON.stringify({ ids: [...ids, 'A00'], seen: {} })).ids).toHaveLength(MAX_WATCH);
  });
});

describe('newEventCounts', () => {
  const state = { ids: ['UKR', 'IND', 'FRA'], seen: { UKR: NOW - 3600, IND: NOW - 100 } as Record<string, number> };
  it('counts the events newer than the last look, per watched country, most first, and skips countries without a last look', () => {
    const s = snap([{ c: 'UKR', t: NOW - 600 }, { c: 'UKR', t: NOW - 1200 }, { c: 'UKR', t: NOW - 7200 }, { c: 'IND', t: NOW - 50 }, { c: 'IND', t: NOW - 500 }]);
    expect(newEventCounts([s], state, NOW)).toEqual([{ id: 'UKR', count: 2, latestS: NOW - 600 }, { id: 'IND', count: 1, latestS: NOW - 50 }]);
  });
  it('counts an event that is in two snapshots once, and ignores events from the future', () => {
    const a = snap([{ c: 'UKR', t: NOW - 600 }]);
    const b = snap([{ c: 'UKR', t: NOW - 600 }, { c: 'UKR', t: NOW + 7200 }]);
    expect(newEventCounts([a, b], state, NOW)).toEqual([{ id: 'UKR', count: 1, latestS: NOW - 600 }]);
  });
  it('is empty for no snapshots, no watched countries and a country with nothing new', () => {
    expect(newEventCounts([], state, NOW)).toEqual([]);
    expect(newEventCounts([snap([{ c: 'UKR', t: NOW - 600 }])], { ids: [], seen: {} }, NOW)).toEqual([]);
    expect(newEventCounts([snap([{ c: 'UKR', t: NOW - 7200 }])], state, NOW)).toEqual([]);
  });
});

describe('alertText', () => {
  it('words new events plainly, never as an attack', () => {
    const names = new Map([['UKR', 'Ukraine'], ['IND', 'India']]);
    expect(alertText([{ id: 'UKR', count: 2, latestS: 1 }], names)).toBe('2 new events in Ukraine');
    expect(alertText([{ id: 'UKR', count: 1, latestS: 1 }, { id: 'IND', count: 3, latestS: 1 }], names)).toBe('1 new event in Ukraine, 3 in India');
    expect(alertText([{ id: 'XXX', count: 1, latestS: 1 }], names)).toBe('1 new event in XXX');
    expect(alertText([], names)).toBe('');
  });
});

describe('useWatchlist', () => {
  beforeEach(() => {
    localStorage.clear();
    useWatchlist.setState({ ids: [], seen: {} });
  });
  it('adds a country with a last look of now (so the first alert is not everything), removes it, and persists', () => {
    useWatchlist.getState().toggle('ukr', NOW);
    expect(useWatchlist.getState()).toMatchObject({ ids: ['UKR'], seen: { UKR: NOW } });
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual({ ids: ['UKR'], seen: { UKR: NOW } });
    useWatchlist.getState().toggle('UKR', NOW);
    expect(useWatchlist.getState().ids).toEqual([]);
    expect(useWatchlist.getState().seen).toEqual({});
  });
  it('refuses a 21st country and a bad id, and marks countries as seen', () => {
    for (let i = 0; i < MAX_WATCH; i++) useWatchlist.getState().toggle(`B${String(i).padStart(2, '0')}`, NOW);
    expect(useWatchlist.getState().toggle('NEW', NOW)).toBe(false);
    expect(useWatchlist.getState().ids).toHaveLength(MAX_WATCH);
    expect(useWatchlist.getState().toggle('<x>', NOW)).toBe(false);
    useWatchlist.getState().markSeen(['B00', 'NOPE'], NOW + 60);
    expect(useWatchlist.getState().seen.B00).toBe(NOW + 60);
    expect(useWatchlist.getState().seen.NOPE).toBeUndefined();
  });
  it('hydrates from storage, and keeps working when storage throws', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ids: ['IND'], seen: { IND: NOW } }));
    useWatchlist.getState().hydrate();
    expect(useWatchlist.getState().ids).toEqual(['IND']);
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('full');
    });
    expect(() => useWatchlist.getState().toggle('UKR', NOW)).not.toThrow();
    expect(useWatchlist.getState().ids).toContain('UKR'); // in memory for this visit
    spy.mockRestore();
  });
});
