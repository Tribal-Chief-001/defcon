import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadTimeline, resetTimelineCache } from '../../src/timeline/load';
import type { TimelineFile } from '../../src/timeline/types';

const good: TimelineFile = {
  generated: '2026-10-18',
  checkedAt: '2026-10-18',
  theatres: [{ key: 'k', title: 'T', conflicts: ['c'], entries: [{ date: '2026-03-01', title: 'x', summary: 's', status: 'confirmed', sources: [{ outlet: 'A', title: 't', url: 'https://a.com/x', published: '2026-03-01', verified: 'v' }] }] }],
};
const reply = (body: unknown, ok = true) => vi.fn(async () => ({ ok, json: async () => body }) as Response);

describe('loadTimeline', () => {
  beforeEach(() => resetTimelineCache());
  afterEach(() => vi.unstubAllGlobals());

  it('returns a valid file once and caches it', async () => {
    const f = reply(good);
    vi.stubGlobal('fetch', f);
    expect(await loadTimeline()).toEqual(good);
    await loadTimeline();
    expect(f).toHaveBeenCalledTimes(1);
    expect(f).toHaveBeenCalledWith('/data/timeline.json');
  });
  it.each([
    ['an HTTP error', null, false],
    ['no theatres', { checkedAt: '2026-10-18' }, true],
    ['a bad checkedAt', { ...good, checkedAt: 'soon' }, true],
    ['an entry with an unknown status', { ...good, theatres: [{ ...good.theatres[0], entries: [{ ...good.theatres[0]!.entries[0], status: 'maybe' }] }] }, true],
    ['an entry with a non-array sources', { ...good, theatres: [{ ...good.theatres[0], entries: [{ ...good.theatres[0]!.entries[0], sources: 'x' }] }] }, true],
    ['a source without an https url', { ...good, theatres: [{ ...good.theatres[0], entries: [{ ...good.theatres[0]!.entries[0], sources: [{ ...good.theatres[0]!.entries[0]!.sources[0], url: 'javascript:alert(1)' }] }] }] }, true],
  ])('gives null for %s and does not cache the failure', async (_n, body, ok) => {
    vi.stubGlobal('fetch', reply(body, ok));
    expect(await loadTimeline()).toBeNull();
    vi.stubGlobal('fetch', reply(good));
    expect(await loadTimeline()).toEqual(good);
  });
  it('gives null when the network fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new TypeError('offline'))));
    expect(await loadTimeline()).toBeNull();
  });
});
