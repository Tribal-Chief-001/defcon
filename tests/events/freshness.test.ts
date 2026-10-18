import { describe, expect, it } from 'vitest';
import { freshness } from '../../src/events/freshness';

const NOW = Date.UTC(2026, 9, 18, 5, 0, 0) / 1000;

describe('freshness', () => {
  // thresholds follow the 3-hour publish cadence (D-047): live up to 4 h, recent up to 12 h
  it.each([
    [10 * 60, 'live'],
    [3 * 3600 + 59 * 60, 'live'],
    [4 * 3600, 'live'],
    [4 * 3600 + 60, 'recent'],
    [11 * 3600, 'recent'],
    [12 * 3600, 'recent'],
    [12 * 3600 + 60, 'stale'],
    [30 * 3600, 'stale'],
  ])('%i seconds old -> %s', (age, state) => {
    expect(freshness(NOW - age, NOW).state).toBe(state);
  });
  it('labels in UTC', () => {
    expect(freshness(Date.UTC(2026, 9, 18, 4, 15, 0) / 1000, NOW).label).toBe('DATA AS OF 04:15 UTC');
  });
  it('treats a future time (clock skew) as live', () => {
    expect(freshness(NOW + 600, NOW).state).toBe('live');
  });
  it('does not throw for a non-finite time and reports stale', () => {
    expect(freshness(NaN, NOW)).toEqual({ state: 'stale', label: 'DATA AS OF --:-- UTC' });
  });
});
