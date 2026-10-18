import { describe, expect, it } from 'vitest';
import { backtest, bootstrapInterval, bootstrapPair, rollingBacktest, confidenceOf, contributions, featureVector, FEATURES, fitTwo, predictOne, type TrainRow } from '../../scripts/index/model';
import { ym } from '../../scripts/index/panel';

// a deterministic synthetic panel: 60 countries x months; deaths drive the labels, governance adds a little
let s = 12345;
const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
const rows = (): TrainRow[] => {
  const out: TrainRow[] = [];
  for (let c = 0; c < 60; c++) {
    const level = rnd() < 0.3 ? 200 * rnd() : 0;
    const gov = rnd() * 2 - 1;
    for (let m = 0; m < 180; m++) {
      const t = ym(2005, 1) + m;
      const f3 = Math.max(0, level * (0.6 + 0.8 * rnd()));
      const f12 = f3 * 3.5;
      const f36 = f12 * 3;
      const pC = 1 / (1 + Math.exp(-(-4 + 1.2 * Math.log1p(f3))));
      const pR = 1 / (1 + Math.exp(-(-3.5 + 0.5 * Math.log1p(f3) - 0.6 * gov)));
      out.push({ id: `C${c}`, ym: t, f3, x: featureVector(f3, f12, f36, [gov, gov, gov, gov, gov]), yContinue: rnd() < pC ? 1 : 0, yRise: rnd() < pR ? 1 : 0 });
    }
  }
  return out;
};

describe('featureVector', () => {
  it('has the history terms (log1p), a momentum term, two leveling-off terms, then the five governance estimates, all named', () => {
    const x = featureVector(10, 100, 1000, [1, 2, 3, 4, 5]);
    expect(x).toHaveLength(FEATURES.length);
    expect(x[0]).toBeCloseTo(Math.log1p(10), 9);
    expect(x[3]).toBeCloseTo(Math.log1p(10) - Math.log1p(30), 9); // the last 3 months against the average of the 9 before: (100 - 10) / 3
    expect(x[4]).toBeCloseTo(Math.log1p(10) ** 2, 9);
    expect(x[5]).toBeCloseTo(Math.log1p(100) ** 2, 9);
    expect(x.slice(-5)).toEqual([1, 2, 3, 4, 5]);
    expect(FEATURES[0]).toMatch(/last 3 months/);
    expect(FEATURES[3]).toMatch(/trend/i);
  });
  it('never gives NaN for zero or inconsistent history (f3 above f12)', () => {
    expect(featureVector(0, 0, 0, [0, 0, 0, 0, 0]).every(Number.isFinite)).toBe(true);
    expect(featureVector(50, 10, 10, [0, 0, 0, 0, 0]).every(Number.isFinite)).toBe(true);
  });
});

describe('fitTwo and contributions', () => {
  const data = rows();
  const m = fitTwo(data);
  it('learns that recent deaths raise the chance of continuing, and returns probabilities inside (0, 1)', () => {
    expect(predictOne(m.continue, featureVector(300, 1000, 3000, [0, 0, 0, 0, 0]))).toBeGreaterThan(predictOne(m.continue, featureVector(0, 0, 0, [0, 0, 0, 0, 0])));
    for (const f of [0, 1, 50, 1e6]) {
      const p = predictOne(m.rise, featureVector(f, f * 3, f * 9, [0.5, 0.5, 0.5, 0.5, 0.5]));
      expect(p).toBeGreaterThan(0);
      expect(p).toBeLessThan(1);
    }
  });
  it('explains a score exactly: the contributions plus the intercept equal the log-odds', () => {
    const x = featureVector(80, 300, 900, [0.2, -0.4, 0.1, 0.9, -1]);
    const c = contributions(m.rise, x);
    expect(c.contributions).toHaveLength(FEATURES.length);
    const p = predictOne(m.rise, x);
    expect(c.intercept + c.contributions.reduce((a, b) => a + b, 0)).toBeCloseTo(Math.log(p / (1 - p)), 9);
  });
});

describe('backtest', () => {
  const r = backtest(rows(), { trainEnd: ym(2015, 12), testStart: ym(2017, 1), testEnd: ym(2019, 12) });
  it('reports discrimination, calibration bins that add up and a persistence baseline', () => {
    for (const t of [r.continue, r.rise]) {
      expect(t.auc).toBeGreaterThan(0.6);
      expect(t.bins).toHaveLength(5);
      expect(t.bins.reduce((a, b) => a + b.n, 0)).toBe(t.testRows);
      expect(t.bins.map((b) => b.predicted)).toEqual([...t.bins.map((b) => b.predicted)].sort((a, b) => a - b));
      expect(t.persistenceAuc).toBeGreaterThan(0.5);
      expect(t.tail.n).toBeGreaterThanOrEqual(0); // predictions of 30% or more, kept apart because the bins hide the tail
      expect(t.tail.predicted === 0 || t.tail.predicted >= 0.3).toBe(true);
      expect(t.baseRate).toBeGreaterThan(0);
      expect(t.positives).toBeGreaterThan(0);
    }
    expect(r.continue.brierSkill).toBeGreaterThan(0);
  });
});

