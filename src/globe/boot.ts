// Sonar Boot: a point, a sonar ring, the equator, the meridians, then the borders draw in (about 3.2 s).
export type BootState = { dot: number; ring: number; equator: number; meridians: number; borders: number; done: boolean };
export type BootControl = { skip(): void; readonly done: boolean; state(): BootState };

export const BOOT_MS = 3200;
const STAGES = {
  dot: [0, 400],
  ring: [400, 1200],
  equator: [1000, 1800],
  meridians: [1600, 2400],
  borders: [2200, 3200],
} as const;

// Exponential ease-out (close to the project's cubic-bezier(0.16, 1, 0.3, 1)), exactly 0 at 0 and 1 at 1.
const ease = (x: number) => (1 - Math.pow(2, -10 * x)) / (1 - Math.pow(2, -10));
const stage = (t: number, [a, b]: readonly [number, number]) => ease(Math.min(1, Math.max(0, (t - a) / (b - a))));

export function bootState(tMs: number): BootState {
  return {
    dot: stage(tMs, STAGES.dot),
    ring: stage(tMs, STAGES.ring),
    equator: stage(tMs, STAGES.equator),
    meridians: stage(tMs, STAGES.meridians),
    borders: stage(tMs, STAGES.borders),
    done: tMs >= BOOT_MS,
  };
}

const FINISHED: BootState = { dot: 1, ring: 1, equator: 1, meridians: 1, borders: 1, done: true };
const SEEN_KEY = 'defcon.boot.seen';

type Store = { getItem(k: string): string | null; setItem(k: string, v: string): void };

export function createBootControl(o: { reducedMotion: boolean; now: () => number; storage?: Store }): BootControl {
  let finished = o.reducedMotion;
  if (!finished) {
    try {
      if (o.storage?.getItem(SEEN_KEY) === '1') finished = true;
      else o.storage?.setItem(SEEN_KEY, '1'); // once per session
    } catch {
      /* storage blocked: still play */
    }
  }
  const t0 = o.now();
  const state = (): BootState => {
    if (finished) return FINISHED;
    const s = bootState(o.now() - t0);
    if (s.done) finished = true;
    return s;
  };
  return {
    skip() {
      finished = true;
    },
    get done() {
      return state().done;
    },
    state,
  };
}
