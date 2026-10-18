import { neighbors } from 'topojson-client';
import type { GeometryCollection, Topology } from 'topojson-specification';

// Countries that share a border arc, by `properties.id`; symmetric and sorted. Geometries that were dropped
// (type null, e.g. too small to keep) get an empty list.
export function neighboursOf(topo: Topology): Record<string, string[]> {
  const geoms = (topo.objects.countries as GeometryCollection).geometries;
  const ids = geoms.map((g) => (g.properties as { id: string }).id);
  const kept = geoms.map((g, i) => (g.type ? i : -1)).filter((i) => i >= 0);
  const nb = neighbors(kept.map((i) => geoms[i]!) as never);
  const out: Record<string, string[]> = Object.fromEntries(ids.map((id) => [id, [] as string[]]));
  kept.forEach((gi, k) => {
    out[ids[gi]!] = nb[k]!.map((j) => ids[kept[j]!]!).sort();
  });
  return out;
}
