import { feature } from 'topojson-client';
import type { Topology } from 'topojson-specification';

// Natural Earth polygons are already split at the antimeridian, so a planar lon/lat even-odd ray cast is
// exact for them and far faster than d3-geo's spherical test (about 3 ms per query on the large countries).
// Edges are bucketed by latitude band, so a query only walks the edges that cross its latitude.
const BAND_DEG = 2;
const BANDS = 90;

type Part = { id: string; w: number; s: number; e: number; n: number; bands: (Float64Array | undefined)[] };
type Ring = number[][];

function buildPart(id: string, rings: Ring[]): Part {
  let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
  const tmp: number[][] = Array.from({ length: BANDS }, () => []);
  for (const ring of rings) {
    for (let i = 0; i + 1 < ring.length; i++) {
      const [x1, y1] = ring[i]!;
      const [x2, y2] = ring[i + 1]!;
      w = Math.min(w, x1!); e = Math.max(e, x1!); s = Math.min(s, y1!); n = Math.max(n, y1!);
      if (y1 === y2) continue; // horizontal edges never cross a horizontal ray
      const lo = Math.max(0, Math.floor((Math.min(y1!, y2!) + 90) / BAND_DEG));
      const hi = Math.min(BANDS - 1, Math.floor((Math.max(y1!, y2!) + 90) / BAND_DEG));
      for (let b = lo; b <= hi; b++) tmp[b]!.push(x1!, y1!, x2!, y2!);
    }
  }
  return { id, w, s, e, n, bands: tmp.map((a) => (a.length ? Float64Array.from(a) : undefined)) };
}

function inside(p: Part, lat: number, lon: number): boolean {
  const edges = p.bands[Math.min(BANDS - 1, Math.max(0, Math.floor((lat + 90) / BAND_DEG)))];
  if (!edges) return false;
  let odd = false;
  for (let i = 0; i < edges.length; i += 4) {
    const y1 = edges[i + 1]!;
    const y2 = edges[i + 3]!;
    if (y1 > lat === y2 > lat) continue;
    const x1 = edges[i]!;
    if (lon < x1 + ((lat - y1) * (edges[i + 2]! - x1)) / (y2 - y1)) odd = !odd;
  }
  return odd;
}

type Feat = { properties: { id: string }; geometry: { type: string; coordinates: unknown } };

// Returns the ADM0_A3 id of the country containing (lat, lon), or null (open ocean, NaN).
export function createPicker(topo: Topology): (lat: number, lon: number) => string | null {
  const fc = feature(topo, topo.objects.countries as never) as unknown as { features: Feat[] };
  const parts: Part[] = [];
  for (const f of fc.features) {
    const g = f.geometry;
    if (!g) continue;
    const polys = g.type === 'Polygon' ? [g.coordinates as Ring[]] : g.type === 'MultiPolygon' ? (g.coordinates as Ring[][]) : [];
    for (const rings of polys) parts.push(buildPart(f.properties.id, rings));
  }
  // Parts bucketed by latitude band too, so a query only looks at parts that reach its latitude.
  const byBand: Part[][] = Array.from({ length: BANDS }, () => []);
  for (const p of parts) {
    const lo = Math.max(0, Math.floor((p.s + 90) / BAND_DEG));
    const hi = Math.min(BANDS - 1, Math.floor((p.n + 90) / BAND_DEG));
    for (let b = lo; b <= hi; b++) byBand[b]!.push(p);
  }
  return (lat, lon) => {
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    for (const p of byBand[Math.min(BANDS - 1, Math.max(0, Math.floor((lat + 90) / BAND_DEG)))] ?? []) {
      if (lat < p.s || lat > p.n || lon < p.w || lon > p.e) continue;
      if (inside(p, lat, lon)) return p.id;
    }
    return null;
  };
}
