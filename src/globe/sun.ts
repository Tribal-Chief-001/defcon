import { vec3ToLatLon } from '../lib/geo';

const D2R = Math.PI / 180;
const mod = (a: number, m: number) => ((a % m) + m) % m;

// Where the sun is overhead at `unixS`: low-precision solar position (declination and right ascension from the mean longitude
// and anomaly), accurate to about a degree, which is plenty for a thin terminator line. Non-finite input gives {0, 0}.
export function subsolarPoint(unixS: number): { lat: number; lon: number } {
  if (!Number.isFinite(unixS)) return { lat: 0, lon: 0 };
  const n = unixS / 86400 + 2440587.5 - 2451545.0; // days since J2000
  const L = mod(280.46 + 0.9856474 * n, 360);
  const g = mod(357.528 + 0.9856003 * n, 360) * D2R;
  const lambda = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * D2R;
  const eps = (23.439 - 0.0000004 * n) * D2R;
  const dec = Math.asin(Math.sin(eps) * Math.sin(lambda));
  const ra = Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda)) / D2R;
  const gmst = mod(280.46061837 + 360.98564736629 * n, 360);
  return { lat: dec / D2R, lon: mod(ra - gmst + 180, 360) - 180 };
}

// The great circle 90 degrees from the sun, as [lat, lon] pairs.
export function terminatorPoints(sun: { lat: number; lon: number }, n = 180): [number, number][] {
  const la = sun.lat * D2R;
  const lo = sun.lon * D2R;
  const s: [number, number, number] = [Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo)]; // same axes as latLonToVec3
  const ref: [number, number, number] = Math.abs(s[1]) > 0.99 ? [1, 0, 0] : [0, 1, 0];
  const cross = (a: number[], b: number[]): [number, number, number] => [a[1]! * b[2]! - a[2]! * b[1]!, a[2]! * b[0]! - a[0]! * b[2]!, a[0]! * b[1]! - a[1]! * b[0]!];
  const norm = (a: [number, number, number]): [number, number, number] => {
    const l = Math.hypot(...a) || 1;
    return [a[0] / l, a[1] / l, a[2] / l];
  };
  const u = norm(cross(s, ref));
  const v = cross(s, u);
  return Array.from({ length: n }, (_, i) => {
    const t = (i / n) * 2 * Math.PI;
    const c = Math.cos(t);
    const sn = Math.sin(t);
    const p = vec3ToLatLon(u[0] * c + v[0] * sn, u[1] * c + v[1] * sn, u[2] * c + v[2] * sn);
    return [p.lat, p.lon] as [number, number];
  });
}
