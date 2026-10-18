import { describe, expect, it } from 'vitest';
import { startTier } from '../../src/perf/device';

describe('startTier', () => {
  it('is high on a desktop with a fine pointer and normal hardware', () => {
    expect(startTier({ coarse: false, narrow: false, memoryGb: 8, cores: 8 })).toBe('high');
    expect(startTier({ coarse: false, narrow: false })).toBe('high'); // unknown hardware
  });
  it('is medium for a coarse pointer or a narrow screen', () => {
    expect(startTier({ coarse: true, narrow: false, memoryGb: 8, cores: 8 })).toBe('medium');
    expect(startTier({ coarse: false, narrow: true, memoryGb: 8, cores: 8 })).toBe('medium');
  });
  it('is low on a weak device (2 GB or less memory, 2 or fewer cores)', () => {
    expect(startTier({ coarse: true, narrow: true, memoryGb: 2 })).toBe('low');
    expect(startTier({ coarse: false, narrow: false, cores: 2 })).toBe('low');
    expect(startTier({ coarse: false, narrow: false, memoryGb: 4, cores: 4 })).toBe('high');
  });
  it('ignores non-finite or zero hardware numbers', () => {
    expect(startTier({ coarse: false, narrow: false, memoryGb: NaN, cores: 0 })).toBe('high');
  });
});
