import type { Calibration, Confidence, TargetMetrics } from '../../src/indices/types';
import { auc, averagePrecision, brier, clusterBootstrap, fitLogistic, percentile, predictLogistic, type Logit } from './metrics';

// The features of the Instability Index (Violence Risk Index) model: the history of deaths and the governance of the country.
export const FEATURES = [
  'Deaths in the last 3 months',
  'Deaths in the last 12 months',
  'Deaths in the last 36 months',
  'Recent trend (last 3 months against the 9 before)',
  'Very high recent deaths (leveling-off effect)',
  'Very high yearly deaths (leveling-off effect)',
  'Government effectiveness',
  'Rule of law',
  'Control of corruption',
  'Voice and accountability',
  'Regulatory quality',
];
export type TrainRow = { id: string; ym: number; f3: number; x: number[]; yContinue: number; yRise: number };
export type Target = 'continue' | 'rise';

// History in log deaths, the trend (the last 3 months against the average of the 9 before) and two squared terms that let the effect level
// off at very high deaths (without them the model gave 55% odds of a doubling to a country that had just had its heaviest year), then governance.
export const featureVector = (f3: number, f12: number, f36: number, wgi: number[]): number[] => {
  const a = Math.log1p(Math.max(0, f3));
  const b = Math.log1p(Math.max(0, f12));
  return [a, b, Math.log1p(Math.max(0, f36)), a - Math.log1p(Math.max(0, f12 - f3) / 3), a * a, b * b, ...wgi];
};

// Two ridge logistic regressions: "continue" (at least 25 deaths in the next 3 months) and "rise" (that, and at least double the last 3 months).
export const fitTwo = (rows: TrainRow[], ridge = 1e-3): { continue: Logit; rise: Logit } => ({
  continue: fitLogistic(rows.map((r) => r.x), rows.map((r) => r.yContinue), ridge),
  rise: fitLogistic(rows.map((r) => r.x), rows.map((r) => r.yRise), ridge),
});
export const predictOne = (m: Logit, x: number[]): number => predictLogistic(m, [x])[0]!;

// Why a score: each feature's coefficient times its standardised value, on the log-odds scale. The intercept plus these terms is exactly the log-odds.
export function contributions(m: Logit, x: number[]): { intercept: number; contributions: number[] } {
  return { intercept: m.w[0]!, contributions: x.map((v, j) => (m.w[j + 1]! * (v - m.mean[j]!)) / m.sd[j]!) };
}

const metricsFor = (train: TrainRow[], test: TrainRow[], target: Target, model: Logit): TargetMetrics => {
  const y = test.map((r) => (target === 'rise' ? r.yRise : r.yContinue));
  const p = test.map((r) => predictOne(model, r.x));
  const trainY = train.map((r) => (target === 'rise' ? r.yRise : r.yContinue));
  const base = trainY.reduce((s, v) => s + v, 0) / trainY.length;
  const order = p.map((_, i) => i).sort((a, b) => p[a]! - p[b]!);
  const bins: Calibration[] = [];
  for (let b = 0; b < 5; b++) {
    const part = order.slice(Math.floor((b * order.length) / 5), Math.floor(((b + 1) * order.length) / 5));
    bins.push({ predicted: part.reduce((s, i) => s + p[i]!, 0) / Math.max(1, part.length), observed: part.reduce((s, i) => s + y[i]!, 0) / Math.max(1, part.length), n: part.length });
  }
  const hi = p.map((v, i) => (v >= 0.3 ? i : -1)).filter((i) => i >= 0);
  const tail: Calibration = { predicted: hi.length ? hi.reduce((s, i) => s + p[i]!, 0) / hi.length : 0, observed: hi.length ? hi.reduce((s, i) => s + y[i]!, 0) / hi.length : 0, n: hi.length };
  return {
    tail,
    auc: auc(p, y),
    ap: averagePrecision(p, y),
    brierSkill: 1 - brier(p, y) / brier(p.map(() => base), y),
    baseRate: base,
    testRows: test.length,
    positives: y.reduce((s, v) => s + v, 0),
    persistenceAuc: auc(test.map((r) => r.f3), y),
    bins,
  };
};

// Time-split backtest: fit on country-months up to `trainEnd`, evaluate on `testStart`..`testEnd` (label windows never cross the split).
export function backtest(rows: TrainRow[], split: { trainEnd: number; testStart: number; testEnd: number }): { rise: TargetMetrics; continue: TargetMetrics } {
  const train = rows.filter((r) => r.ym <= split.trainEnd);
  const test = rows.filter((r) => r.ym >= split.testStart && r.ym <= split.testEnd);
  const m = fitTwo(train);
  return { rise: metricsFor(train, test, 'rise', m.rise), continue: metricsFor(train, test, 'continue', m.continue) };
}

