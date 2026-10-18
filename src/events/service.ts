import { startPolling } from './poller';
import { useEvents } from './store';
import type { WorkerReply } from './workerCore';

// Starts the worker, polls `recent` every 60 s (conditional), and loads `archive` once when the browser is idle.
export function startEventService(base = '/data/events'): () => void {
  const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
  const etags: Partial<Record<'recent' | 'archive', string>> = {};
  const waiting = new Map<string, (r: WorkerReply) => void>();
  worker.onmessage = (e: MessageEvent<WorkerReply>) => {
    waiting.get(e.data.name)?.(e.data);
    waiting.delete(e.data.name);
  };
  worker.onerror = () => useEvents.getState().fail('event worker crashed');

  const request = (name: 'recent' | 'archive') =>
    new Promise<WorkerReply>((resolve) => {
      waiting.set(name, resolve);
      worker.postMessage({ type: 'load', base, name, etag: etags[name] });
    });
  const apply = async (name: 'recent' | 'archive') => {
    const r = await request(name);
    if (r.type === 'snapshot') {
      etags[name] = r.etag;
      if (name === 'recent') useEvents.getState().setRecent(r.snapshot);
      else useEvents.getState().setArchive(r.snapshot);
    } else if (r.type === 'error') useEvents.getState().fail(r.reason);
  };

  useEvents.setState({ status: 'loading' });
  const stopPolling = startPolling(() => apply('recent'), 60_000);
  const later = typeof requestIdleCallback === 'function' ? (f: () => void) => requestIdleCallback(f) : (f: () => void) => setTimeout(f, 1500);
  later(() => void apply('archive'));
  return () => {
    stopPolling();
    worker.terminate();
  };
}
