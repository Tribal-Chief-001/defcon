import { describe, expect, it } from 'vitest';
import { createFocusQueue } from '../../src/globe/focusQueue';

const v = (n: number) => ({ lat: n, lon: n, distance: 2 });

describe('createFocusQueue (a flight asked for before the boot ends waits; a withdrawn request does not fly later)', () => {
  it('flies at once when the boot is done and queues nothing', () => {
    const q = createFocusQueue();
    expect(q.request(v(1), true)).toEqual(v(1));
    expect(q.take(true)).toBeNull();
  });
  it('queues a request made during the boot and hands it out once when the boot ends', () => {
    const q = createFocusQueue();
    expect(q.request(v(1), false)).toBeNull();
    expect(q.take(false)).toBeNull(); // still booting
    expect(q.take(true)).toEqual(v(1));
    expect(q.take(true)).toBeNull();
  });
  it('replaces an older queued request with the newest one', () => {
    const q = createFocusQueue();
    q.request(v(1), false);
    q.request(v(2), false);
    expect(q.take(true)).toEqual(v(2));
  });
  it('drops a queued request when it is withdrawn (finding: pendingFocus survived focus(null) after the room closed)', () => {
    const q = createFocusQueue();
    q.request(v(1), false);
    expect(q.request(null, false)).toBeNull();
    expect(q.take(true)).toBeNull();
  });
  it('ignores a view with a non-finite coordinate', () => {
    const q = createFocusQueue();
    expect(q.request({ lat: Number.NaN, lon: 1, distance: 2 }, true)).toBeNull();
    q.request({ lat: 1, lon: Number.POSITIVE_INFINITY, distance: 2 }, false);
    expect(q.take(true)).toBeNull();
  });
});
