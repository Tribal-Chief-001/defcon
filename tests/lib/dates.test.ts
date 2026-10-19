import { describe, expect, it } from 'vitest';
import { capDataEnd } from '../../scripts/lib/dates';

describe('capDataEnd (finding: one bad future date must not move the data end)', () => {
  it('keeps a data end that is not after today, and caps one that is', () => {
    expect(capDataEnd('2026-08-31', '2026-10-19')).toBe('2026-08-31');
    expect(capDataEnd('2026-10-19', '2026-10-19')).toBe('2026-10-19');
    expect(capDataEnd('2099-01-01', '2026-10-19')).toBe('2026-10-19');
  });
  it('returns an empty string for an empty or malformed data end, so the caller can fail', () => {
    expect(capDataEnd('', '2026-10-19')).toBe('');
    expect(capDataEnd('soon', '2026-10-19')).toBe('');
  });
});
