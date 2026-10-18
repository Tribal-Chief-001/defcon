import type { Snapshot } from './snapshot';
import { KINDS } from './types';

// Defcon's own composite ("DEFCON-style"), never the official US DEFCON level. See docs/TENSION-INDEX.md. Provisional.
export const TENSION = {
  windowDays: 7,
  halfLifeDays: 3,
  weights: { armed: 1, civilian: 1.2, riot: 0.6, protest: 0.3, other: 0 },
  autoMultiplier: 0.5,
  scale: 1448, // calibrated 2026-10-18 by scripts/events/calibrate-tension.ts: median 7-day UCDP score maps to level value 2.5
} as const;

const DAY = 86400;

export function levelFromScore(score: number): 1 | 2 | 3 | 4 | 5 {
  if (!Number.isFinite(score) || score <= 0) return score === Infinity ? 5 : 1;
  const raw = 1 + 4 * (1 - Math.exp(-score / TENSION.scale));
  return Math.max(1, Math.min(5, Math.round(raw))) as 1 | 2 | 3 | 4 | 5;
}

// score = sum over events in the window of weight[kind] * severity^1.5 * (human ? 1 : autoMultiplier) * 0.5^(age / halfLife)
// `comparable` is false when under half of the score comes from human-coded events (or the score is 0): the level is then
// not comparable with the calibrated UCDP baseline and must not be presented as a measure of tension.
export function tension(
  s: Snapshot,
  nowS: number,
  scope?: { country?: string },
): { level: 1 | 2 | 3 | 4 | 5; score: number; humanShare: number; comparable: boolean } {
  const from = nowS - TENSION.windowDays * DAY;
  let score = 0;
  let humanScore = 0;
  for (let i = 0; i < s.n; i++) {
    const t = s.timeS[i]!;
    if (t < from || t > nowS) continue;
    if (scope?.country !== undefined && s.countries[s.country[i]!] !== scope.country) continue;
    const kind = KINDS[s.kind[i]!];
    if (!kind) continue;
    const w = TENSION.weights[kind];
    if (w === 0) continue;
    const ageDays = (nowS - t) / DAY;
    const part = w * Math.pow(s.severity[i]!, 1.5) * (s.human[i] ? 1 : TENSION.autoMultiplier) * Math.pow(0.5, ageDays / TENSION.halfLifeDays);
    score += part;
    if (s.human[i]) humanScore += part;
  }
  const humanShare = score > 0 ? humanScore / score : 0;
  return { level: levelFromScore(score), score, humanShare, comparable: score > 0 && humanShare >= 0.5 };
}
