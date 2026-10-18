// 30-day event counts as a 1px line. All-zero or empty data draws a flat line (no NaN).
export function Sparkline({ data, width = 240, height = 36 }: { data: number[]; width?: number; height?: number }) {
  const peak = Math.max(0, ...data);
  const max = Math.max(1, peak);
  const pts = data.map((v, i) => `${(1 + (i * (width - 2)) / Math.max(1, data.length - 1)).toFixed(1)},${(height - 1 - (v / max) * (height - 2)).toFixed(1)}`).join(' ');
  return (
    <svg role="img" width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block max-w-full">
      <title>{`Events per day, last 30 days, peak ${peak}`}</title>
      <line x1="0" y1={height - 0.5} x2={width} y2={height - 0.5} stroke="var(--border-strong)" strokeWidth="1" />
      <polyline points={pts} fill="none" stroke="var(--lime)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
