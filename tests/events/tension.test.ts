import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { TENSION, levelFromScore, tension } from '../../src/events/tension';
import { decodeSnapshot, type Snapshot, type SnapshotMeta } from '../../src/events/snapshot';
import { encodeSnapshot } from '../../scripts/events/encode';
import type { Ev } from '../../src/events/types';

const DAY = 86400;
const NOW = Date.UTC(2026, 9, 18, 12) / 1000;
const ev = (id: string, o: Partial<Ev> = {}): Ev => ({
  id, source: 'ucdp', alsoIds: [], timeS: NOW - DAY, lat: 1, lon: 2, precision: 1, country: 'IND', kind: 'armed', deaths: 3, severity: 3, human: true,
  place: '', headline: '', actors: '', sources: [], firstSeenS: NOW, updatedS: NOW, ...o,
});
const snap = (events: Ev[]): Snapshot => {
  const e = encodeSnapshot(events, { asOfS: NOW, generatedS: NOW, sources: [] });
  return decodeSnapshot(e.bin.buffer.slice(e.bin.byteOffset, e.bin.byteOffset + e.bin.byteLength) as ArrayBuffer, e.meta);
};

describe('tension', () => {
  it('is level 1 with score 0 when there are no events, and not comparable', () => {
    expect(tension(snap([]), NOW)).toEqual({ level: 1, score: 0, humanShare: 0, comparable: false });
  });
  it('ignores events older than the window and events in the future', () => {
    expect(tension(snap([ev('old', { timeS: NOW - (TENSION.windowDays + 1) * DAY })]), NOW).score).toBe(0);
    expect(tension(snap([ev('future', { timeS: NOW + 3600 })]), NOW).score).toBe(0);
  });
  it('never decreases when an event is added or its severity rises', () => {
    const one = tension(snap([ev('a')]), NOW).score;
    const two = tension(snap([ev('a'), ev('b', { lat: 5 })]), NOW).score;
    const worse = tension(snap([ev('a', { severity: 5 })]), NOW).score;
    expect(two).toBeGreaterThan(one);
    expect(worse).toBeGreaterThan(one);
  });
  it('weights a human-coded event exactly 1 / autoMultiplier times an identical auto-coded one', () => {
    const h = tension(snap([ev('a', { human: true })]), NOW).score;
    const a = tension(snap([ev('a', { human: false })]), NOW).score;
    expect(h / a).toBeCloseTo(1 / TENSION.autoMultiplier, 9);
  });
  it('orders kinds civilian > armed > riot > protest for the same severity', () => {
    const s = (kind: Ev['kind']) => tension(snap([ev('a', { kind })]), NOW).score;
    expect(s('civilian')).toBeGreaterThan(s('armed'));
    expect(s('armed')).toBeGreaterThan(s('riot'));
    expect(s('riot')).toBeGreaterThan(s('protest'));
    expect(s('other')).toBe(0);
  });
  it('decays by half every halfLifeDays', () => {
    const fresh = tension(snap([ev('a', { timeS: NOW })]), NOW).score;
    const aged = tension(snap([ev('a', { timeS: NOW - TENSION.halfLifeDays * DAY })]), NOW).score;
    expect(aged / fresh).toBeCloseTo(0.5, 9);
  });
  it('scopes to one country', () => {
    const s = snap([ev('a', { country: 'IND' }), ev('b', { country: 'PAK', lat: 9 })]);
    const both = tension(s, NOW).score;
    const ind = tension(s, NOW, { country: 'IND' }).score;
    const none = tension(s, NOW, { country: 'FRA' }).score;
    expect(ind).toBeCloseTo(both / 2, 9);
    expect(none).toBe(0);
  });
});

// Found on the real data: calibrated on UCDP, the GDELT-only last 30 days scored global level 5 and the USA level 4 while
// Ukraine and Sudan scored 1 (GDELT is US-centric local news with noisy "armed" codes). Auto-coded-only windows are not comparable.
describe('comparability', () => {
  it('is comparable for a window of human-coded events', () => {
    const r = tension(snap([ev('a'), ev('b', { lat: 5 })]), NOW);
    expect(r.humanShare).toBe(1);
    expect(r.comparable).toBe(true);
  });
  it('is not comparable for a window of auto-coded events only', () => {
    const r = tension(snap([ev('a', { human: false }), ev('b', { human: false, lat: 5 })]), NOW);
    expect(r.humanShare).toBe(0);
    expect(r.comparable).toBe(false);
  });
  it('needs at least half of the score from human-coded events', () => {
    const humanOne = ev('h', { severity: 3 });
    const autoMany = Array.from({ length: 10 }, (_, i) => ev(`a${i}`, { human: false, lat: 10 + i }));
    expect(tension(snap([humanOne, ...autoMany]), NOW).comparable).toBe(false);
    expect(tension(snap([humanOne, ev('a1', { human: false, lat: 30 })]), NOW).comparable).toBe(true);
  });
});

describe('levelFromScore', () => {
  it('is an integer in 1..5 for 10,000 random scores and for odd values', () => {
    let s = 5;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 10_000; i++) {
      const l = levelFromScore(rnd() * 10 ** (rnd() * 12));
      expect(Number.isInteger(l) && l >= 1 && l <= 5).toBe(true);
    }
    for (const odd of [NaN, -1, Infinity, -Infinity, 0]) expect([1, 5]).toContain(levelFromScore(odd));
  });
  it('rises monotonically with the score', () => {
    let prev = 1;
    for (let sc = 0; sc < TENSION.scale * 30; sc += TENSION.scale / 10) {
      const l = levelFromScore(sc);
      expect(l).toBeGreaterThanOrEqual(prev);
      prev = l;
    }
  });
});

// The scale is calibrated so that the typical (median) 7-day score of the UCDP archive is level 2 or 3.
describe.skipIf(!existsSync('public/data/events/archive.bin'))('calibration on the real archive', () => {
  it('gives a median daily level of 2 or 3', () => {
    const meta = JSON.parse(readFileSync('public/data/events/archive.meta.json', 'utf8')) as SnapshotMeta;
    const b = readFileSync('public/data/events/archive.bin');
    const archive = decodeSnapshot(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer, meta);
    const levels: number[] = [];
    const lastEvent = Math.max(...archive.timeS); // UCDP data ends before the archive window does
    for (let t = meta.windowFromS + TENSION.windowDays * DAY; t <= lastEvent; t += DAY) levels.push(tension(archive, t).level);
    levels.sort((x, y) => x - y);
    expect([2, 3]).toContain(levels[levels.length >> 1]);
  });
});
