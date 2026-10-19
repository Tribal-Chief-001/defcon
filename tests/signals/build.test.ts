import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { buildSignals, URLS } from '../../scripts/signals/build-signals';
import { validateSignals } from '../../scripts/signals/validate';

const fx = (n: string) => readFileSync(`tests/fixtures/signals/${n}`, 'utf8');
const NOW = Date.UTC(2026, 9, 18, 12) / 1000;
const conflicts = [{ id: 'nl', name: 'Test Conflict', cells: [[52.25, 4.75, 50]] as [number, number, number][] }];
const ok = (body: string, type = 'text/plain') => new Response(body, { status: 200, headers: { 'content-type': type } });
const router = (over: Partial<Record<keyof typeof URLS, () => Response | Promise<Response>>> = {}) =>
  vi.fn(async (url: string, _init?: RequestInit) => {
    const key = (Object.keys(URLS) as (keyof typeof URLS)[]).find((k) => URLS[k] === url)!;
    const h = over[key];
    if (h) return h();
    return key === 'usgs' ? ok(fx('usgs.geojson'), 'application/json') : key === 'gdacs' ? ok(fx('gdacs.xml'), 'application/xml') : ok(fx('firms.csv'), 'application/octet-stream');
  });
const build = (fetchFn: typeof fetch, extra = {}) => buildSignals({ fetchFn, nowS: NOW, conflicts, ...extra });

