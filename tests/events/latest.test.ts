import { describe, expect, it } from 'vitest';
import { createLatest } from '../../src/events/latest';

describe('createLatest', () => {
  it('only the newest token is current', () => {
    const l = createLatest();
    const a = l.next();
    expect(l.isLatest(a)).toBe(true);
    const b = l.next();
    expect(l.isLatest(a)).toBe(false);
    expect(l.isLatest(b)).toBe(true);
  });
});
