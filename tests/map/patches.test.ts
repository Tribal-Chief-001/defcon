import { describe, expect, it } from 'vitest';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import type { Feature, FeatureCollection, Polygon } from 'geojson';
import { applyPatches, type Patch } from '../../scripts/map/patches';

const square = (x0: number, y0: number, x1: number, y1: number): Polygon => ({
  type: 'Polygon',
  coordinates: [[[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]]],
});
const country = (id: string, g: Polygon): Feature => ({ type: 'Feature', properties: { ADM0_A3: id }, geometry: g });
const fc = (): FeatureCollection => ({
  type: 'FeatureCollection',
  features: [country('AAA', square(0, 0, 10, 10)), country('BBB', square(10, 0, 20, 10))],
});
const patch = square(8, 2, 12, 8);
const patches: Patch[] = [
  { id: 'p-add', op: 'add-to', country: 'AAA', geometry: patch, source: 'test' },
  { id: 'p-cut', op: 'cut-from', country: 'BBB', geometry: patch, source: 'test' },
];

const owners = (out: FeatureCollection, lon: number, lat: number) =>
  out.features.filter((f) => booleanPointInPolygon([lon, lat], f as Feature<Polygon>)).map((f) => f.properties!.ADM0_A3);

describe('applyPatches', () => {
  it('keeps the feature count unchanged', () => {
    expect(applyPatches(fc(), patches).features).toHaveLength(2);
  });
  it('moves the patched area to exactly one country (no overlap, no gap)', () => {
    const out = applyPatches(fc(), patches);
    expect(owners(out, 11, 5)).toEqual(['AAA']);
    expect(owners(out, 9, 5)).toEqual(['AAA']);
  });
  it('leaves points outside the patch untouched', () => {
    const out = applyPatches(fc(), patches);
    expect(owners(out, 15, 5)).toEqual(['BBB']);
    expect(owners(out, 3, 5)).toEqual(['AAA']);
  });
  it('throws when a patch names an unknown country', () => {
    expect(() => applyPatches(fc(), [{ ...patches[0]!, country: 'ZZZ' }])).toThrow(/ZZZ/);
  });
  // Review finding: an add-to without its cut-from silently overlaps the neighbour.
  it('throws when a patch leaves two countries overlapping', () => {
    expect(() => applyPatches(fc(), [patches[0]!])).toThrow(/overlap/i);
  });
  it('names both countries in the overlap error', () => {
    expect(() => applyPatches(fc(), [patches[0]!])).toThrow(/AAA.*BBB|BBB.*AAA/);
  });
});
