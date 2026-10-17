// Pins a SHA-256 of India's outline in the built high-detail borders.
// Usage: npm run map:pin-india   (run only with an owner-approved ledger entry)
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { feature } from 'topojson-client';
import type { Topology } from 'topojson-specification';

const round = (x: unknown): unknown => (Array.isArray(x) ? x.map(round) : typeof x === 'number' ? Math.round(x * 1e4) / 1e4 : x);

export function indiaOutlineHash(topo: Topology): string {
  const fc = feature(topo, topo.objects.countries as never) as unknown as {
    features: { properties: { id: string }; geometry: { coordinates: unknown } }[];
  };
  const ind = fc.features.find((f) => f.properties.id === 'IND');
  if (!ind) throw new Error('IND not found in borders');
  return createHash('sha256').update(JSON.stringify(round(ind.geometry.coordinates))).digest('hex');
}

if (process.argv[1]?.endsWith('pin-india.ts')) {
  const topo = JSON.parse(readFileSync('public/data/borders.high.topo.json', 'utf8')) as Topology;
  const hash = indiaOutlineHash(topo);
  writeFileSync('data/map/india-outline.sha256', hash + '\n');
  console.log('pinned India outline', hash);
}
