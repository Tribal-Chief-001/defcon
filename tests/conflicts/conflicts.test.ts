import { describe, expect, it } from 'vitest';
import { conflictsFromRows, type GedRow } from '../../scripts/conflicts/conflicts';

const END = Date.UTC(2026, 7, 31) / 1000; // the data end day, 2026-08-31
const day = (n: number) => new Date((END - n * 86400) * 1000).toISOString().slice(0, 10); // n days before the data end
let seq = 0;
type Fix = { ago: number; best: number } & Record<string, string | number>;
const row = ({ ago, best, ...rest }: Fix): { row: GedRow; provisional: boolean } => {
  const o = rest as Record<string, string | undefined>;
  return {
  row: {
    id: o.id ?? String(++seq),
    conflict_name: 'Alpha - Beta',
    type_of_violence: '1',
    country: 'Ukraine',
    country_id: '369',
    date_start: `${day(ago)} 00:00:00.000`,
    best: String(best),
    low: String(best),
    high: String(best),
    where_description: 'Somewhere',
    adm_1: 'Region',
    latitude: '48.1',
    longitude: '37.5',
    where_prec: '1',
    source_headline: 'Shelling hits a town',
    source_office: 'Agency A;Agency B',
    ...o,
  },
  provisional: false,
  };
};
const opts = { dataEndS: END, gwToId: { '369': 'UKR', '365': 'RUS' }, generated: '2026-10-18', sources: ['t'] };
const one = (rows: ReturnType<typeof row>[]) => conflictsFromRows(rows, opts).conflicts;

