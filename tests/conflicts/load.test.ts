import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadConflicts, resetConflictsCache } from '../../src/conflicts/load';
import type { ConflictsFile } from '../../src/conflicts/types';
import { worldFixture } from './fixture';

const r = { best: 5, low: 4, high: 9 };
const good: ConflictsFile = {
  generated: '2026-10-18',
  dataEnd: '2026-08-31',
  sources: ['GED 26.1'],
  world: worldFixture(),
  conflicts: [{ id: 'a', name: 'A', kinds: ['state'], countries: [], deaths: { d30: r, d90: r, d365: r }, events: { d30: 1, d90: 1, d365: 1 }, trend: 'steady', lastDate: '2026-08-30', weekly: new Array<number>(52).fill(0), latest: [], provisionalShare: 0, geo: null }],
};
const ev = { id: 'e1', date: '2026-08-30', place: 'P', country: 'C', lat: 1, lon: 2, precision: 1, kind: 'state', deaths: r, headline: 'h', sources: ['A'], provisional: false };
const reply = (body: unknown, ok = true) => vi.fn(async () => ({ ok, json: async () => body }) as Response);

describe('loadConflicts', () => {
  beforeEach(() => resetConflictsCache());
  afterEach(() => vi.unstubAllGlobals());

  it('returns a valid file and caches it', async () => {
    const f = reply(good);
    vi.stubGlobal('fetch', f);
    expect(await loadConflicts()).toEqual(good);
    await loadConflicts();
    expect(f).toHaveBeenCalledTimes(1);
    expect(f).toHaveBeenCalledWith('/data/conflicts.json');
  });
  it.each([
    ['an HTTP error', null, false],
    ['no conflicts array', { dataEnd: '2026-08-31' }, true],
    ['a bad data end', { ...good, dataEnd: 'soon' }, true],
    ['a conflict with a short weekly list', { ...good, conflicts: [{ ...good.conflicts[0], weekly: [1, 2] }] }, true],
    ['no world section', { ...good, world: undefined }, true],
    ['a world without weeklyByKind', { ...good, world: { ...worldFixture(), weeklyByKind: undefined } }, true],
    ['a world with a short weeklyByKind', { ...good, world: { ...worldFixture(), weeklyByKind: { state: [1], 'non-state': [1], 'one-sided': [1] } } }, true],
    ['a geo with a non-finite centroid', { ...good, conflicts: [{ ...good.conflicts[0], geo: { lat: null, lon: 1, spreadKm: 50, cells: [] } }] }, true],
    ['a geo with a located share above 1', { ...good, conflicts: [{ ...good.conflicts[0], geo: { lat: 1, lon: 1, spreadKm: 50, locatedShare: 1.5, cells: [] } }] }, true],
    ['a geo with a malformed cell', { ...good, conflicts: [{ ...good.conflicts[0], geo: { lat: 1, lon: 1, spreadKm: 50, locatedShare: 1, cells: [[1, 2]] } }] }, true],
    ['a world with a short weekly list', { ...good, world: { ...worldFixture(), weekly: [1] } }, true],
    ['a world with a non-finite total', { ...good, world: { ...worldFixture(), deaths: { ...worldFixture().deaths, d90: { best: null, low: 0, high: 0 } } } }, true],
    ['a weekly-by-kind with a short list', { ...good, conflicts: [{ ...good.conflicts[0], weeklyByKind: { state: [1], 'non-state': [1], 'one-sided': [1] } }] }, true],
    ['a data end that is not a real date', { ...good, dataEnd: '2026-13-45' }, true],
    ['a conflict last date that is not a real date', { ...good, conflicts: [{ ...good.conflicts[0], lastDate: '2026-02-30' }] }, true],
    ['an event without an id', { ...good, conflicts: [{ ...good.conflicts[0], latest: [{ ...ev, id: undefined }] }] }, true],
    ['an event with a non-finite place', { ...good, conflicts: [{ ...good.conflicts[0], latest: [{ ...ev, lat: null }] }] }, true],
    ['an event with a bad kind', { ...good, conflicts: [{ ...good.conflicts[0], latest: [{ ...ev, kind: 'war' }] }] }, true],
    ['an event with sources that are not a list', { ...good, conflicts: [{ ...good.conflicts[0], latest: [{ ...ev, sources: 'x' }] }] }, true],
    ['a world latest item that is null', { ...good, world: { ...worldFixture(), latest: [null] } }, true],
    ['a world country without a name', { ...good, world: { ...worldFixture(), countries: [{ id: 'UKR', deaths90: 1, deaths365: 2 }] } }, true],
    ['a non-finite number', { ...good, conflicts: [{ ...good.conflicts[0], deaths: { d30: r, d90: { ...r, best: null }, d365: r } }] }, true],
  ])('throws a readable error for %s and does not cache the failure', async (_n, body, ok) => {
    vi.stubGlobal('fetch', reply(body, ok));
    await expect(loadConflicts()).rejects.toThrow(/conflicts data/i);
    vi.stubGlobal('fetch', reply(good));
    expect(await loadConflicts()).toEqual(good);
  });
  it('throws when the network fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new TypeError('offline'))));
    await expect(loadConflicts()).rejects.toThrow(/conflicts data/i);
  });

  it('accepts an older file without geo and gives those conflicts geo null', async () => {
    const old = { ...good, conflicts: [{ ...good.conflicts[0] }] } as unknown as { conflicts: Record<string, unknown>[] };
    delete old.conflicts[0]!.geo;
    vi.stubGlobal('fetch', reply(old));
    const f = await loadConflicts();
    expect(f.conflicts[0]!.geo).toBeNull();
  });
  it('accepts the committed conflicts.json (the stricter checks must not reject the real file)', async () => {
    const real = JSON.parse((await import('node:fs')).readFileSync('public/data/conflicts.json', 'utf8'));
    vi.stubGlobal('fetch', reply(real));
    expect((await loadConflicts()).conflicts.length).toBeGreaterThan(50);
  });
  it('accepts a file whose conflicts have no weeklyByKind (an older file)', async () => {
    vi.stubGlobal('fetch', reply(good));
    expect((await loadConflicts()).conflicts[0]!.weeklyByKind).toBeUndefined();
  });
});
