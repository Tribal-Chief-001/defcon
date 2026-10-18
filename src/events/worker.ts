/// <reference lib="webworker" />
import { handleLoad, type LoadMsg } from './workerCore';

// Fetching, decoding and checksum verification run off the main thread; the typed arrays are transferred, not copied.
self.onmessage = async (e: MessageEvent<LoadMsg>) => {
  const reply = await handleLoad(e.data);
  const transfer = reply.type === 'snapshot' ? [reply.snapshot.timeS.buffer] : [];
  (self as unknown as Worker).postMessage(reply, transfer);
};
