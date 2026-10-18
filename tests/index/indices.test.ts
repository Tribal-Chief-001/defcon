import { describe, expect, it } from 'vitest';
import { bandOf, countryStats, dfiRange, dfiScore, momentumOf, per100k } from '../../scripts/index/indices';
import type { GedRow } from '../../scripts/conflicts/conflicts';

describe('dfiScore (a log scale: 100 * log10(1 + deaths) / log10(1 + 10000))', () => {
  it('maps 0 to 0, the reference to 100 and clamps above it', () => {
    expect(dfiScore(0)).toBe(0);
    expect(dfiScore(10000)).toBeCloseTo(100, 6);
    expect(dfiScore(50000)).toBe(100);
  });
  it('keeps small numbers small and war-sized numbers high (24 about 35, 1,000 75)', () => {
    expect(dfiScore(24)).toBeGreaterThan(33);
    expect(dfiScore(24)).toBeLessThan(36);
    expect(dfiScore(1000)).toBeCloseTo(75, 0);
  });
  it('is monotonic and safe for bad input', () => {
    const xs = [0, 1, 5, 25, 100, 1000, 9999].map(dfiScore);
    expect([...xs].sort((a, b) => a - b)).toEqual(xs);
    expect(dfiScore(Number.NaN)).toBe(0);
    expect(dfiScore(-5)).toBe(0);
  });
  it('gives a range from low and high deaths, ordered', () => {
    const r = dfiRange({ best: 100, low: 60, high: 300 });
    expect(r.low).toBeLessThan(r.score);
    expect(r.score).toBeLessThan(r.high);
  });
});

describe('bandOf (UCDP thresholds on deaths in 365 days)', () => {
  it.each([[0, 'none'], [1, 'minor'], [24, 'minor'], [25, 'active'], [999, 'active'], [1000, 'severe'], [85000, 'severe']])('%d -> %s', (d, b) => {
    expect(bandOf(d)).toBe(b);
  });
});

describe('momentumOf', () => {
  it('compares the last 30 days with the average 30 days of the 60 before (log ratio)', () => {
    const up = momentumOf(300, 400); // base 50
    expect(up.direction).toBe('rising');
    expect(up.value).toBeGreaterThan(1);
    expect(momentumOf(20, 420).direction).toBe('falling'); // base 200
    expect(momentumOf(100, 300).direction).toBe('steady'); // base 100
  });
  it('says low data under 10 deaths to compare and never divides by zero', () => {
    expect(momentumOf(4, 6).direction).toBe('low data');
    expect(momentumOf(0, 0).direction).toBe('low data');
    const z = momentumOf(50, 50); // nothing before
    expect(Number.isFinite(z.value)).toBe(true);
    expect(z.direction).toBe('rising');
  });
});

describe('per100k', () => {
  it('scales deaths by population and is null without a usable population', () => {
    expect(per100k(500, 10_000_000)).toBeCloseTo(5, 6);
    expect(per100k(500, null)).toBeNull();
    expect(per100k(500, 0)).toBeNull();
    expect(per100k(0, 1000)).toBe(0);
  });
});

const END = Date.UTC(2026, 7, 31) / 1000;
const day = (n: number) => new Date((END - n * 86400) * 1000).toISOString().slice(0, 10);
let seq = 0;
const row = (o: { ago: number; best: number; gw?: string; prec?: string; prov?: boolean; id?: string; low?: string; high?: string }): { row: GedRow; provisional: boolean } => ({
  row: { id: o.id ?? String(++seq), country_id: o.gw ?? '369', date_start: `${day(o.ago)} 00:00:00.000`, best: String(o.best), low: o.low ?? String(o.best), high: o.high ?? String(o.best), where_prec: o.prec ?? '1', type_of_violence: '1' },
  provisional: o.prov ?? false,
});
const opts = { dataEndS: END, gwToId: { '369': 'UKR', '365': 'RUS' } };

describe('countryStats', () => {
  it('computes deaths and events in windows that end at the data end, not today', () => {
    const { countries } = countryStats([row({ ago: 0, best: 10 }), row({ ago: 29, best: 5 }), row({ ago: 30, best: 20 }), row({ ago: 89, best: 40 }), row({ ago: 90, best: 100 }), row({ ago: -1, best: 999 })], opts);
    const u = countries.get('UKR')!;
    expect(u.deaths30.best).toBe(15);
    expect(u.deaths90.best).toBe(75);
    expect(u.deaths365.best).toBe(175);
    expect([u.events30, u.events90, u.events365]).toEqual([2, 4, 5]);
  });
  it('keeps low <= best <= high, falls back to best and counts a duplicated id once (the later row wins)', () => {
    const { countries } = countryStats([row({ id: 'x', ago: 1, best: 200 }), row({ id: 'x', ago: 1, best: 50, low: '', high: '' }), row({ ago: 2, best: 10, low: '30', high: '4' })], opts);
    const u = countries.get('UKR')!;
    expect(u.deaths30).toEqual({ best: 60, low: 50 + 10, high: 50 + 10 });
  });
  it('has 120 monthly buckets ending in the data end month, oldest first', () => {
    const { countries } = countryStats([row({ ago: 0, best: 7 }), row({ ago: 31, best: 3 }), row({ ago: 400, best: 11 }), row({ ago: 365 * 9 + 100, best: 5 }), row({ ago: 365 * 11, best: 99 })], opts);
    const m = countries.get('UKR')!.monthly;
    expect(m).toHaveLength(120);
    expect(m[119]).toBe(7); // August 2026
    expect(m[118]).toBe(3); // July 2026 (31 days before 31 Aug)
    expect(m.reduce((s, v) => s + v, 0)).toBe(7 + 3 + 11 + 5); // the event 11 years back is outside the series
  });
  it('reports the share of deaths located to a province or better and the provisional share of recent events', () => {
    const { countries } = countryStats([row({ ago: 5, best: 30, prec: '2', prov: true }), row({ ago: 6, best: 70, prec: '6', prov: true }), row({ ago: 200, best: 100, prec: '1', prov: false })], opts);
    const u = countries.get('UKR')!;
    expect(u.locatedShare365).toBeCloseTo(130 / 200);
    expect(u.provisionalShare90).toBe(1);
  });
  it('skips and reports countries without an id, and builds a world monthly series from every valid event', () => {
    const r = countryStats([row({ ago: 1, best: 10 }), row({ ago: 1, best: 40, gw: '999' }), row({ ago: 1, best: 5, gw: '365' })], opts);
    expect([...r.countries.keys()].sort()).toEqual(['RUS', 'UKR']);
    expect(r.unmapped).toEqual(['999']);
    expect(r.world).toHaveLength(120);
    expect(r.world[119]).toBe(55);
  });
  it('ignores rows with a bad date or deaths and rows after the data end', () => {
    const bad: { row: GedRow; provisional: boolean } = { row: { id: 'b', country_id: '369', date_start: 'garbage', best: '5' }, provisional: false };
    const r = countryStats([bad, row({ ago: 1, best: Number.NaN }), row({ ago: -3, best: 50 }), row({ ago: 1, best: 4 })], opts);
    expect(r.countries.get('UKR')!.deaths365.best).toBe(4);
  });
});
