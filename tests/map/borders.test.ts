import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import type { Topology, GeometryCollection } from 'topojson-specification';

const HIGH = 'public/data/borders.high.topo.json';
const LOW = 'public/data/borders.low.topo.json';
const gz = (p: string) => gzipSync(readFileSync(p)).length;
const load = (p: string) => JSON.parse(readFileSync(p, 'utf8')) as Topology;
const ids = (t: Topology) =>
  (t.objects.countries as GeometryCollection).geometries.map((g) => (g.properties as { id: string }).id);

describe('built border data', () => {
  it.each([HIGH, LOW])('%s parses and has >= 240 countries', (p) => {
    expect(ids(load(p)).length).toBeGreaterThanOrEqual(240);
  });
  it.each([HIGH, LOW])('%s has the expected ids, all unique', (p) => {
    const list = ids(load(p));
    for (const id of ['IND', 'PAK', 'CHN', 'ATA', 'FJI']) expect(list).toContain(id);
    expect(new Set(list).size).toBe(list.length);
  });
  it('low-detail file is at most 300 KB gzipped (transfer size)', () => {
    expect(gz(LOW)).toBeLessThanOrEqual(300_000);
  });
  it('high-detail file is at most 1 MB gzipped (transfer size)', () => {
    expect(gz(HIGH)).toBeLessThanOrEqual(1_000_000);
  });
});
