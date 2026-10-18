import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { geoContains } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Topology } from 'topojson-specification';
import { createPicker } from '../../src/globe/pick';

type Entry = { name: string; lat: number; lon: number; expect: string; status: 'verified' | 'pending-owner' };
const entries = JSON.parse(readFileSync('data/map/india-guard.json', 'utf8')) as Entry[];
const verified = entries.filter((e) => e.status === 'verified');
const pending = entries.filter((e) => e.status === 'pending-owner');

if (pending.length) {
  console.warn(`india-guard: ${pending.length} point(s) pending owner review: ${pending.map((e) => e.name).join(', ')}`);
}

describe.each([
  ['high', 'public/data/borders.high.topo.json'],
  ['low', 'public/data/borders.low.topo.json'],
])('India guard on %s detail', (_lod, path) => {
  const topo = JSON.parse(readFileSync(path, 'utf8')) as Topology;
  const fc = feature(topo, topo.objects.countries as never) as unknown as {
    features: { properties: { id: string }; geometry: never }[];
  };
  const owners = (lat: number, lon: number) =>
    fc.features.filter((f) => geoContains(f as never, [lon, lat])).map((f) => f.properties.id);

  it('has verified points to check', () => {
    expect(verified.length).toBeGreaterThanOrEqual(10);
  });
  it.each(verified.map((e) => [e.name, e] as const))('%s resolves to exactly its expected country', (_n, e) => {
    expect(owners(e.lat, e.lon)).toEqual([e.expect]);
  });
});

// Review finding: the product picks countries with createPicker (planar), not d3-geo. The guard must protect that path too.
describe.each([
  ['high', 'public/data/borders.high.topo.json'],
  ['low', 'public/data/borders.low.topo.json'],
])('India guard through the shipped picker on %s detail', (_lod, path) => {
  const pick = createPicker(JSON.parse(readFileSync(path, 'utf8')) as Topology);
  it.each(verified.map((e) => [e.name, e] as const))('%s -> its expected country', (_n, e) => {
    expect(pick(e.lat, e.lon)).toBe(e.expect);
  });
});