describe('conflictsFromRows', () => {
  it('computes windows relative to the data end and ignores events after it', () => {
    const [c] = one([row({ ago: 0, best: 10 }), row({ ago: 29, best: 5 }), row({ ago: 30, best: 20 }), row({ ago: 89, best: 40 }), row({ ago: 90, best: 100 }), row({ ago: -1, best: 999 })]);
    expect(c!.deaths.d30.best).toBe(15);
    expect(c!.deaths.d90.best).toBe(75);
    expect(c!.deaths.d365.best).toBe(175);
    expect(c!.events).toEqual({ d30: 2, d90: 4, d365: 5 });
    expect(c!.lastDate).toBe(day(0));
  });

  it('lists a conflict only with >= 100 deaths in 365 days or >= 25 in 90 days', () => {
    expect(one([row({ ago: 100, best: 99 })])).toHaveLength(0);
    expect(one([row({ ago: 100, best: 100 })])).toHaveLength(1);
    expect(one([row({ ago: 5, best: 25, conflict_name: 'Gamma' }), row({ ago: 200, best: 10, conflict_name: 'Gamma' })])).toHaveLength(1);
    expect(one([row({ ago: 400, best: 5000 })])).toHaveLength(0); // older than 365 days
  });

  it('keeps low <= best <= high and falls back to best when low/high are missing', () => {
    const [c] = one([row({ ago: 1, best: 50, low: '70', high: '10' }), row({ ago: 2, best: 60, low: '', high: '' })]);
    expect(c!.deaths.d30).toEqual({ best: 110, low: 60 + 50, high: 60 + 50 });
    expect(c!.deaths.d30.low).toBeLessThanOrEqual(c!.deaths.d30.best);
    expect(c!.deaths.d30.high).toBeGreaterThanOrEqual(c!.deaths.d30.best);
  });

  it('counts a duplicated event id once, the later row winning', () => {
    const [c] = one([row({ id: 'x1', ago: 1, best: 200 }), row({ id: 'x1', ago: 1, best: 120 })]);
    expect(c!.deaths.d365.best).toBe(120);
    expect(c!.events.d365).toBe(1);
  });

  it('skips rows with unusable dates, deaths or violence type', () => {
    const [c] = one([row({ ago: 1, best: 100 }), row({ ago: 1, best: 100, date_start: 'garbage' }), row({ ago: 1, best: 100, type_of_violence: '9' }), row({ ago: 1, best: Number.NaN })]);
    expect(c!.events.d365).toBe(1);
  });

  it('names unnamed UCDP conflicts after their main country and keeps slugs unique', () => {
    const cs = one([row({ ago: 3, best: 300, conflict_name: 'XXX475', country: 'Nigeria', country_id: '475' }), row({ ago: 3, best: 200, conflict_name: 'Russia - Ukraine' }), row({ ago: 3, best: 150, conflict_name: 'Russia: Ukraine' })]);
    expect(cs.map((c) => c.name)).toContain('XXX475 (Nigeria)'); // UCDP's placeholder code stays visible: it is all the data says
    expect(one([row({ ago: 3, best: 300, conflict_name: '', country: 'Chad', country_id: '483' })])[0]!.name).toBe('Unnamed conflict (Chad)');
    const ids = cs.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((i) => /^[a-z0-9-]{1,60}$/.test(i))).toBe(true);
  });

  it('lists countries with deaths, null id for an unmapped Gleditsch-Ward number, sorted by deaths', () => {
    const [c] = one([row({ ago: 1, best: 30 }), row({ ago: 1, best: 80, country: 'Russia (Soviet Union)', country_id: '365' }), row({ ago: 1, best: 5, country: 'Atlantis', country_id: '999' })]);
    expect(c!.countries).toEqual([
      { id: 'RUS', name: 'Russia (Soviet Union)', deaths365: 80 },
      { id: 'UKR', name: 'Ukraine', deaths365: 30 },
      { id: null, name: 'Atlantis', deaths365: 5 },
    ]);
  });

  it('classifies the trend without ever dividing by zero', () => {
    const t = (rows: ReturnType<typeof row>[]) => one(rows)[0]!.trend;
    expect(t([row({ ago: 5, best: 120 }), row({ ago: 40, best: 20 }), row({ ago: 70, best: 20 })])).toBe('rising'); // 120 vs 20 per 30 days
    expect(t([row({ ago: 5, best: 10 }), row({ ago: 40, best: 200 }), row({ ago: 70, best: 200 })])).toBe('falling');
    expect(t([row({ ago: 5, best: 100 }), row({ ago: 40, best: 100 }), row({ ago: 70, best: 100 })])).toBe('steady');
    expect(t([row({ ago: 5, best: 100 })])).toBe('rising'); // base 0, d30 >= 10: rising, not NaN or Infinity
    expect(t([row({ ago: 120, best: 100 }), row({ ago: 5, best: 3 })])).toBe('low data');
  });

  it('builds 52 weekly buckets, oldest first, the last one ending at the data end', () => {
    const [c] = one([row({ ago: 0, best: 7 }), row({ ago: 6, best: 3 }), row({ ago: 7, best: 100 }), row({ ago: 363, best: 11 })]);
    expect(c!.weekly).toHaveLength(52);
    expect(c!.weekly[51]).toBe(10); // days 0..6 before the end
    expect(c!.weekly[50]).toBe(100);
    expect(c!.weekly[0]).toBe(11);
  });

  it('counts an event 364 days old in the 365-day window but not in the 52 weekly buckets', () => {
    const [c] = one([row({ ago: 364, best: 100 }), row({ ago: 363, best: 7 })]);
    expect(c!.deaths.d365.best).toBe(107);
    expect(c!.weekly).toHaveLength(52);
    expect(c!.weekly.reduce((s, v) => s + v, 0)).toBe(7);
    expect(Object.keys(c!.weekly)).toHaveLength(52); // no stray negative index
  });

  it('returns the 12 newest events, trimmed headline, unique sources, place joined, provisional flag and share', () => {
    const rows = Array.from({ length: 15 }, (_, i) => row({ ago: i, best: 10, source_headline: 'x'.repeat(300) }));
    rows[0]!.provisional = true;
    const [c] = one(rows);
    expect(c!.latest).toHaveLength(12);
    expect(c!.latest[0]!.date).toBe(day(0));
    expect(c!.latest[0]!.provisional).toBe(true);
    expect(c!.latest[0]!.headline).toHaveLength(200);
    expect(c!.latest[0]!.sources).toEqual(['Agency A', 'Agency B']);
    expect(c!.latest[0]!.place).toBe('Somewhere, Region, Ukraine');
    expect(c!.provisionalShare).toBeCloseTo(1 / 15);
  });

  it('keeps an event with unusable coordinates in the sums but not in the latest list', () => {
    const [c] = one([row({ ago: 1, best: 150, latitude: '', longitude: '' })]);
    expect(c!.deaths.d365.best).toBe(150);
    expect(c!.latest).toHaveLength(0);
  });

  it('sorts conflicts by 90-day deaths, then name', () => {
    const cs = one([row({ ago: 1, best: 100, conflict_name: 'B' }), row({ ago: 1, best: 500, conflict_name: 'C' }), row({ ago: 1, best: 100, conflict_name: 'A' })]);
    expect(cs.map((c) => c.name)).toEqual(['C', 'A', 'B']);
  });

  it('reports the data end date and sources in the file header', () => {
    const f = conflictsFromRows([row({ ago: 1, best: 100 })], opts);
    expect(f.dataEnd).toBe('2026-08-31');
    expect(f.generated).toBe('2026-10-18');
    expect(f.sources).toEqual(['t']);
  });
});
