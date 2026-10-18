import type { Prob } from './types';

// probabilities as text: one decimal at the extremes, markers beyond 99.9 and below 0.1 (a model is never certain)
export const pct = (v: number) => {
  const x = v * 100;
  return x > 99.9 ? '>99.9%' : x < 0.1 ? '<0.1%' : x < 1 || x > 99 ? `${x.toFixed(1)}%` : `${Math.round(x)}%`;
};
export const ptsNum = (v: number) => {
  const x = v * 100;
  return x < 1 || x > 99 ? x.toFixed(1) : String(Math.round(x));
};
export const interval = (p: Prob) => `90% interval ${ptsNum(p.lo)} to ${ptsNum(p.hi)}%`;
