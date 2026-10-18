// Builds public/data/conflicts.json (the War tracker's data) from the pinned UCDP files: GED plus the candidate releases.
// Usage: npm run data:conflicts      (after npm run data:ucdp)
import { createReadStream, readFileSync, writeFileSync } from 'node:fs';
import { parse } from 'csv-parse';
import { resolveGw } from '../relations/gw-ids';
import { conflictsFromRows, type GedRow } from './conflicts';

const KEEP_FROM = '2025-01-01'; // the tracker needs 365 days before the data end; this leaves room
const FIELDS = ['id', 'conflict_name', 'type_of_violence', 'country', 'country_id', 'date_start', 'date_end', 'best', 'low', 'high', 'where_description', 'adm_1', 'latitude', 'longitude', 'where_prec', 'source_headline', 'source_office'];

async function main() {
  const manifest = JSON.parse(readFileSync('data/events/sources.json', 'utf8')) as { ucdp: { name: string; csv: string; version: string }[] };
  const countries = JSON.parse(readFileSync('public/data/countries.json', 'utf8')) as { id: string; name: string }[];
  const rows: { row: GedRow; provisional: boolean }[] = [];
  const gwNames = new Map<string, string>();
  let maxDate = '';
  for (const s of manifest.ucdp) {
    const provisional = s.name.startsWith('candidate');
    const parser = createReadStream(`data/raw/ucdp/${s.csv}`).pipe(parse({ columns: true, relax_column_count: true, bom: true }));
    for await (const r of parser as AsyncIterable<GedRow>) {
      const d = (r.date_start ?? '').slice(0, 10);
      if (d < KEEP_FROM) continue;
      if (d > maxDate) maxDate = d;
      if (r.country_id && r.country) gwNames.set(r.country_id, r.country);
      rows.push({ row: Object.fromEntries(FIELDS.map((f) => [f, r[f]])), provisional });
    }
  }
  if (!maxDate) throw new Error('no UCDP rows found: run npm run data:ucdp first');
  const { gwToId, unmapped } = resolveGw(gwNames, countries);
  const out = conflictsFromRows(rows, {
    dataEndS: Date.UTC(+maxDate.slice(0, 4), +maxDate.slice(5, 7) - 1, +maxDate.slice(8, 10)) / 1000,
    gwToId,
    generated: new Date().toISOString().slice(0, 10),
    sources: manifest.ucdp.map((s) => s.version),
  });
  writeFileSync('public/data/conflicts.json', JSON.stringify(out));
  console.log(`data end ${out.dataEnd}, ${rows.length} rows kept, ${out.conflicts.length} conflicts${unmapped.length ? `; unmapped countries: ${unmapped.map((u) => `${u.gw} ${u.name}`).join(', ')}` : ''}`);
  for (const c of out.conflicts) console.log(`  ${c.deaths.d90.best.toString().padStart(6)} d90  ${c.deaths.d365.best.toString().padStart(7)} d365  ${c.trend.padEnd(8)}  ${c.name}`);
}

main().catch((e) => (console.error(e), process.exit(1)));
