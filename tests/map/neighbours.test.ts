import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Topology } from 'topojson-specification';
import { neighboursOf } from '../../scripts/map/neighbours';

const high = JSON.parse(readFileSync('public/data/borders.high.topo.json', 'utf8')) as Topology;
const n = neighboursOf(high);

describe('neighboursOf (India-POV borders)', () => {
  it('is symmetric and has no self entries', () => {
    for (const [a, list] of Object.entries(n)) {
      expect(list).not.toContain(a);
      for (const b of list) expect(n[b]).toContain(a);
    }
  });
  it('lists India neighbours as India depicts them, including Afghanistan (Gilgit-Baltistan)', () => {
    for (const id of ['BGD', 'BTN', 'CHN', 'MMR', 'NPL', 'PAK', 'AFG']) expect(n.IND).toContain(id);
  });
  it('is sorted', () => {
    expect(n.IND).toEqual([...n.IND!].sort());
  });
  it('lists known land neighbours of France and none for an island country', () => {
    expect(n.FRA).toEqual(expect.arrayContaining(['BEL', 'ESP']));
    expect(n.JPN).toEqual([]);
  });
  it('handles a topology with a geometry that has no arcs', () => {
    const t: Topology = {
      type: 'Topology',
      arcs: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]],
      objects: { countries: { type: 'GeometryCollection', geometries: [{ type: 'Polygon', arcs: [[0]], properties: { id: 'A' } }, { type: null, properties: { id: 'B' } }] } },
    };
    expect(neighboursOf(t)).toEqual({ A: [], B: [] });
  });
});
