import { describe, expect, it } from 'vitest';
import { createFrameStats } from '../../src/dev/frameStats';

const run = (stats: ReturnType<typeof createFrameStats>, deltas: number[], t0 = 0) => {
  let t = t0;
  stats.tick(t);
  for (const d of deltas) stats.tick((t += d));
  return t;
};

describe('createFrameStats', () => {
  it('reports about 60 fps and 16.7 ms p95 for steady 60 Hz frames', () => {
    const s = createFrameStats(120);
    run(s, Array(120).fill(1000 / 60));
    expect(Math.abs(s.fps() - 60)).toBeLessThan(0.5);
    expect(Math.abs(s.p95FrameMs() - 16.7)).toBeLessThan(0.1);
  });
  it('returns 0 before two ticks have arrived', () => {
    const s = createFrameStats(10);
    expect(s.fps()).toBe(0);
    s.tick(100);
    expect(s.p95FrameMs()).toBe(0);
  });
  it('one spike in a 20-frame window does not move p95, two do', () => {
    const one = createFrameStats(20);
    run(one, [...Array(19).fill(16.667), 100]);
    expect(one.p95FrameMs()).toBeLessThan(17);
    const two = createFrameStats(20);
    run(two, [...Array(18).fill(16.667), 100, 100]);
    expect(two.p95FrameMs()).toBeGreaterThan(90);
  });
  it('forgets a spike once it leaves the window', () => {
    const s = createFrameStats(20);
    run(s, [100, 100, ...Array(30).fill(16.667)]);
    expect(s.p95FrameMs()).toBeLessThan(17);
  });
});
