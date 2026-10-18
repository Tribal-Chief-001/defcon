// Registers the Survey of India boundary halo (page coordinates) to lon/lat by matching it to Natural Earth's
// India-POV outline (iterative closest point, polynomial degree 1 -> 4, trimmed). Prints the residuals.
// Usage: node register.mjs halo.json ne_10m_admin_0_countries_ind.shp out-lonlat.json
import fs from 'node:fs';
import * as shp from 'shapefile';

const [haloPath, shpPath, outPath] = process.argv.slice(2);
const clean = (v) => String(v ?? '').replace(/\0/g, '').trim();
const PAGE = (x, y) => [0.999552 * x - 4.080142, -0.999552 * y + 2570.807529]; // transform on the halo paths
const dens = (pts, step) => {
  const o = [];
  for (let i = 0; i + 1 < pts.length; i++) {
    const n = Math.max(1, Math.ceil(Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]) / step));
    for (let k = 0; k < n; k++) o.push([pts[i][0] + ((pts[i + 1][0] - pts[i][0]) * k) / n, pts[i][1] + ((pts[i + 1][1] - pts[i][1]) * k) / n]);
  }
  o.push(pts.at(-1));
  return o;
};

const stroked = JSON.parse(fs.readFileSync(haloPath, 'utf8')).filter((p) => p.reduce((s, x) => s + x.length, 0) > 100);
const H = stroked.flatMap((p) => p.map((sp) => dens(sp.map(([x, y]) => PAGE(x, y)), 1.0)));
const Hpts = H.flat();

const fc = await shp.read(shpPath, shpPath.replace(/\.shp$/, '.dbf'));
const ind = fc.features.find((f) => clean(f.properties.ADM0_A3) === 'IND');
const N = ind.geometry.coordinates.flatMap((poly) => poly.filter((r) => r.length > 200).flatMap((r) => dens(r, 0.01)));

const cell = 0.05;
const grid = new Map();
N.forEach((p, i) => {
  const k = Math.floor(p[0] / cell) + ',' + Math.floor(p[1] / cell);
  (grid.get(k) ?? grid.set(k, []).get(k)).push(i);
});
const nearest = (lon, lat) => {
  let best = 1e9, bi = -1;
  const cx = Math.floor(lon / cell), cy = Math.floor(lat / cell);
  for (let r = 0; r < 12; r++) {
    for (let dx = -r; dx <= r; dx++)
      for (let dy = -r; dy <= r; dy++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        for (const i of grid.get(cx + dx + ',' + (cy + dy)) ?? []) {
          const d = Math.hypot(N[i][0] - lon, N[i][1] - lat);
          if (d < best) { best = d; bi = i; }
        }
      }
    if (bi >= 0 && best < r * cell) break;
  }
  return [bi, best];
};
const basis = (x, y, deg) => { const o = []; for (let i = 0; i <= deg; i++) for (let j = 0; i + j <= deg; j++) o.push(x ** i * y ** j); return o; };
const solve = (A, b) => {
  const n = A.length, M = A.map((r, i) => [...r, b[i]]);
  for (let i = 0; i < n; i++) {
    let p = i;
    for (let r = i + 1; r < n; r++) if (Math.abs(M[r][i]) > Math.abs(M[p][i])) p = r;
    [M[i], M[p]] = [M[p], M[i]];
    for (let r = i + 1; r < n; r++) { const f = M[r][i] / M[i][i]; for (let c = i; c <= n; c++) M[r][c] -= f * M[i][c]; }
  }
  const x = Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) { let s = M[i][n]; for (let c = i + 1; c < n; c++) s -= M[i][c] * x[c]; x[i] = s / M[i][i]; }
  return x;
};
const fit = (pairs, deg, nz) => {
  const nb = basis(0, 0, deg).length;
  const AtA = Array.from({ length: nb }, () => Array(nb).fill(0));
  const Atb = [Array(nb).fill(0), Array(nb).fill(0)];
  for (const [[x, y], [lo, la]] of pairs) {
    const b = basis((x - nz.cx) / nz.s, (y - nz.cy) / nz.s, deg);
    for (let i = 0; i < nb; i++) { for (let j = 0; j < nb; j++) AtA[i][j] += b[i] * b[j]; Atb[0][i] += b[i] * lo; Atb[1][i] += b[i] * la; }
  }
  return { deg, nz, cLon: solve(AtA.map((r) => [...r]), Atb[0]), cLat: solve(AtA.map((r) => [...r]), Atb[1]) };
};
const apply = (m, x, y) => {
  const b = basis((x - m.nz.cx) / m.nz.s, (y - m.nz.cy) / m.nz.s, m.deg);
  return [b.reduce((s, v, i) => s + v * m.cLon[i], 0), b.reduce((s, v, i) => s + v * m.cLat[i], 0)];
};
const km = (dLon, dLat, lat) => Math.hypot(dLon * 111.32 * Math.cos((lat * Math.PI) / 180), dLat * 110.57);

const xs = Hpts.map((p) => p[0]), ys = Hpts.map((p) => p[1]);
const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
const nz = { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, s: 1000 };
// start: bounding box of India's land boundary (about 68.1-97.4 E, 21.9-37.1 N)
let model = fit([[[x0, y0], [68.1, 37.1]], [[x1, y0], [97.4, 37.1]], [[x0, y1], [68.1, 21.9]], [[x1, y1], [97.4, 21.9]], [[nz.cx, nz.cy], [82.75, 29.5]]], 1, nz);
for (const [deg, iters, keep] of [[1, 8, 0.6], [2, 8, 0.7], [3, 10, 0.8], [4, 10, 0.85]]) {
  for (let it = 0; it < iters; it++) {
    const pairs = [];
    for (const [x, y] of Hpts) { const [lo, la] = apply(model, x, y); const [bi, d] = nearest(lo, la); if (bi >= 0) pairs.push({ x, y, t: N[bi], d }); }
    pairs.sort((a, b) => a.d - b.d);
    const use = pairs.slice(0, Math.floor(pairs.length * keep));
    model = fit(use.map((p) => [[p.x, p.y], p.t]), deg, nz);
    if (it === iters - 1) {
      const r = use.map((p) => { const [lo, la] = apply(model, p.x, p.y); return km(lo - p.t[0], la - p.t[1], la); }).sort((a, b) => a - b);
      console.log(`degree ${deg}: ${use.length}/${pairs.length} points kept, rms ${Math.sqrt(r.reduce((s, v) => s + v * v, 0) / r.length).toFixed(2)} km, median ${r[r.length >> 1].toFixed(2)}, p95 ${r[Math.floor(r.length * 0.95)].toFixed(2)}`);
    }
  }
}
fs.writeFileSync(outPath, JSON.stringify(H.map((sp) => sp.map(([x, y]) => apply(model, x, y)))));
