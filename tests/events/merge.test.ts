import { describe, expect, it } from 'vitest';
import { mergeEvents } from '../../scripts/events/merge';
import type { Ev } from '../../src/events/types';

const DAY = 86400;
const T0 = Date.UTC(2026, 9, 18, 12, 0, 0) / 1000;
const g = (id: string, o: Partial<Ev> = {}): Ev => ({
  id: `gdelt:${id}`, source: 'gdelt', alsoIds: [], timeS: T0, lat: 35.75, lon: 51.51, precision: 2, country: null, kind: 'armed',
  deaths: null, severity: 2, human: false, place: 'Tehran', headline: '', actors: '', sources: [{ name: 'site.com', url: `https://site.com/a${id}` }],
  firstSeenS: T0, updatedS: T0, ...o,
});
const u = (id: string, o: Partial<Ev> = {}): Ev => ({
  id: `ucdp:${id}`, source: 'ucdp', alsoIds: [], timeS: T0 - 12 * 3600, lat: 35.8, lon: 51.6, precision: 1, country: null, kind: 'armed',
  deaths: 4, severity: 2, human: true, place: 'UCDP place', headline: 'UCDP headline', actors: 'A - B', sources: [{ name: 'Reuters' }],
  firstSeenS: T0, updatedS: T0, ...o,
});
const pick = (lat: number, lon: number) => (lat > 0 && lon > 0 ? 'IRN' : null);

describe('mergeEvents within GDELT (Review Focus 3)', () => {
  it('collapses rows for the same place, kind and day into one event with all ids', () => {
    const out = mergeEvents([g('3'), g('1'), g('2')], pick);
    expect(out).toHaveLength(1);
    expect(out[0]!.id).toBe('gdelt:1');
    expect(out[0]!.alsoIds).toEqual(['gdelt:2', 'gdelt:3']);
    expect(out[0]!.sources.map((s) => s.url).sort()).toEqual(['https://site.com/a1', 'https://site.com/a2', 'https://site.com/a3']);
  });
  it('caps merged sources at 5', () => {
    const many = Array.from({ length: 9 }, (_, i) => g(String(i + 1)));
    expect(mergeEvents(many, pick)[0]!.sources).toHaveLength(5);
  });
  it('keeps the highest severity of the merged rows', () => {
    expect(mergeEvents([g('1', { severity: 2 }), g('2', { severity: 3 })], pick)[0]!.severity).toBe(3);
  });
  it('merges the same article (same URL path) reported at two places of the same kind', () => {
    const a = g('1', { lat: 10, lon: 10, sources: [{ name: 's', url: 'https://s.com/x/story?utm=1' }] });
    const b = g('2', { lat: 12, lon: 12, sources: [{ name: 's', url: 'https://s.com/x/story?utm=2#top' }] });
    expect(mergeEvents([a, b], pick)).toHaveLength(1);
  });
  it('keeps events on different days, or of different kinds, separate', () => {
    expect(mergeEvents([g('1'), g('2', { timeS: T0 + DAY })], pick)).toHaveLength(2);
    expect(mergeEvents([g('1', { kind: 'protest' }), g('2', { kind: 'riot' })], pick)).toHaveLength(2);
  });
});

describe('mergeEvents across sources', () => {
  it('folds a nearby GDELT event into the UCDP event; UCDP wins every field', () => {
    const out = mergeEvents([u('7'), g('1')], pick);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ id: 'ucdp:7', human: true, deaths: 4, severity: 2, headline: 'UCDP headline', lat: 35.8 });
    expect(out[0]!.alsoIds).toEqual(['gdelt:1']);
    expect(out[0]!.sources.map((s) => s.name)).toEqual(['Reuters', 'site.com']);
  });
  it('folds a GDELT event one day away but not two days away', () => {
    expect(mergeEvents([u('7'), g('1', { timeS: T0 + DAY })], pick)).toHaveLength(1);
    expect(mergeEvents([u('7'), g('1', { timeS: T0 + 2 * DAY })], pick)).toHaveLength(2);
  });
  it('does not fold when more than 0.3 degrees away', () => {
    expect(mergeEvents([u('7'), g('1', { lat: 36.3 })], pick)).toHaveLength(2);
  });
  it('never folds protests or riots into armed UCDP events; civilian folds with armed class', () => {
    expect(mergeEvents([u('7'), g('1', { kind: 'protest' })], pick)).toHaveLength(2);
    expect(mergeEvents([u('7'), g('1', { kind: 'riot' })], pick)).toHaveLength(2);
    expect(mergeEvents([u('7'), g('1', { kind: 'civilian' })], pick)).toHaveLength(1);
  });
});

describe('mergeEvents countries and validity (Review Focus 4)', () => {
  it('assigns the country from the picker; open ocean stays null but the event is kept', () => {
    const out = mergeEvents([g('1'), g('2', { lat: 0, lon: -140, kind: 'riot' })], pick);
    expect(out.find((e) => e.id === 'gdelt:1')!.country).toBe('IRN');
    expect(out.find((e) => e.id === 'gdelt:2')!.country).toBeNull();
  });
  it('keeps an event exactly at the pole and antimeridian, drops NaN and out-of-range ones', () => {
    const out = mergeEvents(
      [g('1', { lat: 90, lon: 180 }), g('2', { lat: NaN }), g('3', { lon: Infinity }), g('4', { lat: 91 }), g('5', { timeS: NaN })],
      pick,
    );
    expect(out.map((e) => e.id)).toEqual(['gdelt:1']);
  });
  it('sorts by time then id', () => {
    const out = mergeEvents([g('b', { lat: 1, lon: 1, timeS: T0 + 5 }), g('a', { lat: 20, lon: 20, timeS: T0 + 5 }), g('c', { lat: 40, lon: 40, timeS: T0 })], pick);
    expect(out.map((e) => e.id)).toEqual(['gdelt:c', 'gdelt:a', 'gdelt:b']);
  });
  it('does not mutate its input', () => {
    const input = [g('1'), g('2')];
    const copy = JSON.stringify(input);
    mergeEvents(input, pick);
    expect(JSON.stringify(input)).toBe(copy);
  });
});

describe('mergeEvents performance', () => {
  it('merges 100,000 synthetic events fast enough (about 0.6 s of CPU; limit 3 s)', () => {
    let s = 3;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const kinds = ['armed', 'civilian', 'riot', 'protest'] as const;
    const evs: Ev[] = Array.from({ length: 100_000 }, (_, i) =>
      i % 5 === 0
        ? u(String(i), { lat: rnd() * 160 - 80, lon: rnd() * 340 - 170, timeS: T0 + Math.floor(rnd() * 30) * DAY })
        : g(String(i), { lat: rnd() * 160 - 80, lon: rnd() * 340 - 170, timeS: T0 + Math.floor(rnd() * 30) * DAY, kind: kinds[i % 4]!, sources: [{ name: 'x', url: `https://x.com/${i}` }] }),
    );
    mergeEvents(evs.slice(0, 20_000), pick); // warm up the JIT so the timing is stable under parallel test workers
    const c0 = process.cpuUsage();
    const out = mergeEvents(evs, pick);
    const c = process.cpuUsage(c0);
    // CPU time of this test process, so other test files competing for the CPU do not inflate it; an O(n^2) regression would take minutes
    expect((c.user + c.system) / 1000).toBeLessThan(3000);
    expect(out.length).toBeGreaterThan(50_000);
  });
});
