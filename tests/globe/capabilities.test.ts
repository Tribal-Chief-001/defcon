import { describe, expect, it } from 'vitest';
import { hasWebGL2 } from '../../src/globe/capabilities';

// Review Focus 3: no WebGL2 must be detected, not crash.
describe('hasWebGL2', () => {
  it('is false when getContext returns null', () => {
    expect(hasWebGL2(() => ({ getContext: () => null }))).toBe(false);
  });
  it('is true when getContext returns a context', () => {
    expect(hasWebGL2(() => ({ getContext: () => ({}) }))).toBe(true);
  });
  it('asks for webgl2 specifically', () => {
    let asked = '';
    hasWebGL2(() => ({ getContext: (id: string) => ((asked = id), null) }));
    expect(asked).toBe('webgl2');
  });
  it('is false (not a throw) when getContext throws', () => {
    expect(
      hasWebGL2(() => ({
        getContext: () => {
          throw new Error('blocked');
        },
      })),
    ).toBe(false);
  });
});
