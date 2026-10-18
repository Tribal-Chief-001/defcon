import { createReadStream } from 'node:fs';
import { parse } from 'csv-parse';
import { severity } from '../../src/events/severity';
import type { Ev, Kind } from '../../src/events/types';

type Row = Record<string, string>;

const num = (s: string | undefined): number | null => {
  if (s === undefined || s.trim() === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

// "2026-08-10 00:00:00.000" is UTC.
const parseTime = (s: string | undefined): number | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}):(\d{2}))?/.exec(s ?? '');
  if (!m) return null;
  const t = Date.UTC(+m[1]!, +m[2]! - 1, +m[3]!, +(m[4] ?? 0), +(m[5] ?? 0), +(m[6] ?? 0)) / 1000;
  return Number.isFinite(t) ? t : null;
};

const KIND: Record<string, Kind> = { '1': 'armed', '2': 'armed', '3': 'civilian' };

export function ucdpRowToEv(row: Row, nowS: number): Ev | null {
  const kind = KIND[row.type_of_violence ?? ''];
  const lat = num(row.latitude);
  const lon = num(row.longitude);
  const timeS = parseTime(row.date_start);
  if (!kind || lat === null || lon === null || timeS === null || Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  const deaths = num(row.best);
  const prec = Math.min(5, Math.max(1, Math.round(num(row.where_prec) ?? 5))) as Ev['precision'];
  const place = [...new Set([row.where_description, row.adm_1, row.country].map((s) => (s ?? '').trim()).filter(Boolean))].join(', ');
  const names = [...new Set((row.source_office ?? '').split(';').map((s) => s.trim()).filter(Boolean))];
  return {
    id: `ucdp:${row.id}`,
    source: 'ucdp',
    alsoIds: [],
    timeS,
    lat,
    lon,
    precision: prec,
    country: null,
    kind,
    deaths,
    severity: severity({ kind, deaths, human: true }),
    human: true,
    place,
    headline: (row.source_headline ?? '').trim(),
    actors: (row.dyad_name ?? '').trim(),
    sources: names.map((name) => ({ name })),
    firstSeenS: nowS,
    updatedS: nowS,
  };
}

// Streams a UCDP GED or candidate CSV (the GED file is 274 MB, so it is never read whole).
export async function* streamUcdp(csvPath: string, sinceS: number, nowS: number): AsyncGenerator<Ev> {
  const parser = createReadStream(csvPath).pipe(parse({ columns: true, relax_column_count: true, bom: true }));
  for await (const row of parser as AsyncIterable<Row>) {
    const e = ucdpRowToEv(row, nowS);
    if (e && e.timeS >= sinceS) yield e;
  }
}
