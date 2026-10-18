import area from '@turf/area';
import difference from '@turf/difference';
import intersect from '@turf/intersect';
import union from '@turf/union';
import { featureCollection } from '@turf/helpers';
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson';

export type Patch = {
  id: string;
  op: 'add-to' | 'cut-from';
  country: string; // ADM0_A3
  geometry: Polygon | MultiPolygon;
  source: string; // reference the geometry was taken from (e.g. Survey of India map edition)
};

type Area = Feature<Polygon | MultiPolygon>;

// Overlaps smaller than this (float noise along shared edges) are tolerated.
const OVERLAP_TOLERANCE_M2 = 1e5;

const bboxOf = (f: Area): [number, number, number, number] => {
  let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
  const walk = (c: unknown): void => {
    if (typeof (c as number[])[0] === 'number') {
      const [x, y] = c as number[];
      w = Math.min(w, x!); e = Math.max(e, x!); s = Math.min(s, y!); n = Math.max(n, y!);
    } else for (const x of c as unknown[]) walk(x);
  };
  walk(f.geometry.coordinates);
  return [w, s, e, n];
};

// An add-to without its matching cut-from leaves two countries overlapping: fail the build.
function assertNoOverlap(features: Feature[], patched: Set<string>): void {
  for (const id of patched) {
    const a = features.find((f) => f.properties?.ADM0_A3 === id) as Area;
    const [aw, as, ae, an] = bboxOf(a);
    for (const other of features as Area[]) {
      const oid = other.properties?.ADM0_A3 as string;
      if (oid === id || (patched.has(oid) && oid < id)) continue; // each pair once
      const [ow, os, oe, on] = bboxOf(other);
      if (ow > ae || oe < aw || os > an || on < as) continue;
      const shared = intersect(featureCollection([a, other]));
      const m2 = shared ? area(shared) : 0;
      if (m2 > OVERLAP_TOLERANCE_M2) throw new Error(`patches leave ${id} and ${oid} overlapping by ${Math.round(m2 / 1e6)} km2 (add-to needs a matching cut-from)`);
    }
  }
}

// A claimed area must be added to one country AND cut from its neighbour, otherwise polygons overlap.
export function applyPatches(fc: FeatureCollection, patches: Patch[]): FeatureCollection {
  const features = [...fc.features];
  for (const p of patches) {
    const i = features.findIndex((f) => f.properties?.ADM0_A3 === p.country);
    if (i < 0) throw new Error(`patch ${p.id}: unknown country ${p.country}`);
    const target = features[i] as Area;
    const area: Area = { type: 'Feature', properties: {}, geometry: p.geometry };
    const result =
      p.op === 'add-to' ? union(featureCollection([target, area])) : difference(featureCollection([target, area]));
    if (!result) throw new Error(`patch ${p.id}: result is empty`);
    features[i] = { ...target, geometry: result.geometry };
  }
  assertNoOverlap(features, new Set(patches.map((p) => p.country)));
  return { ...fc, features };
}
