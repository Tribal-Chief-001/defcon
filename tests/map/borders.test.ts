import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { geoArea } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';

const HIGH = 'public/data/borders.high.topo.json';
const LOW = 'public/data/borders.low.topo.json';
const gz = (p: string) => gzipSync(readFileSync(p)).length;
const load = (p: string) => JSON.parse(readFileSync(p, 'utf8')) as Topology;
const ids = (t: Topology) =>
  (t.objects.countries as GeometryCollection).geometries.map((g) => (g.properties as { id: string }).id);

describe('built border data', () => {
  // low detail drops islets that vanish when simplified (about 19 micro-states/territories); the picker uses high detail
  it.each([[HIGH, 240], [LOW, 220]] as const)('%s parses and has >= %i countries', (p, min) => {
    expect(ids(load(p)).length).toBeGreaterThanOrEqual(min);
  });
  it.each([HIGH, LOW])('%s has the expected ids, all unique', (p) => {
    const list = ids(load(p));
    for (const id of ['IND', 'PAK', 'CHN', 'ATA', 'FJI']) expect(list).toContain(id);
    expect(new Set(list).size).toBe(list.length);
  });
  it.each([HIGH, LOW])('%s has no country wound as its own complement (area <= hemisphere)', (p) => {
    const topo = load(p);
    const fc = feature(topo, topo.objects.countries as never) as unknown as { features: { properties: { id: string } }[] };
    const bad = fc.features.filter((f) => geoArea(f as never) > 2 * Math.PI).map((f) => f.properties.id);
    expect(bad).toEqual([]);
  });
  it.each([HIGH, LOW])('%s has clean names (no NUL padding or stray whitespace)', (p) => {
    const names = (load(p).objects.countries as GeometryCollection).geometries.map((g) => (g.properties as { name: string }).name);
    expect(names.filter((n) => !n || n !== n.replace(/\0/g, '').trim())).toEqual([]);
  });
  it('countries.json lists all 248 India-POV countries; only micro-islets lack a high-detail polygon', () => {
    const list = JSON.parse(readFileSync('public/data/countries.json', 'utf8')) as { id: string; name: string }[];
    expect(list).toHaveLength(248);
    const have = new Set(ids(load(HIGH)));
    expect(list.filter((c) => !have.has(c.id)).map((c) => c.id).sort()).toEqual(['CSI', 'SCR', 'VAT']);
  });
  it('low-detail file is at most 300 KB gzipped (transfer size)', () => {
    expect(gz(LOW)).toBeLessThanOrEqual(300_000);
  });
  it('high-detail file is at most 1 MB gzipped (transfer size)', () => {
    expect(gz(HIGH)).toBeLessThanOrEqual(1_000_000);
  });

  describe('countries.json rows (CountryRow)', () => {
    type Row = { id: string; name: string; formalName: string | null; iso2: string | null; iso3: string | null; type: string; continent: string | null; subregion: string | null; lat: number; lon: number; hasPolygon: boolean; bbox: [number, number, number, number] | null; neighbours: string[] };
    const rows = JSON.parse(readFileSync('public/data/countries.json', 'utf8')) as Row[];
    const row = (id: string) => rows.find((r) => r.id === id)!;
    it('keeps 248 rows sorted by id with every field', () => {
      expect(rows).toHaveLength(248);
      expect(rows.map((r) => r.id)).toEqual([...rows.map((r) => r.id)].sort((a, b) => a.localeCompare(b)));
      for (const r of rows) for (const k of ['id', 'name', 'formalName', 'iso2', 'iso3', 'type', 'continent', 'subregion', 'lat', 'lon', 'hasPolygon', 'bbox', 'neighbours']) expect(k in r).toBe(true);
    });
    it('maps ISO codes (South Sudan is SDS here and SSD in ISO), -99 becomes null', () => {
      expect(row('IND')).toMatchObject({ iso2: 'IN', iso3: 'IND', name: 'India' });
      expect(row('SDS').iso3).toBe('SSD');
      for (const id of ['ESB', 'USG', 'WSB', 'BRT', 'PGA', 'SCR']) expect(row(id).iso3).toBeNull();
    });
    it('has finite label coordinates for every row', () => {
      for (const r of rows) expect(Number.isFinite(r.lat) && Number.isFinite(r.lon)).toBe(true);
    });
    it('hasPolygon is false exactly for VAT, CSI and SCR', () => {
      expect(rows.filter((r) => !r.hasPolygon).map((r) => r.id).sort()).toEqual(['CSI', 'SCR', 'VAT']);
      expect(row('VAT').bbox).toBeNull();
    });
    it('bounding boxes cross the antimeridian as w > e for Fiji, Russia and the USA', () => {
      for (const id of ['FJI', 'RUS', 'USA']) {
        const b = row(id).bbox!;
        expect(b[0]).toBeGreaterThan(b[2]);
      }
      const ind = row('IND').bbox!;
      expect(ind[0]).toBeLessThan(ind[2]);
    });
    it('carries neighbours from the borders', () => {
      expect(row('IND').neighbours).toContain('AFG');
      expect(row('JPN').neighbours).toEqual([]);
    });
  });
});
