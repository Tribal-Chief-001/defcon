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
const FAST_MIN_MS = 14; // 90th percentile below the fast limit for 10 s: step up
const FAST_MAX_MS = 19; // never above this, so a slow device cannot count as recovered (SLOW_MS is 22)
const UP_AFTER_MS = 10_000;
const UP_AFTER_MAX_MS = 80_000;
const QUICK_DROP_MS = 30_000; // a drop this soon after a climb doubles the next climb's wait
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
  let baseline = Infinity; // the best median frame time seen: a 60 Hz display never gets below 16.7 ms, so "fast" is relative to it
  let upAfter = UP_AFTER_MS;
  let lastUp = -Infinity;

  const sorted = () => [...frames].sort((a, b) => a - b);
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
      const s = sorted();
      const q = s[Math.floor(s.length * 0.9)]!;
      baseline = Math.min(baseline, s[Math.floor(s.length / 2)]!);
      const fastLimit = Math.min(FAST_MAX_MS, Math.max(FAST_MIN_MS, baseline * 1.15));
      if (q > SLOW_MS) {
        fastSince = null;
        if (level < ORDER.length - 1 && t - lastChange >= MIN_CHANGE_GAP_MS) {
          if (t - lastUp < QUICK_DROP_MS) upAfter = Math.min(UP_AFTER_MAX_MS, upAfter * 2);
          change(level + 1, t);
        }
      } else if (q < fastLimit) {
        fastSince ??= t;
        if (level > ceiling && t - fastSince >= upAfter && t - lastChange >= MIN_CHANGE_GAP_MS) {
          lastUp = t;
          change(level - 1, t);
        }
      } else fastSince = null;
      return ORDER[level]!;
    },
  };
}