describe('rollingBacktest (one split is not enough: the model is tested year by year)', () => {
  const data = rows();
  it('fits on everything up to September of the year before and tests on that year, so no label window crosses', () => {
    const r = rollingBacktest(data, [2014, 2015, 2016]);
    expect(r.map((x) => x.year)).toEqual([2014, 2015, 2016]);
    for (const x of r) {
      expect(x.testRows).toBe(60 * 12);
      expect(x.rise.auc).toBeGreaterThan(0.5);
      expect(x.continue.auc).toBeGreaterThan(0.5);
      expect(x.rise.persistenceAuc).toBeGreaterThan(0.5);
    }
  }, 60_000);
  it('skips a year whose test months do not exist and one without enough positives to rank', () => {
    expect(rollingBacktest(data, [1990, 2040]).map((x) => x.year)).toEqual([]);
  });
});

describe('bootstrapInterval', () => {
  const data = rows();
  const xs = [featureVector(100, 350, 1000, [0, 0, 0, 0, 0]), featureVector(0, 0, 0, [0, 0, 0, 0, 0])];
  it('brackets the point estimate, is ordered and reproducible', () => {
    const a = bootstrapInterval(data, 'rise', xs, 12, 7);
    const b = bootstrapInterval(data, 'rise', xs, 12, 7);
    expect(a).toEqual(b);
    const m = fitTwo(data);
    xs.forEach((x, i) => {
      expect(a[i]!.lo).toBeLessThanOrEqual(a[i]!.hi);
      expect(a[i]!.lo).toBeLessThanOrEqual(predictOne(m.rise, x) + 0.05);
      expect(a[i]!.hi).toBeGreaterThanOrEqual(predictOne(m.rise, x) - 0.05);
    });
  }, 30_000); // two 12-replicate bootstraps: slow when the whole suite runs in parallel on this laptop
});

describe('bootstrapPair (finding: the rise interval must never exceed the continue interval)', () => {
  const data = rows();
  const xs = [featureVector(100, 350, 1000, [0, 0, 0, 0, 0]), featureVector(5, 20, 60, [0, 0, 0, 0, 0]), featureVector(0, 0, 0, [0, 0, 0, 0, 0])];
  it('clamps each replicate so rise <= continue in both bounds, is ordered and reproducible', () => {
    const a = bootstrapPair(data, xs, 10, 7);
    expect(bootstrapPair(data, xs, 10, 7)).toEqual(a);
    xs.forEach((_, i) => {
      expect(a.rise[i]!.lo).toBeLessThanOrEqual(a.continue[i]!.lo + 1e-12);
      expect(a.rise[i]!.hi).toBeLessThanOrEqual(a.continue[i]!.hi + 1e-12);
      expect(a.rise[i]!.lo).toBeLessThanOrEqual(a.rise[i]!.hi);
      expect(a.continue[i]!.lo).toBeLessThanOrEqual(a.continue[i]!.hi);
    });
  }, 60_000);
});

describe('confidenceOf (a heuristic: the lowest of three checks)', () => {
  const base = { locatedShare365: 0.9, intervalWidth: 0.05, provisionalShare90: 0.2, deaths365: 500 };
  it('is high when the deaths are located, the interval is narrow and the recent data is mostly final', () => {
    expect(confidenceOf(base).level).toBe('high');
  });
  it('drops to the weakest check and names it', () => {
    const l = confidenceOf({ ...base, locatedShare365: 0.12 });
    expect(l.level).toBe('low');
    expect(l.reason).toMatch(/12%.*located/i);
    const w = confidenceOf({ ...base, intervalWidth: 0.2 });
    expect(w.level).toBe('medium');
    expect(w.reason).toMatch(/interval/i);
    expect(confidenceOf({ ...base, intervalWidth: 0.4 }).level).toBe('low');
  });
  it('mostly provisional recent data caps confidence at medium, never low by itself', () => {
    const p = confidenceOf({ ...base, provisionalShare90: 1 });
    expect(p.level).toBe('medium');
    expect(p.reason).toMatch(/provisional/i);
  });
  it('does not penalise placement when there were no deaths to place', () => {
    expect(confidenceOf({ ...base, deaths365: 0, locatedShare365: 1 }).level).toBe('high');
  });
});
