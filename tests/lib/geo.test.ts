import { describe, expect, it } from 'vitest';
import { latLonToVec3, vec3ToLatLon } from '../../src/lib/geo';

const close = (a: number[], b: number[], eps = 1e-9) => a.forEach((v, i) => expect(Math.abs(v - b[i]!)).toBeLessThan(eps));

describe('latLonToVec3', () => {
  it('puts lon 0 / lat 0 on +z', () => close(latLonToVec3(0, 0), [0, 0, 1]));
  it('puts lon 90 on +x', () => close(latLonToVec3(0, 90), [1, 0, 0]));
  it('puts the north pole on +y', () => close(latLonToVec3(90, 0), [0, 1, 0]));
  it('scales by r', () => {
    const [x, y, z] = latLonToVec3(12, 34, 2);
    expect(Math.hypot(x, y, z)).toBeCloseTo(2, 9);
  });
});

describe('vec3ToLatLon', () => {
  it('round-trips 200 random points', () => {
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 200; i++) {
      const lat = rnd() * 178 - 89;
      const lon = rnd() * 360 - 180;
      const back = vec3ToLatLon(...latLonToVec3(lat, lon));
      expect(Math.abs(back.lat - lat)).toBeLessThan(1e-9);
      const dLon = Math.abs(back.lon - lon);
      expect(Math.min(dLon, 360 - dLon)).toBeLessThan(1e-9);
    }
  });
  it('is scale independent', () => {
    const { lat, lon } = vec3ToLatLon(...latLonToVec3(10, 20, 5));
    expect(lat).toBeCloseTo(10, 9);
    expect(lon).toBeCloseTo(20, 9);
  });
});
