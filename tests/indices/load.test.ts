import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { indexFor, loadIndices, resetIndicesCache } from '../../src/indices/load';
import type { IndicesFile } from '../../src/indices/types';
import { indicesFixture } from './fixture';

const reply = (body: unknown, ok = true) => vi.fn(async () => ({ ok, json: async () => body }) as Response);
const clone = (): IndicesFile => JSON.parse(JSON.stringify(indicesFixture())) as IndicesFile;

describe('loadIndices', () => {
  beforeEach(() => resetIndicesCache());
  afterEach(() => vi.unstubAllGlobals());

  it('returns a valid file once and caches it', async () => {
    const f = reply(indicesFixture());
    vi.stubGlobal('fetch', f);
    const a = await loadIndices();
    expect(a!.countries).toHaveLength(3);
    await loadIndices();
    expect(f).toHaveBeenCalledTimes(1);
    expect(f).toHaveBeenCalledWith('/data/indices.json');
  });

  const bad: [string, (f: IndicesFile) => unknown][] = [
    ['no countries', (f) => ({ ...f, countries: undefined })],
    ['a bad data end', (f) => ({ ...f, dataEnd: 'soon' })],
    ['a short world series', (f) => ({ ...f, world: { monthly: [1, 2] } })],
    ['a feature list that is not text', (f) => ((f.model.features = [1, 2] as unknown as string[]), f)],
    ['no test period', (f) => (((f.model as unknown as { testPeriod: unknown }).testPeriod = undefined), f)],
    ['a non-numeric bootstrap count', (f) => (((f.model as unknown as { bootstrapReps: unknown }).bootstrapReps = 'many'), f)],
    ['no model section', (f) => ({ ...f, model: undefined })],
    ['a score above 100', (f) => ((f.countries[0]!.fatality.score = 140), f)],
    ['a non-finite score', (f) => ((f.countries[0]!.fatality as unknown as { score: unknown }).score = null, f)],
    ['an unknown band', (f) => (((f.countries[0]!.fatality as unknown as { band: string }).band = 'war'), f)],
    ['a short monthly series', (f) => ((f.countries[0]!.fatality.monthly = [1, 2, 3]), f)],
    ['a probability above 1', (f) => ((f.countries[0]!.risk!.rise.p = 1.4), f)],
    ['an interval that does not bracket the estimate', (f) => ((f.countries[0]!.risk!.rise.lo = 0.9), f)],
    ['an unknown confidence', (f) => (((f.countries[0]!.risk as unknown as { confidence: string }).confidence = 'certain'), f)],
    ['a malformed why list', (f) => ((f.countries[0]!.risk!.why = [{ label: 'x', value: Number.NaN }]), f)],
  ];
  it.each(bad)('gives null for %s and does not cache the failure', async (_n, mutate) => {
    vi.stubGlobal('fetch', reply(mutate(clone())));
    expect(await loadIndices()).toBeNull();
    vi.stubGlobal('fetch', reply(indicesFixture()));
    expect(await loadIndices()).not.toBeNull();
  });
  it('gives null for an HTTP error and for a network failure', async () => {
    vi.stubGlobal('fetch', reply(null, false));
    expect(await loadIndices()).toBeNull();
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new TypeError('offline'))));
    expect(await loadIndices()).toBeNull();
  });
});

describe('indexFor', () => {
  it('finds a country by its map id, case-insensitively, and returns undefined for an unknown one', () => {
    const f = indicesFixture();
    expect(indexFor(f, 'UKR')?.fatality.band).toBe('severe');
    expect(indexFor(f, 'ukr')?.id).toBe('UKR');
    expect(indexFor(f, 'ZZZ')).toBeUndefined();
    expect(indexFor(null, 'UKR')).toBeUndefined();
  });
});
