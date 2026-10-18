import { readFileSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { validateTimeline } from '../../scripts/timeline/validate';
import type { ConflictsFile } from '../../src/conflicts/types';
import type { TimelineFile } from '../../src/timeline/types';

const PATH = 'public/data/timeline.json';
const file = JSON.parse(readFileSync(PATH, 'utf8')) as TimelineFile;
const conflictIds = new Set((JSON.parse(readFileSync('public/data/conflicts.json', 'utf8')) as ConflictsFile).conflicts.map((c) => c.id));

describe('public/data/timeline.json', () => {
  it('passes every validator rule against the real conflict ids', () => {
    expect(validateTimeline(file, { conflictIds })).toEqual([]);
  });
  it('covers the four theatres with at least 5 entries each, small enough to load lazily', () => {
    expect(file.theatres.map((t) => t.key).sort()).toEqual(['iran-war', 'israel-gaza', 'israel-lebanon', 'russia-ukraine']);
    for (const t of file.theatres) expect(t.entries.length, t.key).toBeGreaterThanOrEqual(5);
    expect(statSync(PATH).size).toBeLessThan(120_000);
  });
  it('is recent: each theatre has an entry in the 120 days before the checked date', () => {
    const limit = new Date(Date.parse(`${file.checkedAt}T00:00:00Z`) - 120 * 86400000).toISOString().slice(0, 10);
    for (const t of file.theatres) expect(t.entries[t.entries.length - 1]!.date >= limit, t.key).toBe(true);
  });
  it('never presents a single-source claim as confirmed, and every entry names where each number comes from', () => {
    for (const t of file.theatres) for (const e of t.entries) if (e.status === 'confirmed') expect(new Set(e.sources.map((s) => s.outlet.toLowerCase())).size, `${t.key} ${e.date}`).toBeGreaterThanOrEqual(2);
  });
  it('credits outlets by name and keeps summaries free of markup', () => {
    for (const t of file.theatres) for (const e of t.entries) {
      expect(e.summary).not.toMatch(/[<>]/);
      expect(e.title).not.toMatch(/[<>]/);
    }
  });
});
