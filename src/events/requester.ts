import type { LoadMsg, WorkerReply } from './workerCore';

type Timers = { setTimeout: typeof setTimeout; clearTimeout: typeof clearTimeout };
type Pending = { resolve: (r: WorkerReply) => void; timer: ReturnType<typeof setTimeout> };

// Request/reply bookkeeping for the worker: every request resolves, even when the worker never answers or crashes.
export function createRequester(
  post: (msg: LoadMsg) => void,
  timeoutMs: number,
  timers: Timers = { setTimeout: globalThis.setTimeout.bind(globalThis), clearTimeout: globalThis.clearTimeout.bind(globalThis) },
) {
  const pending = new Map<string, Pending>();
  const settle = (name: string, reply: WorkerReply) => {
    const p = pending.get(name);
    if (!p) return; // a late reply after a timeout is ignored
    pending.delete(name);
    timers.clearTimeout(p.timer);
    p.resolve(reply);
  };
  return {
    request(msg: LoadMsg): Promise<WorkerReply> {
      settle(msg.name, { type: 'error', name: msg.name, reason: 'superseded by a newer request' });
      return new Promise((resolve) => {
        const timer = timers.setTimeout(() => settle(msg.name, { type: 'error', name: msg.name, reason: `${msg.name}: request timed out` }), timeoutMs);
        pending.set(msg.name, { resolve, timer });
        post(msg);
      });
    },
    onReply(reply: WorkerReply) {
      settle(reply.name, reply);
    },
    failAll(reason: string) {
      for (const name of [...pending.keys()]) settle(name, { type: 'error', name, reason });
    },
  };
}
