import { createReadStream } from 'node:fs';
import { parse } from 'csv-parse';
import { type GedEv, ym } from './panel';

// Streams the UCDP GED CSV (274 MB, never read whole) into the events the panel needs.
export async function loadGed(csv: string, start: number, end: number): Promise<GedEv[]> {
  const out: GedEv[] = [];
  const parser = createReadStream(csv).pipe(parse({ columns: true, relax_column_count: true, bom: true }));
  for await (const r of parser as AsyncIterable<Record<string, string>>) {
    const m = /^(\d{4})-(\d{2})/.exec(r.date_start ?? '');
    const best = Number(r.best);
    if (!m || !r.country_id || !Number.isFinite(best)) continue;
    const t = ym(+m[1]!, +m[2]!);
    if (t < start || t > end) continue;
    out.push({ gw: r.country_id, name: r.country ?? r.country_id, ym: t, best, type: Number(r.type_of_violence) });
  }
  return out;
}
