import { describe, expect, it } from 'vitest';
import { TIERS, createQualityGovernor, type Tier } from '../../src/perf/quality';

// A fake clock that advances by each frame's duration.
const rig = (start: Tier) => {
  let t = 0;
  const g = createQualityGovernor({ start, now: () => t });
  const feed = (ms: number, n: number) => {
    let last: Tier = g.tier();
    for (let i = 0; i < n; i++) {
      t += ms;
      last = g.sample(ms);
    }
    return last;
  };
  return { g, feed, advance: (ms: number) => (t += ms) };
};

describe('TIERS', () => {
  it('lowers every knob from high to low', () => {
    expect(TIERS.high).toEqual({ pixelRatio: 2, grain: 1, labelCap: 40, arcSegments: 48, terminator: true, densityHz: 4 });
    expect(TIERS.medium).toEqual({ pixelRatio: 1.5, grain: 0.5, labelCap: 24, arcSegments: 32, terminator: true, densityHz: 2 });
    expect(TIERS.low).toEqual({ pixelRatio: 1, grain: 0, labelCap: 12, arcSegments: 16, terminator: false, densityHz: 0 });
  });
});

describe('createQualityGovernor', () => {
  it('stays on the starting tier while frames are fast', () => {
    const { feed, g } = rig('high');
    feed(12, 600);
    expect(g.tier()).toBe('high');
  });
  it('steps down one tier after a slow window, not twice within 4 s, and again after 4 s of continued slowness', () => {
    const { feed, g } = rig('high');
    feed(30, 90);
    expect(g.tier()).toBe('medium');
    feed(30, 90); // 2.7 s later: too soon
    expect(g.tier()).toBe('medium');
    feed(30, 90); // now over 4 s since the change
    expect(g.tier()).toBe('low');
    feed(30, 300);
    expect(g.tier()).toBe('low'); // the floor
  });
  it('steps back up one tier only after 10 s of fast frames', () => {
    const { feed, g } = rig('high');
    feed(30, 90);
    expect(g.tier()).toBe('medium');
    feed(10, 500); // 5 s: not yet
    expect(g.tier()).toBe('medium');
    feed(10, 700); // 12 s total
    expect(g.tier()).toBe('high');
  });
  it('ignores a long spike (tab switch or hitch)', () => {
    const { feed, g } = rig('high');
    feed(12, 60);
    feed(300, 40);
    feed(12, 60);
    expect(g.tier()).toBe('high');
  });
  it('never rises above the starting tier', () => {
    const { feed, g } = rig('medium');
    feed(8, 3000);
    expect(g.tier()).toBe('medium');
  });
  it('does not flap on alternating fast and slow stretches', () => {
    const { feed, g } = rig('high');
    const changes: Tier[] = [];
    let prev = g.tier();
    for (let i = 0; i < 40; i++) {
      feed(i % 2 ? 30 : 10, 90);
      if (g.tier() !== prev) changes.push((prev = g.tier()));
    }
    // 40 stretches of 90 frames: 20 slow (2.7 s each) and 20 fast (0.9 s each) is about 72 s; a flap would change nearly every stretch
    expect(changes.length).toBeLessThanOrEqual(6);
  });
  it('treats non-finite and negative samples as no information', () => {
    const { g } = rig('high');
    for (let i = 0; i < 200; i++) g.sample(i % 2 ? NaN : -5);
    expect(g.tier()).toBe('high');
  });

  // review finding: on a 60 Hz display frames are ~16.7 ms, so recovery must work there too
  it('recovers on a 60 Hz display (16.7 ms frames) after a stall', () => {
    const { feed, g } = rig('high');
    feed(16.7, 120); // the display's own rhythm sets the baseline
    expect(g.tier()).toBe('high');
    feed(30, 90);
    expect(g.tier()).toBe('medium');
    feed(16.7, 1000); // 16 s of a healthy 60 Hz
    expect(g.tier()).toBe('high');
  });
  it('does not treat a permanently slow device as recovered (the baseline never loosens past the slow limit)', () => {
    const { feed, g } = rig('high');
    feed(30, 90);
    feed(30, 90);
    feed(30, 400);
    expect(g.tier()).toBe('low');
  });
  it('backs off: after a climb that is followed by a quick drop, the next climb needs twice as long', () => {
    const { feed, g } = rig('high');
    feed(16.7, 120);
    feed(30, 90);
    feed(16.7, 800); // 13 s: climbs back to high
    expect(g.tier()).toBe('high');
    feed(30, 150); // slow again right away (4.5 s)
    expect(g.tier()).toBe('medium');
    feed(16.7, 700); // 11.7 s is no longer enough
    expect(g.tier()).toBe('medium');
    feed(16.7, 800); // 25 s in total
    expect(g.tier()).toBe('high');
  });
});
