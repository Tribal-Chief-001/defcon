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
      expect(weeks).toBeLessThanOrEqual(c.deaths.d365.best); // the weekly chart covers 364 days, the total 365
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
});
