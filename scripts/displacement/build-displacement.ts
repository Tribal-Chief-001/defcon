// Builds public/data/displacement.json from the UNHCR Refugee Population Statistics API (no key; CC BY 4.0 with the attribution
// "UNHCR Refugee Population Statistics Database" and a link to the Terms of Use for Datasets, read 2026-10-19).
// Run by hand (npm run data:displacement): UNHCR publishes annual figures in June and mid-year figures in the autumn.
import { writeFileSync } from 'node:fs';
import type { CountryDisplacement, DisplacementFile, FromCountry, HostedHere } from '../../src/displacement/types';

export const URL_BASE = 'https://api.unhcr.org/population/v1/population/';
const TERMS = 'https://www.unhcr.org/what-we-do/data-and-publications/data-and-statistics/terms-use-datasets';

// UNHCR writes "-" for a figure it does not report (suppressed or not applicable): null, never 0. A real 0 stays 0.
export function figure(v: unknown): number | null {
  const n = typeof v === 'number' ? v : typeof v === 'string' && /^\d+$/.test(v.trim()) ? Number(v) : Number.NaN;
  return Number.isFinite(n) && n >= 0 ? n : null;
}

type Mode = 'coo' | 'coa';
export function parseUnhcr(json: unknown, mode: Mode): Map<string, FromCountry | HostedHere> {
  const out = new Map<string, FromCountry | HostedHere>();
  const items = (json as { items?: unknown } | null)?.items;
  if (!Array.isArray(items)) return out;
  for (const row of items) {
    const r = row as Record<string, unknown> | null;
    const iso = r?.[`${mode}_iso`]; // UNHCR's own `coo`/`coa` codes differ from ISO (Sudan is SUD there); the *_iso column is ISO3
    const code = typeof iso === 'string' ? iso.toUpperCase() : '';
    if (!r || !/^[A-Z]{3}$/.test(code)) continue;
    out.set(code, mode === 'coo' ? { refugees: figure(r.refugees), asylumSeekers: figure(r.asylum_seekers), idps: figure(r.idps), returnedRefugees: figure(r.returned_refugees), stateless: figure(r.stateless), otherInNeed: figure(r.ooc) } : { refugees: figure(r.refugees), asylumSeekers: figure(r.asylum_seekers) });
  }
  return out;
}

async function page(fetchFn: typeof fetch, year: number, mode: Mode, p: number): Promise<{ items: unknown[]; maxPages: number }> {
  const url = `${URL_BASE}?limit=500&year=${year}&${mode}_all=true&cf_type=ISO&page=${p}`;
  const res = await fetchFn(url, { headers: { Accept: 'application/json', 'User-Agent': 'Defcon/0.1 (research showcase)' }, signal: AbortSignal.timeout(30_000), redirect: 'error' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const j = (await res.json()) as { items?: unknown; maxPages?: unknown };
  return { items: Array.isArray(j.items) ? j.items : [], maxPages: typeof j.maxPages === 'number' ? j.maxPages : 1 };
}

async function all(fetchFn: typeof fetch, year: number, mode: Mode): Promise<unknown[]> {
  const first = await page(fetchFn, year, mode, 1);
  const items = [...first.items];
  for (let p = 2; p <= Math.min(first.maxPages, 20); p++) items.push(...(await page(fetchFn, year, mode, p)).items);
  return items;
}

export async function buildDisplacement(fetchFn: typeof fetch, thisYear: number, generated: string): Promise<DisplacementFile> {
  let year = 0;
  for (const y of [thisYear, thisYear - 1, thisYear - 2]) {
    if ((await page(fetchFn, y, 'coo', 1)).items.length > 0) {
      year = y;
      break;
    }
  }
  if (!year) throw new Error('no UNHCR data for the last three years');
  const from = parseUnhcr({ items: await all(fetchFn, year, 'coo') }, 'coo') as Map<string, FromCountry>;
  const hosted = parseUnhcr({ items: await all(fetchFn, year, 'coa') }, 'coa') as Map<string, HostedHere>;
  const countries: Record<string, CountryDisplacement> = {};
  for (const [k, v] of from) countries[k] = { ...countries[k], from: v };
  for (const [k, v] of hosted) countries[k] = { ...countries[k], hosted: v };
  return { year, generated, source: 'UNHCR Refugee Population Statistics Database', licence: 'CC BY 4.0', termsUrl: TERMS, countries };
}

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  const f = await buildDisplacement(fetch, new Date().getUTCFullYear(), today);
  const n = Object.keys(f.countries).length;
  if (n < 100) throw new Error(`only ${n} countries: refusing to write a partial file`);
  writeFileSync('public/data/displacement.json', JSON.stringify(f));
  console.log(`UNHCR ${f.year}: ${n} countries written`);
}

if (process.argv[1]?.endsWith('build-displacement.ts')) main().catch((e) => (console.error(e), process.exit(1)));
