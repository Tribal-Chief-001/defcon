import type { Conflict } from '../conflicts/types';

const D2R = Math.PI / 180;
const R_KM = 6371;

export type WarConflict = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  spreadKm: number;
  deaths90: number;
  deaths365: number;
  trend: Conflict['trend'];
  cells: [number, number, number][];
  rank: number; // 0 = most deaths in the last 90 days
};
export type WarPin = { lat: number; lon: number; status: 'confirmed' | 'reported' | 'disputed'; label: string };
// where a conflict's label goes on screen (CSS px in the canvas) and how big its halo is
export type WarLabelPos = { id: string; name: string; x: number; y: number; r: number; selected: boolean; rising: boolean; deaths90: number };
export type WarState = { active: boolean; conflicts: WarConflict[]; selected: string | null; pins: WarPin[]; hoverPin: number | null };

export function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const dLat = (b.lat - a.lat) * D2R;
  const dLon = (b.lon - a.lon) * D2R;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * D2R) * Math.cos(b.lat * D2R) * Math.sin(dLon / 2) ** 2;
  return 2 * R_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

// n points of the great circle of radius `km` around (lat, lon), longitudes wrapped into -180..180; empty for a bad radius or count
export function circlePoints(lat: number, lon: number, km: number, n: number): [number, number][] {
  if (![lat, lon, km, n].every(Number.isFinite) || km <= 0 || n < 3) return [];
  const d = km / R_KM;
  const la = lat * D2R;
  const out: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const t = (2 * Math.PI * i) / n;
    const lat2 = Math.asin(Math.sin(la) * Math.cos(d) + Math.cos(la) * Math.sin(d) * Math.cos(t));
    const lon2 = lon * D2R + Math.atan2(Math.sin(t) * Math.sin(d) * Math.cos(la), Math.cos(d) - Math.sin(la) * Math.sin(lat2));
    out.push([lat2 / D2R, ((((lon2 / D2R + 180) % 360) + 360) % 360) - 180]);
  }
  return out;
}

// halo size in CSS px: log of the 365-day deaths, so a war with 100,000 deaths is bigger than one with 100 but not 1000 times bigger
export const haloRadiusPx = (deaths365: number): number => {
  const d = Number.isFinite(deaths365) && deaths365 > 0 ? deaths365 : 0;
  return Math.min(34, Math.max(10, 6 + 4.6 * Math.log10(1 + d)));
};

// camera distance (globe radius = 1) that frames a conflict of this spread: close for a town-sized one, farther for a wide one
export const focusDistance = (spreadKm: number): number => {
  const s = Number.isFinite(spreadKm) ? Math.min(2500, Math.max(0, spreadKm)) : 400;
  return Math.min(4, Math.max(1.45, 1.6 + 1.8 * (s / 2500) ** 0.6));
};

// the conflicts that get a halo: some deaths in the last 90 days and a place, most active first
export function toWarConflicts(conflicts: Conflict[]): WarConflict[] {
  return conflicts
    .filter((c) => c.geo && Number.isFinite(c.geo.lat) && Number.isFinite(c.geo.lon) && c.deaths.d90.best > 0)
    .sort((a, b) => b.deaths.d90.best - a.deaths.d90.best || a.name.localeCompare(b.name))
    .map((c, rank) => ({ id: c.id, name: c.name, lat: c.geo!.lat, lon: c.geo!.lon, spreadKm: c.geo!.spreadKm, deaths90: c.deaths.d90.best, deaths365: c.deaths.d365.best, trend: c.trend, cells: c.geo!.cells, rank }));
}
