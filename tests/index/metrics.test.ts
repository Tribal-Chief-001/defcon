import { describe, expect, it } from 'vitest';
import { auc, averagePrecision, brier, clusterBootstrap, fitLogistic, mulberry32, percentile, predictLogistic } from '../../scripts/index/metrics';

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

  it('mulberry32 is deterministic and in [0, 1)', () => {
    const a = mulberry32(7);
    const b = mulberry32(7);
    const xs = Array.from({ length: 5 }, () => a());
    expect(xs).toEqual(Array.from({ length: 5 }, () => b()));
    expect(xs.every((x) => x >= 0 && x < 1)).toBe(true);
    expect(mulberry32(8)()).not.toBe(xs[0]);
  });
  it('percentile interpolates and handles tiny arrays', () => {
    expect(percentile([1, 2, 3, 4, 5], 0.5)).toBe(3);
    expect(percentile([1, 2, 3, 4, 5], 0)).toBe(1);
    expect(percentile([1, 2, 3, 4, 5], 1)).toBe(5);
    expect(percentile([4], 0.9)).toBe(4);
    expect(percentile([], 0.5)).toBeNaN();
  });
  it('clusterBootstrap resamples whole groups, is reproducible and returns one stat row per repetition', () => {
    const groups = [0, 0, 1, 1, 2];
    const seen: number[][] = [];
    const r1 = clusterBootstrap(groups, 20, 3, (idx) => (seen.push(idx), [idx.length]));
    const r2 = clusterBootstrap(groups, 20, 3, (idx) => [idx.length]);
    expect(r1).toEqual(r2);
    expect(r1).toHaveLength(20);
    // every resample is made of complete groups: counts of index 0 and 1 are equal, counts of 2 and 3 are equal
    for (const idx of seen) {
      const c = (v: number) => idx.filter((i) => i === v).length;
      expect(c(0)).toBe(c(1));
      expect(c(2)).toBe(c(3));
    }
  });
});

