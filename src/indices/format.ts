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
// the ends are worded like the estimate itself: a near-certain interval reads "above 99.9%", never "100.0 to 100.0%"
export const interval = (p: Prob) => {
  if (p.lo >= 0.9985) return '90% interval above 99.9%';
  if (p.hi < 0.0005) return '90% interval below 0.1%';
  return `90% interval ${p.lo < 0.0005 ? '<0.1' : ptsNum(p.lo)} to ${p.hi >= 0.9995 ? '>99.9' : ptsNum(p.hi)}%`;
};
