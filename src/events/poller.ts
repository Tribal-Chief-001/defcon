type Timers = { setTimeout: typeof setTimeout; clearTimeout: typeof clearTimeout };

// Runs `load` now, then again `intervalMs` after each run finishes (never overlapping). Skips runs while the tab is hidden.
export function startPolling(
  load: () => Promise<void>,
  intervalMs: number,
  timers: Timers = { setTimeout: globalThis.setTimeout.bind(globalThis), clearTimeout: globalThis.clearTimeout.bind(globalThis) },
): () => void {
  let stopped = false;
  let handle: ReturnType<typeof setTimeout> | undefined;
  const schedule = (ms: number) => {
    if (stopped) return;
    handle = timers.setTimeout(async () => {
      if (typeof document === 'undefined' || !document.hidden) {
        try {
          await load();
        } catch {
          /* the store already records failures; keep polling */
        }
      }
      schedule(intervalMs);
    }, ms);
  };
  schedule(0);
  return () => {
    stopped = true;
    if (handle !== undefined) timers.clearTimeout(handle);
  };
}
