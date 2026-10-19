// The data end of a build: the newest event date, but never after today (one bad future date in a source must not move every window).
// An empty or malformed value gives '' so the caller can stop with an error.
export function capDataEnd(maxDate: string, today: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(maxDate)) return '';
  return maxDate > today ? today : maxDate;
}
