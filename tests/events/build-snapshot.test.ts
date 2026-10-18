import { describe, expect, it } from 'vitest';
import { buildSnapshots } from '../../scripts/events/build-snapshot';
import { dayKey } from '../../src/events/snapshot';
import type { Ev } from '../../src/events/types';

const DAY = 86400;
const NOW = Date.UTC(2026, 9, 18, 12, 0, 0) / 1000;
const ev = (id: string, timeS: number, o: Partial<Ev> = {}): Ev => ({
  id, source: 'ucdp', alsoIds: [], timeS, lat: 10, lon: 20, precision: 1, country: 'IND', kind: 'armed', deaths: 1, severity: 2, human: true,
  place: `place ${id}`, headline: '', actors: '', sources: [], firstSeenS: NOW, updatedS: NOW, ...o,
});
const sources = [
  { id: 'ucdp' as const, name: 'UCDP', version: 'x', asOfS: NOW - 40 * DAY, url: 'https://ucdp.uu.se', license: 'CC BY 4.0' },
  { id: 'gdelt' as const, name: 'GDELT', version: 'y', asOfS: NOW - 600, url: 'https://www.gdeltproject.org', license: 'free; cite' },
];

describe('buildSnapshots', () => {
  const events = [
    ev('old-dropped', NOW - 366 * DAY),
    ev('archive-oldest', NOW - 365 * DAY),
    ev('archive-newest', NOW - 30 * DAY - 1),
    ev('recent-boundary', NOW - 30 * DAY),
    ev('recent-now', NOW - 3600),
  ];
  const { recent, archive } = buildSnapshots({ events, nowS: NOW, sources });

  it('splits at 30 days: the boundary event is recent, older than 365 days is dropped', () => {
    expect(recent.meta.n).toBe(2);
    expect(archive.meta.n).toBe(2);
    const names = (e: typeof recent) => [...e.details.values()].flat().map((d) => d.place).sort();
    expect(names(recent)).toEqual(['place recent-boundary', 'place recent-now']);
    expect(names(archive)).toEqual(['place archive-newest', 'place archive-oldest']);
  });
  it('windows end at now (recent) and at the cut (archive); asOf is the newest source time', () => {
    expect(recent.meta.windowFromS).toBe(NOW - 30 * DAY);
    expect(recent.meta.windowToS).toBe(NOW);
    expect(archive.meta.windowFromS).toBe(NOW - 365 * DAY);
    expect(archive.meta.windowToS).toBe(NOW - 30 * DAY);
    expect(recent.meta.asOfS).toBe(NOW - 600);
    expect(archive.meta.asOfS).toBe(NOW - 600);
  });
  it('has a detail shard for every day that has events', () => {
    expect([...recent.details.keys()].sort()).toEqual([dayKey(NOW - 30 * DAY), dayKey(NOW - 3600)].sort());
  });
  it('carries the source list into both snapshots', () => {
    expect(recent.meta.sources.map((s) => s.id)).toEqual(['ucdp', 'gdelt']);
  });
  it('builds an empty archive without throwing', () => {
    const r = buildSnapshots({ events: [ev('x', NOW - 100)], nowS: NOW, sources });
    expect(r.archive.meta.n).toBe(0);
    expect(r.recent.meta.n).toBe(1);
  });
});
