// Thermal anomalies from NASA FIRMS (VIIRS 375 m, last 24 hours). A detection is a hot pixel seen from orbit: a fire, a flare, a burning
// field or a burning building. It is context beside the conflict data, never proof of an attack. Acknowledgement: NASA FIRMS, LANCE, ESDIS.
export type Detection = { lat: number; lon: number; frp: number; time: number };
export type ConflictArea = { id: string; name: string; cells: [number, number, number][] };
import type { FireCell, FireTotal } from '../../src/signals/types';

const MAX_CHARS = 40_000_000;
const STEP = 0.5;
const ROWS = 360; // 180 / 0.5
const COLS = 720; // 360 / 0.5
const iy = (lat: number) => Math.min(ROWS - 1, Math.max(0, Math.floor((lat + 90) / STEP)));
const ix = (lon: number) => ((Math.floor((lon + 180) / STEP) % COLS) + COLS) % COLS;
export const cellKey = (lat: number, lon: number) => `${iy(lat)}:${ix(lon)}`;

export function parseFirmsCsv(text: string): Detection[] {
  const lines = text.slice(0, MAX_CHARS).split(/\r?\n/);
  const head = (lines[0] ?? '').split(',');
  const col = (n: string) => head.indexOf(n);
  const [cLat, cLon, cDate, cTime, cConf, cFrp] = ['latitude', 'longitude', 'acq_date', 'acq_time', 'confidence', 'frp'].map(col) as [number, number, number, number, number, number];
  if ([cLat, cLon, cDate, cTime, cConf, cFrp].some((i) => i < 0)) return [];
  const out: Detection[] = [];
  for (let i = 1; i < lines.length; i++) {
    const r = lines[i]!.split(',');
    const conf = (r[cConf] ?? '').toLowerCase();
    if (!['h', 'high', 'n', 'nominal'].includes(conf)) continue; // low confidence is dropped
    if (r[cLat] === '' || r[cLon] === '' || r[cFrp] === '') continue; // Number('') is 0: an empty field is not a detection at 0,0
    const lat = Number(r[cLat]);
    const lon = Number(r[cLon]);
    const frp = Number(r[cFrp]);
    const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(r[cDate] ?? '');
    const t = /^(\d{1,4})$/.exec(r[cTime] ?? '');
    if (!d || !t || !Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180 || !Number.isFinite(frp)) continue;
    const hhmm = t[1]!.padStart(4, '0');
    const [hh, mm] = [Number(hhmm.slice(0, 2)), Number(hhmm.slice(2))];
    const ms = Date.UTC(+d[1]!, +d[2]! - 1, +d[3]!, hh, mm);
    if (hh > 23 || mm > 59 || Number.isNaN(ms) || new Date(ms).getUTCMonth() !== +d[2]! - 1) continue;
    out.push({ lat, lon, frp, time: ms / 1000 });
  }
  return out;
}

// Detections inside or next to the 0.5-degree cells of the conflict areas, counted per cell, the busiest first (not capped).
// A cell belongs to the conflict that owns it (the one with the most deaths there, ties to the smaller id); a cell that no conflict owns
// but that touches some goes to the nearest of them (ties to the smaller id).
export function fireCells(dets: Detection[], conflicts: ConflictArea[]): FireCell[] {
  const area = new Map<string, { id: string; name: string; deaths: number }>();
  for (const c of conflicts)
    for (const [lat, lon, deaths] of c.cells) {
      const k = cellKey(lat, lon);
      const had = area.get(k);
      if (!had || deaths > had.deaths || (deaths === had.deaths && c.id < had.id)) area.set(k, { id: c.id, name: c.name, deaths });
    }
  if (area.size === 0) return [];
  const owner = (y: number, x: number): { id: string; name: string } | null => {
    const own = area.get(`${y}:${x}`);
    if (own) return own;
    const lat = (y * STEP - 90 + STEP / 2) * (Math.PI / 180);
    let best: { id: string; name: string } | null = null;
    let bestD = Infinity;
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        const yy = y + dy;
        if (yy < 0 || yy >= ROWS) continue;
        const hit = area.get(`${yy}:${(x + dx + COLS) % COLS}`);
        if (!hit) continue;
        const d = dy * dy + (dx * Math.cos(lat)) ** 2; // a longitude step is shorter away from the equator
        if (d < bestD - 1e-9 || (Math.abs(d - bestD) <= 1e-9 && best !== null && hit.id < best.id)) [best, bestD] = [hit, d];
      }
    return best;
  };
  const cells = new Map<string, FireCell>();
  for (const d of dets) {
    const y = iy(d.lat);
    const x = ix(d.lon);
    const key = `${y}:${x}`;
    let cell = cells.get(key);
    if (!cell) {
      const c = owner(y, x);
      if (!c) continue;
      cell = { lat: y * STEP - 90 + STEP / 2, lon: x * STEP - 180 + STEP / 2, count: 0, frp: 0, latestS: 0, conflictId: c.id, conflict: c.name };
      cells.set(key, cell);
    }
    cell.count++;
    cell.frp = Math.max(cell.frp, d.frp);
    cell.latestS = Math.max(cell.latestS, d.time);
  }
  return [...cells.values()].sort((a, b) => b.count - a.count || b.frp - a.frp || a.lat - b.lat || a.lon - b.lon);
}

export const aggregateFires = (dets: Detection[], conflicts: ConflictArea[], cap = 300): FireCell[] => fireCells(dets, conflicts).slice(0, cap);

// per conflict over every cell (so a cap on the cell list cannot make a total too small); the busiest cell is where the map flies to
export function fireTotals(cells: FireCell[]): FireTotal[] {
  const m = new Map<string, FireTotal & { top: number }>();
  for (const c of cells) {
    const g = m.get(c.conflictId) ?? { conflictId: c.conflictId, conflict: c.conflict, detections: 0, cells: 0, frp: 0, lat: c.lat, lon: c.lon, top: 0 };
    g.detections += c.count;
    g.cells++;
    g.frp = Math.max(g.frp, c.frp);
    if (c.count > g.top) [g.top, g.lat, g.lon] = [c.count, c.lat, c.lon];
    m.set(c.conflictId, g);
  }
  return [...m.values()].map(({ top: _t, ...g }) => g).sort((a, b) => b.detections - a.detections || a.conflict.localeCompare(b.conflict));
}
