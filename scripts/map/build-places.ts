import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { read } from 'shapefile';

export type Capital = { name: string; country: string; lat: number; lon: number; rank: number };

// Natural Earth featurecla values for national capitals (checked in the dbf 2026-10-18: 202 + 13 alt).
const CAPITAL_CLASSES = new Set(['Admin-0 capital', 'Admin-0 capital alt']);
// Natural Earth uses SSD for South Sudan in the places file and SDS in the countries file.
const ID_ALIAS: Record<string, string> = { SSD: 'SDS' };
const clean = (v: unknown) => String(v ?? '').replace(/\0/g, '').trim();
const r4 = (x: number) => Math.round(x * 1e4) / 1e4;

// Capitals of countries that the India-POV countries file does not list (Kosovo, Somaliland, Western Sahara)
// are dropped, so the capitals follow the same worldview as the borders.
export async function buildCapitals(
  shpPath: string,
  dbfPath: string,
  outPath: string,
  countryIds: Set<string>,
): Promise<Capital[]> {
  const fc = await read(shpPath, dbfPath);
  const caps: Capital[] = [];
  for (const f of fc.features) {
    const p = f.properties ?? {};
    if (!CAPITAL_CLASSES.has(String(p.featurecla)) || f.geometry?.type !== 'Point') continue;
    const [lon, lat] = f.geometry.coordinates as [number, number];
    const raw = clean(p.adm0_a3);
    const country = ID_ALIAS[raw] ?? raw;
    if (!countryIds.has(country)) {
      console.log(`capital dropped (country not in India-POV file): ${clean(p.name)} [${raw}]`);
      continue;
    }
    caps.push({ name: clean(p.name), country, lat: r4(lat), lon: r4(lon), rank: Number(p.scalerank) });
  }
  caps.sort((a, b) => a.country.localeCompare(b.country) || a.name.localeCompare(b.name));
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(caps));
  return caps;
}
