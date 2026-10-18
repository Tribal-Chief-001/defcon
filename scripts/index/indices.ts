import type { GedRow } from '../conflicts/conflicts';
import type { Range } from '../../src/conflicts/types';
import type { Band } from '../../src/indices/types';

const DAY = 86400;
const REF_DEATHS = 10_000; // deaths in 90 days that map to 100: about the heaviest country-quarter on record
const MONTHS = 120;
const LOCATED_PREC = 4;

// The Defcon Fatality Index scale: log10 because deaths span five orders of magnitude. A presentation scale, not a weighted composite.
export const dfiScore = (deaths: number): number => (Number.isFinite(deaths) && deaths > 0 ? Math.min(100, (100 * Math.log10(1 + deaths)) / Math.log10(1 + REF_DEATHS)) : 0);
export const dfiRange = (r: Range) => ({ score: dfiScore(r.best), low: dfiScore(r.low), high: dfiScore(r.high) });

// UCDP's thresholds (25 deaths a year for a minor conflict, 1,000 for a war), applied here to all organised-violence deaths in 365 days
export const bandOf = (d365: number): Band => (!(d365 > 0) ? 'none' : d365 < 25 ? 'minor' : d365 < 1000 ? 'active' : 'severe');

// the last 30 days against the average 30 days of the 60 before, as a log ratio; under 10 deaths to compare there is no reading
export function momentumOf(d30: number, d90: number): { value: number; direction: 'rising' | 'steady' | 'falling' | 'low data' } {
  const a = Number.isFinite(d30) && d30 > 0 ? d30 : 0;
  const base = Number.isFinite(d90) ? Math.max(0, (d90 - a) / 2) : 0;
  const value = Math.log1p(a) - Math.log1p(base);
  if (a + base < 10) return { value, direction: 'low data' };
  return { value, direction: value >= Math.log(1.5) ? 'rising' : value <= -Math.log(1.5) ? 'falling' : 'steady' };
}

export const per100k = (deaths: number, population: number | null): number | null => (population !== null && Number.isFinite(population) && population > 0 && Number.isFinite(deaths) ? (deaths / population) * 1e5 : null);

export type Stats = {
  deaths30: Range;
  deaths90: Range;
  deaths365: Range;
  events30: number;
  events90: number;
  events365: number;
  monthly: number[];
  locatedShare365: number;
  provisionalShare90: number;
  firstOfMonthShare90: number; // share of the 90-day deaths dated the 1st of a month: candidate rows can carry only a month, which makes windows lumpy
};

const num = (s: string | undefined): number | null => {
  if (s === undefined || s.trim() === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};
const zero = (): Range => ({ best: 0, low: 0, high: 0 });
const add = (a: Range, r: Range) => ((a.best += r.best), (a.low += r.low), (a.high += r.high));

// Observed statistics per country (and the world's monthly series) from UCDP rows. Windows end at the data end day; one event per id (the
// later row wins); a country without an id is skipped and reported.
export function countryStats(input: { row: GedRow; provisional: boolean }[], opts: { dataEndS: number; gwToId: Record<string, string> }) {
  const byId = new Map<string, { row: GedRow; provisional: boolean }>();
  for (const x of input) if (x.row.id) byId.set(x.row.id, x);
  const end = new Date(opts.dataEndS * 1000);
  const endIndex = end.getUTCFullYear() * 12 + end.getUTCMonth();
  const countries = new Map<string, Stats & { _located: number; _prov90: number; _first90: number }>();
  const unmapped = new Set<string>();
  const world = new Array<number>(MONTHS).fill(0);
  for (const { row, provisional } of byId.values()) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(row.date_start ?? '');
    const best = num(row.best);
    if (!m || best === null) continue;
    const t = Date.UTC(+m[1]!, +m[2]! - 1, +m[3]!) / 86400000; // days since the epoch
    const ageD = Math.floor(opts.dataEndS / DAY - t);
    if (ageD < 0) continue;
    const b = Math.max(0, best);
    const r: Range = { best: b, low: Math.min(b, Math.max(0, num(row.low) ?? b)), high: Math.max(b, num(row.high) ?? b) };
    const back = endIndex - (+m[1]! * 12 + (+m[2]! - 1));
    const slot = MONTHS - 1 - back;
    if (slot >= 0 && slot < MONTHS) world[slot]! += b;
    const id = opts.gwToId[row.country_id ?? ''];
    if (!id) {
      unmapped.add(row.country_id ?? '');
      continue;
    }
    const c = countries.get(id) ?? { deaths30: zero(), deaths90: zero(), deaths365: zero(), events30: 0, events90: 0, events365: 0, monthly: new Array<number>(MONTHS).fill(0), locatedShare365: 1, provisionalShare90: 0, firstOfMonthShare90: 0, _located: 0, _prov90: 0, _first90: 0 };
    countries.set(id, c);
    if (slot >= 0 && slot < MONTHS) c.monthly[slot]! += b;
    if (ageD < 365) {
      add(c.deaths365, r);
      c.events365++;
      if ((num(row.where_prec) ?? 5) <= LOCATED_PREC) c._located += b;
    }
    if (ageD < 90) {
      add(c.deaths90, r);
      c.events90++;
      if (provisional) c._prov90++;
      if (m[3] === '01') c._first90 += b;
    }
    if (ageD < 30) {
      add(c.deaths30, r);
      c.events30++;
    }
  }
  const out = new Map<string, Stats>();
  for (const [id, c] of countries) {
    const { _located, _prov90, _first90, ...s } = c;
    out.set(id, { ...s, locatedShare365: c.deaths365.best > 0 ? _located / c.deaths365.best : 1, provisionalShare90: c.events90 > 0 ? _prov90 / c.events90 : 0, firstOfMonthShare90: c.deaths90.best > 0 ? _first90 / c.deaths90.best : 0 });
  }
  return { countries: out, unmapped: [...unmapped].filter(Boolean), world };
}
