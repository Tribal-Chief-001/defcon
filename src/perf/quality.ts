export type Tier = 'high' | 'medium' | 'low';

// What each tier costs. `grain` multiplies the grain strength, `densityHz` is how often the heat texture may be rebuilt.
export const TIERS: Record<Tier, { pixelRatio: number; grain: 0 | 0.5 | 1; labelCap: number; arcSegments: number; terminator: boolean; densityHz: number }> = {
  high: { pixelRatio: 2, grain: 1, labelCap: 40, arcSegments: 48, terminator: true, densityHz: 4 },
  medium: { pixelRatio: 1.5, grain: 0.5, labelCap: 24, arcSegments: 32, terminator: true, densityHz: 2 },
  low: { pixelRatio: 1, grain: 0, labelCap: 12, arcSegments: 16, terminator: false, densityHz: 0 },
};

const ORDER: Tier[] = ['high', 'medium', 'low'];
const WINDOW = 90; // frames
const SLOW_MS = 22; // 90th percentile above this over a full window: step down
const FAST_MS = 14; // 90th percentile below this for 10 s: step up
const UP_AFTER_MS = 10_000;
const MIN_CHANGE_GAP_MS = 4_000;
const IGNORE_OVER_MS = 250; // a hitch or a background tab, not a measure of the GPU

// Frame-time governor: drops a quality tier when the last 90 frames are slow, climbs back after a long calm spell, never faster than
// every 4 s and never above the starting tier. The window restarts after each change so a decision always rests on fresh frames.
export function createQualityGovernor(opts: { start: Tier; now?: () => number }) {
  const now = opts.now ?? (() => performance.now());
  const ceiling = ORDER.indexOf(opts.start);
  let level = ceiling;
  let frames: number[] = [];
  let lastChange = -Infinity;
  let fastSince: number | null = null;

  const p90 = () => [...frames].sort((a, b) => a - b)[Math.floor(frames.length * 0.9)]!;
  const change = (to: number, t: number) => {
    level = to;
    lastChange = t;
    frames = [];
    fastSince = null;
  };

  return {
    tier: (): Tier => ORDER[level]!,
    sample(frameMs: number): Tier {
      if (!Number.isFinite(frameMs) || frameMs <= 0 || frameMs > IGNORE_OVER_MS) return ORDER[level]!;
      frames.push(frameMs);
      if (frames.length > WINDOW) frames.shift();
      if (frames.length < WINDOW) return ORDER[level]!;
      const t = now();
      const q = p90();
      if (q > SLOW_MS) {
        fastSince = null;
        if (level < ORDER.length - 1 && t - lastChange >= MIN_CHANGE_GAP_MS) change(level + 1, t);
      } else if (q < FAST_MS) {
        fastSince ??= t;
        if (level > ceiling && t - fastSince >= UP_AFTER_MS && t - lastChange >= MIN_CHANGE_GAP_MS) change(level - 1, t);
      } else fastSince = null;
      return ORDER[level]!;
    },
  };
}
