import type { Conflict, ConflictEvent, ConflictsFile, Kind, Range, World } from '../../src/conflicts/types';

export type GedRow = Record<string, string | undefined>;
const DAY = 86400;
const KIND: Record<string, Kind> = { '1': 'state', '2': 'non-state', '3': 'one-sided' };
const LIST_D365 = 100; // a conflict is listed with this many deaths in 365 days ...
const LIST_D90 = 25; // ... or this many in 90 days

const num = (s: string | undefined): number | null => {
  if (s === undefined || s.trim() === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};
const dayOf = (s: string | undefined): { date: string; t: number } | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s ?? '');
  if (!m) return null;
  const t = Date.UTC(+m[1]!, +m[2]! - 1, +m[3]!) / 1000;
  return Number.isFinite(t) ? { date: `${m[1]}-${m[2]}-${m[3]}`, t } : null;
};
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 56) || 'conflict';
const zero = (): Range => ({ best: 0, low: 0, high: 0 });
const add = (a: Range, r: Range) => ((a.best += r.best), (a.low += r.low), (a.high += r.high));

export const WORLD_ID = 'world'; // reserved for the World overview page
const DATE_ONLY = /^(\d{4}-\d{2}-\d{2}|\d{1,2}\s+[A-Za-z]+\s+\d{4})$/; // some UCDP candidate headlines are just the date

type Ev = { id: string; date: string; ageD: number; row: GedRow; kind: Kind; deaths: Range; provisional: boolean };

const newestFirst = (a: ConflictEvent, b: ConflictEvent) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id);

// null when the event has no usable location (it still counts in the sums)
function toEvent(e: Ev): ConflictEvent | null {
  const lat = num(e.row.latitude);
  const lon = num(e.row.longitude);
  if (lat === null || lon === null) return null;
  const headline = (e.row.source_headline ?? '').trim();
  return {
    id: e.id,
    date: e.date,
    place: [...new Set([e.row.where_description, e.row.adm_1, e.row.country].map((s) => (s ?? '').trim()).filter(Boolean))].join(', '),
    country: e.row.country ?? '',
    lat,
    lon,
    precision: Math.min(7, Math.max(1, Math.round(num(e.row.where_prec) ?? 5))),
    kind: e.kind,
    deaths: e.deaths,
    headline: DATE_ONLY.test(headline) ? '' : headline.slice(0, 200),
    sources: [...new Set((e.row.source_office ?? '').split(';').map((s) => s.trim()).filter(Boolean))],
    provisional: e.provisional,
  };
}

