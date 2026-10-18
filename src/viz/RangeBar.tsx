const clamp = (v: number) => Math.min(100, Math.max(0, Number.isFinite(v) ? v : 0));
const int = (n: number) => (Number.isFinite(n) ? n : 0).toLocaleString('en-US');

// The uncertainty of a death estimate on a zero-based scale: a hairline track, the low-high range as a lime segment and the best
// estimate as a bone tick. `max` is the scale's end (use one value for all rows of a league so bars compare).
export function RangeBar({ low, best, high, max }: { low: number; best: number; high: number; max: number }) {
  const m = max > 0 ? max : 1;
  const x = (v: number) => clamp((v / m) * 100);
  return (
    <svg role="img" aria-label={`Best estimate ${int(best)}, range ${int(low)} to ${int(high)}`} viewBox="0 0 100 10" preserveAspectRatio="none" className="block h-[10px] w-full">
      <line x1="0" y1="5" x2="100" y2="5" stroke="var(--border-strong)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      <line data-part="range" x1={x(low)} y1="5" x2={x(high)} y2="5" stroke="var(--lime)" strokeWidth="3" strokeLinecap="butt" vectorEffect="non-scaling-stroke" />
      <rect data-part="best" x={Math.max(0, x(best) - 0.6)} y="0.5" width="1.2" height="9" fill="var(--text)" />
    </svg>
  );
}
