import type { Tier } from './quality';

// The tier to start in (also the ceiling for the adaptive governor): phones and touch screens start at medium, weak devices at low.
export function startTier(env: { coarse: boolean; narrow: boolean; memoryGb?: number; cores?: number }): Tier {
  const weakMem = Number.isFinite(env.memoryGb) && (env.memoryGb as number) > 0 && (env.memoryGb as number) <= 2;
  const weakCpu = Number.isFinite(env.cores) && (env.cores as number) > 0 && (env.cores as number) <= 2;
  if (weakMem || weakCpu) return 'low';
  return env.coarse || env.narrow ? 'medium' : 'high';
}

// Reads the browser; navigator.deviceMemory is Chromium-only (undefined elsewhere, which counts as unknown).
export function detectStartTier(): Tier {
  if (typeof window === 'undefined') return 'high';
  return startTier({
    coarse: !!window.matchMedia?.('(pointer: coarse)').matches,
    narrow: !!window.matchMedia?.('(max-width: 639px)').matches,
    memoryGb: (navigator as Navigator & { deviceMemory?: number }).deviceMemory,
    cores: navigator.hardwareConcurrency,
  });
}
