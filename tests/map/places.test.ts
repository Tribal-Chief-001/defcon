import { readFileSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

type Capital = { name: string; country: string; lat: number; lon: number; rank: number };
const PATH = 'public/data/capitals.json';
const caps = JSON.parse(readFileSync(PATH, 'utf8')) as Capital[];

describe('capitals dataset', () => {
  it('has at least 190 capitals', () => {
    expect(caps.length).toBeGreaterThanOrEqual(190);
  });
  it('contains New Delhi in IND within 0.5 degrees of (28.61, 77.21)', () => {
    const d = caps.find((c) => c.name === 'New Delhi' && c.country === 'IND');
    expect(d).toBeDefined();
    expect(Math.abs(d!.lat - 28.61)).toBeLessThan(0.5);
    expect(Math.abs(d!.lon - 77.21)).toBeLessThan(0.5);
  });
  it('has valid coordinates and ranks', () => {
    for (const c of caps) {
      expect(c.lat).toBeGreaterThanOrEqual(-90);
      expect(c.lat).toBeLessThanOrEqual(90);
      expect(c.lon).toBeGreaterThanOrEqual(-180);
      expect(c.lon).toBeLessThanOrEqual(180);
      expect(Number.isFinite(c.rank)).toBe(true);
    }
  });
  it('has no duplicate name+country', () => {
    const keys = caps.map((c) => `${c.name}|${c.country}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
  it('is at most 60 KB', () => {
    expect(statSync(PATH).size).toBeLessThanOrEqual(60_000);
  });
  it('every capital belongs to a country in the India-POV country list', () => {
    const countries = JSON.parse(readFileSync('public/data/countries.json', 'utf8')) as { id: string }[];
    const ids = new Set(countries.map((c) => c.id));
    expect(caps.filter((c) => !ids.has(c.country)).map((c) => `${c.name}:${c.country}`)).toEqual([]);
  });
  it('follows the India-POV file: no capital for countries it does not separate (Kosovo, Somaliland, W. Sahara)', () => {
    const names = caps.map((c) => c.name);
    for (const n of ['Pristina', 'Hargeisa', 'Bir Lehlou']) expect(names).not.toContain(n);
  });
  it('maps South Sudan to the same id as the borders (SDS)', () => {
    expect(caps.find((c) => c.name === 'Juba')?.country).toBe('SDS');
  });
  it('has clean names (no NUL padding or stray whitespace)', () => {
    expect(caps.filter((c) => c.name !== c.name.replace(/\0/g, '').trim() || !c.name).length).toBe(0);
  });
});
