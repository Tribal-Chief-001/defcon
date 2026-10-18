import { beforeEach, describe, expect, it } from 'vitest';
import { decodeSnapshot } from '../../src/events/snapshot';
import { useEvents } from '../../src/events/store';
import { encodeSnapshot } from '../../scripts/events/encode';

const mk = () => {
  const e = encodeSnapshot([], { asOfS: 1, generatedS: 1, sources: [] });
  return decodeSnapshot(e.bin.buffer.slice(0) as ArrayBuffer, e.meta);
};

beforeEach(() => useEvents.setState({ recent: undefined, archive: undefined, status: 'idle', error: undefined, archiveError: undefined }));

describe('useEvents store', () => {
  it('starts idle and empty', () => {
    const s = useEvents.getState();
    expect(s.status).toBe('idle');
    expect(s.recent).toBeUndefined();
  });
  it('setRecent stores the snapshot and becomes ready', () => {
    const snap = mk();
    useEvents.getState().setRecent(snap);
    expect(useEvents.getState().recent).toBe(snap);
    expect(useEvents.getState().status).toBe('ready');
  });
  it('fail keeps the last good snapshots and records the reason', () => {
    const snap = mk();
    useEvents.getState().setRecent(snap);
    useEvents.getState().fail('HTTP 404');
    const s = useEvents.getState();
    expect(s.recent).toBe(snap);
    expect(s.error).toBe('HTTP 404');
    expect(s.status).toBe('error');
  });
  it('a later success clears the error', () => {
    useEvents.getState().fail('x');
    useEvents.getState().setRecent(mk());
    expect(useEvents.getState().error).toBeUndefined();
    expect(useEvents.getState().status).toBe('ready');
  });
  it('setArchive does not change a ready status to idle', () => {
    useEvents.getState().setRecent(mk());
    useEvents.getState().setArchive(mk());
    expect(useEvents.getState().status).toBe('ready');
    expect(useEvents.getState().archive).toBeDefined();
  });
  // review findings: a stale banner after a successful "unchanged" poll, and an archive failure must not flip the whole status
  it('clearError returns to ready when data is loaded', () => {
    useEvents.getState().setRecent(mk());
    useEvents.getState().fail('HTTP 500');
    useEvents.getState().clearError();
    expect(useEvents.getState().status).toBe('ready');
    expect(useEvents.getState().error).toBeUndefined();
  });
  it('failArchive records its own error and leaves status ready', () => {
    useEvents.getState().setRecent(mk());
    useEvents.getState().failArchive('archive.bin: HTTP 404');
    const s = useEvents.getState();
    expect(s.status).toBe('ready');
    expect(s.archiveError).toBe('archive.bin: HTTP 404');
    useEvents.getState().setArchive(mk());
    expect(useEvents.getState().archiveError).toBeUndefined();
  });
});
