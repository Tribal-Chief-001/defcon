import { describe, expect, it } from 'vitest';
import { geoContains } from 'd3-geo';
import type { Feature, Polygon } from 'geojson';
import { rewindFeature } from '../../scripts/map/rewind';

// d3 convention: exterior ring clockwise (as drawn on a lon/lat map), holes counter-clockwise.
const cw = [[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]];
const ccw = [...cw].reverse();
const feat = (ring: number[][]): Feature<Polygon> => ({ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [ring] } });

describe('rewindFeature', () => {
  it('leaves a correctly wound polygon unchanged', () => {
    const f = rewindFeature(feat(cw));
    expect(f.geometry).toEqual(feat(cw).geometry);
  });
  it('fixes a wrongly wound polygon so it contains its inside and not the rest of the world', () => {
    const f = rewindFeature(feat(ccw));
    expect(geoContains(f, [5, 5])).toBe(true);
    expect(geoContains(f, [-140, 0])).toBe(false);
  });
  it('fixes each polygon of a MultiPolygon independently', () => {
    const far = (r: number[][]) => r.map(([x, y]) => [x! + 100, y!]);
    const multi: Feature = {
      type: 'Feature',
      properties: {},
      geometry: { type: 'MultiPolygon', coordinates: [[cw], [far(ccw)]] },
    };
    const f = rewindFeature(multi);
    expect(geoContains(f, [5, 5])).toBe(true);
    expect(geoContains(f, [105, 5])).toBe(true);
    expect(geoContains(f, [-140, 0])).toBe(false);
  });
});
