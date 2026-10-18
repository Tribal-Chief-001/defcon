// Builds one static JSON file per country (public/data/dossiers/<ADM0_A3>.json) and a search index.
// Usage: npm run data:dossiers   (after npm run data:wb and npm run data:factbook; output is committed)
import { readFileSync, readdirSync, rmSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import type { CountryIndexEntry, CountryRow, Dossier, Field } from '../../src/dossier/types';
import { swapDir } from '../events/build-snapshot';
import { matchFactbook, parseFactbook, type FactbookFacts } from './factbook';
import { loadMemberships, membershipOf, type Memberships } from './memberships';
import { WB_INDICATORS, parseWb, type WbValue } from './worldbank';

export type BuildCtx = {
  caps: { name: string; country: string; lat: number; lon: number; rank: number; alt?: true }[];
  wb: Record<keyof typeof WB_INDICATORS, Map<string, WbValue>>;
  wbMeta: { lastupdated: string };
  factbookByCountry: Record<string, FactbookFacts | undefined>;
  fbMeta: { dataDate: string; url: string };
  mem: Memberships;
};

const FB_NOTE = 'The CIA discontinued the World Factbook on 2026-02-04; this is its last data and will not be updated.';
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// null (unavailable) unless the source has a finite number for this country
function wbField(m: Map<string, WbValue>, iso3: string | null, source: string, code: string): Field<number> {
  const v = iso3 ? m.get(iso3) : undefined;
  if (!v || !Number.isFinite(v.value)) return null;
  return { value: v.value, source, asOf: String(v.year), url: `https://data.worldbank.org/indicator/${code}` };
}

export function buildDossier(row: CountryRow, ctx: BuildCtx): Dossier {
  const fb = ctx.factbookByCountry[row.id];
  const fbField = (v: string | undefined): Field<string> =>
    v ? { value: v, source: 'CIA World Factbook (archived)', asOf: ctx.fbMeta.dataDate, url: ctx.fbMeta.url, note: FB_NOTE } : null;
  const { un, nato } = membershipOf(ctx.mem, row.id);
  const own = ctx.caps.filter((c) => c.country === row.id);
  const fbIs = (name: string) => !!fb?.capitalName && norm(fb.capitalName.replace(/\([^)]*\)/g, '')) === norm(name);
  const fbAgrees = !fb?.capitalName || own.some((c) => norm(fb.capitalName!.replace(/\([^)]*\)/g, '')) === norm(c.name));
  const capitals = own
    // the capital the Factbook names first, then Natural Earth's primary capitals, then its alternates
    .sort((a, b) => Number(!fbIs(a.name)) - Number(!fbIs(b.name)) || Number(!!a.alt) - Number(!!b.alt) || a.rank - b.rank || a.name.localeCompare(b.name))
    .map((c) => {
      const base = { name: c.name, lat: c.lat, lon: c.lon, ...(c.alt ? { alt: true as const } : {}) };
      // keep Natural Earth's capital; note (never silently replace) a different capital in the Factbook, e.g. Burundi's Gitega
      return !fbAgrees && !c.alt ? { ...base, note: `CIA World Factbook lists: ${fb!.capitalName}` } : base;
    });
  return {
    id: row.id,
    iso2: row.iso2,
    iso3: row.iso3,
    name: row.name,
    formalName: row.formalName,
    type: row.type,
    continent: row.continent,
    subregion: row.subregion,
    capitals,
    neighbours: row.neighbours,
    population: wbField(ctx.wb.population, row.iso3, 'World Bank WDI', WB_INDICATORS.population),
    areaKm2: wbField(ctx.wb.areaKm2, row.iso3, 'World Bank WDI', WB_INDICATORS.areaKm2),
    gdpUsd: wbField(ctx.wb.gdpUsd, row.iso3, 'World Bank WDI', WB_INDICATORS.gdpUsd),
    milExpUsd: wbField(ctx.wb.milExpUsd, row.iso3, 'SIPRI via World Bank WDI', WB_INDICATORS.milExpUsd),
    milExpGdpPct: wbField(ctx.wb.milExpGdpPct, row.iso3, 'SIPRI via World Bank WDI', WB_INDICATORS.milExpGdpPct),
    governmentType: fbField(fb?.governmentType),
    languages: fbField(fb?.languages),
    independence: fbField(fb?.independence),
    organisations: fbField(fb?.organisations),
    un: { value: un, source: 'United Nations member states list', asOf: ctx.mem.un.asOf, url: un === 'observer' ? ctx.mem.un.observerSource : ctx.mem.un.source },
    nato: { value: nato, source: 'NATO member countries page', asOf: ctx.mem.nato.asOf, url: ctx.mem.nato.source },
  };
}

