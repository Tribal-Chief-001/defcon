import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadDisplacement, resetDisplacementCache } from '../../src/displacement/load';
import type { DisplacementFile } from '../../src/displacement/types';
import { displacementFixture } from './fixture';

const reply = (body: unknown, ok = true) => vi.fn(async () => ({ ok, json: async () => body }) as Response);
const clone = () => JSON.parse(JSON.stringify(displacementFixture())) as DisplacementFile;

describe('loadDisplacement', () => {
  beforeEach(() => resetDisplacementCache());
  afterEach(() => vi.unstubAllGlobals());
  it('returns a valid file once and caches it', async () => {
    const f = reply(displacementFixture());
    vi.stubGlobal('fetch', f);
    expect(await loadDisplacement()).toEqual(displacementFixture());
    await loadDisplacement();
    expect(f).toHaveBeenCalledTimes(1);
    expect(f).toHaveBeenCalledWith('/data/displacement.json');
  });
  it('accepts the committed file', async () => {
    vi.stubGlobal('fetch', reply(JSON.parse(readFileSync('public/data/displacement.json', 'utf8'))));
    expect(Object.keys((await loadDisplacement())!.countries).length).toBeGreaterThan(150);
  });
  const bad: [string, (f: DisplacementFile) => unknown][] = [
    ['no countries', (f) => ({ ...f, countries: undefined })],
    ['a year that is not an integer', (f) => ({ ...f, year: 'last' })],
    ['a missing licence', (f) => ({ ...f, licence: '' })],
    ['a terms link that is not https', (f) => ({ ...f, termsUrl: 'javascript:alert(1)' })],
    ['a terms link on another host', (f) => ({ ...f, termsUrl: 'https://evil.example/terms' })],
    ['a negative figure', (f) => ((f.countries.AFG!.from!.refugees = -5), f)],
    ['a text figure', (f) => (((f.countries.AFG!.from as unknown as { idps: unknown }).idps = '9'), f)],
    ['a country code that is not three letters', (f) => ({ ...f, countries: { ...f.countries, AFGH: f.countries.AFG } })],
  ];
  it.each(bad)('gives null for %s and does not cache the failure', async (_n, mutate) => {
    vi.stubGlobal('fetch', reply(mutate(clone())));
    expect(await loadDisplacement()).toBeNull();
    vi.stubGlobal('fetch', reply(displacementFixture()));
    expect(await loadDisplacement()).toEqual(displacementFixture());
  });
  it('gives null on an HTTP error and a network error', async () => {
    vi.stubGlobal('fetch', reply(null, false));
    expect(await loadDisplacement()).toBeNull();
    resetDisplacementCache();
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new TypeError('offline'))));
    expect(await loadDisplacement()).toBeNull();
  });
});
