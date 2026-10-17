const D2R = Math.PI / 180;

// y is up; longitude 0 faces +z, longitude +90 faces +x.
export function latLonToVec3(latDeg: number, lonDeg: number, r = 1): [number, number, number] {
  const phi = latDeg * D2R;
  const lam = lonDeg * D2R;
  const c = Math.cos(phi);
  return [r * c * Math.sin(lam), r * Math.sin(phi), r * c * Math.cos(lam)];
}

export function vec3ToLatLon(x: number, y: number, z: number): { lat: number; lon: number } {
  const r = Math.hypot(x, y, z);
  return { lat: Math.asin(y / r) / D2R, lon: Math.atan2(x, z) / D2R };
}
