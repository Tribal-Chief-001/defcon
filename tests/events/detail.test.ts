import { describe, expect, it } from 'vitest';
import { fetchDetail, clearDetailCache } from '../../src/events/detail';
import { decodeSnapshot } from '../../src/events/snapshot';
import { encodeSnapshot } from '../../scripts/events/encode';
import type { Ev } from '../../src/events/types';

const T = Date.UTC(2026, 9, 18, 12) / 1000;
const ev = (id: string, timeS: number): Ev => ({
  id, source: 'ucdp', alsoIds: [], timeS, lat: 1, lon: 2, precision: 1, country: null, kind: 'armed', deaths: 1, severity: 2, human: true,
  place: `place ${id}`, headline: '', actors: '', sources: [], firstSeenS: T, updatedS: T,
});
const enc = encodeSnapshot([ev('a', T), ev('b', T + 10), ev('c', T + 86400)], { asOfS: T, generatedS: T, sources: [] });
const snap = decodeSnapshot(enc.bin.buffer.slice(enc.bin.byteOffset, enc.bin.byteOffset + enc.bin.byteLength) as ArrayBuffer, enc.meta);

const fakeFetch = (log: string[], missing = false) =>
  (async (url: string) => {
    log.push(url);
    const day = url.match(/(\d{4}-\d{2}-\d{2})\.json$/)![1]!;
    return missing ? ({ ok: false, status: 404 } as Response) : ({ ok: true, status: 200, json: async () => enc.details.get(day) } as unknown as Response);
  }) as unknown as typeof fetch;

describe('fetchDetail', () => {
  it('fetches the shard at detail/<snapshot>/<day>.json and returns the entry for the event', async () => {
    clearDetailCache();
    const log: string[] = [];
    const d = await fetchDetail('/e', 'recent', snap, 1, fakeFetch(log));
    expect(log).toEqual(['/e/detail/recent/2026-10-18.json']);
    expect(d?.place).toBe('place b');
    expect((await fetchDetail('/e', 'recent', snap, 2, fakeFetch(log)))?.place).toBe('place c');
  });
  it('fetches each shard only once', async () => {
    clearDetailCache();
    const log: string[] = [];
    await fetchDetail('/e', 'recent', snap, 0, fakeFetch(log));
    await fetchDetail('/e', 'recent', snap, 1, fakeFetch(log));
    expect(log).toHaveLength(1);
  });
  it('returns null on a 404 or an out-of-range index, without throwing', async () => {
    clearDetailCache();
    expect(await fetchDetail('/e', 'recent', snap, 0, fakeFetch([], true))).toBeNull();
    clearDetailCache();
    expect(await fetchDetail('/e', 'recent', snap, 99, fakeFetch([]))).toBeNull();
  });
});
