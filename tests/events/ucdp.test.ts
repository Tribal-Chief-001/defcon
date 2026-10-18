import { readFileSync } from 'node:fs';
import { parse } from 'csv-parse/sync';
import { describe, expect, it } from 'vitest';
import { streamUcdp, ucdpRowToEv } from '../../scripts/events/ucdp';

const FIXTURE = 'tests/fixtures/ucdp-sample.csv';
const NOW = Date.UTC(2026, 9, 18) / 1000;
const rows = parse(readFileSync(FIXTURE, 'utf8'), { columns: true }) as Record<string, string>[];
const byId = (id: string) => rows.find((r) => r.id === id)!;
const collect = async (since: number) => {
  const out = [];
  for await (const e of streamUcdp(FIXTURE, since, NOW)) out.push(e);
  return out;
};

describe('streamUcdp', () => {
  // Review Focus 6: commas, quotes and newlines inside quoted fields must not split or shift records.
  it('reads quoted fields with commas and newlines as 4 records from 7+ physical lines', async () => {
    expect(readFileSync(FIXTURE, 'utf8').split('\n').length).toBeGreaterThan(rows.length + 1);
    const ev = await collect(0);
    expect(ev.map((e) => e.id).sort()).toEqual(['ucdp:637096', 'ucdp:637360', 'ucdp:638553', 'ucdp:638583']);
  });
  it('maps the fields of a one-sided violence row', async () => {
    const e = (await collect(0)).find((x) => x.id === 'ucdp:637360')!;
    expect(e).toMatchObject({ source: 'ucdp', kind: 'civilian', deaths: 0, human: true, precision: 1, severity: 1, country: null });
    expect(e.timeS).toBe(Date.UTC(2026, 7, 10) / 1000);
    expect(e.lat).toBeCloseTo(34.349991, 5);
    expect(e.lon).toBeCloseTo(62.200001, 5);
    expect(e.actors).toBe('Government of Afghanistan - Civilians');
    expect(e.headline.startsWith('One person killed')).toBe(true);
    expect(e.sources.map((s) => s.name)).toEqual(['Hasht e Subh Daily', 'Kabul Now']);
  });
  it('uses death bins for severity and state-based violence is armed', async () => {
    const ev = await collect(0);
    expect(ev.find((x) => x.id === 'ucdp:637096')).toMatchObject({ kind: 'civilian', deaths: 24, severity: 3 });
    expect(ev.find((x) => x.id === 'ucdp:638583')).toMatchObject({ kind: 'armed', deaths: 25, severity: 4, precision: 2 });
  });
  it('drops rows before sinceS', async () => {
    const ev = await collect(Date.UTC(2026, 7, 15) / 1000);
    expect(ev.map((e) => e.id).sort()).toEqual(['ucdp:638553', 'ucdp:638583']);
  });
});

describe('ucdpRowToEv', () => {
  const base = byId('637360');
  const with_ = (o: Record<string, string>) => ucdpRowToEv({ ...base, ...o }, NOW);
  it.each([
    ['empty latitude', { latitude: '' }],
    ['NaN latitude', { latitude: 'NaN' }],
    ['latitude over 90', { latitude: '91' }],
    ['longitude over 180', { longitude: '181' }],
    ['invalid date', { date_start: 'not a date' }],
    ['unknown violence type', { type_of_violence: '9' }],
  ])('returns null for %s', (_n, o) => {
    expect(with_(o)).toBeNull();
  });
  it.each([[1, 1], [5, 5], [6, 5], [7, 5]])('where_prec %i -> precision %i', (w, p) => {
    expect(with_({ where_prec: String(w) })!.precision).toBe(p);
  });
  it('treats an unparsable best estimate as unknown deaths', () => {
    expect(with_({ best: '' })!.deaths).toBeNull();
  });
});
