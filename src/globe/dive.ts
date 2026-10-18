const D2R = Math.PI / 180;
const DEFAULT_DISTANCE = 2.2;
const wrapLon = (x: number) => ((((x + 180) % 360) + 360) % 360) - 180;
const fin = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);

// Where the camera should look and how far away it should be to frame a country. The centre is the country's label point
// (the best spot of a multi-part country such as the USA) or, without one, the centre of its bounding box taken on the circle
// (a box with west > east crosses the antimeridian). The distance comes from the box's ground size; it stays within 1.45..3.6.
export function diveTarget(
  bbox: [number, number, number, number] | null,
  label: { lat: number; lon: number } | null,
): { lat: number; lon: number; distance: number } {
  const labelPt = label && fin(label.lat) && fin(label.lon) ? { lat: label.lat, lon: label.lon } : null;
  if (!bbox || !bbox.every(fin)) return { ...(labelPt ?? { lat: 0, lon: 0 }), distance: DEFAULT_DISTANCE };
  const [w, s, e, n] = bbox;
  const lonSpan = w > e ? e + 360 - w : e - w;
  const latC = (s + n) / 2;
  const centre = labelPt ?? { lat: latC, lon: wrapLon(w + lonSpan / 2) };
  const groundLon = lonSpan * Math.max(0.2, Math.cos(latC * D2R));
  const sizeRad = Math.max(groundLon, n - s) * D2R;
  return { lat: Math.max(-90, Math.min(90, centre.lat)), lon: wrapLon(centre.lon), distance: Math.min(3.6, Math.max(1.45, 1.25 + sizeRad * 1.8)) };
}

// Exponential ease-out (close to the project's cubic-bezier(0.16, 1, 0.3, 1)), 0 at 0 and 1 at 1, clamped outside.
export const easeDive = (t: number): number => {
  const x = Math.min(1, Math.max(0, t));
  return (1 - Math.pow(2, -10 * x)) / (1 - Math.pow(2, -10));
};