// Groups UCDP events (GED and candidate rows) by conflict name and computes deaths, trend, a weekly timeline and the latest events.
// Windows end at `dataEndS` (00:00 UTC of the last day of data), so "last 30 days" means the 30 days up to the data end, never today.
export function conflictsFromRows(input: { row: GedRow; provisional: boolean }[], opts: { dataEndS: number; gwToId: Record<string, string>; generated: string; sources: string[] }): ConflictsFile {
  const byId = new Map<string, { row: GedRow; provisional: boolean }>();
  for (const x of input) if (x.row.id) byId.set(x.row.id, x); // a later row for the same id wins

  const groups = new Map<string, Ev[]>();
  const all: Ev[] = [];
  for (const { row, provisional } of byId.values()) {
    const d = dayOf(row.date_start);
    const best = num(row.best);
    const kind = KIND[row.type_of_violence ?? ''];
    if (!d || best === null || !kind || d.t > opts.dataEndS) continue;
    const ageD = Math.floor((opts.dataEndS - d.t) / DAY);
    if (ageD >= 365) continue;
    const b = Math.max(0, best);
    const deaths: Range = { best: b, low: Math.min(b, Math.max(0, num(row.low) ?? b)), high: Math.max(b, num(row.high) ?? b) };
    const name = (row.conflict_name ?? '').trim();
    const list = groups.get(name) ?? [];
    groups.set(name, list);
    const ev: Ev = { id: row.id!, date: d.date, ageD, row, kind, deaths, provisional };
    list.push(ev);
    all.push(ev);
  }

  const used = new Set<string>([WORLD_ID]);
  const conflicts: Conflict[] = [];
  for (const [rawName, evs] of groups) {
    const d30 = zero(), d90 = zero(), d365 = zero();
    const n = { d30: 0, d90: 0, d365: 0 };
    const weekly = new Array<number>(52).fill(0);
    const countries = new Map<string, { id: string | null; name: string; deaths365: number }>();
    let provisional = 0;
    for (const e of evs) {
      add(d365, e.deaths);
      n.d365++;
      if (e.ageD < 90) (add(d90, e.deaths), n.d90++);
      if (e.ageD < 30) (add(d30, e.deaths), n.d30++);
      if (e.ageD < 364) weekly[51 - Math.floor(e.ageD / 7)]! += e.deaths.best; // 52 whole weeks; day 365 only counts in d365
      if (e.provisional) provisional++;
      const key = e.row.country_id ?? e.row.country ?? '';
      const c = countries.get(key) ?? { id: opts.gwToId[e.row.country_id ?? ''] ?? null, name: e.row.country ?? 'Unknown', deaths365: 0 };
      countries.set(key, c);
      c.deaths365 += e.deaths.best;
    }
    if (d365.best < LIST_D365 && d90.best < LIST_D90) continue;

    const countryList = [...countries.values()].sort((a, b) => b.deaths365 - a.deaths365 || a.name.localeCompare(b.name));
    const main = countryList[0]?.name ?? 'unknown';
    // UCDP candidate files anonymise some actors as XXX<number>: keep the code visible, it is all the data says
    const name = rawName === '' ? `Unnamed conflict (${main})` : /^XXX\d+/.test(rawName) ? `${rawName} (${main})` : rawName;
    let id = slug(name);
    for (let i = 2; used.has(id); i++) id = `${slug(name)}-${i}`;
    used.add(id);

    // activity trend from event counts, not deaths: one mass-casualty event must not make a steady conflict look like it is falling or rising
    const base = (n.d90 - n.d30) / 2; // events per 30 days in the 60 days before the last 30
    const trend: Conflict['trend'] = n.d30 + base < 5 ? 'low data' : n.d30 >= 5 && n.d30 >= 1.5 * base ? 'rising' : base >= 5 && n.d30 <= 0.5 * base ? 'falling' : 'steady';

    const latest = evs.map(toEvent).filter((e): e is ConflictEvent => e !== null).sort(newestFirst).slice(0, 12);

    conflicts.push({
      id,
      name,
      kinds: [...new Set(evs.map((e) => e.kind))],
      countries: countryList,
      deaths: { d30, d90, d365 },
      events: n,
      trend,
      lastDate: evs.reduce((m, e) => (e.date > m ? e.date : m), ''),
      weekly,
      latest,
      provisionalShare: provisional / evs.length,
    });
  }
  const world = worldOf(all, conflicts.length, opts.gwToId);
  conflicts.sort((a, b) => b.deaths.d90.best - a.deaths.d90.best || a.name.localeCompare(b.name));
  return { generated: opts.generated, dataEnd: new Date(opts.dataEndS * 1000).toISOString().slice(0, 10), sources: opts.sources, conflicts, world };
}

function worldOf(all: Ev[], conflictsListed: number, gwToId: Record<string, string>): World {
  const deaths = { d30: zero(), d90: zero(), d365: zero() };
  const byKind: World['byKind'] = { state: { d90: zero(), d365: zero() }, 'non-state': { d90: zero(), d365: zero() }, 'one-sided': { d90: zero(), d365: zero() } };
  const weekly = new Array<number>(52).fill(0);
  const countries = new Map<string, { id: string | null; name: string; deaths90: number; deaths365: number }>();
  for (const e of all) {
    add(deaths.d365, e.deaths);
    add(byKind[e.kind].d365, e.deaths);
    if (e.ageD < 90) (add(deaths.d90, e.deaths), add(byKind[e.kind].d90, e.deaths));
    if (e.ageD < 30) add(deaths.d30, e.deaths);
    if (e.ageD < 364) weekly[51 - Math.floor(e.ageD / 7)]! += e.deaths.best;
    const key = e.row.country_id ?? e.row.country ?? '';
    const c = countries.get(key) ?? { id: gwToId[e.row.country_id ?? ''] ?? null, name: e.row.country ?? 'Unknown', deaths90: 0, deaths365: 0 };
    countries.set(key, c);
    c.deaths365 += e.deaths.best;
    if (e.ageD < 90) c.deaths90 += e.deaths.best;
  }
  return {
    deaths,
    byKind,
    weekly,
    countries: [...countries.values()].filter((c) => c.deaths90 > 0).sort((a, b) => b.deaths90 - a.deaths90 || a.name.localeCompare(b.name)).slice(0, 12),
    conflictsListed,
    latest: all.map(toEvent).filter((e): e is ConflictEvent => e !== null).sort(newestFirst).slice(0, 20),
  };
}
