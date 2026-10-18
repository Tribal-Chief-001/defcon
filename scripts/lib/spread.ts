// An event covers the days from `date_start` to `date_end` (UCDP candidate rows often cover a month or several months, date_prec 4 and 5):
// its deaths are spread evenly over those days, so a window takes the share of the days it contains. Pure helpers shared by the conflicts
// and indices builders. No end, a malformed end or an end before the start means one day (the old behaviour).
export type Span = { start: number; end: number; len: number }; // inclusive day numbers (days since the epoch)

export const dayNum = (s: string | undefined): number | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s ?? '');
  if (!m) return null;
  const t = Date.UTC(+m[1]!, +m[2]! - 1, +m[3]!) / 86400000;
  return Number.isFinite(t) ? t : null;
};

// The days an event covers, the end clipped to `lastDay` (the data end: later days are not data yet); null without a usable start or
// when it starts after `lastDay`.
export function spanOf(dateStart: string | undefined, dateEnd: string | undefined, lastDay: number): Span | null {
  const start = dayNum(dateStart);
  if (start === null || start > lastDay) return null;
  const e = dayNum(dateEnd);
  const end = Math.min(e !== null && e >= start ? e : start, lastDay);
  return { start, end, len: end - start + 1 };
}

// The fraction of the event's days inside the window [lo, hi] (inclusive day numbers).
export function share(s: Span, lo: number, hi: number): number {
  const a = Math.max(s.start, lo);
  const b = Math.min(s.end, hi);
  return b < a ? 0 : (b - a + 1) / s.len;
}

// The share of the event's days in each calendar month it covers; `month` is year * 12 + (month - 1).
export function monthShares(s: Span): { month: number; share: number }[] {
  const first = new Date(s.start * 86400000);
  const out: { month: number; share: number }[] = [];
  let y = first.getUTCFullYear();
  let m = first.getUTCMonth();
  for (;;) {
    const lo = Date.UTC(y, m, 1) / 86400000;
    const hi = Date.UTC(y, m + 1, 1) / 86400000 - 1;
    if (lo > s.end) break;
    out.push({ month: y * 12 + m, share: share(s, lo, hi) });
    if (++m === 12) (m = 0, y++);
  }
  return out;
}
