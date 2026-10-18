import { beforeEach, describe, expect, it } from 'vitest';
import { MAX_BACK_S, playheadS, useTime, visibleAt } from '../../src/time/store';

beforeEach(() => useTime.setState({ backS: 0, playing: false }));

describe('useTime', () => {
  it('clamps setBack to 0..365 days and ignores non-finite values', () => {
    useTime.getState().setBack(-5);
    expect(useTime.getState().backS).toBe(0);
    useTime.getState().setBack(1e12);
    expect(useTime.getState().backS).toBe(MAX_BACK_S);
    expect(MAX_BACK_S).toBe(365 * 86400);
    useTime.getState().setBack(1000);
    useTime.getState().setBack(NaN);
    expect(useTime.getState().backS).toBe(1000);
  });
  it('goLive resets the playhead and stops playback', () => {
    useTime.setState({ backS: 5000, playing: true });
    useTime.getState().goLive();
    expect(useTime.getState()).toMatchObject({ backS: 0, playing: false });
  });
  it('rounds nothing: a fractional back value is kept', () => {
    useTime.getState().setBack(12.5);
    expect(useTime.getState().backS).toBe(12.5);
  });
});

describe('time helpers', () => {
  it('playheadS subtracts backS from now', () => {
    expect(playheadS(100, 40)).toBe(60);
    expect(playheadS(100, 0)).toBe(100);
  });
  it('an event is visible once the playhead has reached it (age at the playhead is not negative)', () => {
    expect(visibleAt(0, 0)).toBe(true);
    expect(visibleAt(100, 40)).toBe(true);
    expect(visibleAt(100, 100)).toBe(true);
    expect(visibleAt(100, 101)).toBe(false);
    expect(visibleAt(Number.NaN, 0)).toBe(false);
  });
});
