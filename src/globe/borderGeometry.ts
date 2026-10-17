import { mesh } from 'topojson-client';
import type { GeometryObject, Topology } from 'topojson-specification';
import { latLonToVec3 } from '../lib/geo';

type V3 = [number, number, number];

// Number of pieces a segment must be cut into so none is longer than maxSegDeg.
const pieces = (a: V3, b: V3, maxSegDeg: number): number => {
  const dot = Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  return Math.max(1, Math.ceil(((Math.acos(dot) * 180) / Math.PI) / maxSegDeg));
};

// Spherical interpolation, so segments follow the great circle (also across the antimeridian).
const slerp = (a: V3, b: V3, t: number): V3 => {
  const dot = Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const om = Math.acos(dot);
  const s = Math.sin(om);
  if (s < 1e-9) return a;
  const k0 = Math.sin((1 - t) * om) / s;
  const k1 = Math.sin(t * om) / s;
  return [k0 * a[0] + k1 * b[0], k0 * a[1] + k1 * b[1], k0 * a[2] + k1 * b[2]];
};

// Vertex pairs for THREE.LineSegments: every border once (shared borders are not doubled).
export function buildBorderPositions(topo: Topology, radius: number, maxSegDeg = 1): Float32Array {
  const lines = mesh(topo, topo.objects.countries as GeometryObject).coordinates;
  const unit = lines.map((line) => line.map(([lon, lat]) => latLonToVec3(lat!, lon!, 1)));

  let segs = 0;
  for (const line of unit) for (let i = 0; i + 1 < line.length; i++) segs += pieces(line[i]!, line[i + 1]!, maxSegDeg);

  const out = new Float32Array(segs * 6);
  let o = 0;
  const put = (v: V3) => {
    out[o++] = v[0] * radius;
    out[o++] = v[1] * radius;
    out[o++] = v[2] * radius;
  };
  for (const line of unit) {
    for (let i = 0; i + 1 < line.length; i++) {
      const a = line[i]!;
      const b = line[i + 1]!;
      const n = pieces(a, b, maxSegDeg);
      for (let k = 0; k < n; k++) {
        put(k === 0 ? a : slerp(a, b, k / n));
        put(k === n - 1 ? b : slerp(a, b, (k + 1) / n));
      }
    }
  }
  return out;
}
