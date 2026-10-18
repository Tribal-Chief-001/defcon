import { share, spanOf, type Span } from '../lib/spread';
import { activityTrend } from './trend';
import type { Conflict, ConflictEvent, ConflictsFile, Geo, Kind, Range, World } from '../../src/conflicts/types';

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

type Ev = { id: string; date: string; ageD: number; span: Span; row: GedRow; kind: Kind; deaths: Range; provisional: boolean };

// The part of an event's deaths that falls in the last `days` days up to the data end (an event covers all the days from its start to its
// end, see scripts/lib/spread.ts), and in each of the 52 weeks. One-day events are in a window wholly or not at all, as before.
const frac = (e: Ev, lastDay: number, days: number) => share(e.span, lastDay - days + 1, lastDay);
const scaled = (r: Range, f: number): Range => ({ best: r.best * f, low: r.low * f, high: r.high * f });
const rounded = (r: Range): Range => ({ best: Math.round(r.best), low: Math.round(r.low), high: Math.round(r.high) });
const weekShare = (e: Ev, lastDay: number, i: number) => share(e.span, lastDay - (51 - i) * 7 - 6, lastDay - (51 - i) * 7); // week 51 is the newest

const R_KM = 6371;
const D2R = Math.PI / 180;
const CELL = 0.5; // degrees
const MAX_CELLS = 40;
const SPREAD_MIN = 40;
const SPREAD_MAX = 2500;
const SPREAD_SCATTERED = 1000; // km: above this the centroid is not a place
const LOCATED_PREC = 4; // UCDP where_prec: 1 exact, 2 within 25 km, 3 district, 4 province; 5 and above: region or country geocode
const haversineKm = (a: { lat: number; lon: number }, b: { lat: number; lon: number }) => {
  const dLat = (b.lat - a.lat) * D2R;
  const dLon = (b.lon - a.lon) * D2R;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * D2R) * Math.cos(b.lat * D2R) * Math.sin(dLon / 2) ** 2;
  return 2 * R_KM * Math.asin(Math.min(1, Math.sqrt(h)));
};

