import { loadSnapshot } from './client';
import type { Snapshot } from './snapshot';

export type LoadMsg = { type: 'load'; base: string; name: 'recent' | 'archive'; etag?: string };
export type WorkerReply =
  | { type: 'snapshot'; name: string; snapshot: Snapshot; etag?: string }
  | { type: 'unchanged'; name: string }
  | { type: 'error'; name: string; reason: string };

// The logic of the worker, kept free of `self` so it can be tested.
export async function handleLoad(msg: LoadMsg, deps: { fetchFn?: typeof fetch } = {}): Promise<WorkerReply> {
  const r = await loadSnapshot(msg.base, msg.name, { etag: msg.etag }, deps.fetchFn);
  if (r.status === 'ok') return { type: 'snapshot', name: msg.name, snapshot: r.snapshot, etag: r.etag };
  if (r.status === 'unchanged') return { type: 'unchanged', name: msg.name };
  return { type: 'error', name: msg.name, reason: r.reason };
}
