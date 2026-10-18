import { describe, expect, it } from 'vitest';
import { ageDays } from '../../scripts/timeline/age';

describe('ageDays', () => {
  it('counts whole days from the checked date to now', () => {
    expect(ageDays('2026-10-18', Date.UTC(2026, 9, 18, 15) / 1000)).toBe(0);
    expect(ageDays('2026-10-18', Date.UTC(2026, 10, 18, 1) / 1000)).toBe(31);
  });
  it('is NaN for a malformed date, so a check against a limit fails rather than passes', () => {
    expect(ageDays('soon', 0)).toBeNaN();
  });
});
