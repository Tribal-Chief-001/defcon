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
  conflicts: [{ id: 'a', name: 'A', kinds: ['state'], countries: [], deaths: { d30: r, d90: r, d365: r }, events: { d30: 1, d90: 1, d365: 1 }, trend: 'steady', lastDate: '2026-08-30', weekly: new Array<number>(52).fill(0), latest: [], provisionalShare: 0 }],
};
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
    ['a world with a short weekly list', { ...good, world: { ...worldFixture(), weekly: [1] } }, true],
    ['a world with a non-finite total', { ...good, world: { ...worldFixture(), deaths: { ...worldFixture().deaths, d90: { best: null, low: 0, high: 0 } } } }, true],
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
});
