import { describe, expect, it } from 'vitest';
import { packCircles } from '../../src/viz/pack';

const items = [
  { id: 'a', value: 85000 }, { id: 'b', value: 6000 }, { id: 'c', value: 4000 }, { id: 'd', value: 3900 }, { id: 'e', value: 2000 },
  { id: 'f', value: 1500 }, { id: 'g', value: 900 }, { id: 'h', value: 400 }, { id: 'i', value: 150 }, { id: 'j', value: 100 },
];

describe('packCircles', () => {
  const W = 640;
  const H = 300;
  const out = packCircles(items, W, H);

  it('returns every item once, with finite positions', () => {
    expect(out.map((c) => c.id).sort()).toEqual(items.map((i) => i.id).sort());
    expect(out.every((c) => [c.x, c.y, c.r].every(Number.isFinite) && c.r > 0)).toBe(true);
  });
  it('makes the AREA proportional to the value (radius to its square root), not the radius', () => {
    const k = out[0]!.r ** 2 / items.find((i) => i.id === out[0]!.id)!.value;
    for (const c of out) expect(c.r ** 2 / items.find((i) => i.id === c.id)!.value).toBeCloseTo(k, 6);
  });
  it('never overlaps and stays inside the box', () => {
    for (const a of out) {
      expect(a.x - a.r).toBeGreaterThanOrEqual(-1e-6);
      expect(a.x + a.r).toBeLessThanOrEqual(W + 1e-6);
      expect(a.y - a.r).toBeGreaterThanOrEqual(-1e-6);
      expect(a.y + a.r).toBeLessThanOrEqual(H + 1e-6);
    }
    for (let i = 0; i < out.length; i++)
      for (let j = i + 1; j < out.length; j++) expect(Math.hypot(out[i]!.x - out[j]!.x, out[i]!.y - out[j]!.y)).toBeGreaterThanOrEqual(out[i]!.r + out[j]!.r - 1e-6);
  });
  it('is deterministic and handles empty, zero and one item', () => {
    expect(packCircles(items, W, H)).toEqual(out);
    expect(packCircles([], W, H)).toEqual([]);
    expect(packCircles([{ id: 'z', value: 0 }], W, H)).toEqual([]); // nothing to draw for no deaths
    const one = packCircles([{ id: 'x', value: 10 }], W, H);
    expect(one).toHaveLength(1);
    expect(one[0]!.x).toBeCloseTo(W / 2, 0);
  });
  it('shrinks to fit a small box', () => {
    const small = packCircles(items, 200, 120);
    for (const a of small) expect(a.x + a.r).toBeLessThanOrEqual(200 + 1e-6);
  });
});