describe('buildSignals', () => {
  it('builds all three sources from real sample responses, with the licence and attribution of each', async () => {
    const f = await build(router() as never);
    expect(f.sources.map((s) => [s.id, s.ok])).toEqual([['usgs', true], ['gdacs', true], ['firms', true]]);
    expect(f.seismic.length).toBe(0); // both explosion events of the sample are tiny (below magnitude 2): local blasts, not signals
    expect(f.disasters.length).toBe(2);
    expect(f.fires.length).toBeGreaterThan(0);
    expect(f.fires[0]).toMatchObject({ conflictId: 'nl', conflict: 'Test Conflict' });
    for (const s of f.sources) {
      expect(s.licence.length).toBeGreaterThan(5);
      expect(s.attribution.length).toBeGreaterThan(5);
      expect(s.url).toMatch(/^https:\/\//);
    }
    expect(f.sources.find((s) => s.id === 'usgs')!.attribution).toMatch(/U\.S\. Geological Survey/);
    expect(f.generated).toBe(new Date(NOW * 1000).toISOString());
    expect(validateSignals(f, NOW)).toEqual([]);
  });

  it('keeps explosion-type events of magnitude 2 or more, or without a magnitude, and drops the tiny ones', async () => {
    const j = JSON.parse(fx('usgs.geojson')) as { features: { properties: { type: string; mag: number | null } }[] };
    const ex = j.features.filter((f) => f.properties.type === 'explosion');
    ex[0]!.properties.mag = 3.2;
    ex[1]!.properties.mag = null;
    const f = await build(router({ usgs: () => ok(JSON.stringify(j), 'application/json') }) as never);
    expect(f.seismic.length).toBe(2);
    ex[1]!.properties.mag = 1.9;
    expect((await build(router({ usgs: () => ok(JSON.stringify(j), 'application/json') }) as never)).seismic.length).toBe(1);
  });

  it('keeps going when one source is down: the others are shown and the failed one says so', async () => {
    const f = await build(router({ usgs: () => new Response('boom', { status: 500 }) }) as never);
    expect(f.sources.find((s) => s.id === 'usgs')).toMatchObject({ ok: false, count: 0 });
    expect(f.sources.find((s) => s.id === 'usgs')!.error).toMatch(/500/);
    expect(f.seismic).toEqual([]);
    expect(f.disasters.length).toBe(2);
    expect(validateSignals(f, NOW)).toEqual([]);
  });

  it('survives a timeout, a network error, HTML instead of the feed and an oversize body', async () => {
    const f = await build(
      router({
        usgs: () => Promise.reject(new DOMException('The operation timed out', 'TimeoutError')),
        gdacs: () => ok('<!doctype html><html>maintenance</html>', 'text/html'),
        firms: () => new Response('x'.repeat(2000), { status: 200, headers: { 'content-length': '999999999' } }),
      }) as never,
      { maxBytes: 1000 },
    );
    expect(f.sources.every((s) => !s.ok)).toBe(true);
    expect(f.sources.find((s) => s.id === 'usgs')!.error).toMatch(/timed out|timeout/i);
    expect(f.sources.find((s) => s.id === 'gdacs')!.error).toMatch(/feed/i);
    expect(f.sources.find((s) => s.id === 'firms')!.error).toMatch(/too large/i);
    expect(validateSignals(f, NOW)).toEqual([]);
  });

  it('an ok source with nothing to show is still ok (count 0), not an error', async () => {
    const f = await build(router({ gdacs: () => ok('<rss><channel></channel></rss>', 'application/xml') }) as never);
    expect(f.sources.find((s) => s.id === 'gdacs')).toMatchObject({ ok: true, count: 0 });
  });

  it('asks only the three https endpoints, with a timeout signal', async () => {
    const calls = router();
    await build(calls as never);
    expect(calls.mock.calls.map((c) => c[0])).toEqual(Object.values(URLS));
    expect(Object.values(URLS).every((u) => u.startsWith('https://'))).toBe(true);
    expect((calls.mock.calls[0]![1] as RequestInit).signal).toBeTruthy();
  });
});

describe('buildSignals: totals, the cap and odd upstream data (review findings)', () => {
  it('counts the detections of a conflict before any cap, so the totals stay true', async () => {
    const rows = ['latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,confidence,version,bright_ti5,frp,daynight'];
    for (let i = 0; i < 12; i++) for (let k = 0; k <= i; k++) rows.push(`${50 + i * 0.5 + 0.1},${10.1},300,0.4,0.4,2026-10-18,0336,N,nominal,2.0NRT,270,${k + 1},N`); // cell i has i+1 detections
    const cs = [{ id: 'big', name: 'Big', cells: Array.from({ length: 12 }, (_, i) => [50.25 + i * 0.5, 10.25, 9] as [number, number, number]) }];
    const f = await build(router({ firms: () => ok(rows.join('\n'), 'text/csv') }) as never, { conflicts: cs, maxFireCells: 5 });
    expect(f.fires.length).toBe(5); // the cell list is capped, after sorting
    expect(f.fires[0]!.count).toBe(12);
    expect(f.fireTotals).toEqual([expect.objectContaining({ conflictId: 'big', detections: 78, cells: 12, frp: 12 })]); // 1+2+...+12, all cells, strongest power 12
    expect(f.fireTotals[0]).toMatchObject({ lat: 55.75, lon: 10.25 }); // the busiest cell
  });
  it('drops items dated more than a day in the future instead of failing the whole run', async () => {
    const j = JSON.parse(fx('usgs.geojson')) as { features: { properties: { type: string; mag: number | null; time: number } }[] };
    for (const f of j.features) if (f.properties.type === 'explosion') { f.properties.mag = 3; f.properties.time = (NOW + 5 * 86400) * 1000; }
    const f = await build(router({ usgs: () => ok(JSON.stringify(j), 'application/json') }) as never);
    expect(f.seismic).toEqual([]);
    expect(validateSignals(f, NOW)).toEqual([]);
  });
  it('shows the FIRMS acknowledgement in full and links the GDACS licence', async () => {
    const f = await build(router() as never);
    expect(f.sources.find((s) => s.id === 'firms')!.attribution).toBe("We acknowledge the use of data and/or imagery from NASA's Fire Information for Resource Management System (FIRMS) (https://earthdata.nasa.gov/firms), part of NASA's Land, Atmosphere Near real-time Capability for Earth observations (LANCE) (https://earthdata.nasa.gov/lance) and NASA's Earth Science Data and Information System (ESDIS).");
    expect(f.sources.find((s) => s.id === 'gdacs')!.licenceUrl).toBe('https://creativecommons.org/licenses/by/4.0/');
  });
});

describe('validateSignals', () => {
  const bigBlast = () => {
    const j = JSON.parse(fx('usgs.geojson')) as { features: { properties: { type: string; mag: number | null } }[] };
    for (const f of j.features) if (f.properties.type === 'explosion') f.properties.mag = 3.2;
    return JSON.stringify(j);
  };
  const good = async () => build(router({ usgs: () => ok(bigBlast(), 'application/json') }) as never);
  it('rejects bad coordinates, an http link, a future time, too many items and duplicate sources', async () => {
    const f = await good();
    const clone = () => JSON.parse(JSON.stringify(f)) as typeof f;
    const a = clone(); a.seismic[0]!.lat = 95; expect(validateSignals(a, NOW).join()).toMatch(/lat/);
    const b = clone(); b.disasters[0]!.url = 'http://x.example/a'; expect(validateSignals(b, NOW).join()).toMatch(/https/);
    const c = clone(); c.seismic[0]!.time = NOW + 10 * 86400; expect(validateSignals(c, NOW).join()).toMatch(/future/);
    const d = clone(); d.fires = Array.from({ length: 801 }, () => d.fires[0]!); expect(validateSignals(d, NOW).join()).toMatch(/too many/);
    const e = clone(); e.sources.push(e.sources[0]!); expect(validateSignals(e, NOW).join()).toMatch(/duplicate/);
  });
  it('requires the licence and attribution of every source and an ok flag that matches the data', async () => {
    const f = await good();
    f.sources[0]!.attribution = '';
    expect(validateSignals(f, NOW).join()).toMatch(/attribution/);
    const g = await good();
    g.sources.find((s) => s.id === 'usgs')!.ok = false;
    expect(validateSignals(g, NOW).join()).toMatch(/usgs.*failed.*data|data.*failed/i);
  });
});
