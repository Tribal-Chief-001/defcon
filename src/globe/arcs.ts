import { latLonToVec3 } from '../lib/geo';

type V3 = [number, number, number];
type LatLon = { lat: number; lon: number };

const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a: V3): V3 => {
  const l = Math.hypot(...a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

// A great-circle arc from a to b, lifted off the globe by up to `lift` at its middle (less for short hops, so they stay close to the surface).
export function arcPoints(a: LatLon, b: LatLon, segments = 48, lift = 0.18): V3[] {
  const p = latLonToVec3(a.lat, a.lon);
  const q = latLonToVec3(b.lat, b.lon);
  const theta = Math.acos(Math.max(-1, Math.min(1, dot(p, q))));
  if (!Number.isFinite(theta) || theta < 1e-6) return [p];
  let axis = cross(p, q);
  if (Math.hypot(...axis) < 1e-9) axis = cross(p, Math.abs(p[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]); // antipodal: any plane through both will do
  const k = norm(axis);
  const kxp = cross(k, p);
  const kdp = dot(k, p);
  const out: V3[] = [];
  const n = Math.max(2, Math.floor(segments));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const ang = theta * t;
    const c = Math.cos(ang);
    const s = Math.sin(ang);
    // Rodrigues rotation of p about k by ang
    const r = 1 + lift * Math.sin(Math.PI * t) * Math.min(1, theta / Math.PI);
    out.push([r * (p[0] * c + kxp[0] * s + k[0] * kdp * (1 - c)), r * (p[1] * c + kxp[1] * s + k[1] * kdp * (1 - c)), r * (p[2] * c + kxp[2] * s + k[2] * kdp * (1 - c))]);
  }
  return out;
}

const pairs = (pts: V3[], keep: (i: number) => boolean): Float32Array => {
  const out: number[] = [];
  for (let i = 0; i + 1 < pts.length; i++) if (keep(i)) out.push(...pts[i]!, ...pts[i + 1]!);
  return Float32Array.from(out);
};

// Vertex pairs for THREE.LineSegments.
export const solidSegments = (pts: V3[]): Float32Array => pairs(pts, () => true);
export const dashedSegments = (pts: V3[], dash = 3, gap = 2): Float32Array => pairs(pts, (i) => i % (dash + gap) < dash);
