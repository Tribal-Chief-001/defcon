// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { decodeSnapshot } from '../../src/events/snapshot';
import { useEvents } from '../../src/events/store';
import { useTime } from '../../src/time/store';
import { Scrubber } from '../../src/ui/Scrubber';
import { encodeSnapshot } from '../../scripts/events/encode';

const D = 86400;
const NOW = Math.floor(Date.now() / 1000);
const snapFrom = (fromS: number) => {
  const e = encodeSnapshot([], { asOfS: NOW, generatedS: NOW, windowFromS: fromS, windowToS: NOW, sources: [] });
  return decodeSnapshot(e.bin.buffer.slice(e.bin.byteOffset, e.bin.byteOffset + e.bin.byteLength) as ArrayBuffer, e.meta);
};
const reduce = (on: boolean) =>
  (window.matchMedia = ((q: string) => ({ matches: on && q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia);

beforeEach(() => {
  useTime.setState({ backS: 0, playing: false });
  useEvents.setState({ recent: undefined, archive: snapFrom(NOW - 365 * D), status: 'ready' });
  reduce(false);
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('Scrubber', () => {
  it('renders nothing without a snapshot', () => {
    useEvents.setState({ recent: undefined, archive: undefined });
    const { container } = render(<Scrubber />);
    expect(container.firstChild).toBeNull();
  });
  it('is LIVE at backS 0; moving the slider back sets backS in whole days and LIVE restores it', () => {
    render(<Scrubber />);
    const slider = screen.getByRole('slider', { name: /time travel/i }) as HTMLInputElement;
    expect(slider.getAttribute('aria-valuetext')).toBe('LIVE');
    fireEvent.change(slider, { target: { value: String(Number(slider.max) - 12) } });
    expect(useTime.getState().backS).toBe(12 * D);
    expect(slider.getAttribute('aria-valuetext')).toMatch(/12 days before now, \d{4}-\d{2}-\d{2} UTC/);
    fireEvent.click(screen.getByRole('button', { name: /live/i }));
    expect(useTime.getState().backS).toBe(0);
    expect(slider.getAttribute('aria-valuetext')).toBe('LIVE');
  });
  it('can be moved with the keyboard (native range input) to the oldest day and back', () => {
    render(<Scrubber />);
    const slider = screen.getByRole('slider') as HTMLInputElement;
    fireEvent.change(slider, { target: { value: '0' } });
    expect(useTime.getState().backS).toBeGreaterThanOrEqual(360 * D);
    expect(useTime.getState().backS).toBeLessThanOrEqual(365 * D);
  });
  it('Play walks backS down to 0 and stops; a manual input or Escape stops it earlier', () => {
    vi.useFakeTimers();
    let t = 0;
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => setTimeout(() => cb((t += 50)), 50) as unknown as number);
    vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id));
    useTime.setState({ backS: 7 * D });
    render(<Scrubber />);
    fireEvent.click(screen.getByRole('button', { name: /play/i }));
    expect(useTime.getState().playing).toBe(true);
    act(() => void vi.advanceTimersByTime(7_000));
    expect(useTime.getState().backS).toBeLessThan(7 * D);
    expect(useTime.getState().backS).toBeGreaterThan(0);
    act(() => void window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })));
    expect(useTime.getState().playing).toBe(false);
    const stoppedAt = useTime.getState().backS;
    act(() => void vi.advanceTimersByTime(2_000));
    expect(useTime.getState().backS).toBe(stoppedAt);
    fireEvent.click(screen.getByRole('button', { name: /play/i }));
    act(() => void vi.advanceTimersByTime(30_000));
    expect(useTime.getState()).toMatchObject({ backS: 0, playing: false });
    vi.unstubAllGlobals();
  });
  it('disables Play under reduced motion and says why', () => {
    reduce(true);
    render(<Scrubber />);
    const play = screen.getByRole('button', { name: /play/i }) as HTMLButtonElement;
    expect(play.disabled).toBe(true);
    expect(play.title).toMatch(/reduced motion/i);
  });
});
