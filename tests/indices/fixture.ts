import { FEATURES } from '../../scripts/index/model';
import type { CountryIndex, IndicesFile, TargetMetrics } from '../../src/indices/types';

const metrics = (auc: number, persistence: number): TargetMetrics => ({
  auc, ap: 0.2, brierSkill: 0.105, baseRate: 0.057, testRows: 7410, positives: 380, persistenceAuc: persistence,
  bins: [0.005, 0.008, 0.018, 0.076, 0.2].map((p, i) => ({ predicted: p, observed: p * (i === 4 ? 0.8 : 1), n: 1482 })),
  tail: { predicted: 0.36, observed: 0.32, n: 203 },
});
const why = (big: string) => FEATURES.map((label, i) => ({ label, value: label === big ? 3.1 : (i % 2 ? -0.4 : 0.2) / (i + 1) })).sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
const monthly = (v: number) => Array.from({ length: 120 }, (_, i) => (i > 100 ? v + i : 0));

export const ukraine = (): CountryIndex => ({
  id: 'UKR',
  fatality: { score: 100, scoreLow: 97.6, scoreHigh: 100, deaths90: { best: 11071, low: 10500, high: 14000 }, deaths365: { best: 85542, low: 82000, high: 111000 }, per100k: 205.5, band: 'severe', trend: 'steady', rank: 1, monthly: monthly(4000) },
  risk: { continue: { p: 0.9997, lo: 0.9994, hi: 0.9998 }, rise: { p: 0.1, lo: 0.06, hi: 0.15 }, momentum: { value: -2.1, direction: 'falling' }, confidence: 'low', confidenceReason: 'only 12% of the deaths were located to a province or better', why: why('Deaths in the last 12 months') },
});
export const ecuador = (): CountryIndex => ({
  id: 'ECU',
  fatality: { score: 17.5, scoreLow: 12, scoreHigh: 24, deaths90: { best: 4, low: 3, high: 7 }, deaths365: { best: 190, low: 150, high: 260 }, per100k: 1.04, band: 'active', trend: 'low data', rank: 47, monthly: monthly(10) },
  risk: { continue: { p: 0.5, lo: 0.4, hi: 0.6 }, rise: { p: 0.32, lo: 0.2, hi: 0.45 }, momentum: { value: -1, direction: 'low data' }, confidence: 'medium', confidenceReason: 'the risk interval is wide (25 points)', why: why('Deaths in the last 12 months') },
});
export const iceland = (): CountryIndex => ({
  id: 'ISL',
  fatality: { score: 0, scoreLow: 0, scoreHigh: 0, deaths90: { best: 0, low: 0, high: 0 }, deaths365: { best: 0, low: 0, high: 0 }, per100k: 0, band: 'none', trend: 'low data', rank: null, monthly: monthly(0) },
  risk: null,
});

export const indicesFixture = (): IndicesFile => ({
  generated: '2026-10-19',
  dataEnd: '2026-08-31',
  seriesEnd: '2026-08',
  model: { trainedThrough: '2025-09', testPeriod: '2021-01 to 2025-09', features: FEATURES, bootstrapReps: 100, rise: metrics(0.846, 0.742), continue: metrics(0.983, 0.972) },
  world: { monthly: monthly(8000) },
  countries: [ukraine(), ecuador(), iceland()],
});
