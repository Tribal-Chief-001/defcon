// Compares the registered Survey of India boundary with Natural Earth's India-POV polygon in a lon/lat box,
// and with Natural Earth's own "Indian claim" lines.
// Usage: node compare.mjs halo-lonlat.json ne_10m_admin_0_countries_ind.shp ne_10m_admin_0_boundary_lines_disputed_areas.shp
import fs from 'node:fs';
import * as shp from 'shapefile';
import inside from '@turf/boolean-point-in-polygon';

const [haloPath, countriesShp, linesShp] = process.argv.slice(2);
const clean = (v) => String(v ?? '').replace(/\0/g, '').trim();
const km = (a, b) => Math.hypot((a[0] - b[0]) * 111.32 * Math.cos((a[1] * Math.PI) / 180), (a[1] - b[1]) * 110.57);
const H = JSON.parse(fs.readFileSync(haloPath, 'utf8'));
const all = H.flat();
const dens = (pts, step) => { const o = []; for (let i = 0; i + 1 < pts.length; i++) { const n = Math.max(1, Math.ceil(Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]) / step)); for (let k = 0; k < n; k++) o.push([pts[i][0] + ((pts[i + 1][0] - pts[i][0]) * k) / n, pts[i][1] + ((pts[i + 1][1] - pts[i][1]) * k) / n]); } o.push(pts.at(-1)); return o; };

const fc = await shp.read(countriesShp, countriesShp.replace(/\.shp$/, '.dbf'));
const ind = fc.features.find((f) => clean(f.properties.ADM0_A3) === 'IND');
const ring = dens(ind.geometry.coordinates[0][0], 0.01);
const dRing = (p) => Math.min(...ring.map((q) => km(p, q)));

const lines = await shp.read(linesShp, linesShp.replace(/\.shp$/, '.dbf'));
const claim = lines.features.filter((f) => clean(f.properties.BRK_A3) === 'B06'); // "Shaksam Valley", Indian claim line
const cp = claim.flatMap((f) => f.geometry.coordinates.flatMap((l) => dens(l, 0.02)));
const d = cp.map((p) => Math.min(...all.map((q) => km(p, q)))).sort((a, b) => a - b);
console.log(`NE Indian-claim line B06 (Shaksgam) to the SoI boundary: median ${d[d.length >> 1].toFixed(1)} km, p90 ${d[Math.floor(d.length * 0.9)].toFixed(1)}, max ${d.at(-1).toFixed(1)}`);

const sector = H.flat().filter((p) => p[0] > 75.5 && p[0] < 77.8 && p[1] > 35.3 && p[1] < 36.7);
const dist = sector.map(dRing).sort((a, b) => a - b);
console.log(`SoI boundary in the Shaksgam sector (${sector.length} points) to the Natural Earth India outline: median ${dist[dist.length >> 1].toFixed(1)} km, p90 ${dist[Math.floor(dist.length * 0.9)].toFixed(1)}, max ${dist.at(-1).toFixed(1)}`);
console.log('NE India polygon contains these valley points (lat, lon):');
for (const [n, la, lo] of [['north of K2', 36.07, 76.47], ['Kyagar area', 36.15, 76.3], ['K2 summit', 35.8825, 76.5133], ['NE of the boundary (control)', 36.2, 77.0], ['N of the boundary (control)', 36.6, 76.6]])
  console.log(' ', n.padEnd(30), la, lo, inside([lo, la], ind) ? 'IND' : 'not IND');
