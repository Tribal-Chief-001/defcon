// Rolling frame-time statistics over the last `windowSize` frames.
export function createFrameStats(windowSize = 120) {
  const deltas: number[] = [];
  let last: number | undefined;
  return {
    tick(nowMs: number) {
      if (last !== undefined) {
        deltas.push(nowMs - last);
        if (deltas.length > windowSize) deltas.shift();
      }
      last = nowMs;
    },
    fps(): number {
      if (!deltas.length) return 0;
      return 1000 / (deltas.reduce((a, b) => a + b, 0) / deltas.length);
    },
    p95FrameMs(): number {
      if (!deltas.length) return 0;
      const sorted = [...deltas].sort((a, b) => a - b);
      return sorted[Math.min(sorted.length - 1, Math.ceil(0.95 * sorted.length) - 1)]!;
    },
  };
}
