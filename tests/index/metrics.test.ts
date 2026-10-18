import { describe, expect, it } from 'vitest';
import { auc, averagePrecision, brier, fitLogistic, predictLogistic } from '../../scripts/index/metrics';

describe('metrics', () => {
  it('auc is 1 for a perfect ranking, 0.5 for ties, 0 for an inverted one', () => {
    expect(auc([0.1, 0.2, 0.8, 0.9], [0, 0, 1, 1])).toBe(1);
    expect(auc([1, 1, 1, 1], [0, 1, 0, 1])).toBe(0.5);
    expect(auc([0.9, 0.8, 0.2, 0.1], [0, 0, 1, 1])).toBe(0);
  });
  it('auc is NaN without both classes', () => {
    expect(auc([1, 2], [1, 1])).toBeNaN();
  });
  it('average precision of a perfect ranking is 1', () => {
    expect(averagePrecision([0.1, 0.9, 0.2, 0.8], [0, 1, 0, 1])).toBe(1);
  });
  it('brier is the mean squared error', () => {
    expect(brier([0.5, 0.5], [0, 1])).toBe(0.25);
  });
  it('logistic regression learns a separable-ish 1-D rule and stays in (0,1)', () => {
    const x: number[][] = [];
    const y: number[] = [];
    for (let i = 0; i < 200; i++) {
      const v = (i - 100) / 20;
      x.push([v]);
      y.push(v + Math.sin(i * 12.9898) * 0.8 > 0 ? 1 : 0); // deterministic noise
    }
    const m = fitLogistic(x, y);
    const p = predictLogistic(m, [[-4], [0], [4]]);
    expect(p[0]!).toBeLessThan(0.1);
    expect(p[2]!).toBeGreaterThan(0.9);
    expect(p.every((q) => q > 0 && q < 1)).toBe(true);
  });
});
