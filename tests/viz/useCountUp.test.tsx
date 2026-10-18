// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCountUp } from '../../src/viz/useCountUp';

const Probe = ({ value }: { value: number }) => <span data-testid="v">{useCountUp(value, 400)}</span>;
const reduced = (on: boolean) => {
  window.matchMedia = ((q: string) => ({ matches: on && /reduce/.test(q), media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
};

describe('useCountUp', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('shows the final value at once under prefers-reduced-motion', () => {
    reduced(true);
    render(<Probe value={1234} />);
    expect(screen.getByTestId('v').textContent).toBe('1234');
  });
  it('shows a non-finite value as it is (no NaN animation) and counts up to a finite one', () => {
    reduced(false);
    const { rerender } = render(<Probe value={Number.NaN} />);
    expect(screen.getByTestId('v').textContent).toBe('NaN');
    rerender(<Probe value={1000} />);
    act(() => void vi.advanceTimersByTime(100));
    const mid = Number(screen.getByTestId('v').textContent);
    expect(mid).toBeGreaterThanOrEqual(0);
    expect(mid).toBeLessThan(1000);
    act(() => void vi.advanceTimersByTime(1000));
    expect(screen.getByTestId('v').textContent).toBe('1000');
  });
});
