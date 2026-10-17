import { describe, expect, it } from 'vitest';
import { bootState, createBootControl } from '../../src/globe/boot';

const keys = ['dot', 'ring', 'equator', 'meridians', 'borders'] as const;

describe('bootState (timeline in ms: dot 0-400, ring 400-1200, equator 1000-1800, meridians 1600-2400, borders 2200-3200)', () => {
  it('starts with every channel at 0 and not done', () => {
    const s = bootState(0);
    for (const k of keys) expect(s[k]).toBe(0);
    expect(s.done).toBe(false);
  });
  it('ends with every channel at 1', () => {
    const s = bootState(4000);
    for (const k of keys) expect(s[k]).toBe(1);
  });
  it('keeps every channel inside 0..1 and non-decreasing', () => {
    const prev: Record<string, number> = Object.fromEntries(keys.map((k) => [k, 0]));
    for (let t = 0; t <= 4000; t += 50) {
      const s = bootState(t);
      for (const k of keys) {
        expect(s[k]).toBeGreaterThanOrEqual(0);
        expect(s[k]).toBeLessThanOrEqual(1);
        expect(s[k]).toBeGreaterThanOrEqual(prev[k]!);
        prev[k] = s[k];
      }
    }
  });
  it('runs the stages in order: ring starts after the dot, equator after the ring starts, borders last', () => {
    const s = bootState(700);
    expect(s.dot).toBe(1);
    expect(s.ring).toBeGreaterThan(0);
    expect(s.equator).toBe(0);
    expect(bootState(2000).meridians).toBeGreaterThan(0);
    expect(bootState(2000).borders).toBe(0);
  });
  it('is done at 3200 ms and not at 3199', () => {
    expect(bootState(3199).done).toBe(false);
    expect(bootState(3200).done).toBe(true);
  });
});

const store = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
};

describe('createBootControl', () => {
  // Review Focus 4: reduced motion skips the boot.
  it('is already done with reduced motion', () => {
    const c = createBootControl({ reducedMotion: true, now: () => 0 });
    expect(c.done).toBe(true);
    expect(c.state().borders).toBe(1);
  });
  it('plays once per session: a second control with the same storage is already done', () => {
    const s = store();
    const first = createBootControl({ reducedMotion: false, storage: s, now: () => 0 });
    expect(first.done).toBe(false);
    const second = createBootControl({ reducedMotion: false, storage: s, now: () => 0 });
    expect(second.done).toBe(true);
  });
  it('skip() finishes it immediately', () => {
    const c = createBootControl({ reducedMotion: false, now: () => 0 });
    c.skip();
    expect(c.done).toBe(true);
    expect(c.state().borders).toBe(1);
  });
  it('finishes by itself after 3200 ms', () => {
    let t = 1000;
    const c = createBootControl({ reducedMotion: false, now: () => t });
    t = 1000 + 1500;
    expect(c.done).toBe(false);
    t = 1000 + 3200;
    expect(c.state().done).toBe(true);
    expect(c.done).toBe(true);
  });
  it('still plays when storage throws', () => {
    const bad = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
    const c = createBootControl({ reducedMotion: false, storage: bad, now: () => 0 });
    expect(c.done).toBe(false);
  });
});
