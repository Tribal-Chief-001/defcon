import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { read } from 'shapefile';
import { topology } from 'topojson-server';
import { filter, presimplify, simplify } from 'topojson-simplify';
import { feature, quantize } from 'topojson-client';
import { geoArea } from 'd3-geo';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import type { Objects, Topology } from 'topojson-specification';
import { applyPatches, type Patch } from './patches.ts';
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
  const raw = await read(shpPath, dbfPath);
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
  writeFileSync(
    join(outDir, 'countries.json'),
    JSON.stringify(slim.features.map((f) => f.properties as { id: string; name: string }).sort((a, b) => a.id.localeCompare(b.id))),
  );

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

  mkdirSync(outDir, { recursive: true });
  const highPath = join(outDir, 'borders.high.topo.json');
  const lowPath = join(outDir, 'borders.low.topo.json');
  writeFileSync(highPath, JSON.stringify(high));
  writeFileSync(lowPath, JSON.stringify(low));
  return { countries: slim.features.length, highBytes: statSync(highPath).size, lowBytes: statSync(lowPath).size };
}
