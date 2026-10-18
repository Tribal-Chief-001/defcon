// Activity trend from event counts, not deaths: one mass-casualty event must not make a steady conflict look like it is falling or rising.
// `d30` = events in the last 30 days, `d90` = events in the last 90 days; the base is the average 30 days of the 60 before.
export type Trend = 'rising' | 'steady' | 'falling' | 'low data';
export function activityTrend(d30: number, d90: number): Trend {
  if (![d30, d90].every(Number.isFinite) || d30 < 0 || d90 < 0) return 'low data';
  const base = (d90 - d30) / 2;
  if (d30 + base < 5) return 'low data';
  if (d30 >= 5 && d30 >= 1.5 * base) return 'rising';
  if (base >= 5 && d30 <= 0.5 * base) return 'falling';
  return 'steady';
}
