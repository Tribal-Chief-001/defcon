import type { ConflictsFile } from './types';

const FAIL = 'Could not load the conflicts data';
let cached: Promise<ConflictsFile> | null = null;

const num = (v: unknown) => typeof v === 'number' && Number.isFinite(v);
const range = (r: unknown) => !!r && typeof r === 'object' && num((r as Record<string, unknown>).best) && num((r as Record<string, unknown>).low) && num((r as Record<string, unknown>).high);
const text = (v: unknown) => typeof v === 'string';
// a real calendar date (2026-02-30 and 2026-13-45 are not)
const realDate = (v: unknown) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`)) && new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) === v;
const KINDS = ['state', 'non-state', 'one-sided'];
const event = (e: unknown) => {
  const x = e as Record<string, unknown> | null;
  return !!x && text(x.id) && realDate(x.date) && text(x.place) && text(x.country) && num(x.lat) && num(x.lon) && num(x.precision) && KINDS.includes(x.kind as string) && range(x.deaths) && text(x.headline) && Array.isArray(x.sources) && x.sources.every(text) && typeof x.provisional === 'boolean';
};
const TRENDS = ['rising', 'steady', 'falling', 'low data'];

const weeks = (a: unknown) => Array.isArray(a) && a.length === 52 && a.every(num);
// an older file has no geo (undefined, accepted); otherwise null or a well-formed place
function validGeo(g: unknown): boolean {
  if (g === undefined || g === null) return true;
  const x = g as { lat?: unknown; lon?: unknown; spreadKm?: unknown; locatedShare?: unknown; cells?: unknown };
  return num(x.lat) && num(x.lon) && num(x.spreadKm) && num(x.locatedShare) && (x.locatedShare as number) >= 0 && (x.locatedShare as number) <= 1 && Array.isArray(x.cells) && x.cells.every((c) => Array.isArray(c) && c.length === 3 && c.every(num));
}

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
    weeks(x.weekly) &&
    !!x.weeklyByKind &&
    (['state', 'non-state', 'one-sided'] as const).every((k) => weeks(x.weeklyByKind![k])) &&
    Array.isArray(x.countries) &&
    x.countries.every((k) => !!k && text(k.name) && (k.id === null || text(k.id)) && num(k.deaths90) && num(k.deaths365)) &&
    Array.isArray(x.latest) &&
    x.latest.every(event) &&
    num(x.conflictsListed)
  );
}

function valid(f: unknown): f is ConflictsFile {
  const x = f as Partial<ConflictsFile> | null;
  if (!x || typeof x !== 'object' || !realDate(x.dataEnd) || !Array.isArray(x.conflicts) || !validWorld(x.world)) return false;
  return x.conflicts.every(
    (c) =>
      !!c &&
      typeof c.id === 'string' &&
      typeof c.name === 'string' &&
      Array.isArray(c.countries) &&
      Array.isArray(c.latest) &&
      Array.isArray(c.kinds) &&
      TRENDS.includes(c.trend) &&
      realDate(c.lastDate) &&
      c.latest.every(event) &&
      c.countries.every((k) => !!k && text(k.name) && num(k.deaths365)) &&
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
      c.weekly.every(num) &&
      ((c as { weeklyByKind?: unknown }).weeklyByKind === undefined || (!!(c as { weeklyByKind?: Record<string, unknown> }).weeklyByKind && KINDS.every((k) => weeks((c as { weeklyByKind: Record<string, unknown> }).weeklyByKind[k])))) &&
      validGeo((c as { geo?: unknown }).geo),
  );
}

// public/data/conflicts.json, fetched once when the War tracker opens. A failure rejects with a readable message and is not cached.
export function loadConflicts(): Promise<ConflictsFile> {
  cached ??= fetch('/data/conflicts.json')
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(FAIL))))
    .then((f: unknown) => (valid(f) ? f : Promise.reject(new Error(FAIL))))
    .then((f) => {
      for (const c of f.conflicts) c.geo ??= null; // an older file has no geography
      return f;
    })
    .catch(() => {
      cached = null;
      throw new Error(FAIL);
    });
  return cached;
}
export const resetConflictsCache = () => {
  cached = null;
};