// Rolling origin: for each year, fit on everything up to September of the year before (the label windows of those rows end by December)
// and test on that year. A year with no test months or fewer than 10 "rise" positives is skipped: its AUC would say nothing.
export function rollingBacktest(rows: TrainRow[], years: number[]): { year: number; testRows: number; positives: number; rise: TargetMetrics; continue: TargetMetrics }[] {
  const out: { year: number; testRows: number; positives: number; rise: TargetMetrics; continue: TargetMetrics }[] = [];
  for (const year of years) {
    const test = rows.filter((r) => r.ym >= year * 12 && r.ym <= year * 12 + 11);
    const train = rows.filter((r) => r.ym <= year * 12 - 4); // September of the year before
    const positives = test.reduce((t, r) => t + r.yRise, 0);
    if (test.length === 0 || train.length === 0 || positives < 10) continue;
    const m = fitTwo(train);
    out.push({ year, testRows: test.length, positives, rise: metricsFor(train, test, 'rise', m.rise), continue: metricsFor(train, test, 'continue', m.continue) });
  }
  return out;
}

// 5th-95th percentile of the predicted probability over `reps` cluster-bootstrap refits (countries resampled with replacement).
// It covers training-sample uncertainty only.
export function bootstrapInterval(rows: TrainRow[], target: Target, xs: number[][], reps: number, seed: number): { lo: number; hi: number }[] {
  const ids = new Map<string, number>();
  const groups = rows.map((r) => ids.get(r.id) ?? (ids.set(r.id, ids.size), ids.size - 1));
  const runs = clusterBootstrap(groups, reps, seed, (idx) => {
    const sub = idx.map((i) => rows[i]!);
    const m = fitLogistic(sub.map((r) => r.x), sub.map((r) => (target === 'rise' ? r.yRise : r.yContinue)), 1e-3);
    return xs.map((x) => predictOne(m, x));
  });
  return xs.map((_, j) => ({ lo: percentile(runs.map((r) => r[j]!), 0.05), hi: percentile(runs.map((r) => r[j]!), 0.95) }));
}

// Both targets in one bootstrap, so each replicate can be clamped: a sharp rise implies continuing violence, so its probability in a
// replicate never exceeds "continue" (the point estimates are clamped the same way). Without this the "rise" interval could sit above
// the "continue" interval.
export function bootstrapPair(rows: TrainRow[], xs: number[][], reps: number, seed: number): { continue: { lo: number; hi: number }[]; rise: { lo: number; hi: number }[] } {
  const ids = new Map<string, number>();
  const groups = rows.map((r) => ids.get(r.id) ?? (ids.set(r.id, ids.size), ids.size - 1));
  const runs = clusterBootstrap(groups, reps, seed, (idx) => {
    const sub = idx.map((i) => rows[i]!);
    const mc = fitLogistic(sub.map((r) => r.x), sub.map((r) => r.yContinue), 1e-3);
    const mr = fitLogistic(sub.map((r) => r.x), sub.map((r) => r.yRise), 1e-3);
    return xs.flatMap((x) => {
      const c = predictOne(mc, x);
      return [c, Math.min(predictOne(mr, x), c)];
    });
  });
  const band = (k: number) => xs.map((_, j) => ({ lo: percentile(runs.map((r) => r[2 * j + k]!), 0.05), hi: percentile(runs.map((r) => r[2 * j + k]!), 0.95) }));
  return { continue: band(0), rise: band(1) };
}

// The confidence label is a heuristic, not a statistical coverage claim: the lowest of three checks, with the reason of the weakest.
export function confidenceOf(a: { locatedShare365: number; intervalWidth: number; provisionalShare90: number; deaths365: number }): { level: Confidence; reason: string } {
  const placed = a.deaths365 > 0 ? (a.locatedShare365 >= 0.6 ? 2 : a.locatedShare365 >= 0.3 ? 1 : 0) : 2;
  const width = a.intervalWidth <= 0.1 ? 2 : a.intervalWidth <= 0.25 ? 1 : 0;
  const prov = a.provisionalShare90 <= 0.5 ? 2 : 1;
  const worst = Math.min(placed, width, prov);
  const level: Confidence = worst === 2 ? 'high' : worst === 1 ? 'medium' : 'low';
  if (worst === 2) return { level, reason: 'the deaths are located, the interval is narrow and the recent data is mostly final' };
  if (placed === worst) return { level, reason: `only ${Math.round(a.locatedShare365 * 100)}% of the deaths were located to a province or better` };
  if (width === worst) return { level, reason: `the risk interval is wide (${Math.round(a.intervalWidth * 100)} points)` };
  return { level, reason: 'most of the recent data is provisional' };
}
