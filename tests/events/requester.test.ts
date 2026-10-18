import { describe, expect, it } from 'vitest';
import { createRequester } from '../../src/events/requester';
import type { WorkerReply } from '../../src/events/workerCore';

const fakeTimers = () => {
  let id = 0;
  const q = new Map<number, () => void>();
  return {
    setTimeout: ((fn: () => void) => (q.set(++id, fn), id)) as unknown as typeof setTimeout,
    clearTimeout: ((i: number) => void q.delete(i)) as unknown as typeof clearTimeout,
    fireAll: () => [...q.values()].forEach((f) => f()),
    count: () => q.size,
  };
};
const snapReply = (name: string): WorkerReply => ({ type: 'unchanged', name });

// review finding: a hung or crashed worker must never leave the poller waiting forever
describe('createRequester', () => {
  it('resolves a request with the worker reply for that name and clears its timer', async () => {
    const t = fakeTimers();
    const sent: unknown[] = [];
    const r = createRequester((m) => sent.push(m), 1000, t);
    const p = r.request({ type: 'load', base: '/d', name: 'recent' });
    r.onReply(snapReply('recent'));
    expect(await p).toEqual({ type: 'unchanged', name: 'recent' });
    expect(sent).toHaveLength(1);
    expect(t.count()).toBe(0);
  });
  it('resolves with a timeout error when no reply arrives, and ignores a late reply', async () => {
    const t = fakeTimers();
    const r = createRequester(() => {}, 1000, t);
    const p = r.request({ type: 'load', base: '/d', name: 'archive' });
    t.fireAll();
    expect(await p).toMatchObject({ type: 'error', name: 'archive', reason: expect.stringMatching(/timed out/) });
    r.onReply(snapReply('archive')); // late: must not throw
  });
  it('failAll resolves every pending request with the reason (worker crash)', async () => {
    const t = fakeTimers();
    const r = createRequester(() => {}, 1000, t);
    const a = r.request({ type: 'load', base: '/d', name: 'recent' });
    const b = r.request({ type: 'load', base: '/d', name: 'archive' });
    r.failAll('event worker crashed');
    expect(await a).toMatchObject({ type: 'error', reason: 'event worker crashed' });
    expect(await b).toMatchObject({ type: 'error', name: 'archive' });
    expect(t.count()).toBe(0);
  });
});
