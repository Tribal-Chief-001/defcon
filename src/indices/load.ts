import type { CountryIndex, IndicesFile } from './types';

let cached: Promise<IndicesFile | null> | null = null;

const num = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const within = (v: unknown, lo: number, hi: number): v is number => num(v) && v >= lo && v <= hi;
const range = (r: unknown) => {
  const x = r as { best?: unknown; low?: unknown; high?: unknown } | null;
  return !!x && num(x.best) && num(x.low) && num(x.high) && x.low >= 0 && x.low <= x.best && x.best <= x.high;
};
const prob = (p: unknown) => {
  const x = p as { p?: unknown; lo?: unknown; hi?: unknown } | null;
  return !!x && within(x.p, 0, 1) && within(x.lo, 0, 1) && within(x.hi, 0, 1) && x.lo <= x.p && x.p <= x.hi;
};
const TRENDS = ['rising', 'steady', 'falling', 'low data'];
const months = (a: unknown, n: number) => Array.isArray(a) && a.length === n && a.every((v) => num(v) && v >= 0);
const calib = (b: unknown) => {
  const x = b as { predicted?: unknown; observed?: unknown; n?: unknown } | null;
  return !!x && within(x.predicted, 0, 1) && within(x.observed, 0, 1) && num(x.n);
};
const target = (t: unknown) => {
  const x = t as Record<string, unknown> | null;
  return !!x && [x.auc, x.ap, x.brierSkill, x.baseRate, x.testRows, x.positives, x.persistenceAuc].every(num) && Array.isArray(x.bins) && x.bins.length === 5 && x.bins.every(calib) && calib(x.tail);
};

const rollingOk = (r: unknown) => Array.isArray(r) && r.every((y) => !!y && Number.isInteger(y.year) && num(y.testRows) && num(y.positives) && [y.riseAuc, y.risePersistenceAuc, y.continueAuc, y.continuePersistenceAuc].every((v) => within(v, 0, 1)));

function country(c: CountryIndex | null | undefined): boolean {
  if (!c || typeof c.id !== 'string' || !c.fatality) return false;
  const f = c.fatality;
  const ok =
    within(f.score, 0, 100) &&
    within(f.scoreLow, 0, 100) &&
    within(f.scoreHigh, 0, 100) &&
    f.scoreLow <= f.score &&
    f.score <= f.scoreHigh &&
    range(f.deaths90) &&
    range(f.deaths365) &&
    (f.per100k === null || within(f.per100k, 0, 1e9)) &&
    ['none', 'minor', 'active', 'severe'].includes(f.band) &&
    TRENDS.includes(f.trend) &&
    (f.rank === null || (Number.isInteger(f.rank) && f.rank > 0)) &&
    months(f.monthly, 120);
  if (!ok) return false;
  const r = c.risk;
  if (r === null) return true;
  return (
    !!r &&
    prob(r.continue) &&
    prob(r.rise) &&
    !!r.momentum &&
    num(r.momentum.value) &&
    TRENDS.includes(r.momentum.direction) &&
    ['high', 'medium', 'low'].includes(r.confidence) &&
    typeof r.confidenceReason === 'string' &&
    Array.isArray(r.why) &&
    r.why.every((w) => !!w && typeof w.label === 'string' && num(w.value))
  );
}

function valid(f: unknown): f is IndicesFile {
  const x = f as Partial<IndicesFile> | null;
  return (
    !!x &&
    typeof x.dataEnd === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(x.dataEnd) &&
    typeof x.seriesEnd === 'string' &&
    !!x.model &&
    target(x.model.rise) &&
    target(x.model.continue) &&
    Array.isArray(x.model.features) &&
    x.model.features.every((t) => typeof t === 'string') &&
    typeof x.model.trainedThrough === 'string' &&
    typeof x.model.testPeriod === 'string' &&
    num(x.model.bootstrapReps) &&
    rollingOk(x.model.rolling) &&
    !!x.world &&
    months(x.world.monthly, 120) &&
    Array.isArray(x.countries) &&
    x.countries.every(country)
  );
}

// public/data/indices.json (the Fatality Index and the Instability Index); null on any failure, which the dossier and the War room
// simply do without. A failure is not cached.
export function loadIndices(): Promise<IndicesFile | null> {
  cached ??= fetch('/data/indices.json')
    .then((r) => (r.ok ? r.json() : null))
    .then((f: unknown) => (valid(f) ? f : null))
    .catch(() => null)
    .then((f) => {
      if (!f) cached = null;
      return f;
    });
  return cached;
}
export const resetIndicesCache = () => {
  cached = null;
};
export const indexFor = (f: IndicesFile | null | undefined, id: string): CountryIndex | undefined => f?.countries.find((c) => c.id === id.toUpperCase());
