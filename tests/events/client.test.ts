import { describe, expect, it } from 'vitest';
import { loadSnapshot } from '../../src/events/client';
import { handleLoad } from '../../src/events/workerCore';
import { encodeSnapshot } from '../../scripts/events/encode';
import type { Ev } from '../../src/events/types';

const T0 = Date.UTC(2026, 9, 18, 12) / 1000;
const ev = (id: string, timeS: number): Ev => ({
  id, source: 'gdelt', alsoIds: [], timeS, lat: 10, lon: 20, precision: 2, country: 'IND', kind: 'protest', deaths: null, severity: 1, human: false,
  place: 'p', headline: '', actors: '', sources: [], firstSeenS: T0, updatedS: T0,
});
const enc = encodeSnapshot([ev('a', T0), ev('b', T0 + 60), ev('c', T0 + 120)], { asOfS: T0, generatedS: T0, sources: [] });
const binBuf = () => enc.bin.buffer.slice(enc.bin.byteOffset, enc.bin.byteOffset + enc.bin.byteLength) as ArrayBuffer;

type Reply = { status: number; body?: unknown; headers?: Record<string, string> };
const fakeFetch = (routes: Record<string, Reply | (() => never)>, log: { url: string; init?: RequestInit }[] = []) =>
  (async (url: string, init?: RequestInit) => {
    log.push({ url, init });
    const r = routes[url];
    if (!r) return { ok: false, status: 404, headers: new Headers() } as Response;
    if (typeof r === 'function') r();
    const rep = r as Reply;
    return {
      ok: rep.status >= 200 && rep.status < 300,
      status: rep.status,
      headers: new Headers(rep.headers ?? {}),
      json: async () => {
        if (typeof rep.body === 'string') return JSON.parse(rep.body);
        return rep.body;
      },
      arrayBuffer: async () => rep.body as ArrayBuffer,
    } as unknown as Response;
  }) as unknown as typeof fetch;

const good = () => ({
  '/d/recent.meta.json': { status: 200, body: enc.meta },
  '/d/recent.bin': { status: 200, body: binBuf() },
});

// Review Focus 5: failures must leave the caller with an error value, never an exception.
describe('loadSnapshot', () => {
  it('returns ok with a decoded snapshot and the meta hash as etag', async () => {
    const r = await loadSnapshot('/d', 'recent', undefined, fakeFetch(good()));
    expect(r.status).toBe('ok');
    if (r.status === 'ok') {
      expect(r.snapshot.n).toBe(3);
      expect(r.etag).toBe(enc.meta.sha256);
    }
  });
  it('sends If-None-Match when it has an etag, and treats 304 as unchanged', async () => {
    const log: { url: string; init?: RequestInit }[] = [];
    const r = await loadSnapshot('/d', 'recent', { etag: 'abc' }, fakeFetch({ '/d/recent.meta.json': { status: 304 } }, log));
    expect(r).toEqual({ status: 'unchanged' });
    expect((log[0]!.init?.headers as Record<string, string>)['If-None-Match']).toBe('abc');
  });
  it('is unchanged without downloading the binary when the meta hash equals the known etag', async () => {
    const log: { url: string }[] = [];
    const r = await loadSnapshot('/d', 'recent', { etag: enc.meta.sha256 }, fakeFetch(good(), log));
    expect(r).toEqual({ status: 'unchanged' });
    expect(log.map((l) => l.url)).toEqual(['/d/recent.meta.json']);
  });
  it('returns an error naming 404 when the meta file is missing', async () => {
    const r = await loadSnapshot('/d', 'recent', undefined, fakeFetch({}));
    expect(r.status).toBe('error');
    if (r.status === 'error') expect(r.reason).toMatch(/404/);
  });
  it('returns an error for invalid JSON in the meta file', async () => {
    const r = await loadSnapshot('/d', 'recent', undefined, fakeFetch({ '/d/recent.meta.json': { status: 200, body: '<html>not json' } }));
    expect(r.status).toBe('error');
  });
  it('returns a snapshot error when the binary is truncated by 1 byte', async () => {
    const r = await loadSnapshot('/d', 'recent', undefined, fakeFetch({ ...good(), '/d/recent.bin': { status: 200, body: binBuf().slice(0, enc.bin.length - 1) } }));
    expect(r.status).toBe('error');
    if (r.status === 'error') expect(r.reason).toMatch(/snapshot/);
  });
  it('returns a checksum error when a byte changed but the size is the same', async () => {
    const bad = new Uint8Array(binBuf());
    bad[0] = bad[0]! ^ 0xff;
    const r = await loadSnapshot('/d', 'recent', undefined, fakeFetch({ ...good(), '/d/recent.bin': { status: 200, body: bad.buffer } }));
    expect(r.status).toBe('error');
    if (r.status === 'error') expect(r.reason).toMatch(/checksum/);
  });
  it('returns an error (does not throw) when the network rejects', async () => {
    const r = await loadSnapshot('/d', 'recent', undefined, (async () => {
      throw new TypeError('network down');
    }) as unknown as typeof fetch);
    expect(r.status).toBe('error');
    if (r.status === 'error') expect(r.reason).toMatch(/network down/);
  });
});

describe('handleLoad (worker core)', () => {
  it('maps the three outcomes to messages', async () => {
    const ok = await handleLoad({ type: 'load', base: '/d', name: 'recent' }, { fetchFn: fakeFetch(good()) });
    expect(ok.type).toBe('snapshot');
    const same = await handleLoad({ type: 'load', base: '/d', name: 'recent', etag: enc.meta.sha256 }, { fetchFn: fakeFetch(good()) });
    expect(same).toEqual({ type: 'unchanged', name: 'recent' });
    const err = await handleLoad({ type: 'load', base: '/d', name: 'recent' }, { fetchFn: fakeFetch({}) });
    expect(err).toMatchObject({ type: 'error', name: 'recent' });
  });
});
