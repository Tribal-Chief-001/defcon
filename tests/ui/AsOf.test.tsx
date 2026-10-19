// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AsOf } from '../../src/ui/AsOf';
import { decodeSnapshot } from '../../src/events/snapshot';
import { useEvents } from '../../src/events/store';
import { encodeSnapshot } from '../../scripts/events/encode';

const NOW = Date.UTC(2026, 9, 18, 5, 0, 0) / 1000;
const snapAt = (asOfS: number) => {
  const e = encodeSnapshot([], { asOfS, generatedS: asOfS, sources: [] });
  return decodeSnapshot(e.bin.buffer.slice(0) as ArrayBuffer, e.meta);
};
beforeEach(() => useEvents.setState({ recent: undefined, archive: undefined, status: 'idle', error: undefined, archiveError: undefined }));
afterEach(cleanup);

describe('AsOf', () => {
  it('says LIVE with the data time for a fresh recent snapshot', () => {
    useEvents.setState({ recent: snapAt(NOW - 600), status: 'ready' });
    render(<AsOf nowS={NOW} />);
    expect(screen.getByText('LIVE')).toBeTruthy();
    expect(screen.getByText('DATA AS OF 04:50 UTC')).toBeTruthy();
  });
  it('says STALE for an old recent snapshot', () => {
    useEvents.setState({ recent: snapAt(NOW - 14 * 3600), status: 'ready' });
    render(<AsOf nowS={NOW} />);
    expect(screen.getByText('STALE')).toBeTruthy();
  });
  it('says ARCHIVE when only the archive is loaded', () => {
    useEvents.setState({ archive: snapAt(NOW - 600), status: 'ready' });
    render(<AsOf nowS={NOW} />);
    expect(screen.getByText('ARCHIVE')).toBeTruthy();
  });
  it('says NO DATA when nothing is loaded', () => {
    render(<AsOf nowS={NOW} />);
    expect(screen.getByText('NO DATA')).toBeTruthy();
  });
  it('puts the error notes in the normal flow of the header, so the docked War room cannot cover them (Plan 10 review minor)', () => {
    useEvents.setState({ recent: snapAt(NOW - 3600), status: 'error', error: 'x' } as never);
    render(<AsOf nowS={NOW} />);
    const note = screen.getByText(/refresh failed/i);
    expect(note.parentElement!.className).not.toMatch(/\babsolute\b/);
  });
  it('keeps showing data with a note when a later refresh failed', () => {
    useEvents.setState({ recent: snapAt(NOW - 600), status: 'error', error: 'recent.meta.json: HTTP 404' });
    render(<AsOf nowS={NOW} />);
    expect(screen.getByText('LIVE')).toBeTruthy();
    expect(screen.getByText(/refresh failed/i)).toBeTruthy();
  });
});

// review finding: the pill must age while the page stays open and polls return "unchanged"
describe('AsOf ticking', () => {
  it('moves from LIVE to RECENT as time passes without any store change', () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(NOW * 1000);
      useEvents.setState({ recent: snapAt(NOW - (4 * 3600 - 5 * 60)), status: 'ready' });
      render(<AsOf />);
      expect(screen.getByText('LIVE')).toBeTruthy();
      act(() => void vi.advanceTimersByTime(10 * 60 * 1000));
      expect(screen.getByText('RECENT')).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });
});
