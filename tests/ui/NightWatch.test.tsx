// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NightWatch } from '../../src/ui/NightWatch';

const reduce = (on: boolean) =>
  (window.matchMedia = ((q: string) => ({ matches: on && String(q).includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia);
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
const live = (c: HTMLElement) => c.querySelector('[aria-live]') as HTMLElement;

describe('NightWatch', () => {
  it('shows the whole caption at once in the live region under reduced motion', () => {
    reduce(true);
    const { container } = render(<NightWatch active caption="KYIV // 2026-10-18 04:12 UTC // ARMED CONFLICT" />);
    expect(live(container).textContent).toBe('KYIV // 2026-10-18 04:12 UTC // ARMED CONFLICT');
  });
  it('types the caption progressively otherwise', () => {
    reduce(false);
    vi.useFakeTimers();
    const { container } = render(<NightWatch active caption="ABCDEFGHIJ" />);
    expect(live(container).textContent!.length).toBeLessThan(10);
    act(() => void vi.advanceTimersByTime(1000));
    expect(live(container).textContent).toBe('ABCDEFGHIJ');
  });
  it('shows nothing when inactive and never takes pointer events', () => {
    reduce(false);
    const { container } = render(<NightWatch active={false} caption="X" />);
    expect(container.querySelector('[data-letterbox]')).toBeNull();
    cleanup();
    const on = render(<NightWatch active caption="X" />);
    for (const bar of on.container.querySelectorAll('[data-letterbox]')) expect((bar as HTMLElement).className).toContain('pointer-events-none');
  });
  it('renders caption text as text, not markup', () => {
    reduce(true);
    const { container } = render(<NightWatch active caption="<img src=x onerror=alert(1)>" />);
    expect(container.querySelector('img')).toBeNull();
  });
});
