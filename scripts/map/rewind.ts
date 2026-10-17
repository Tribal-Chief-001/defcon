import { geoArea } from 'd3-geo';
import type { Feature, Geometry, Position } from 'geojson';

// d3-geo reads rings on the sphere: a wrongly wound polygon means "everything except the country".
// A polygon whose spherical area exceeds a hemisphere (2*pi sr) is wound the wrong way: reverse its rings.
const reversePolygon = (rings: Position[][]): Position[][] => rings.map((r) => [...r].reverse());
const fixPolygon = (rings: Position[][]): Position[][] =>
  geoArea({ type: 'Polygon', coordinates: rings }) > 2 * Math.PI ? reversePolygon(rings) : rings;

export function rewindFeature<F extends Feature>(f: F): F {
  const g = f.geometry as Geometry;
  if (g.type === 'Polygon') return { ...f, geometry: { ...g, coordinates: fixPolygon(g.coordinates) } };
  if (g.type === 'MultiPolygon') return { ...f, geometry: { ...g, coordinates: g.coordinates.map(fixPolygon) } };
  return f;
}
