import { describe, expect, it } from 'vitest';
import { freshness } from '../../src/events/freshness';

const NOW = Date.UTC(2026, 9, 18, 5, 0, 0) / 1000;

describe('freshness', () => {
  it.each([
    [10 * 60, 'live'],
    [45 * 60, 'live'],
    [46 * 60, 'recent'],
    [2 * 3600, 'recent'],
    [3 * 3600, 'recent'],
    [3 * 3600 + 1, 'stale'],
    [5 * 3600, 'stale'],
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