// Where a conflict's deaths are: weighted by deaths (an event with none counts 1), the centroid is the mean of 3-D unit vectors so it is
// right across the antimeridian; the spread is the death-weighted 75th-percentile distance to it; the cells are the top death hotspots.
function geoOf(evs: Ev[]): Geo | null {
  const pts = evs.flatMap((e) => {
    const lat = num(e.row.latitude);
    const lon = num(e.row.longitude);
    return lat === null || lon === null || Math.abs(lat) > 90 || Math.abs(lon) > 180 ? [] : [{ lat, lon, deaths: e.deaths.best, w: Math.max(1, e.deaths.best), located: (num(e.row.where_prec) ?? 5) <= LOCATED_PREC }];
  });
  if (pts.length === 0) return null;
  // UCDP gives events it can only place in a region or the whole country a single geocode: in Russia - Ukraine one point (49.0, 32.0)
  // holds most of the deaths. Those would be the whole picture, so the shape comes from events located to a district or better.
  const totalDeaths = pts.reduce((s, p) => s + p.deaths, 0);
  const located = pts.filter((p) => p.located);
  const locatedShare = totalDeaths > 0 ? located.reduce((s, p) => s + p.deaths, 0) / totalDeaths : located.length > 0 ? 1 : 0;
  if (located.length > 0) pts.splice(0, pts.length, ...located);
  let x = 0;
  let y = 0;
  let z = 0;
  let total = 0;
  for (const p of pts) {
    x += p.w * Math.cos(p.lat * D2R) * Math.cos(p.lon * D2R);
    y += p.w * Math.cos(p.lat * D2R) * Math.sin(p.lon * D2R);
    z += p.w * Math.sin(p.lat * D2R);
    total += p.w;
  }
  const norm = Math.hypot(x, y, z);
  const heaviest = pts.reduce((m, p) => (p.w > m.w ? p : m), pts[0]!);
  let c = norm < 1e-9 * total ? { lat: heaviest.lat, lon: heaviest.lon } : { lat: Math.asin(z / norm) / D2R, lon: Math.atan2(y, x) / D2R };
  const spreadAround = (ctr: { lat: number; lon: number }) => {
    const byDist = pts.map((p) => ({ d: haversineKm(ctr, p), w: p.w })).sort((a, b) => a.d - b.d);
    let cum = 0;
    for (const p of byDist) {
      cum += p.w;
      if (cum >= 0.75 * total) return p.d;
    }
    return byDist[byDist.length - 1]!.d;
  };
  const cells = new Map<string, [number, number, number]>();
  for (const p of pts) {
    const i = Math.floor(p.lat / CELL);
    const j = Math.floor(p.lon / CELL);
    const key = `${i},${j}`;
    const cell = cells.get(key) ?? [Math.round((i + 0.5) * CELL * 100) / 100, Math.round((j + 0.5) * CELL * 100) / 100, 0];
    cells.set(key, cell);
    cell[2] += p.deaths;
  }
  const top = [...cells.values()].sort((a, b) => b[2] - a[2] || a[0] - b[0] || a[1] - b[1]);
  let spread = spreadAround(c);
  // a conflict spread over several regions has its centroid in the empty space between them: put it on its heaviest hotspot instead
  if (spread > SPREAD_SCATTERED && top.length > 0) {
    c = { lat: top[0]![0], lon: top[0]![1] };
    spread = spreadAround(c);
  }
  return {
    lat: Math.round(c.lat * 1000) / 1000,
    lon: Math.round(c.lon * 1000) / 1000,
    spreadKm: Math.round(Math.min(SPREAD_MAX, Math.max(SPREAD_MIN, spread))),
    locatedShare: Math.round(locatedShare * 1000) / 1000,
    cells: top.filter((v) => v[2] >= 3).slice(0, MAX_CELLS),
  };
}

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

  const lastDay = opts.dataEndS / DAY;
  const groups = new Map<string, Ev[]>();
  const all: Ev[] = [];
  for (const { row, provisional } of byId.values()) {
    const d = dayOf(row.date_start);
    const best = num(row.best);
    const kind = KIND[row.type_of_violence ?? ''];
    if (!d || best === null || !kind || d.t > opts.dataEndS) continue;
    const lastDay = opts.dataEndS / DAY;
    const span = spanOf(row.date_start, row.date_end, lastDay);
    if (!span || span.end < lastDay - 364) continue; // nothing of it falls in the last 365 days
    const ageD = Math.floor((opts.dataEndS - d.t) / DAY);
    const b = Math.max(0, best);
    const deaths: Range = { best: b, low: Math.min(b, Math.max(0, num(row.low) ?? b)), high: Math.max(b, num(row.high) ?? b) };
    const name = (row.conflict_name ?? '').trim();
    const list = groups.get(name) ?? [];
    groups.set(name, list);
    const ev: Ev = { id: row.id!, date: d.date, ageD, span, row, kind, deaths, provisional };
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
      add(d365, scaled(e.deaths, frac(e, lastDay, 365)));
      add(d90, scaled(e.deaths, frac(e, lastDay, 90)));
      add(d30, scaled(e.deaths, frac(e, lastDay, 30)));
      if (e.ageD < 365) n.d365++;
      if (e.ageD < 90) n.d90++;
      if (e.ageD < 30) n.d30++;
      for (let i = 0; i < 52; i++) weekly[i]! += e.deaths.best * weekShare(e, lastDay, i); // 52 whole weeks; day 365 only counts in d365
      if (e.provisional) provisional++;
      const key = e.row.country_id ?? e.row.country ?? '';
      const c = countries.get(key) ?? { id: opts.gwToId[e.row.country_id ?? ''] ?? null, name: e.row.country ?? 'Unknown', deaths365: 0 };
      countries.set(key, c);
      c.deaths365 += e.deaths.best * frac(e, lastDay, 365);
    }
    for (const c of countries.values()) c.deaths365 = Math.round(c.deaths365);
    if (d365.best < LIST_D365 && d90.best < LIST_D90) continue;

    const countryList = [...countries.values()].sort((a, b) => b.deaths365 - a.deaths365 || a.name.localeCompare(b.name));
    const main = countryList[0]?.name ?? 'unknown';
    // UCDP candidate files anonymise some actors as XXX<number>: keep the code visible, it is all the data says
    const name = rawName === '' ? `Unnamed conflict (${main})` : /^XXX\d+/.test(rawName) ? `${rawName} (${main})` : rawName;
    let id = slug(name);
    for (let i = 2; used.has(id); i++) id = `${slug(name)}-${i}`;
    used.add(id);

    const trend: Conflict['trend'] = activityTrend(n.d30, n.d90);

    const latest = evs.map(toEvent).filter((e): e is ConflictEvent => e !== null).sort(newestFirst).slice(0, 12);

    conflicts.push({
      id,
      name,
      kinds: [...new Set(evs.map((e) => e.kind))],
      countries: countryList,
      deaths: { d30: rounded(d30), d90: rounded(d90), d365: rounded(d365) },
      events: n,
      trend,
      lastDate: evs.reduce((m, e) => (e.date > m ? e.date : m), ''),
      weekly: weekly.map(Math.round),
      latest,
      provisionalShare: provisional / evs.length,
      geo: geoOf(evs),
    });
  }
  const world = worldOf(all, conflicts.length, opts.gwToId, lastDay);
  conflicts.sort((a, b) => b.deaths.d90.best - a.deaths.d90.best || a.name.localeCompare(b.name));
  return { generated: opts.generated, dataEnd: new Date(opts.dataEndS * 1000).toISOString().slice(0, 10), sources: opts.sources, conflicts, world };
}

