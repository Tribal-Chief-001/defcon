import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadSignals, resetSignalsCache } from '../../src/signals/load';
import type { SignalsFile } from '../../src/signals/types';
import { signalsFixture } from './fixture';

const reply = (body: unknown, ok = true) => vi.fn(async () => ({ ok, json: async () => body }) as Response);
const clone = () => JSON.parse(JSON.stringify(signalsFixture())) as SignalsFile;

describe('loadSignals', () => {
  beforeEach(() => resetSignalsCache());
  afterEach(() => vi.unstubAllGlobals());

  it('returns a valid file once and caches it', async () => {
    const f = reply(signalsFixture());
    vi.stubGlobal('fetch', f);
    expect(await loadSignals()).toEqual(signalsFixture());
    await loadSignals();
    expect(f).toHaveBeenCalledTimes(1);
    expect(f).toHaveBeenCalledWith('/data/signals.json');
  });
  const bad: [string, (f: SignalsFile) => unknown][] = [
    ['no lists', (f) => ({ ...f, fires: undefined })],
    ['a bad generated date', (f) => ({ ...f, generated: 'soon' })],
    ['a source without attribution', (f) => ((f.sources[0]!.attribution = ''), f)],
    ['a fire cell with a non-finite count', (f) => ((f.fires[0]!.count = Number.NaN as number), f)],
    ['a disaster link that is not https', (f) => ((f.disasters[0]!.url = 'javascript:alert(1)'), f)],
    ['a disaster link on another host', (f) => ((f.disasters[0]!.url = 'https://evil.example/x'), f)],
    ['a seismic link on another host', (f) => ((f.seismic[0]!.url = 'https://evil.example/x'), f)],
    ['a fire total with a non-finite count', (f) => ((f.fireTotals[0]!.detections = Number.NaN as number), f)],
    ['a licence link that is not https', (f) => ((f.sources[1]!.licenceUrl = 'javascript:alert(1)'), f)],
    ['windows that are not numbers', (f) => (((f as unknown as { windows: unknown }).windows = { seismicDays: 'x' }), f)],
    ['a latitude out of range', (f) => ((f.seismic[0]!.lat = 120), f)],
    ['an unknown alert level', (f) => (((f.disasters[0] as unknown as { alert: string }).alert = 'Purple'), f)],
  ];
  it.each(bad)('gives null for %s and does not cache the failure', async (_n, mutate) => {
    vi.stubGlobal('fetch', reply(mutate(clone())));
    expect(await loadSignals()).toBeNull();
    vi.stubGlobal('fetch', reply(signalsFixture()));
    expect(await loadSignals()).toEqual(signalsFixture());
  });
  it('gives null on an HTTP error and on a network error', async () => {
    vi.stubGlobal('fetch', reply(null, false));
    expect(await loadSignals()).toBeNull();
    resetSignalsCache();
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new TypeError('offline'))));
    expect(await loadSignals()).toBeNull();
  });
});
