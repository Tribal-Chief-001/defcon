// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useEvents } from '../../src/events/store';
import { PulseBorder } from '../../src/ui/PulseBorder';

const reduce = (on: boolean) =>
  (window.matchMedia = ((q: string) => ({ matches: on && String(q).includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia);
beforeEach(() => useEvents.setState({ recent: undefined, archive: undefined, status: 'idle' }));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('PulseBorder', () => {
  it('renders a decorative canvas even when the 2d context is unavailable (jsdom)', () => {
    reduce(false);
    const { container } = render(<PulseBorder />);
    const c = container.querySelector('canvas')!;
    expect(c).toBeTruthy();
    expect(c.getAttribute('aria-hidden')).toBe('true');
  });
  it('starts no animation frame loop under reduced motion', () => {
    reduce(true);
    const raf = vi.fn();
    vi.stubGlobal('requestAnimationFrame', raf);
    render(<PulseBorder />);
    expect(raf).not.toHaveBeenCalled();
  });
});
