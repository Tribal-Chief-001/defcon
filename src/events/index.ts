import type { Snapshot } from './snapshot';

const KM_PER_DEG = 111.195;
const D2R = Math.PI / 180;

const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const dLat = (lat2 - lat1) * D2R;
  const dLon = (lon2 - lon1) * D2R;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * D2R) * Math.cos(lat2 * D2R) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371.0088 * Math.asin(Math.min(1, Math.sqrt(a)));
};
const wrapCell = (c: number) => ((((c + 180) % 360) + 360) % 360) - 180; // cell index of longitude, wrapped at the antimeridian

// A 1-degree grid over the snapshot: nearest(lat, lon, maxKm) -> snapshot index of the closest event, or -1.
export function createEventIndex(s: Snapshot): { nearest(lat: number, lon: number, maxKm: number): number } {
  const cells = new Map<string, number[]>();
  for (let i = 0; i < s.n; i++) {
    const lat = s.lat[i]!;
    const lon = s.lon[i]!;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const k = `${Math.floor(lat)},${wrapCell(Math.floor(lon))}`;
    (cells.get(k) ?? cells.set(k, []).get(k)!).push(i);
  }
  return {
    nearest(lat, lon, maxKm) {
      if (!Number.isFinite(lat) || !Number.isFinite(lon) || s.n === 0) return -1;
      const dLat = maxKm / KM_PER_DEG;
      const dLon = Math.min(180, maxKm / (KM_PER_DEG * Math.max(1e-6, Math.cos(lat * D2R))));
      let best = -1;
      let bestD = maxKm;
      for (let cy = Math.floor(lat - dLat); cy <= Math.floor(lat + dLat); cy++)
        for (let cx = Math.floor(lon - dLon); cx <= Math.floor(lon + dLon); cx++)
          for (const i of cells.get(`${cy},${wrapCell(cx)}`) ?? []) {
            const d = haversineKm(lat, lon, s.lat[i]!, s.lon[i]!);
            if (d <= bestD) {
              bestD = d;
              best = i;
            }
          }
      return best;
    },
  };
}
