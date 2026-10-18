import { describe, expect, it } from 'vitest';
import { redactionFor } from '../../src/ui/redaction';

const DAY = 86400;
describe('redactionFor (declassification progress: 0 = fully barred, 1 = declassified)', () => {
  it('is 0 for an event under 24 h old at the playhead and 1 from 14 days on', () => {
    expect(redactionFor(0)).toBe(0);
    expect(redactionFor(DAY)).toBe(0);
    expect(redactionFor(14 * DAY)).toBe(1);
    expect(redactionFor(400 * DAY)).toBe(1);
  });
  it('rises monotonically in between', () => {
    let prev = -1;
    for (let d = 0; d <= 15; d += 0.5) {
      const v = redactionFor(d * DAY);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
    expect(redactionFor(7.5 * DAY)).toBeCloseTo(0.5, 2);
  });
  it('shows no bars (1) for non-finite input and treats a negative age as fresh', () => {
    expect(redactionFor(NaN)).toBe(1);
    expect(redactionFor(Infinity)).toBe(1);
    expect(redactionFor(-100)).toBe(0);
  });
});
