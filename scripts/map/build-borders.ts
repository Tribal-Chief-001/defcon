import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { readUtf8 } from './read-utf8.ts';
import { topology } from 'topojson-server';
import { filter, presimplify, simplify } from 'topojson-simplify';
import { feature, quantize } from 'topojson-client';
import { geoArea, geoBounds } from 'd3-geo';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import type { Objects, Topology } from 'topojson-specification';
import { applyPatches, type Patch } from './patches.ts';
import type { CountryRow } from '../../src/dossier/types.ts';
import { neighboursOf } from './neighbours.ts';
import { rewindFeature } from './rewind.ts';

// Tuned by measurement (docs/DATA-SOURCES.md): gzip size high <= 1 MB, low <= 300 KB.
export const HIGH_QUANTIZATION = 5e4;
export const LOW_MIN_WEIGHT = 2e-3;
export const LOW_QUANTIZATION = 1e4;

const PATCH_DIR = 'data/map/patches';
// Natural Earth dbf text fields are NUL-padded.
export const clean = (v: unknown): string => String(v ?? '').replace(/\0/g, '').trim();

function loadPatches(): Patch[] {
  return readdirSync(PATCH_DIR)
    .filter((f) => f.endsWith('.json'))
    .flatMap((f) => JSON.parse(readFileSync(join(PATCH_DIR, f), 'utf8')) as Patch | Patch[]);
}

export async function buildBorders(
  shpPath: string,
  dbfPath: string,
  outDir: string,
): Promise<{ countries: number; highBytes: number; lowBytes: number }> {
  const raw = await readUtf8(shpPath, dbfPath);
  const patched = applyPatches(raw, loadPatches());
  const slim: FeatureCollection = {
    type: 'FeatureCollection',
    features: patched.features.map((f) =>
      rewindFeature<Feature<Geometry>>({
        type: 'Feature',
        properties: { id: clean(f.properties?.ADM0_A3), name: clean(f.properties?.NAME) },
        geometry: f.geometry,
      }),
    ),
  };

  mkdirSync(outDir, { recursive: true });

  const base = topology({ countries: slim }) as unknown as Topology<Objects<{}>>;
  // Quantizing can collapse or flip tiny islands. d3-geo reads a wrongly wound ring as "the whole sphere
  // except this ring", so drop rings whose winding no longer matches (exterior: area <= a hemisphere,
  // hole: area > a hemisphere).
  const dropBadRings = <T extends Topology<Objects<{}>>>(t: T): T => {
    const keep = (ring: number[], interior: boolean) => {
      const coords = (feature(t, { type: 'Polygon', arcs: [ring] } as never) as unknown as { geometry: { coordinates: number[][][] } }).geometry.coordinates;
      const a = geoArea({ type: 'Polygon', coordinates: coords } as never);
      return a > 0 && (interior ? a > 2 * Math.PI : a <= 2 * Math.PI);
    };
    return filter(t, keep as never) as unknown as T;
  };
  const high = dropBadRings(quantize(base, HIGH_QUANTIZATION));
  const low = dropBadRings(quantize(simplify(presimplify(base), LOW_MIN_WEIGHT), LOW_QUANTIZATION));

  // countries.json: one CountryRow per country (identity from the India-POV file, neighbours and bounding boxes from our borders)
  const props = new Map(patched.features.map((f) => [clean(f.properties?.ADM0_A3), f.properties ?? {}]));
  const nb = neighboursOf(high as unknown as Topology);
  const iso = (v: unknown) => {
    const s = clean(v);
    return s === '' || s === '-99' ? null : s;
  };
  const r4 = (x: number) => Math.round(x * 1e4) / 1e4;
  // topojson drops countries whose polygon vanished at this quantization, so look geometries up by id
  const highFc = feature(high, high.objects.countries as never) as unknown as { features: { properties: { id: string }; geometry: unknown }[] };
  const highById = new Map(highFc.features.map((f) => [f.properties.id, f]));
  const rows: CountryRow[] = [...props.keys()]
    .map((id): CountryRow => {
      const p = props.get(id) ?? {};
      const f = highById.get(id);
      const b = f?.geometry ? geoBounds(f as never) : null;
      const bbox = b && b.flat().every(Number.isFinite) ? ([r4(b[0]![0]!), r4(b[0]![1]!), r4(b[1]![0]!), r4(b[1]![1]!)] as CountryRow['bbox']) : null;
      const lat = Number(clean(p.LABEL_Y));
      const lon = Number(clean(p.LABEL_X));
      return {
        id,
        name: clean(p.NAME),
        formalName: clean(p.FORMAL_EN) || null,
        iso2: iso(p.ISO_A2_EH),
        iso3: iso(p.ISO_A3_EH),
        type: clean(p.TYPE),
        continent: clean(p.CONTINENT) || null,
        subregion: clean(p.SUBREGION) || null,
        lat: Number.isFinite(lat) ? r4(lat) : bbox ? r4((bbox[1] + bbox[3]) / 2) : 0,
        lon: Number.isFinite(lon) ? r4(lon) : bbox ? r4(bbox[0] > bbox[2] ? (bbox[0] + bbox[2] + 360) / 2 : (bbox[0] + bbox[2]) / 2) : 0,
        hasPolygon: !!f?.geometry,
        bbox,
        neighbours: nb[id] ?? [],
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));
  writeFileSync(join(outDir, 'countries.json'), JSON.stringify(rows));

  const highPath = join(outDir, 'borders.high.topo.json');
  const lowPath = join(outDir, 'borders.low.topo.json');
  writeFileSync(highPath, JSON.stringify(high));
  writeFileSync(lowPath, JSON.stringify(low));
  return { countries: slim.features.length, highBytes: statSync(highPath).size, lowBytes: statSync(lowPath).size };
}
