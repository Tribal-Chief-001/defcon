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

  it('classifies the trend by event counts, never dividing by zero', () => {
    const many = (n: number, ago: number, best = 20) => Array.from({ length: n }, (_, i) => row({ ago: ago + (i % 20), best }));
    const t = (rows: ReturnType<typeof row>[]) => one(rows)[0]!.trend;
    expect(t([...many(10, 2), ...many(4, 35)])).toBe('rising'); // 10 events in 30 days against 2 per 30 days before
    expect(t([...many(2, 2), ...many(20, 35)])).toBe('falling'); // 2 against 10
    expect(t([...many(6, 2), ...many(12, 35)])).toBe('steady'); // 6 against 6
    expect(t(many(8, 2))).toBe('rising'); // nothing before: rising, not NaN or Infinity
    expect(t([...many(3, 2), ...many(7, 150, 30)])).toBe('low data'); // under 5 events to compare
  });

  it('is not fooled by one huge event: a steady conflict stays steady', () => {
    const rows = [...Array.from({ length: 8 }, (_, i) => row({ ago: 2 + i, best: 10 })), ...Array.from({ length: 16 }, (_, i) => row({ ago: 35 + i, best: 10 })), row({ ago: 50, best: 5000 })];
    const [c] = one(rows);
    expect(c!.deaths.d30.best).toBeLessThan(c!.deaths.d90.best / 3); // deaths alone would say "falling"
    expect(c!.trend).toBe('steady');
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

  describe('world overview', () => {
    const world = (rows: ReturnType<typeof row>[]) => conflictsFromRows(rows, opts).world;

    it('counts every valid event, also those of conflicts below the listing threshold', () => {
      const w = world([row({ ago: 3, best: 200, conflict_name: 'Big' }), row({ ago: 5, best: 10, conflict_name: 'Small' })]);
      expect(w.deaths.d365.best).toBe(210);
      expect(w.deaths.d90.best).toBe(210);
      expect(w.deaths.d30.best).toBe(210);
      expect(w.conflictsListed).toBe(1);
    });

    it('splits deaths by kind of violence and the parts add up to the total', () => {
      const w = world([row({ ago: 1, best: 150, type_of_violence: '1' }), row({ ago: 2, best: 60, type_of_violence: '3' }), row({ ago: 100, best: 40, type_of_violence: '2' })]);
      expect(w.byKind.state.d365.best).toBe(150);
      expect(w.byKind['one-sided'].d90.best).toBe(60);
      expect(w.byKind['non-state'].d90.best).toBe(0);
      expect(w.byKind['non-state'].d365.best).toBe(40);
      const sum = (f: (k: 'state' | 'non-state' | 'one-sided') => number) => f('state') + f('non-state') + f('one-sided');
      expect(sum((k) => w.byKind[k].d365.best)).toBe(w.deaths.d365.best);
      expect(sum((k) => w.byKind[k].d90.best)).toBe(w.deaths.d90.best);
    });

    it('has 52 weekly buckets over all conflicts', () => {
      const w = world([row({ ago: 0, best: 5, conflict_name: 'A' }), row({ ago: 1, best: 7, conflict_name: 'B' }), row({ ago: 8, best: 100, conflict_name: 'C' })]);
      expect(w.weekly).toHaveLength(52);
      expect(w.weekly[51]).toBe(12);
      expect(w.weekly[50]).toBe(100);
    });

    it('ranks the top 12 countries by 90-day deaths, null id when unmapped', () => {
      const rows = Array.from({ length: 14 }, (_, i) => row({ ago: 1, best: 10 + i, country: `Land ${i}`, country_id: String(900 + i), conflict_name: `C${i}` }));
      rows.push(row({ ago: 200, best: 5000, country: 'Old', country_id: '365' }));
      const w = world(rows);
      expect(w.countries).toHaveLength(12);
      expect(w.countries[0]).toEqual({ id: null, name: 'Land 13', deaths90: 23, deaths365: 23 });
      expect(w.countries.map((c) => c.deaths90)).toEqual([...w.countries.map((c) => c.deaths90)].sort((a, b) => b - a));
      expect(w.countries.some((c) => c.name === 'Old')).toBe(false); // no deaths in the last 90 days: not in a 90-day ranking
    });

    it('lists the 20 newest located events of all conflicts, newest first', () => {
      const rows = Array.from({ length: 25 }, (_, i) => row({ ago: i, best: 1, conflict_name: i % 2 ? 'Odd' : 'Even', id: `ev${String(i).padStart(2, '0')}` }));
      rows.push(row({ ago: 0, best: 1, latitude: '', longitude: '', id: 'nocoords' }));
      const w = world(rows);
      expect(w.latest).toHaveLength(20);
      expect(w.latest[0]!.date).toBe(day(0));
      expect(w.latest.some((e) => e.id === 'nocoords')).toBe(false);
      expect(w.latest.map((e) => e.date)).toEqual([...w.latest.map((e) => e.date)].sort().reverse());
    });

    it('is all zeros for no data, without NaN', () => {
      const f = conflictsFromRows([], opts);
      expect(f.conflicts).toEqual([]);
      expect(f.world.deaths.d365).toEqual({ best: 0, low: 0, high: 0 });
      expect(f.world.weekly.every((v) => v === 0)).toBe(true);
      expect(f.world.countries).toEqual([]);
      expect(f.world.latest).toEqual([]);
    });

    it('never gives a conflict the reserved id "world"', () => {
      const [c] = one([row({ ago: 1, best: 200, conflict_name: 'World' })]);
      expect(c!.id).toBe('world-2');
    });
  });

  it('empties a headline that is only a date', () => {
    const hs = ['31 August 2026', '2026-08-31', '31 Aug 2026', 'Shelling hits a market'];
    const [c] = one(hs.map((h, i) => row({ ago: i, best: 100, source_headline: h })));
    expect(c!.latest.map((e) => e.headline).sort()).toEqual(['', '', '', 'Shelling hits a market']);
  });

  describe('geography', () => {
    const geo = (rows: ReturnType<typeof row>[]) => one(rows)[0]!.geo;

    it('puts the centroid on the sphere, correct across the antimeridian', () => {
      const g = geo([row({ ago: 1, best: 60, latitude: '0', longitude: '179.9' }), row({ ago: 2, best: 60, latitude: '0', longitude: '-179.9' })])!;
      expect(Math.abs(g.lon)).toBeGreaterThan(179.8);
      expect(Math.abs(g.lat)).toBeLessThan(0.1);
    });

    it('weights the centroid by deaths', () => {
      const g = geo([row({ ago: 1, best: 90, latitude: '0', longitude: '0' }), row({ ago: 2, best: 10, latitude: '0', longitude: '10' })])!;
      expect(g.lon).toBeGreaterThan(0.8);
      expect(g.lon).toBeLessThan(1.2);
    });

    it('still places a conflict whose located events have no deaths (they count 1)', () => {
      const g = geo([row({ ago: 1, best: 200, latitude: '', longitude: '' }), row({ ago: 2, best: 0, latitude: '12', longitude: '34' })])!;
      expect(g.lat).toBeCloseTo(12, 1);
      expect(g.lon).toBeCloseTo(34, 1);
    });

    it('places a conflict only from events located to a district or better, and says how much could not be placed', () => {
      const g = geo([
        row({ ago: 1, best: 100, latitude: '48', longitude: '37', where_prec: '1' }),
        row({ ago: 2, best: 100, latitude: '49', longitude: '32', where_prec: '6' }), // a whole-country geocode: no place
        row({ ago: 3, best: 50, latitude: '48', longitude: '37', where_prec: '4' }),
      ])!;
      expect(g.lat).toBeCloseTo(48, 1);
      expect(g.lon).toBeCloseTo(37, 1);
      expect(g.cells).toEqual([[48.25, 37.25, 150]]);
      expect(g.locatedShare).toBeCloseTo(150 / 250);
    });

    it('falls back to every located event when none is placed to a district or better (located share 0)', () => {
      const g = geo([row({ ago: 1, best: 100, latitude: '49', longitude: '32', where_prec: '6' })])!;
      expect(g.lat).toBeCloseTo(49, 1);
      expect(g.locatedShare).toBe(0);
    });

    it('is null when no event has a usable location', () => {
      expect(geo([row({ ago: 1, best: 200, latitude: '', longitude: '' })])).toBeNull();
    });

    it('clamps the spread between 40 and 2500 km', () => {
      expect(geo([row({ ago: 1, best: 200, latitude: '10', longitude: '10' })])!.spreadKm).toBe(40);
      const wide = geo([row({ ago: 1, best: 100, latitude: '0', longitude: '-30' }), row({ ago: 2, best: 100, latitude: '0', longitude: '30' })])!;
      expect(wide.spreadKm).toBe(2500); // 3300 km from the centroid, clamped
    });

    it('puts a spread-out conflict on its heaviest hotspot, not in the empty space between regions', () => {
      const g = geo([row({ ago: 1, best: 200, latitude: '0.1', longitude: '0.1' }), row({ ago: 2, best: 120, latitude: '0.1', longitude: '60.1' })])!;
      expect(g.lat).toBeCloseTo(0.25, 1);
      expect(g.lon).toBeCloseTo(0.25, 1); // the 200-death cell, not the weighted middle near 22 E
      expect(g.spreadKm).toBeLessThanOrEqual(2500);
    });

    it('bins deaths into 0.5-degree cells, drops cells under 3 deaths, orders by deaths and keeps at most 40', () => {
      const g = geo([row({ ago: 1, best: 40, latitude: '10.1', longitude: '20.1' }), row({ ago: 2, best: 60, latitude: '10.2', longitude: '20.2' }), row({ ago: 3, best: 2, latitude: '30.1', longitude: '30.1' }), row({ ago: 4, best: 150, latitude: '-5.1', longitude: '99.9' })])!;
      expect(g.cells[0]).toEqual([-5.25, 99.75, 150]);
      expect(g.cells[1]).toEqual([10.25, 20.25, 100]); // the two events share a cell
      expect(g.cells).toHaveLength(2); // the 2-death cell is dropped
      const many = geo(Array.from({ length: 45 }, (_, i) => row({ ago: 1, best: 5 + i, latitude: String(i), longitude: '10.1' })))!;
      expect(many.cells).toHaveLength(40);
      expect(many.cells.map((c) => c[2])).toEqual([...many.cells.map((c) => c[2])].sort((a, b) => b - a));
    });
  });

  it('world weeklyByKind has 3 x 52 weeks and its weeks add up to the weekly total', () => {
    const f = conflictsFromRows([row({ ago: 0, best: 5, type_of_violence: '1' }), row({ ago: 1, best: 7, type_of_violence: '3' }), row({ ago: 8, best: 100, type_of_violence: '2' })], opts);
    const w = f.world.weeklyByKind;
    for (const k of ['state', 'non-state', 'one-sided'] as const) expect(w[k]).toHaveLength(52);
    expect(w.state[51]).toBe(5);
    expect(w['one-sided'][51]).toBe(7);
    expect(w['non-state'][50]).toBe(100);
    for (let i = 0; i < 52; i++) expect(w.state[i]! + w['non-state'][i]! + w['one-sided'][i]!).toBe(f.world.weekly[i]);
  });
});

