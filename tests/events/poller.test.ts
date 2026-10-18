import { describe, expect, it } from 'vitest';
import { startPolling } from '../../src/events/poller';

const fakeTimers = () => {
  let id = 0;
  const q = new Map<number, { fn: () => void; ms: number }>();
  return {
    setTimeout: ((fn: () => void, ms: number) => (q.set(++id, { fn, ms }), id)) as unknown as typeof setTimeout,
    clearTimeout: ((i: number) => void q.delete(i)) as unknown as typeof clearTimeout,
    pending: () => [...q.values()],
    fireNext: async () => {
      const [k, v] = [...q.entries()][0]!;
      q.delete(k);
      v.fn();
      await Promise.resolve();
      await Promise.resolve();
    },
  };
};
const tick = () => new Promise((r) => setTimeout(r, 0));

describe('startPolling', () => {
  it('runs immediately, then schedules the next run only after the previous one finishes', async () => {
    const t = fakeTimers();
    let runs = 0;
    let release!: () => void;
    const load = () => new Promise<void>((r) => ((runs++, (release = r))));
    startPolling(load, 60_000, t);
    await t.fireNext(); // the initial 0 ms timer
    expect(runs).toBe(1);
    expect(t.pending()).toHaveLength(0); // slow load: nothing scheduled yet, so no overlap
    release();
    await tick();
    expect(t.pending().map((p) => p.ms)).toEqual([60_000]);
  });
  it('keeps polling after a load that throws', async () => {
    const t = fakeTimers();
    startPolling(async () => {
      throw new Error('boom');
    }, 1000, t);
    await t.fireNext();
    await tick();
    expect(t.pending()).toHaveLength(1);
  });
  it('stop() cancels the pending run and prevents rescheduling', async () => {
    const t = fakeTimers();
    let runs = 0;
    const stop = startPolling(async () => void runs++, 1000, t);
    await t.fireNext();
    await tick();
    stop();
    expect(t.pending()).toHaveLength(0);
    expect(runs).toBe(1);
  });
});
