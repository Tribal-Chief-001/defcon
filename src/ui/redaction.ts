const DAY = 86400;

// Declassify (cosmetic): 0 = fully barred (an event under 24 h old), 1 = declassified (14 days or older), linear in between.
// The text behind the bars is never withheld; this only drives how long the decorative bars are.
export function redactionFor(eventAgeS: number): number {
  if (Number.isNaN(eventAgeS) || !Number.isFinite(eventAgeS)) return 1;
  return Math.max(0, Math.min(1, (eventAgeS - DAY) / (13 * DAY)));
}
