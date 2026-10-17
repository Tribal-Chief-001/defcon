import difference from '@turf/difference';
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
  return { ...fc, features };
}
