const int = (n: number) => (Number.isFinite(n) ? n : 0).toLocaleString('en-US');
const C = (r: number) => 2 * Math.PI * r;

// Three concentric 270-degree arcs: the last 365 days (the whole ring), 90 days and 30 days as shares of it, so the eye sees how much of a
// year's deaths came recently.
export function Ring({ d30, d90, d365, size = 108 }: { d30: number; d90: number; d365: number; size?: number }) {
  const total = d365 > 0 ? d365 : 1;
  const frac = (v: number) => Math.min(1, Math.max(0, Number.isFinite(v) ? v / total : 0));
  const arcs = [
    { r: 46, f: 1, color: 'var(--text-muted)', w: 2 },
    { r: 37, f: frac(d90), color: 'var(--text)', w: 3 },
    { r: 28, f: frac(d30), color: 'var(--lime)', w: 4 },
  ];
  return (
    <svg role="img" aria-label={`Deaths: 30 days ${int(d30)}, 90 days ${int(d90)}, 365 days ${int(d365)}`} width={size} height={size} viewBox="0 0 108 108" className="block max-w-full">
      {arcs.map((a) => (
        <g key={a.r} transform="rotate(135 54 54)">
          <circle cx="54" cy="54" r={a.r} fill="none" stroke="var(--border-strong)" strokeWidth="1" strokeDasharray={`${C(a.r) * 0.75} ${C(a.r)}`} />
          <circle data-arc={a.r} cx="54" cy="54" r={a.r} fill="none" stroke={a.color} strokeWidth={a.w} strokeLinecap="round" strokeDasharray={`${C(a.r) * 0.75 * a.f} ${C(a.r)}`} />
        </g>
      ))}
    </svg>
  );
}
