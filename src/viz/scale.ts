// Small, pure helpers for the War room's SVG charts.
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const num = (v: number) => (Number.isFinite(v) ? v : 0);
const r1 = (v: number) => Math.round(num(v) * 10) / 10;

export const scaleLinear = (d0: number, d1: number, r0: number, r1_: number) => (v: number) => (d1 === d0 ? r0 : r0 + ((v - d0) / (d1 - d0)) * (r1_ - r0));

// the next 1, 2, 5 x 10^k at or above v (never 0 or NaN), for axis maxima
export function niceMax(v: number): number {
  if (!Number.isFinite(v) || v <= 0) return 1;
  const exp = Math.floor(Math.log10(v));
  const f = v / 10 ** exp;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  return nice * 10 ** exp;
}

export const addDays = (iso: string, n: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
// the last day of week i of the 52-week series that ends on `dataEnd` (week 51)
export const weekEnd = (dataEnd: string, i: number) => addDays(dataEnd, -(51 - i) * 7);

// the weeks where a new month begins (by the week's end date), for the x axis
// the first tick and every January also carry the two-digit year, so the axis says which year it is
export function monthTicks(dataEnd: string): { i: number; label: string; year?: string }[] {
  const out: { i: number; label: string; year?: string }[] = [];
  let prev = weekEnd(dataEnd, 0).slice(5, 7);
  for (let i = 1; i < 52; i++) {
    const m = weekEnd(dataEnd, i).slice(5, 7);
    if (m !== prev) out.push({ i, label: MON[Number(m) - 1]!, ...(out.length === 0 || m === '01' ? { year: weekEnd(dataEnd, i).slice(2, 4) } : {}) });
    prev = m;
  }
  return out;
}

// cumulative stack from zero (a bar or area chart of deaths must start at zero); bad values count as 0
export function stackAreas(series: number[][]): { y0: number[]; y1: number[] }[] {
  const n = series[0]?.length ?? 0;
  const base = new Array<number>(n).fill(0);
  return series.map((s) => {
    const y0 = [...base];
    const y1 = s.map((v, i) => y0[i]! + Math.max(0, num(v)));
    y1.forEach((v, i) => (base[i] = v));
    return { y0, y1 };
  });
}

export const linePath = (xs: number[], ys: number[]) => xs.map((x, i) => `${i ? 'L' : 'M'}${r1(x)},${r1(ys[i]!)}`).join('');
export function areaPath(xs: number[], y0: number[], y1: number[]): string {
  if (xs.length === 0) return '';
  const top = xs.map((x, i) => `${i ? 'L' : 'M'}${r1(x)},${r1(y1[i]!)}`).join('');
  const back = [...xs].reverse().map((x, k) => `L${r1(x)},${r1(y0[xs.length - 1 - k]!)}`).join('');
  return `${top}${back}Z`;
}
