import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Topology } from 'topojson-specification';
import { createPicker } from '../../src/globe/pick';

const high = JSON.parse(readFileSync('public/data/borders.high.topo.json', 'utf8')) as Topology;
const pick = createPicker(high);

describe('createPicker', () => {
  it.each([
    ['New Delhi', 28.61, 77.21, 'IND'],
    ['Gilgit (India-POV)', 35.92, 74.31, 'IND'],
    ['Islamabad', 33.69, 73.05, 'PAK'],
    ['Antarctica', -85, 0, 'ATA'],
  ])('%s -> %s', (_n, lat, lon, id) => {
    expect(pick(lat, lon)).toBe(id);
  });

  // Review Focus 1: a wrong-winding bug returns a country for open ocean.
  it.each([
    [0, -140],
    [-30, -30],
    [0, 80],
  ])('open ocean (%f, %f) -> null', (lat, lon) => {
    expect(pick(lat, lon)).toBeNull();
  });

  // Review Focus 2: antimeridian.
  it.each([
    ['Fiji east of the antimeridian (Viti Levu)', -17.7, 178.0, 'FJI'],
    ['Fiji west of the antimeridian (Taveuni)', -16.85, -179.97, 'FJI'],
    ['Chukotka, Russia', 66.0, -175.0, 'RUS'],
  ])('%s -> %s', (_n, lat, lon, id) => {
    expect(pick(lat, lon)).toBe(id);
  });

  it('returns null for NaN input without throwing', () => {
    expect(pick(NaN, 10)).toBeNull();
    expect(pick(10, NaN)).toBeNull();
  });

  it('answers 1,000 random picks in under 200 ms', () => {
    let s = 11;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const pts = Array.from({ length: 1000 }, () => [Math.asin(2 * rnd() - 1) * (180 / Math.PI), rnd() * 360 - 180] as const);
    for (const [lat, lon] of pts.slice(0, 300)) pick(lat, lon); // warm up the JIT so the timing is stable under parallel test workers
    const t0 = performance.now();
    for (const [lat, lon] of pts) pick(lat, lon);
    expect(performance.now() - t0).toBeLessThan(200);
  });

  it('resolves capitals to their own country (cross-checks borders against capitals)', () => {
    const caps = JSON.parse(readFileSync('public/data/capitals.json', 'utf8')) as { name: string; country: string; lat: number; lon: number }[];
    const wrong = caps.filter((c) => pick(c.lat, c.lon) !== c.country).map((c) => `${c.name}: ${pick(c.lat, c.lon)} not ${c.country}`);
    // Known gaps: micro-states too small for the high-detail data (quantization about 800 m). Plan 3 gives them
    // point-based lookup through their capital. Any other mismatch is a regression.
    expect(wrong).toEqual(['Funafuti: null not TUV', 'Vatican City: ITA not VAT']);
  });
});
