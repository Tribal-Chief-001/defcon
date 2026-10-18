import { applyReply } from './apply';
import { startPolling } from './poller';
import { createRequester } from './requester';
import { useEvents } from './store';
import type { WorkerReply } from './workerCore';

const REQUEST_TIMEOUT_MS = 25_000;

// Starts the worker, polls `recent` every 60 s (conditional), and loads `archive` once when the browser is idle.
export function startEventService(base = '/data/events'): () => void {
  const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
  const etags: Partial<Record<'recent' | 'archive', string>> = {};
  const requester = createRequester((msg) => worker.postMessage(msg), REQUEST_TIMEOUT_MS);
  worker.onmessage = (e: MessageEvent<WorkerReply>) => requester.onReply(e.data);
  worker.onerror = () => requester.failAll('event worker crashed');
  worker.onmessageerror = () => requester.failAll('event worker sent an unreadable message');

  const apply = async (name: 'recent' | 'archive') => applyReply(name, await requester.request({ type: 'load', base, name, etag: etags[name] }), etags);

  useEvents.setState({ status: 'loading' });
  const stopPolling = startPolling(() => apply('recent'), 60_000);
  const idle = typeof requestIdleCallback === 'function' ? requestIdleCallback(() => void apply('archive')) : undefined;
  const timer = idle === undefined ? setTimeout(() => void apply('archive'), 1500) : undefined;
  return () => {
    stopPolling();
    if (idle !== undefined) cancelIdleCallback(idle);
    if (timer !== undefined) clearTimeout(timer);
    requester.failAll('stopped');
    worker.terminate();
  };
}
