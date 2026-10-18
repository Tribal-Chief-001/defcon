import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Topology } from 'topojson-specification';
import { createOwnerLister } from '../../src/globe/pick';

// Review Focus 5 / finding: no point of the shipped map may belong to two countries.
describe.each([
  ['high', 'public/data/borders.high.topo.json'],
  ['low', 'public/data/borders.low.topo.json'],
])('no overlapping countries (%s detail)', (_lod, path) => {
  it('every point of a 1 degree grid has at most one owner', () => {
    const owners = createOwnerLister(JSON.parse(readFileSync(path, 'utf8')) as Topology);
    const multi: string[] = [];
    for (let lat = -89.5; lat < 90; lat += 1)
      for (let lon = -179.5; lon < 180; lon += 1) {
        const o = owners(lat, lon);
        if (o.length > 1) multi.push(`${lat},${lon}: ${o.join('+')}`);
      }
    expect(multi).toEqual([]);
  });
});
