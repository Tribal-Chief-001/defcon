// Builds public/data/relations.json from the curated alliances and the UCDP state-based dyads in the pinned GED CSVs.
// Usage: npm run data:relations      (after npm run data:ucdp)
import { createReadStream, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { parse } from 'csv-parse';
import type { Alliance, Relations } from '../../src/relations/types';
import { disputesFromGed } from './disputes';
import { resolveGw } from './gw-ids';

// a single GED row is not an "active dispute": at least this many state-vs-state events in the window
const MIN_DISPUTE_EVENTS = 3;
async function main() {
  const countries = JSON.parse(readFileSync('public/data/countries.json', 'utf8')) as { id: string; name: string }[];
  const manifest = JSON.parse(readFileSync('data/events/sources.json', 'utf8')) as { ucdp: { csv: string }[] };
  const rows: Record<string, string>[] = [];
  const gwNames = new Map<string, string>();
  let maxYear = 0;
  for (const s of manifest.ucdp) {
    const parser = createReadStream(`data/raw/ucdp/${s.csv}`).pipe(parse({ columns: true, relax_column_count: true, bom: true }));
    for await (const r of parser as AsyncIterable<Record<string, string>>) {
      maxYear = Math.max(maxYear, Number(r.year) || 0);
      if (r.country_id && r.country) gwNames.set(r.country_id, r.country);
      if (r.type_of_violence === '1' && r.gwnoa && r.gwnob) rows.push(r);
    }
  }
  const { gwToId, unmapped } = resolveGw(gwNames, countries);
  const unresolved = unmapped.filter(({ gw }) => rows.some((r) => r.gwnoa === gw || r.gwnob === gw)).map(({ gw, name }) => `${gw} ${name}`);
  if (unresolved.length) throw new Error(`Gleditsch-Ward numbers without a Natural Earth id: ${unresolved.join(', ')} (add to NAME_ALIAS in gw-ids.ts)`);
  const known = new Set(countries.map((c) => c.id));
  for (const id of Object.values(gwToId)) if (!known.has(id)) throw new Error(`mapped id ${id} is not in countries.json`);

  const disputes = disputesFromGed(rows, gwToId, { minLastYear: maxYear - 1, minEvents: MIN_DISPUTE_EVENTS });
  const alliances = (JSON.parse(readFileSync('data/relations/alliances.json', 'utf8')) as { alliances: Alliance[] }).alliances;
  const out: Relations = { generated: new Date().toISOString().slice(0, 10), alliances, disputes };
  mkdirSync('public/data', { recursive: true });
  writeFileSync('public/data/relations.json', JSON.stringify(out));
  console.log(`alliances ${alliances.length}, disputes ${disputes.length} (last year >= ${maxYear - 1}, at least ${MIN_DISPUTE_EVENTS} events)`);
  for (const d of disputes) console.log(`  ${d.a}-${d.b}  ${d.conflict}  events ${d.events}  last ${d.lastYear}`);
}
void main();
