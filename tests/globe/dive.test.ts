import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { diveTarget, easeDive } from '../../src/globe/dive';
import type { CountryRow } from '../../src/dossier/types';

const rows = JSON.parse(readFileSync('public/data/countries.json', 'utf8')) as CountryRow[];
const row = (id: string) => rows.find((r) => r.id === id)!;
const target = (id: string) => diveTarget(row(id).bbox, { lat: row(id).lat, lon: row(id).lon });

describe('diveTarget (Review Focus 5)', () => {
  it('uses the minimum distance for a tiny country and the maximum for huge ones', () => {
    expect(target('LUX').distance).toBeCloseTo(1.45, 5);
    expect(target('RUS').distance).toBe(3.6);
    expect(target('ATA').distance).toBe(3.6);
  });
  it('grows with the size of the country', () => {
    const d = ['MLT', 'BEL', 'IND', 'CHN'].map((id) => target(id).distance);
    for (let i = 1; i < d.length; i++) expect(d[i]).toBeGreaterThanOrEqual(d[i - 1]!);
  });
  it('centres Fiji (a bbox that crosses the antimeridian) near longitude 180, not near 0', () => {
    const t = target('FJI');
    expect(Math.abs(Math.abs(t.lon) - 180)).toBeLessThan(4);
  });
  it('without a label point centres a crossing bbox on the circle, not on the wrong side of the globe', () => {
    const t = diveTarget(row('FJI').bbox, null);
    expect(Math.abs(Math.abs(t.lon) - 180)).toBeLessThan(4);
    expect(t.lat).toBeGreaterThan(-22);
    expect(t.lat).toBeLessThan(-12);
  });
  it('returns finite values inside valid ranges for every country, including Antarctica, Russia and the USA', () => {
    for (const r of rows) {
      const t = diveTarget(r.bbox, { lat: r.lat, lon: r.lon });
      expect(Number.isFinite(t.lat) && Number.isFinite(t.lon) && Number.isFinite(t.distance)).toBe(true);
      expect(Math.abs(t.lat)).toBeLessThanOrEqual(90);
      expect(Math.abs(t.lon)).toBeLessThanOrEqual(180);
      expect(t.distance).toBeGreaterThanOrEqual(1.45);
      expect(t.distance).toBeLessThanOrEqual(3.6);
    }
  });
  it('falls back to the label point and a default distance when there is no polygon (Vatican)', () => {
    expect(row('VAT').bbox).toBeNull();
    expect(target('VAT')).toEqual({ lat: row('VAT').lat, lon: row('VAT').lon, distance: 2.2 });
  });
  it('without a bbox and without a label it returns the origin at the default distance, never NaN', () => {
    expect(diveTarget(null, null)).toEqual({ lat: 0, lon: 0, distance: 2.2 });
  });
});

describe('easeDive', () => {
  it('is 0 at 0, 1 at 1, monotonic, and clamps outside 0..1', () => {
    expect(easeDive(0)).toBe(0);
    expect(easeDive(1)).toBe(1);
    expect(easeDive(-5)).toBe(0);
    expect(easeDive(9)).toBe(1);
    let prev = 0;
    for (let t = 0; t <= 1; t += 0.05) {
      expect(easeDive(t)).toBeGreaterThanOrEqual(prev);
      prev = easeDive(t);
    }
  });
});
