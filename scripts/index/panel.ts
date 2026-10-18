// Country-month panel for the Violence Risk Index study: fatalities from UCDP GED per Gleditsch-Ward country and month, rolling history
// features (use data up to month t only) and 3-month-ahead labels (spec: docs/INSTABILITY-INDEX.md section 4).
export const ym = (year: number, month: number) => year * 12 + (month - 1);

export type GedEv = { gw: string; name: string; ym: number; best: number; type: number };
export type Cell = { events: number; fat: number; state: number; nonstate: number; onesided: number };
export type PanelRow = {
  gw: string;
  name: string;
  ym: number;
  events: number;
  fat: number;
  state: number;
  nonstate: number;
  onesided: number;
  f3: number;
  f12: number;
  f36: number;
  label3: 0 | 1 | null; // next three months hold >= 25 deaths
  labelRise: 0 | 1 | null; // ... and at least double the previous three months
};

export const THRESHOLD = 25;

export function aggregate(events: GedEv[]) {
  const out = new Map<string, { name: string; cells: Map<number, Cell> }>();
  for (const e of events) {
    const c = out.get(e.gw) ?? { name: e.name, cells: new Map<number, Cell>() };
    out.set(e.gw, c);
    const cell = c.cells.get(e.ym) ?? { events: 0, fat: 0, state: 0, nonstate: 0, onesided: 0 };
    c.cells.set(e.ym, cell);
    cell.events += 1;
    cell.fat += e.best;
    if (e.type === 1) cell.state += e.best;
    else if (e.type === 2) cell.nonstate += e.best;
    else if (e.type === 3) cell.onesided += e.best;
  }
  return out;
}

// minHistory: rows start once a full minHistory-month window exists (dropped rows would otherwise have truncated rolling features).
export function buildPanel(agg: ReturnType<typeof aggregate>, start: number, end: number, opts: { minHistory?: number } = {}): PanelRow[] {
  const minHistory = opts.minHistory ?? 36;
  const rows: PanelRow[] = [];
  const n = end - start + 1;
  for (const [gw, { name, cells }] of [...agg].sort(([a], [b]) => Number(a) - Number(b))) {
    const fat = new Float64Array(n);
    for (const [m, c] of cells) if (m >= start && m <= end) fat[m - start] = c.fat;
    const pre = new Float64Array(n + 1); // pre[i] = sum of fat[0..i-1]
    for (let i = 0; i < n; i++) pre[i + 1] = pre[i]! + fat[i]!;
    const sum = (a: number, b: number) => pre[Math.min(n - 1, b) + 1]! - pre[Math.max(0, a)]!; // inclusive indices
    for (let i = Math.max(0, minHistory - 1); i < n; i++) {
      const c = cells.get(start + i) ?? { events: 0, fat: 0, state: 0, nonstate: 0, onesided: 0 };
      const f3 = sum(i - 2, i);
      const known = i + 3 <= n - 1; // the whole next quarter is observed
      const next = known ? sum(i + 1, i + 3) : null;
      rows.push({
        gw,
        name,
        ym: start + i,
        ...c,
        f3,
        f12: sum(i - 11, i),
        f36: sum(i - 35, i),
        label3: next === null ? null : next >= THRESHOLD ? 1 : 0,
        labelRise: next === null ? null : next >= THRESHOLD && next >= 2 * f3 ? 1 : 0,
      });
    }
  }
  return rows;
}
