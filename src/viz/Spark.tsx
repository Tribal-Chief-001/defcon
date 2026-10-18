import { areaPath, linePath, niceMax, scaleLinear } from './scale';

// A tiny line of weekly deaths on a zero baseline. All zeros draw a flat line (no NaN).
export function Spark({ data, width = 120, height = 28, area = true, max }: { data: number[]; width?: number; height?: number; area?: boolean; max?: number }) {
  const clean = data.map((v) => (Number.isFinite(v) && v > 0 ? v : 0));
  const peak = Math.max(0, ...clean);
  const x = scaleLinear(0, Math.max(1, clean.length - 1), 1, width - 1);
  const y = scaleLinear(0, max !== undefined && Number.isFinite(max) && max > 0 ? max : niceMax(peak), height - 1, 3); // a shared max makes rows comparable
  const xs = clean.map((_, i) => x(i));
  const ys = clean.map((v) => y(v));
  return (
    <svg role="img" aria-label={peak > 0 ? `Deaths per week, peak ${peak.toLocaleString('en-US')}` : 'Deaths per week: no deaths'} width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block max-w-full">
      {area && clean.length > 0 ? <path d={areaPath(xs, clean.map(() => height - 1), ys)} fill="var(--text)" fillOpacity="0.1" /> : null}
      <line x1="0" y1={height - 0.5} x2={width} y2={height - 0.5} stroke="var(--border-strong)" strokeWidth="1" />
      <path d={linePath(xs, ys)} fill="none" stroke="var(--text)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
