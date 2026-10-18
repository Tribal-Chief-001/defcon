import { latLonToVec3 } from '../lib/geo';

export type Capital = { name: string; country: string; lat: number; lon: number; rank: number; alt?: true }; // alt = Natural Earth alternate capital: listed in the dossier, never marked on the globe
export type View = { lat: number; lon: number; distance: number };

const FAR = 3.2; // beyond this distance no labels are drawn (unless diving)
const LEVELS = [
  { above: 2.4, maxRank: 2, limit: 12 },
  { above: 1.8, maxRank: 4, limit: 24 },
] as const;

// Which capitals get a marker and label at this view: fewer when zoomed out, only the visible hemisphere, stable order.
export function selectCapitals(caps: Capital[], view: View, diveId: string | null, cap = 40): Capital[] {
  const { lat, lon, distance } = view;
  if (![lat, lon, distance].every(Number.isFinite)) return [];
  const far = distance > FAR;
  if (far && !diveId) return [];
  const level = LEVELS.find((l) => distance > l.above);
  const maxRank = level?.maxRank ?? 7;
  const limit = Math.min(level?.limit ?? cap, cap);
  const [vx, vy, vz] = latLonToVec3(lat, lon);
  // a point is in front of the horizon when dot(normal, view) > 1 / distance; the 0.03 margin keeps labels off the very edge
  const minDot = Math.max(0.12, 1 / distance + 0.03);
  const visible = (c: Capital) => {
    const [x, y, z] = latLonToVec3(c.lat, c.lon);
    return x * vx + y * vy + z * vz > minDot;
  };
  const byRank = (a: Capital, b: Capital) => a.rank - b.rank || a.name.localeCompare(b.name) || a.country.localeCompare(b.country);
  const main = caps.filter((c) => !c.alt);
  const dived = diveId ? main.filter((c) => c.country === diveId && visible(c)).sort(byRank) : [];
  const others = far
    ? []
    : main
        .filter((c) => c.country !== diveId && c.rank <= maxRank && visible(c))
        .sort(byRank)
        .slice(0, Math.max(0, limit - dived.length));
  return [...dived, ...others];
}
