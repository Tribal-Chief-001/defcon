import type { ConflictsFile } from '../conflicts/types';
import type { IndicesFile } from '../indices/types';

type Cell = string | number | boolean | null | undefined;

// One CSV field. Numbers are written as they are (NaN and infinities are empty); text that a spreadsheet would read as a formula (it
// starts with = + - @ tab or carriage return) gets a leading apostrophe; fields with commas, quotes or line breaks are quoted.
export function csvCell(v: Cell): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : '';
  if (typeof v === 'boolean') return String(v);
  const t = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return /[",\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
}
export const toCsv = (rows: Cell[][]): string => rows.map((r) => r.map(csvCell).join(',')).join('\n') + '\n';

// a file name from data: letters, digits, dash, underscore and dot only
export const safeFileName = (s: string): string =>
  s
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/-+\./g, '.')
    .replace(/\.{2,}/g, '.')
    .replace(/^[-.]+|-+$/g, '') || 'download';

const range = (r: { best: number; low: number; high: number }) => [r.best, r.low, r.high];

// every listed conflict with its death ranges (UCDP estimates; windows end at the data end date), CC BY 4.0 (UCDP), see docs/OPEN-DATA.md
export function conflictsCsv(f: ConflictsFile): string {
  const head = ['id', 'name', 'kinds', 'activity_trend', ...['30d', '90d', '365d'].flatMap((w) => [`deaths_${w}_best`, `deaths_${w}_low`, `deaths_${w}_high`]), 'events_30d', 'events_90d', 'events_365d', 'last_event', 'provisional_share', 'countries', 'data_end'];
  return toCsv([
    head,
    ...f.conflicts.map((c) => [c.id, c.name, c.kinds.join(';'), c.trend, ...range(c.deaths.d30), ...range(c.deaths.d90), ...range(c.deaths.d365), c.events.d30, c.events.d90, c.events.d365, c.lastDate, c.provisionalShare, c.countries.map((k) => k.name).join(';'), f.dataEnd]),
  ]);
}

// the Fatality Index and the Instability Index of every country; the risk columns are empty (never 0) for a country that is not modelled
export function indicesCsv(f: IndicesFile, names: Map<string, string>): string {
  const head = ['country_id', 'country', 'fatality_score', 'fatality_score_low', 'fatality_score_high', 'band', 'deaths_90d_best', 'deaths_90d_low', 'deaths_90d_high', 'deaths_365d_best', 'deaths_365d_low', 'deaths_365d_high', 'deaths_per_100k_365d', 'rank_90d', 'activity_trend', 'risk_continue', 'risk_continue_low', 'risk_continue_high', 'risk_rise', 'risk_rise_low', 'risk_rise_high', 'momentum', 'confidence', 'data_end'];
  return toCsv([
    head,
    ...f.countries.map((c) => {
      const x = c.fatality;
      const r = c.risk;
      return [c.id, names.get(c.id) ?? c.id, x.score, x.scoreLow, x.scoreHigh, x.band, ...range(x.deaths90), ...range(x.deaths365), x.per100k, x.rank, x.trend, r?.continue.p, r?.continue.lo, r?.continue.hi, r?.rise.p, r?.rise.lo, r?.rise.hi, r?.momentum.direction, r?.confidence, f.dataEnd];
    }),
  ]);
}
