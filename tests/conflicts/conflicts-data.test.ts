import { readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import type { ConflictsFile, Range } from '../../src/conflicts/types';

const PATH = 'public/data/conflicts.json';
const file = JSON.parse(readFileSync(PATH, 'utf8')) as ConflictsFile;
const ok = (r: Range) => [r.best, r.low, r.high].every((v) => Number.isFinite(v) && v >= 0) && r.low <= r.best && r.best <= r.high;

describe('public/data/conflicts.json', () => {
  it('has a valid header and a plausible number of conflicts', () => {
    expect(file.dataEnd).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(file.generated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(file.sources.length).toBeGreaterThan(0);
    expect(file.conflicts.length).toBeGreaterThanOrEqual(10);
    expect(statSync(PATH).size).toBeLessThan(700_000); // served gzipped and loaded only when the page opens
    expect(gzipSync(readFileSync(PATH)).length).toBeLessThan(150_000);
  });
  it('contains the big wars of the UCDP data', () => {
    const names = file.conflicts.map((c) => c.name);
    expect(names).toContain('Russia - Ukraine');
    expect(names.some((n) => /Israel/.test(n))).toBe(true);
  });
  it('has consistent ranges, windows and shapes for every conflict', () => {
    const ids = new Set<string>();
    for (const c of file.conflicts) {
      expect(c.id).toMatch(/^[a-z0-9-]{1,60}$/);
      expect(ids.has(c.id)).toBe(false);
      ids.add(c.id);
      for (const w of ['d30', 'd90', 'd365'] as const) expect(ok(c.deaths[w]), `${c.id} ${w}`).toBe(true);
      expect(c.deaths.d30.best).toBeLessThanOrEqual(c.deaths.d90.best);
      expect(c.deaths.d90.best).toBeLessThanOrEqual(c.deaths.d365.best);
      expect(c.events.d30).toBeLessThanOrEqual(c.events.d90);
      expect(c.events.d90).toBeLessThanOrEqual(c.events.d365);
      expect(c.weekly).toHaveLength(52);
      expect(c.weekly.every((v) => Number.isFinite(v) && v >= 0)).toBe(true);
      const weeks = c.weekly.reduce((s, v) => s + v, 0);
      expect(weeks).toBeLessThanOrEqual(c.deaths.d365.best + 26); // the weekly chart covers 364 days, the total 365; 52 weeks and the total are rounded separately (up to half a death each)
      expect(c.latest.length).toBeLessThanOrEqual(12);
      expect(c.provisionalShare).toBeGreaterThanOrEqual(0);
      expect(c.provisionalShare).toBeLessThanOrEqual(1);
      expect(c.lastDate <= file.dataEnd).toBe(true);
      for (const e of c.latest) {
        expect(e.date <= file.dataEnd).toBe(true);
        expect(ok(e.deaths)).toBe(true);
        expect(Number.isFinite(e.lat) && Number.isFinite(e.lon)).toBe(true);
      }
    }
  });
  it('is sorted by 90-day deaths', () => {
    const d = file.conflicts.map((c) => c.deaths.d90.best);
    expect(d).toEqual([...d].sort((a, b) => b - a));
  });

  it('has a consistent world overview', () => {
    const w = file.world;
    for (const k of ['d30', 'd90', 'd365'] as const) expect(ok(w.deaths[k]), `world ${k}`).toBe(true);
    expect(w.deaths.d30.best).toBeLessThanOrEqual(w.deaths.d90.best);
    expect(w.deaths.d90.best).toBeLessThanOrEqual(w.deaths.d365.best);
    for (const w2 of ['d90', 'd365'] as const) {
      const sum = (['state', 'non-state', 'one-sided'] as const).reduce((s, k) => s + w.byKind[k][w2].best, 0);
      expect(sum).toBe(w.deaths[w2].best);
    }
    expect(w.weekly).toHaveLength(52);
    expect(w.weekly.reduce((s, v) => s + v, 0)).toBeLessThanOrEqual(w.deaths.d365.best + 26); // 52 weeks rounded separately from the total
    expect(w.conflictsListed).toBe(file.conflicts.length);
    expect(file.conflicts.reduce((s, c) => s + c.deaths.d365.best, 0)).toBeLessThanOrEqual(w.deaths.d365.best + Math.ceil(file.conflicts.length / 2)); // each conflict total is rounded separately // the world also holds the small conflicts
    expect(w.countries.length).toBeLessThanOrEqual(12);
    const d = w.countries.map((c) => c.deaths90);
    expect(d).toEqual([...d].sort((a, b) => b - a));
    expect(w.latest.length).toBeLessThanOrEqual(20);
    expect(w.latest.map((e) => e.date)).toEqual([...w.latest.map((e) => e.date)].sort().reverse());
    expect(file.conflicts.some((c) => c.id === 'world')).toBe(false);
  });

  it('has geography for every conflict with a located event, inside valid ranges', () => {
    let withGeo = 0;
    for (const c of file.conflicts) {
      if (!c.geo) continue;
      withGeo++;
      expect(Math.abs(c.geo.lat), c.id).toBeLessThanOrEqual(90);
      expect(Math.abs(c.geo.lon), c.id).toBeLessThanOrEqual(180);
      expect(c.geo.spreadKm).toBeGreaterThanOrEqual(40);
      expect(c.geo.spreadKm).toBeLessThanOrEqual(2500);
      expect(c.geo.cells.length).toBeLessThanOrEqual(40);
      expect(c.geo.locatedShare).toBeGreaterThanOrEqual(0);
      expect(c.geo.locatedShare).toBeLessThanOrEqual(1);
      const d = c.geo.cells.map((x) => x[2]);
      expect(d).toEqual([...d].sort((a, b) => b - a));
      for (const [la, lo, dd] of c.geo.cells) {
        expect(Math.abs(la)).toBeLessThanOrEqual(90);
        expect(Math.abs(lo)).toBeLessThanOrEqual(180);
        expect(dd).toBeGreaterThanOrEqual(3);
      }
    }
    expect(withGeo).toBeGreaterThan(file.conflicts.length * 0.9);
    const ukraine = file.conflicts.find((c) => c.name === 'Russia - Ukraine')!;
    expect(ukraine.geo!.lat).toBeGreaterThan(44);
    expect(ukraine.geo!.lat).toBeLessThan(52);
    expect(ukraine.geo!.lon).toBeGreaterThan(30);
    expect(ukraine.geo!.lon).toBeLessThan(42);
    // the whole-country geocode (49.0, 32.0) holds most of the deaths in the raw data: it must not become the picture of the conflict
    expect(ukraine.geo!.cells.every((c) => !(c[0] === 49.25 && c[1] === 32.25 && c[2] > 20000))).toBe(true);
    expect(ukraine.geo!.locatedShare).toBeLessThan(0.5);
  });
  it('has weekly-by-kind series that add up to the weekly total', () => {
    const w = file.world;
    for (let i = 0; i < 52; i++) expect(w.weeklyByKind.state[i]! + w.weeklyByKind['non-state'][i]! + w.weeklyByKind['one-sided'][i]!).toBe(w.weekly[i]);
  });
});
