import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { read } from 'shapefile';
import { topology } from 'topojson-server';
import { presimplify, simplify } from 'topojson-simplify';
import { quantize } from 'topojson-client';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import type { Objects, Topology } from 'topojson-specification';
import { applyPatches, type Patch } from './patches.ts';

// Tuned by measurement (docs/DATA-SOURCES.md): gzip size high <= 1 MB, low <= 300 KB.
export const HIGH_QUANTIZATION = 5e4;
export const LOW_MIN_WEIGHT = 2e-3;
export const LOW_QUANTIZATION = 1e4;

const PATCH_DIR = 'data/map/patches';

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
    features: patched.features.map(
      (f): Feature<Geometry> => ({
        type: 'Feature',
        properties: { id: f.properties?.ADM0_A3, name: f.properties?.NAME },
        geometry: f.geometry,
      }),
    ),
  };

  const base = topology({ countries: slim }) as unknown as Topology<Objects<{}>>;
  const high = quantize(base, HIGH_QUANTIZATION);
  const low = quantize(simplify(presimplify(base), LOW_MIN_WEIGHT), LOW_QUANTIZATION);

  mkdirSync(outDir, { recursive: true });
  const highPath = join(outDir, 'borders.high.topo.json');
  const lowPath = join(outDir, 'borders.low.topo.json');
  writeFileSync(highPath, JSON.stringify(high));
  writeFileSync(lowPath, JSON.stringify(low));
  return { countries: slim.features.length, highBytes: statSync(highPath).size, lowBytes: statSync(lowPath).size };
}
