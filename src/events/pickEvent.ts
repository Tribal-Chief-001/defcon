import { createEventIndex } from './index';
import type { Snapshot } from './snapshot';

const indexes = new WeakMap<Snapshot, ReturnType<typeof createEventIndex>>();
const indexOf = (s: Snapshot) => indexes.get(s) ?? indexes.set(s, createEventIndex(s)).get(s)!;

const km = (s: Snapshot, i: number, lat: number, lon: number) => {
  const dLat = (s.lat[i]! - lat) * 111.195;
  const dLon = (((s.lon[i]! - lon + 540) % 360) - 180) * 111.195 * Math.cos((lat * Math.PI) / 180);
  return Math.hypot(dLat, dLon);
};

// The event closest to (lat, lon) within maxKm across the recent and archive snapshots, or null.
export function pickEvent(
  recent: Snapshot | undefined,
  archive: Snapshot | undefined,
  lat: number,
  lon: number,
  maxKm: number,
): { name: 'recent' | 'archive'; index: number; snapshot: Snapshot } | null {
  let best: { name: 'recent' | 'archive'; index: number; snapshot: Snapshot } | null = null;
  let bestD = Infinity;
  for (const [name, snapshot] of [['recent', recent], ['archive', archive]] as const) {
    if (!snapshot) continue;
    const index = indexOf(snapshot).nearest(lat, lon, maxKm);
    if (index < 0) continue;
    const d = km(snapshot, index, lat, lon);
    if (d < bestD) {
      bestD = d;
      best = { name, index, snapshot };
    }
  }
  return best;
}
