import type { Range } from '../conflicts/types';

// public/data/indices.json (built by scripts/index/build-indices.ts from UCDP and the World Bank). See docs/superpowers/plans/2026-10-19-plan-11-indices.md.
export type Band = 'none' | 'minor' | 'active' | 'severe'; // by deaths in 365 days: none, under 25, 25 to 999, 1,000 or more
export type Trend = 'rising' | 'steady' | 'falling' | 'low data';
export type Confidence = 'high' | 'medium' | 'low';
export type Prob = { p: number; lo: number; hi: number }; // a probability and its 90% bootstrap interval

export type Fatality = {
  score: number; // 0-100 on a log scale of deaths in 90 days (not a weighted composite)
  scoreLow: number;
  scoreHigh: number;
  deaths90: Range;
  deaths365: Range;
  per100k: number | null;
  band: Band;
  trend: Trend;
  rank: number | null; // among countries with deaths in 90 days, 1 = most deadly
  monthly: number[]; // best deaths per month, the last 120 months, oldest first
};
export type Risk = {
  continue: Prob; // at least 25 deaths in the next 3 months
  rise: Prob; // at least 25 and at least double the previous 3 months
  momentum: { value: number; direction: Trend };
  confidence: Confidence;
  confidenceReason: string;
  why: { label: string; value: number }[]; // log-odds contributions to "rise", exactly additive
};
export type CountryIndex = { id: string; fatality: Fatality; risk: Risk | null }; // risk null = not modelled

export type Calibration = { predicted: number; observed: number; n: number };
export type TargetMetrics = { auc: number; ap: number; brierSkill: number; baseRate: number; testRows: number; positives: number; persistenceAuc: number; bins: Calibration[]; tail: Calibration /* predictions of 30% or more */ };
export type ModelMeta = {
  trainedThrough: string; // YYYY-MM, the last country-month whose label window is fully observed
  testPeriod: string;
  features: string[];
  bootstrapReps: number;
  rise: TargetMetrics;
  continue: TargetMetrics;
};
export type IndicesFile = { generated: string; dataEnd: string; seriesEnd: string; model: ModelMeta; world: { monthly: number[] }; countries: CountryIndex[] };