describe('conflictsFromRows: events that cover several days (finding: candidate rows dated by their start only)', () => {
  const span = (from: string, to: string, best: number, extra: Record<string, string | number> = {}) => row({ ago: 0, best, date_start: `${from} 00:00:00.000`, date_end: `${to} 00:00:00.000`, ...extra });
  it('spreads a month-long event over its days: the last 90 days get all of an August event, the last 30 days get 30 of its 31 days', () => {
    const [c] = one([span('2026-08-01', '2026-08-31', 3100), row({ ago: 200, best: 50 })]);
    expect(c!.deaths.d30.best).toBe(3000);
    expect(c!.deaths.d90.best).toBe(3100);
    expect(c!.deaths.d365.best).toBe(3150);
  });
  it('counts an event that started over 365 days ago but ends inside the window, partly', () => {
    const start = day(369); // 369 days before the data end
    const end = day(360);
    const [c] = one([span(start, end, 100), row({ ago: 1, best: 500 })]);
    expect(c!.deaths.d365.best).toBe(500 + 50); // 5 of its 10 days (ages 364 to 360); the 365-day window is ages 0 to 364
  });
  it('keeps an event that started over 365 days ago out of the latest events, the last date, the provisional share and the geography (finding)', () => {
    const old = span(day(369), day(360), 100, { id: 'old', latitude: '10', longitude: '10', source_headline: 'Old raid' });
    old.provisional = true;
    const recent = row({ ago: 1, best: 500, id: 'new', latitude: '48.1', longitude: '37.5' });
    const out = conflictsFromRows([old, recent], opts);
    const c = out.conflicts[0]!;
    expect(c.deaths.d365.best).toBe(550); // its deaths still count in the window, by share
    expect(c.latest.map((e) => e.id)).toEqual(['new']);
    expect(c.lastDate).toBe(day(1));
    expect(c.provisionalShare).toBe(0);
    expect(c.geo!.lat).toBeCloseTo(48.1, 1); // the old event's place does not pull the centre
    expect(out.world.latest.map((e) => e.id)).toEqual(['new']);
  });
  it('keeps low <= best <= high after spreading and rounding', () => {
    const [c] = one([span('2026-07-01', '2026-09-30', 1000, { low: '800', high: '1500' }), row({ ago: 0, best: 10, low: '5', high: '40' })]);
    for (const w of [c!.deaths.d30, c!.deaths.d90, c!.deaths.d365]) expect(w.low <= w.best && w.best <= w.high).toBe(true);
  });
  it('clips an end after the data end (those days are not data yet) and ignores a bad end', () => {
    const [a] = one([span('2026-08-30', '2026-09-30', 100)]);
    expect(a!.deaths.d30.best).toBe(100); // only 2 days of data: all of the deaths are placed there
    const [b] = one([row({ ago: 3, best: 40, date_end: 'garbage' }), row({ ago: 3, best: 8, date_end: '' })]);
    expect(b!.deaths.d30.best).toBe(48);
  });
  it('puts the weekly series on the days the event covers (a month is spread over its weeks)', () => {
    const [c] = one([span('2026-08-01', '2026-08-31', 3100)]);
    expect(c!.weekly).toHaveLength(52);
    expect(Math.abs(c!.weekly.reduce((s, v) => s + v, 0) - 3100)).toBeLessThanOrEqual(52); // rounding only
    expect(c!.weekly[51]).toBeGreaterThan(500);
    expect(c!.weekly[50]).toBeGreaterThan(500);
    expect(c!.weekly[47]).toBeGreaterThan(0);
  });
  it('does not change anything for events without an end: they are one day', () => {
    const [c] = one([row({ ago: 0, best: 10 }), row({ ago: 29, best: 5 }), row({ ago: 30, best: 20 })]);
    expect([c!.deaths.d30.best, c!.deaths.d90.best]).toEqual([15, 35]);
    expect(c!.events).toEqual({ d30: 2, d90: 3, d365: 3 });
  });
});
