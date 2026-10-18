// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AsOf } from '../../src/ui/AsOf';
import { decodeSnapshot } from '../../src/events/snapshot';
import { useEvents } from '../../src/events/store';
import { encodeSnapshot } from '../../scripts/events/encode';

const NOW = Date.UTC(2026, 9, 18, 5, 0, 0) / 1000;
const snapAt = (asOfS: number) => {
  const e = encodeSnapshot([], { asOfS, generatedS: asOfS, sources: [] });
  return decodeSnapshot(e.bin.buffer.slice(0) as ArrayBuffer, e.meta);
};
beforeEach(() => useEvents.setState({ recent: undefined, archive: undefined, status: 'idle', error: undefined }));
afterEach(cleanup);

describe('AsOf', () => {
  it('says LIVE with the data time for a fresh recent snapshot', () => {
    useEvents.setState({ recent: snapAt(NOW - 600), status: 'ready' });
    render(<AsOf nowS={NOW} />);
    expect(screen.getByText('LIVE')).toBeTruthy();
    expect(screen.getByText('DATA AS OF 04:50 UTC')).toBeTruthy();
  });
  it('says STALE for an old recent snapshot', () => {
    useEvents.setState({ recent: snapAt(NOW - 6 * 3600), status: 'ready' });
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
  it('keeps showing data with a note when a later refresh failed', () => {
    useEvents.setState({ recent: snapAt(NOW - 600), status: 'error', error: 'recent.meta.json: HTTP 404' });
    render(<AsOf nowS={NOW} />);
    expect(screen.getByText('LIVE')).toBeTruthy();
    expect(screen.getByText(/refresh failed/i)).toBeTruthy();
  });
});
