import type { SeismicSignal } from '../../src/signals/types';

// Seismic events that are not earthquakes: explosions seen by seismometers. Quarry and mining blasts, ice quakes and earthquakes are left
// out (industrial or natural). Public domain, credit "U.S. Geological Survey".
const KEEP = new Set(['explosion', 'nuclear explosion', 'chemical explosion']);
const num = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

export function parseUsgs(json: unknown): SeismicSignal[] {
  const features = (json as { features?: unknown } | null)?.features;
  if (!Array.isArray(features)) return [];
  const out: SeismicSignal[] = [];
  for (const f of features) {
    const x = f as { id?: unknown; properties?: Record<string, unknown>; geometry?: { coordinates?: unknown } } | null;
    const p = x?.properties;
    const c = x?.geometry?.coordinates;
    if (!p || typeof p.type !== 'string' || !KEEP.has(p.type) || !Array.isArray(c) || !num(c[0]) || !num(c[1]) || !num(p.time) || p.time <= 0) continue;
    const [lon, lat] = [c[0], c[1]];
    if (Math.abs(lat) > 90 || Math.abs(lon) > 180) continue;
    const id = typeof x?.id === 'string' && x.id ? x.id : typeof p.code === 'string' ? p.code : '';
    if (!id) continue;
    out.push({
      id,
      time: Math.round(p.time / 1000),
      lat,
      lon,
      mag: num(p.mag) ? p.mag : null,
      type: p.type,
      place: typeof p.place === 'string' ? p.place.slice(0, 120) : '',
      url: typeof p.url === 'string' && /^https:\/\/earthquake\.usgs\.gov\//.test(p.url) ? p.url : `https://earthquake.usgs.gov/earthquakes/eventpage/${encodeURIComponent(id)}`,
    });
  }
  return out;
}
