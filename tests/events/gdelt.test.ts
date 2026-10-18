import { mkdtempSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { zipSync, strToU8 } from 'fflate';
import { describe, expect, it } from 'vitest';
import { GDELT_FILTER, cameoKind, gdeltRowToEv, readGdeltFile } from '../../scripts/events/gdelt';
import { fetchGdelt, slotStamps } from '../../scripts/events/fetch-gdelt';

const FIXTURE = 'tests/fixtures/gdelt-sample.tsv';
const NOW = Date.UTC(2026, 9, 18, 1, 0, 0) / 1000;
const rows = readFileSync(FIXTURE, 'utf8').split('\n').filter(Boolean).map((l) => l.split('\t'));
const row = (id: string) => rows.find((r) => r[0] === id)!;
const ev = (id: string, edit: Record<number, string> = {}) => {
  const cols = [...row(id)];
  for (const [i, v] of Object.entries(edit)) cols[+i] = v;
  return gdeltRowToEv(cols, NOW);
};
const MENTIONS = 31, SOURCES = 32, GEO_TYPE = 51, LAT = 56, LON = 57, SQLDATE = 1;

describe('cameoKind', () => {
  it.each([
    ['1451', 'riot'], ['145', 'riot'], ['141', 'protest'], ['140', 'protest'], ['143', 'protest'],
    ['190', 'armed'], ['193', 'armed'], ['196', 'armed'], ['186', 'civilian'], ['180', 'civilian'], ['203', 'civilian'],
    ['040', null], ['173', null], ['010', null], ['', null],
  ])('%s -> %s', (code, kind) => {
    expect(cameoKind(code)).toBe(kind);
  });
});

describe('gdeltRowToEv: real rows', () => {
  it('maps a New York protest (US state centroid): protest, precision 4, auto-coded, host as source', () => {
    const e = ev('1328505103')!;
    expect(e).toMatchObject({ id: 'gdelt:1328505103', source: 'gdelt', kind: 'protest', precision: 4, human: false, severity: 1, country: null });
    expect(e.place).toBe('New York, United States');
    expect(e.lat).toBeCloseTo(42.1497, 3);
    // GDELT has no time of day for the event itself: the time is when it was first reported (DATEADDED), not an invented midday
    expect(e.timeS).toBe(Date.UTC(2026, 9, 18, 0, 30, 0) / 1000);
    expect(e.sources[0]).toEqual({ name: 'cnycentral.com', url: row('1328505103')[60] });
  });
  it('maps a city-level military event with Goldstein -10: armed, severity 3 (auto cap), precision 2', () => {
    expect(ev('1328505108')).toMatchObject({ kind: 'armed', severity: 3, precision: 2, deaths: null });
  });
  it('keeps a Goldstein -9 assault at severity 2', () => {
    expect(ev('1328505184')).toMatchObject({ kind: 'civilian', severity: 2 });
  });
  it('keeps a single-source Delhi protest because it has 10 mentions', () => {
    expect(ev('1328505197')).toMatchObject({ kind: 'protest', precision: 2 });
  });
  it('never exceeds severity 3 for any kept real row', () => {
    for (const r of rows) {
      const e = gdeltRowToEv(r, NOW);
      if (e) expect(e.severity).toBeLessThanOrEqual(3);
    }
  });
});

describe('gdeltRowToEv: filters (Review Focus 1 and 2)', () => {
  it('drops a country-centroid row (ActionGeo_Type 1) and a row with no place (type 0)', () => {
    expect(ev('1328505076')).toBeNull();
    expect(ev('1328505127')).toBeNull();
  });
  it.each([['empty', ''], ['NaN', 'NaN'], ['text', 'abc']])('drops %s latitude', (_n, v) => {
    expect(ev('1328505108', { [LAT]: v })).toBeNull();
  });
  it('drops coordinates exactly (0, 0) (null island)', () => {
    expect(ev('1328505108', { [LAT]: '0', [LON]: '0' })).toBeNull();
  });
  it('drops out-of-range coordinates', () => {
    expect(ev('1328505108', { [LAT]: '95' })).toBeNull();
    expect(ev('1328505108', { [LON]: '-181' })).toBeNull();
  });
  it('drops events whose date is more than 2 days before DATEADDED, keeps 2 days', () => {
    expect(GDELT_FILTER.maxLagDays).toBe(2);
    expect(ev('1328505108', { [SQLDATE]: '20261016' })).not.toBeNull(); // 2 days
    expect(ev('1328505108', { [SQLDATE]: '20261015' })).toBeNull(); // 3 days
    expect(ev('1328505108', { [SQLDATE]: '20251018' })).toBeNull(); // a year old (seen in real data)
  });
  it('needs 2 sources or 3 mentions', () => {
    expect(ev('1328505145')).toBeNull(); // 2 mentions, 1 source
    expect(ev('1328505145', { [MENTIONS]: '3' })).not.toBeNull();
    expect(ev('1328505145', { [SOURCES]: '2' })).not.toBeNull();
  });
  it('drops event types we do not draw (root 04) and rows with fewer than 61 columns without throwing', () => {
    expect(ev('1328505091')).toBeNull();
    expect(gdeltRowToEv(row('1328505108').slice(0, 40), NOW)).toBeNull();
    expect(gdeltRowToEv([], NOW)).toBeNull();
  });
  it('allows geo types 2-5 only', () => {
    expect(GDELT_FILTER.allowedGeoTypes).toEqual([2, 3, 4, 5]);
    expect(ev('1328505108', { [GEO_TYPE]: '1' })).toBeNull();
  });
});

describe('readGdeltFile', () => {
  it('returns only the kept events of the fixture', () => {
    const kept = readGdeltFile(FIXTURE, NOW).map((e) => e.id).sort();
    expect(kept).toEqual(['gdelt:1328505103', 'gdelt:1328505108', 'gdelt:1328505184', 'gdelt:1328505197', 'gdelt:1328505237']);
  });
});

describe('fetchGdelt', () => {
  const zipOf = (text: string) => zipSync({ 'x.export.CSV': strToU8(text) });
  const dir = () => mkdtempSync(join(tmpdir(), 'gdelt-'));
  const noSleep = async () => {};

  it('enumerates 15-minute slots backwards from the last published slot', () => {
    const s = slotStamps(Date.UTC(2026, 9, 18, 0, 31, 0) / 1000, 4);
    expect(s).toEqual(['20261018001500', '20261018000000', '20261017234500', '20261017233000']);
  });
  it('downloads missing slots, caches them, and never refetches a cached file', async () => {
    const d = dir();
    const calls: string[] = [];
    const fetchFn = (async (url: string) => {
      calls.push(url);
      return { ok: true, status: 200, arrayBuffer: async () => zipOf('a\tb\n').buffer.slice(0) } as Response;
    }) as unknown as typeof fetch;
    const files = await fetchGdelt({ days: 1 / 24, cacheDir: d, nowS: NOW, fetchFn, sleep: noSleep });
    expect(files.length).toBe(4);
    expect(calls.length).toBe(4);
    expect(calls[0]).toMatch(/^http:\/\/data\.gdeltproject\.org\/gdeltv2\/\d{14}\.export\.CSV\.zip$/);
    expect(readFileSync(files[0]!, 'utf8')).toBe('a\tb\n');
    await fetchGdelt({ days: 1 / 24, cacheDir: d, nowS: NOW, fetchFn, sleep: noSleep });
    expect(calls.length).toBe(4);
  });
  it('skips a 404 without throwing and does not cache a recent slot as missing', async () => {
    const d = dir();
    const fetchFn = (async () => ({ ok: false, status: 404 }) as Response) as unknown as typeof fetch;
    const files = await fetchGdelt({ days: 1 / 24, cacheDir: d, nowS: NOW, fetchFn, sleep: noSleep });
    expect(files).toEqual([]);
    expect(existsSync(join(d, '20261018000000.missing'))).toBe(false);
    writeFileSync(join(d, 'unrelated.txt'), 'x');
  });
  it('retries a failing request up to 3 times', async () => {
    const d = dir();
    let n = 0;
    const fetchFn = (async () => {
      n++;
      throw new Error('network');
    }) as unknown as typeof fetch;
    await fetchGdelt({ days: 1 / 96, cacheDir: d, nowS: NOW, fetchFn, sleep: noSleep });
    expect(n).toBe(3);
  });
});
