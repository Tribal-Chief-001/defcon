// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { radarBus } from '../../src/globe/radar';
import { Reticle } from '../../src/ui/Reticle';

const media = (fine: boolean) =>
  (window.matchMedia = ((q: string) => ({ matches: fine && String(q).includes('hover: hover'), media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia);
beforeEach(() => media(true));
afterEach(() => {
  cleanup();
  radarBus.emit(null);
});

describe('Reticle', () => {
  it('is decorative, shows nothing until the cursor is over the globe, then the readout', () => {
    const { container } = render(<Reticle />);
    expect(container.querySelector('[data-reticle]')).toBeNull();
    act(() => radarBus.emit({ x: 10, y: 20, readout: '28.61N 77.21E', snapped: false }));
    const el = container.querySelector('[data-reticle]') as HTMLElement;
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.textContent).toContain('28.61N 77.21E');
    expect(el.style.transform).toContain('10px');
    act(() => radarBus.emit({ x: 50, y: 60, readout: '1.00N 2.00E // EVENT 3 KM', snapped: true }));
    expect(el.textContent).toContain('EVENT 3 KM');
    expect(el.style.transform).toContain('50px');
    act(() => radarBus.emit(null));
    expect(container.querySelector('[data-reticle]')).toBeNull();
  });
  it('renders nothing without a fine hovering pointer (touch)', () => {
    media(false);
    const { container } = render(<Reticle />);
    act(() => radarBus.emit({ x: 1, y: 1, readout: 'x', snapped: false }));
    expect(container.querySelector('[data-reticle]')).toBeNull();
  });
  it('stops listening when unmounted', () => {
    const { unmount } = render(<Reticle />);
    unmount();
    expect(() => radarBus.emit({ x: 1, y: 1, readout: 'x', snapped: false })).not.toThrow();
  });
});
