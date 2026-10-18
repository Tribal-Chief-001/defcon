import { describe, expect, it } from 'vitest';
import { dayNum, monthShares, share, spanOf } from '../../scripts/lib/spread';

const D = (s: string) => dayNum(s)!;
const LAST = D('2026-08-31');

describe('spanOf', () => {
  it('is one day without an end, with an empty or malformed end, or an end before the start', () => {
    for (const e of [undefined, '', 'soon', '2026-08-01']) expect(spanOf('2026-08-10 00:00:00.000', e, LAST)).toEqual({ start: D('2026-08-10'), end: D('2026-08-10'), len: 1 });
  });
  it('covers every day from the start to the end, inclusive', () => {
    expect(spanOf('2026-08-01 00:00:00.000', '2026-08-31 00:00:00.000', LAST)).toEqual({ start: D('2026-08-01'), end: LAST, len: 31 });
  });
  it('clips the end to the last day of data, so deaths are not placed after it', () => {
    expect(spanOf('2026-08-20', '2026-09-05', LAST)).toEqual({ start: D('2026-08-20'), end: LAST, len: 12 });
  });
  it('is null when the start is missing, malformed or after the last day', () => {
    expect(spanOf(undefined, undefined, LAST)).toBeNull();
    expect(spanOf('nope', '2026-08-31', LAST)).toBeNull();
    expect(spanOf('2026-09-01', '2026-09-30', LAST)).toBeNull();
  });
});

describe('share', () => {
  const month = spanOf('2026-08-01', '2026-08-31', LAST)!;
  it('is the fraction of the days inside the window', () => {
    expect(share(month, LAST - 29, LAST)).toBeCloseTo(30 / 31, 12); // the last 30 days
    expect(share(month, LAST - 89, LAST)).toBe(1);
    expect(share(month, D('2026-07-01'), D('2026-07-31'))).toBe(0);
  });
  it('gives all the weight to a one-day event inside the window and none outside', () => {
    const d = spanOf('2026-08-15', undefined, LAST)!;
    expect(share(d, LAST - 29, LAST)).toBe(1);
    expect(share(d, D('2026-08-16'), LAST)).toBe(0);
  });
  it('adds up to 1 over consecutive windows that cover the span', () => {
    const s = spanOf('2026-01-01', '2026-06-30', LAST)!;
    let t = 0;
    for (let lo = D('2026-01-01'); lo <= D('2026-06-30'); lo += 7) t += share(s, lo, lo + 6);
    expect(t).toBeCloseTo(1, 12);
  });
});

describe('monthShares', () => {
  it('splits a span over the months it covers by their days, adding up to 1', () => {
    const s = spanOf('2026-01-01', '2026-06-30', LAST)!;
    const m = monthShares(s);
    expect(m.map((x) => x.month)).toEqual([2026 * 12, 2026 * 12 + 1, 2026 * 12 + 2, 2026 * 12 + 3, 2026 * 12 + 4, 2026 * 12 + 5]);
    expect(m.reduce((t, x) => t + x.share, 0)).toBeCloseTo(1, 12);
    expect(m[1]!.share).toBeCloseTo(28 / 181, 12); // February
  });
  it('puts a one-day event wholly in its month', () => {
    expect(monthShares(spanOf('2026-08-15', undefined, LAST)!)).toEqual([{ month: 2026 * 12 + 7, share: 1 }]);
  });
});
