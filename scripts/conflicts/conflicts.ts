import type { Conflict, ConflictEvent, ConflictsFile, Kind, Range } from '../../src/conflicts/types';

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

type Ev = { id: string; date: string; ageD: number; row: GedRow; kind: Kind; deaths: Range; provisional: boolean };

// Groups UCDP events (GED and candidate rows) by conflict name and computes deaths, trend, a weekly timeline and the latest events.
// Windows end at `dataEndS` (00:00 UTC of the last day of data), so "last 30 days" means the 30 days up to the data end, never today.
export function conflictsFromRows(input: { row: GedRow; provisional: boolean }[], opts: { dataEndS: number; gwToId: Record<string, string>; generated: string; sources: string[] }): ConflictsFile {
  const byId = new Map<string, { row: GedRow; provisional: boolean }>();
  for (const x of input) if (x.row.id) byId.set(x.row.id, x); // a later row for the same id wins

  const groups = new Map<string, Ev[]>();
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
    list.push({ id: row.id!, date: d.date, ageD, row, kind, deaths, provisional });
  }

  const used = new Set<string>();
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

    const base = (d90.best - d30.best) / 2; // deaths per 30 days in the 60 days before the last 30
    const trend: Conflict['trend'] = d30.best + base < 10 ? 'low data' : d30.best >= 10 && d30.best >= 1.5 * base ? 'rising' : base >= 10 && d30.best <= 0.5 * base ? 'falling' : 'steady';

    const latest: ConflictEvent[] = evs
      .filter((e) => num(e.row.latitude) !== null && num(e.row.longitude) !== null)
      .sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id))
      .slice(0, 12)
      .map((e) => ({
        id: e.id,
        date: e.date,
        place: [...new Set([e.row.where_description, e.row.adm_1, e.row.country].map((s) => (s ?? '').trim()).filter(Boolean))].join(', '),
        country: e.row.country ?? '',
        lat: num(e.row.latitude)!,
        lon: num(e.row.longitude)!,
        precision: Math.min(7, Math.max(1, Math.round(num(e.row.where_prec) ?? 5))),
        kind: e.kind,
        deaths: e.deaths,
        headline: (e.row.source_headline ?? '').trim().slice(0, 200),
        sources: [...new Set((e.row.source_office ?? '').split(';').map((s) => s.trim()).filter(Boolean))],
        provisional: e.provisional,
      }));

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
  conflicts.sort((a, b) => b.deaths.d90.best - a.deaths.d90.best || a.name.localeCompare(b.name));
  return { generated: opts.generated, dataEnd: new Date(opts.dataEndS * 1000).toISOString().slice(0, 10), sources: opts.sources, conflicts };
}
