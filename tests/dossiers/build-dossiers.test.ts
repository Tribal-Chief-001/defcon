import { describe, expect, it } from 'vitest';
import { buildAll, buildDossier, type BuildCtx } from '../../scripts/dossiers/build-dossiers';
import type { FactbookFacts } from '../../scripts/dossiers/factbook';
import type { Memberships } from '../../scripts/dossiers/memberships';
import type { WbValue } from '../../scripts/dossiers/worldbank';
import type { CountryRow, Dossier } from '../../src/dossier/types';

const row = (o: Partial<CountryRow> & { id: string }): CountryRow => ({
  name: o.id, formalName: null, iso2: null, iso3: null, type: 'Sovereign country', continent: 'Asia', subregion: null, lat: 1, lon: 2, hasPolygon: true,
  bbox: [0, 0, 1, 1], neighbours: [], ...o,
});
const wbMap = (entries: Record<string, WbValue>) => new Map(Object.entries(entries));
const mem: Memberships = {
  un: { members: ['IND', 'SDS', 'BDI'], observers: ['VAT'], source: 'https://www.un.org/en/about-us/member-states', observerSource: 'https://www.un.org/en/about-us/non-member-states', asOf: '2026-10-18' },
  nato: { members: ['FIN'], source: 'https://www.nato.int/cps/en/natohq/nato_countries.htm', asOf: '2026-10-18' },
};
const fbIN: FactbookFacts = { governmentType: 'federal parliamentary republic', languages: 'Hindi 43.6%', independence: '15 August 1947', organisations: 'UN, WTO', capitalName: 'New Delhi' };
const ctx = (o: Partial<BuildCtx> = {}): BuildCtx => ({
  caps: [
    { name: 'New Delhi', country: 'IND', lat: 28.6, lon: 77.2, rank: 1 },
    { name: 'Bujumbura', country: 'BDI', lat: -3.38, lon: 29.36, rank: 1 },
    { name: 'Juba', country: 'SDS', lat: 4.85, lon: 31.58, rank: 1 },
  ],
  wb: {
    population: wbMap({ IND: { value: 1463865525, year: 2025 }, SSD: { value: 12188788, year: 2025 }, ZZZ: { value: 0, year: 2024 } }),
    areaKm2: wbMap({ IND: { value: 3287263, year: 2024 } }),
    gdpUsd: wbMap({}),
    milExpUsd: wbMap({ IND: { value: 92057013588, year: 2025 } }),
    milExpGdpPct: wbMap({ IND: { value: 2.29, year: 2025 } }),
  },
  wbMeta: { lastupdated: '2026-10-08' },
  factbookByCountry: { IND: fbIN, BDI: { capitalName: 'Gitega (political capital), Bujumbura (commercial capital)', governmentType: 'presidential republic' } },
  fbMeta: { dataDate: '2026-01-22', url: 'https://github.com/factbook/factbook.json' },
  mem,
  ...o,
});

// every number anywhere in the object must be finite (JSON.stringify would silently turn NaN into null)
const numbers = (x: unknown, out: number[] = []): number[] => {
  if (typeof x === 'number') out.push(x);
  else if (Array.isArray(x)) x.forEach((v) => numbers(v, out));
  else if (x && typeof x === 'object') Object.values(x).forEach((v) => numbers(v, out));
  return out;
};

