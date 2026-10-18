import { beforeEach, describe, expect, it } from 'vitest';
import { applyReply } from '../../src/events/apply';
import { decodeSnapshot } from '../../src/events/snapshot';
import { useEvents } from '../../src/events/store';
import { encodeSnapshot } from '../../scripts/events/encode';

const snap = () => {
  const e = encodeSnapshot([], { asOfS: 5, generatedS: 5, sources: [] });
  return decodeSnapshot(e.bin.buffer.slice(0) as ArrayBuffer, e.meta);
};
beforeEach(() => useEvents.setState({ recent: undefined, archive: undefined, status: 'idle', error: undefined, archiveError: undefined }));

describe('applyReply', () => {
  it('stores a recent snapshot and remembers its etag', () => {
    const etags: Record<string, string | undefined> = {};
    applyReply('recent', { type: 'snapshot', name: 'recent', snapshot: snap(), etag: 'e1' }, etags);
    expect(useEvents.getState().recent).toBeDefined();
    expect(etags.recent).toBe('e1');
  });
  it('clears a recent-feed error when a later poll is unchanged', () => {
    applyReply('recent', { type: 'snapshot', name: 'recent', snapshot: snap() }, {});
    applyReply('recent', { type: 'error', name: 'recent', reason: 'HTTP 500' }, {});
    expect(useEvents.getState().status).toBe('error');
    applyReply('recent', { type: 'unchanged', name: 'recent' }, {});
    expect(useEvents.getState().status).toBe('ready');
    expect(useEvents.getState().error).toBeUndefined();
  });
  it('an archive failure does not flip the global status', () => {
    applyReply('recent', { type: 'snapshot', name: 'recent', snapshot: snap() }, {});
    applyReply('archive', { type: 'error', name: 'archive', reason: 'archive.bin: HTTP 404' }, {});
    expect(useEvents.getState().status).toBe('ready');
    expect(useEvents.getState().archiveError).toBe('archive.bin: HTTP 404');
  });
});
