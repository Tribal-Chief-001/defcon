import { useEvents } from './store';
import type { WorkerReply } from './workerCore';

// Applies one worker reply to the store. "unchanged" clears an old recent-feed error; an archive failure is its own
// state and never flips the global status.
export function applyReply(name: 'recent' | 'archive', r: WorkerReply, etags: Partial<Record<'recent' | 'archive', string>>): void {
  const st = useEvents.getState();
  if (r.type === 'snapshot') {
    etags[name] = r.etag;
    if (name === 'recent') st.setRecent(r.snapshot);
    else st.setArchive(r.snapshot);
  } else if (r.type === 'unchanged') {
    if (name === 'recent') st.clearError();
  } else if (name === 'recent') st.fail(r.reason);
  else st.failArchive(r.reason);
}
