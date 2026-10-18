import type { EventAttrs } from '../events/attributes';
import { visibleAt } from '../time/store';
import { vec3ToLatLon } from '../lib/geo';

const D30 = 30 * 86400;
const fadeAt = (ageS: number) => 1 - 0.65 * Math.max(0, Math.min(1, ageS / D30)); // the event layer's 30-day fade (1 -> 0.35)

// Soft falloff over a 5 x 5 neighbourhood (by squared distance): hard 3 x 3 blocks showed as rectangles on the globe.
const FALLOFF: Record<number, number> = { 0: 1, 1: 0.6, 2: 0.37, 4: 0.14, 5: 0.08, 8: 0.02 };

// Event heat on an equirectangular grid (w x h, row 0 = south pole), 0..255, for the grain shader: each event adds its size (3..9,
// severity) times the fade to its cell and half of that to the 8 neighbours (longitude wraps, latitude does not). A cell counts only
// when the event already happened at the playhead (`backS`). Normalised so the 98th-percentile lit cell is 255; a lit cell is at least 1.
export function buildDensity(list: EventAttrs[], backS: number, w = 180, h = 90): Uint8Array {
  const acc = new Float32Array(w * h);
  const add = (row: number, col: number, v: number) => {
    if (row < 0 || row >= h) return;
    acc[row * w + ((col % w) + w) % w]! += v;
  };
  for (const a of list) {
    for (let i = 0; i < a.count; i++) {
      const weight = a.size[i]!;
      const age = a.age[i]!;
      if (!(weight > 0) || !visibleAt(age, backS)) continue;
      const { lat, lon } = vec3ToLatLon(a.position[i * 3]!, a.position[i * 3 + 1]!, a.position[i * 3 + 2]!);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
      const row = Math.min(h - 1, Math.max(0, Math.floor(((lat + 90) / 180) * h)));
      const col = Math.min(w - 1, Math.max(0, Math.floor(((lon + 180) / 360) * w)));
      const v = weight * fadeAt(age - backS);
      for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) add(row + dr, col + dc, v * FALLOFF[dr * dr + dc * dc]!);
    }
  }
  const lit = Array.from(acc).filter((v) => v > 0).sort((p, q) => p - q);
  const out = new Uint8Array(w * h);
  if (!lit.length) return out;
  const scale = lit[Math.min(lit.length - 1, Math.floor(lit.length * 0.98))]!;
  for (let i = 0; i < acc.length; i++) if (acc[i]! > 0) out[i] = Math.max(1, Math.min(255, Math.round((255 * acc[i]!) / scale)));
  return out;
}