describe('buildDossier', () => {
  const india = buildDossier(row({ id: 'IND', name: 'India', iso2: 'IN', iso3: 'IND', neighbours: ['AFG', 'CHN'] }), ctx());
  it('fills every field with the right provenance when all sources have data', () => {
    expect(india.population).toMatchObject({ value: 1463865525, source: 'World Bank WDI', asOf: '2025' });
    expect(india.areaKm2).toMatchObject({ value: 3287263, asOf: '2024' });
    expect(india.milExpUsd).toMatchObject({ value: 92057013588, source: 'SIPRI via World Bank WDI', asOf: '2025' });
    expect(india.governmentType).toMatchObject({ value: 'federal parliamentary republic', source: 'CIA World Factbook (archived)', asOf: '2026-01-22' });
    expect(india.governmentType!.note).toMatch(/2026-02-04/);
    expect(india.un).toMatchObject({ value: 'member', asOf: '2026-10-18' });
    expect(india.nato).toMatchObject({ value: false });
    expect(india.neighbours).toEqual(['AFG', 'CHN']);
    expect(india.capitals).toEqual([{ name: 'New Delhi', lat: 28.6, lon: 77.2 }]);
  });
  it('shows unavailable (null) for a field a source does not have, never 0 or a neighbour value', () => {
    expect(india.gdpUsd).toBeNull(); // no World Bank row
  });
  // Review Focus 1: a country with no data anywhere
  it('a territory with no World Bank row, no Factbook file and no list entry has null sourced fields but keeps identity', () => {
    const d = buildDossier(row({ id: 'XYZ', name: 'Nowhere', neighbours: ['ABC'] }), ctx());
    for (const k of ['population', 'areaKm2', 'gdpUsd', 'milExpUsd', 'milExpGdpPct', 'governmentType', 'languages', 'independence', 'organisations'] as const) expect(d[k]).toBeNull();
    expect(d).toMatchObject({ name: 'Nowhere', neighbours: ['ABC'], capitals: [] });
    expect(d.un).toMatchObject({ value: 'non-member' }); // the official lists are complete, so absence is a true statement
    expect(d.nato).toMatchObject({ value: false });
    expect(numbers(d).every(Number.isFinite)).toBe(true);
    expect(JSON.stringify(d)).not.toMatch(/undefined|NaN/);
  });
  it('keeps a real zero as a value (not unavailable)', () => {
    expect(buildDossier(row({ id: 'ZZ', iso3: 'ZZZ' }), ctx()).population).toMatchObject({ value: 0, asOf: '2024' });
  });
  // Review Focus 3: South Sudan is SDS in our ids and SSD in the World Bank
  it('looks World Bank values up by ISO3, not by our id', () => {
    expect(buildDossier(row({ id: 'SDS', iso3: 'SSD' }), ctx()).population).toMatchObject({ value: 12188788 });
  });
  it('rejects a non-finite value from a source as unavailable', () => {
    const c = ctx();
    c.wb.population = wbMap({ IND: { value: NaN, year: 2025 } });
    expect(buildDossier(row({ id: 'IND', iso3: 'IND' }), c).population).toBeNull();
  });
  // Review Focus 2: Burundi's capital
  it('lists the primary capital first and marks Natural Earth alternates', () => {
    const caps = [
      { name: 'Lagos', country: 'NGA', lat: 6.4, lon: 3.4, rank: 1, alt: true as const },
      { name: 'Abuja', country: 'NGA', lat: 9.1, lon: 7.5, rank: 3 },
    ];
    const d = buildDossier(row({ id: 'NGA', name: 'Nigeria' }), ctx({ caps }));
    expect(d.capitals.map((c) => c.name)).toEqual(['Abuja', 'Lagos']);
    expect(d.capitals[0]!.alt).toBeUndefined();
    expect(d.capitals[1]!.alt).toBe(true);
  });
  it('puts the capital the Factbook names first even when Natural Earth marks it alternate (Tanzania)', () => {
    const caps = [
      { name: 'Dar es Salaam', country: 'TZA', lat: -6.8, lon: 39.3, rank: 1 },
      { name: 'Dodoma', country: 'TZA', lat: -6.2, lon: 35.7, rank: 3, alt: true as const },
    ];
    const d = buildDossier(row({ id: 'TZA' }), ctx({ caps, factbookByCountry: { TZA: { capitalName: 'Dodoma' } } }));
    expect(d.capitals.map((c) => c.name)).toEqual(['Dodoma', 'Dar es Salaam']);
    expect(d.capitals.every((c) => c.note === undefined)).toBe(true);
  });
  it('keeps Natural Earth capitals and notes a different Factbook capital instead of overwriting', () => {
    const d = buildDossier(row({ id: 'BDI', iso3: 'BDI' }), ctx());
    expect(d.capitals[0]!.name).toBe('Bujumbura');
    expect(d.capitals[0]!.note).toMatch(/Gitega/);
  });
  it('gives no capital note when the Factbook agrees', () => {
    expect(india.capitals[0]!.note).toBeUndefined();
  });
  it('only uses the membership lists for UN and NATO', () => {
    expect(buildDossier(row({ id: 'FIN' }), ctx()).nato).toMatchObject({ value: true });
    expect(buildDossier(row({ id: 'VAT' }), ctx()).un).toMatchObject({ value: 'observer' });
  });
});

describe('buildAll', () => {
  const rows = [row({ id: 'IND', name: 'India', iso2: 'IN', iso3: 'IND' }), row({ id: 'VAT', name: 'Vatican', hasPolygon: false })];
  const { dossiers, index } = buildAll(rows, ctx());
  it('makes one dossier and one index entry per country', () => {
    expect(dossiers.map((d: Dossier) => d.id)).toEqual(['IND', 'VAT']);
    expect(index).toHaveLength(2);
  });
  it('index entries carry what search needs', () => {
    expect(index[0]).toEqual({ id: 'IND', name: 'India', iso2: 'IN', iso3: 'IND', capitals: ['New Delhi'], continent: 'Asia', lat: 1, lon: 2, hasPolygon: true });
    expect(index[1]!.hasPolygon).toBe(false);
  });
});