export function buildAll(rows: CountryRow[], ctx: BuildCtx): { dossiers: Dossier[]; index: CountryIndexEntry[] } {
  const dossiers = rows.map((r) => buildDossier(r, ctx));
  const index = dossiers.map((d, i): CountryIndexEntry => ({
    id: d.id,
    name: d.name,
    iso2: d.iso2,
    iso3: d.iso3,
    capitals: d.capitals.map((c) => c.name),
    continent: d.continent,
    lat: rows[i]!.lat,
    lon: rows[i]!.lon,
    hasPolygon: rows[i]!.hasPolygon,
  }));
  return { dossiers, index };
}

const OUT = 'public/data/dossiers';

function main() {
  const rows = JSON.parse(readFileSync('public/data/countries.json', 'utf8')) as CountryRow[];
  const caps = JSON.parse(readFileSync('public/data/capitals.json', 'utf8')) as BuildCtx['caps'];
  const wb = Object.fromEntries(
    Object.entries(WB_INDICATORS).map(([k, code]) => [k, parseWb(JSON.parse(readFileSync(`data/raw/wb/${code}.json`, 'utf8')))]),
  ) as BuildCtx['wb'];
  const wbMeta = JSON.parse(readFileSync('data/raw/wb/meta.json', 'utf8')) as { lastupdated: string };
  const fbMetaRaw = JSON.parse(readFileSync('data/raw/factbook/meta.json', 'utf8')) as { dataDate: string; url: string };
  const facts: Record<string, FactbookFacts> = {};
  for (const f of readdirSync('data/raw/factbook').filter((x) => x.endsWith('.json') && x !== 'meta.json')) facts[f] = parseFactbook(JSON.parse(readFileSync(join('data/raw/factbook', f), 'utf8')));
  const byCountry = matchFactbook(facts, caps).byCountry;
  const factbookByCountry = Object.fromEntries(Object.entries(byCountry).map(([id, file]) => [id, facts[file]]));
  const ctx: BuildCtx = { caps, wb, wbMeta, factbookByCountry, fbMeta: { dataDate: fbMetaRaw.dataDate, url: fbMetaRaw.url }, mem: loadMemberships() };

  const { dossiers, index } = buildAll(rows, ctx);
  rmSync(`${OUT}.tmp`, { recursive: true, force: true });
  mkdirSync(`${OUT}.tmp`, { recursive: true });
  for (const d of dossiers) writeFileSync(join(`${OUT}.tmp`, `${d.id}.json`), JSON.stringify(d));
  writeFileSync(join(`${OUT}.tmp`, 'index.json'), JSON.stringify(index));
  swapDir(`${OUT}.tmp`, OUT);

  const have = (k: keyof Dossier) => dossiers.filter((d) => d[k] !== null).length;
  const sizes = dossiers.map((d) => statSync(join(OUT, `${d.id}.json`)).size);
  console.log(`wrote ${dossiers.length} dossiers + index (${gzipSync(readFileSync(join(OUT, 'index.json'))).length} bytes gzip); total ${sizes.reduce((a, b) => a + b, 0)} bytes, largest ${Math.max(...sizes)} bytes`);
  for (const k of ['population', 'areaKm2', 'gdpUsd', 'milExpUsd', 'milExpGdpPct', 'governmentType', 'languages', 'independence', 'organisations'] as const) console.log(`  ${k.padEnd(14)} ${have(k)} / ${dossiers.length}`);
  console.log('  with a capital', dossiers.filter((d) => d.capitals.length).length, ' with neighbours', dossiers.filter((d) => d.neighbours.length).length);
}

if (process.argv[1]?.endsWith('build-dossiers.ts')) main();
