import { describe, expect, it } from 'vitest';
import { activityTrend } from '../../scripts/conflicts/trend';

describe('activityTrend (events in the last 30 days against the average 30 days of the 60 before)', () => {
  it('is rising at 1.5x and at least 5 events, including when nothing came before', () => {
    expect(activityTrend(10, 14)).toBe('rising'); // 10 vs 2 per 30 days
    expect(activityTrend(8, 8)).toBe('rising'); // nothing before: not NaN or Infinity
  });
  it('is falling at half or less with a base of at least 5', () => {
    expect(activityTrend(2, 22)).toBe('falling'); // 2 vs 10
  });
  it('is steady in between and "low data" under 5 events to compare', () => {
    expect(activityTrend(6, 18)).toBe('steady'); // 6 vs 6
    expect(activityTrend(3, 3)).toBe('low data');
    expect(activityTrend(0, 0)).toBe('low data');
  });
  it('is safe for bad input', () => {
    expect(activityTrend(Number.NaN, 5)).toBe('low data');
    expect(activityTrend(-1, -5)).toBe('low data');
  });
});