function worldOf(all: Ev[], conflictsListed: number, gwToId: Record<string, string>, lastDay: number): World {
  const deaths = { d30: zero(), d90: zero(), d365: zero() };
  const byKind: World['byKind'] = { state: { d90: zero(), d365: zero() }, 'non-state': { d90: zero(), d365: zero() }, 'one-sided': { d90: zero(), d365: zero() } };
  const weekly = new Array<number>(52).fill(0);
  const weeklyByKind: World['weeklyByKind'] = { state: new Array<number>(52).fill(0), 'non-state': new Array<number>(52).fill(0), 'one-sided': new Array<number>(52).fill(0) };
  const countries = new Map<string, { id: string | null; name: string; deaths90: number; deaths365: number }>();
  for (const e of all) {
    const f365 = frac(e, lastDay, 365), f90 = frac(e, lastDay, 90);
    add(deaths.d365, scaled(e.deaths, f365));
    add(byKind[e.kind].d365, scaled(e.deaths, f365));
    add(deaths.d90, scaled(e.deaths, f90));
    add(byKind[e.kind].d90, scaled(e.deaths, f90));
    add(deaths.d30, scaled(e.deaths, frac(e, lastDay, 30)));
    for (let i = 0; i < 52; i++) {
      const w = e.deaths.best * weekShare(e, lastDay, i);
      weekly[i]! += w;
      weeklyByKind[e.kind][i]! += w;
    }
    const key = e.row.country_id ?? e.row.country ?? '';
    const c = countries.get(key) ?? { id: gwToId[e.row.country_id ?? ''] ?? null, name: e.row.country ?? 'Unknown', deaths90: 0, deaths365: 0 };
    countries.set(key, c);
    c.deaths365 += e.deaths.best * f365;
    c.deaths90 += e.deaths.best * f90;
  }
  const roundAll = (a: number[]) => a.map(Math.round);
  const kinds = { state: roundAll(weeklyByKind.state), 'non-state': roundAll(weeklyByKind['non-state']), 'one-sided': roundAll(weeklyByKind['one-sided']) };
  return {
    deaths: { d30: rounded(deaths.d30), d90: rounded(deaths.d90), d365: rounded(deaths.d365) },
    byKind: Object.fromEntries(Object.entries(byKind).map(([k, v]) => [k, { d90: rounded(v.d90), d365: rounded(v.d365) }])) as World['byKind'],
    weekly: kinds.state.map((v, i) => v + kinds['non-state'][i]! + kinds['one-sided'][i]!), // the total is the sum of the rounded kinds, so the stacked chart adds up exactly
    weeklyByKind: kinds,
    countries: [...countries.values()].map((c) => ({ ...c, deaths90: Math.round(c.deaths90), deaths365: Math.round(c.deaths365) })).filter((c) => c.deaths90 > 0).sort((a, b) => b.deaths90 - a.deaths90 || a.name.localeCompare(b.name)).slice(0, 12),
    conflictsListed,
    latest: all.map(toEvent).filter((e): e is ConflictEvent => e !== null).sort(newestFirst).slice(0, 20),
  };
}
