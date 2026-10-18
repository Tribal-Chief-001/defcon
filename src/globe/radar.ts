export type Candidate = { x: number; y: number; km: number };
export type RadarView = { x: number; y: number; readout: string; snapped: boolean };

// The candidate nearest to the cursor within `snapPx` screen pixels (ties: the one closer in km), or null.
export function snapTarget(cursor: { x: number; y: number }, candidates: Candidate[], snapPx = 28): Candidate | null {
  if (!Number.isFinite(cursor.x) || !Number.isFinite(cursor.y)) return null;
  let best: Candidate | null = null;
  let bestD = Infinity;
  for (const c of candidates) {
    if (![c.x, c.y, c.km].every(Number.isFinite)) continue;
    const d = Math.hypot(c.x - cursor.x, c.y - cursor.y);
    if (d > snapPx) continue;
    if (d < bestD - 1e-9 || (Math.abs(d - bestD) <= 1e-9 && best && c.km < best.km)) (best = c), (bestD = d);
  }
  return best;
}

// "28.61N 77.21E", plus " // EVENT 12 KM" when the reticle is snapped to an event.
export function formatReadout(lat: number, lon: number, snappedKm: number | null): string {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return '--';
  const base = `${Math.abs(lat).toFixed(2)}${lat < 0 ? 'S' : 'N'} ${Math.abs(lon).toFixed(2)}${lon < 0 ? 'W' : 'E'}`;
  return snappedKm === null || !Number.isFinite(snappedKm) ? base : `${base} // EVENT ${Math.round(snappedKm)} KM`;
}

// The globe's pointer moves arrive here without going through React state: only the reticle listens.
const listeners = new Set<(v: RadarView | null) => void>();
export const radarBus = {
  emit: (v: RadarView | null) => listeners.forEach((cb) => cb(v)),
  subscribe: (cb: (v: RadarView | null) => void) => {
    listeners.add(cb);
    return () => void listeners.delete(cb);
  },
};
