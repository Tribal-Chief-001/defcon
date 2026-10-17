import { describe, expect, it } from 'vitest';
import { prefersReducedMotion } from '../../src/lib/motion';

describe('prefersReducedMotion', () => {
  it('is true when the media query matches', () => {
    expect(prefersReducedMotion(() => ({ matches: true }))).toBe(true);
  });
  it('is false when it does not', () => {
    expect(prefersReducedMotion(() => ({ matches: false }))).toBe(false);
  });
  it('asks for the reduce preference', () => {
    let q = '';
    prefersReducedMotion((s) => ((q = s), { matches: false }));
    expect(q).toBe('(prefers-reduced-motion: reduce)');
  });
  it('is false when matchMedia is unavailable', () => {
    expect(prefersReducedMotion(undefined)).toBe(false);
  });
});
