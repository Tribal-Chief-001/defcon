import type { ConflictsFile } from './types';

const FAIL = 'Could not load the conflicts data';
let cached: Promise<ConflictsFile> | null = null;

const num = (v: unknown) => typeof v === 'number' && Number.isFinite(v);
const range = (r: unknown) => !!r && typeof r === 'object' && num((r as Record<string, unknown>).best) && num((r as Record<string, unknown>).low) && num((r as Record<string, unknown>).high);
const TRENDS = ['rising', 'steady', 'falling', 'low data'];

function validWorld(w: unknown): boolean {
  const x = w as Partial<ConflictsFile['world']> | null;
  return (
    !!x &&
    !!x.deaths &&
    range(x.deaths.d30) &&
    range(x.deaths.d90) &&
    range(x.deaths.d365) &&
    !!x.byKind &&
    (['state', 'non-state', 'one-sided'] as const).every((k) => !!x.byKind![k] && range(x.byKind![k].d90) && range(x.byKind![k].d365)) &&
    Array.isArray(x.weekly) &&
    x.weekly.length === 52 &&
    x.weekly.every(num) &&
    Array.isArray(x.countries) &&
    Array.isArray(x.latest) &&
    num(x.conflictsListed)
  );
}

function valid(f: unknown): f is ConflictsFile {
  const x = f as Partial<ConflictsFile> | null;
  if (!x || typeof x !== 'object' || typeof x.dataEnd !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(x.dataEnd) || !Array.isArray(x.conflicts) || !validWorld(x.world)) return false;
  return x.conflicts.every(
    (c) =>
      !!c &&
      typeof c.id === 'string' &&
      typeof c.name === 'string' &&
      Array.isArray(c.countries) &&
      Array.isArray(c.latest) &&
      Array.isArray(c.kinds) &&
      TRENDS.includes(c.trend) &&
      typeof c.lastDate === 'string' &&
      num(c.provisionalShare) &&
      !!c.deaths &&
      range(c.deaths.d30) &&
      range(c.deaths.d90) &&
      range(c.deaths.d365) &&
      !!c.events &&
      num(c.events.d30) &&
      num(c.events.d90) &&
      num(c.events.d365) &&
      Array.isArray(c.weekly) &&
      c.weekly.length === 52 &&
      c.weekly.every(num),
  );
}

// public/data/conflicts.json, fetched once when the War tracker opens. A failure rejects with a readable message and is not cached.
export function loadConflicts(): Promise<ConflictsFile> {
  cached ??= fetch('/data/conflicts.json')
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(FAIL))))
    .then((f: unknown) => (valid(f) ? f : Promise.reject(new Error(FAIL))))
    .catch(() => {
      cached = null;
      throw new Error(FAIL);
    });
  return cached;
}
export const resetConflictsCache = () => {
  cached = null;
};
