const clamp = (v: number) => Math.min(100, Math.max(0, v));
const D2R = Math.PI / 180;
const A0 = 225; // the gauge runs 270 degrees clockwise from bottom-left, over the top, to bottom-right (angles clockwise from 12 o'clock)
const at = (v: number) => A0 + 2.7 * v;
const pt = (cx: number, cy: number, r: number, deg: number) => [cx + r * Math.sin(deg * D2R), cy - r * Math.cos(deg * D2R)] as const;

export function arcPath(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const [x0, y0] = pt(cx, cy, r, a0);
  const [x1, y1] = pt(cx, cy, r, a1);
  const big = a1 - a0 > 180 ? 1 : 0;
  return `M${x0.toFixed(2)},${y0.toFixed(2)}A${r},${r} 0 ${big} 1 ${x1.toFixed(2)},${y1.toFixed(2)}`;
}

// A 0-100 gauge: a hairline 270-degree track, the low-high range as a lime segment and the value as a bone tick, the number at the
// centre as text. The text alternative gives the value, the scale and the range.
export function Gauge({ value, low, high, label, size = 124 }: { value: number; low: number; high: number; label: string; size?: number }) {
  const v = clamp(Number.isFinite(value) ? value : 0);
  const lo = clamp(Number.isFinite(low) ? Math.min(low, v) : v);
  const hi = clamp(Number.isFinite(high) ? Math.max(high, v) : v);
  const [tx0, ty0] = pt(50, 50, 34, at(v));
  const [tx1, ty1] = pt(50, 50, 46, at(v));
  return (
    <svg role="img" aria-label={`${label}: ${Math.round(v)} out of 100, range ${Math.round(lo)} to ${Math.round(hi)}`} width={size} height={size} viewBox="0 0 100 100" className="block max-w-full">
      <path d={arcPath(50, 50, 40, A0, A0 + 270)} fill="none" stroke="var(--border-strong)" strokeWidth="1" />
      {hi > lo ? <path d={arcPath(50, 50, 40, at(lo), at(hi))} fill="none" stroke="var(--lime)" strokeWidth="4" strokeLinecap="round" /> : null}
      <line x1={tx0} y1={ty0} x2={tx1} y2={ty1} stroke="var(--text)" strokeWidth="2" strokeLinecap="round" />
      <text x="50" y="57" textAnchor="middle" className="fill-[var(--text)] font-[var(--font-body)] text-[26px] font-semibold">
        {Math.round(v)}
      </text>
    </svg>
  );
}
