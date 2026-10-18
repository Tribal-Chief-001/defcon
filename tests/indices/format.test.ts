import { describe, expect, it } from 'vitest';
import { interval, pct } from '../../src/indices/format';

describe('indices format', () => {
  it('words a probability with extremes as markers', () => {
    expect(pct(0.9997)).toBe('>99.9%');
    expect(pct(0.0004)).toBe('<0.1%');
    expect(pct(0.25)).toBe('25%');
    expect(pct(0.005)).toBe('0.5%');
  });
  it('words an interval, and never prints "100.0 to 100.0%" next to ">99.9%" (finding)', () => {
    expect(interval({ p: 0.25, lo: 0.1, hi: 0.4 })).toBe('90% interval 10 to 40%');
    expect(interval({ p: 0.9997, lo: 0.9994, hi: 0.9999 })).toBe('90% interval above 99.9%');
    expect(interval({ p: 0.0002, lo: 0.0001, hi: 0.0004 })).toBe('90% interval below 0.1%');
    expect(interval({ p: 0.995, lo: 0.98, hi: 0.9999 })).toBe('90% interval 98 to >99.9%');
  });
});
