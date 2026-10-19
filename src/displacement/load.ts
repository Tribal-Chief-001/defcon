import type { DisplacementFile } from './types';

let cached: Promise<DisplacementFile | null> | null = null;

const fig = (v: unknown) => v === null || (typeof v === 'number' && Number.isFinite(v) && v >= 0);
const FROM = ['refugees', 'asylumSeekers', 'idps', 'returnedRefugees', 'stateless', 'otherInNeed'];
const HOSTED = ['refugees', 'asylumSeekers'];
const group = (g: unknown, keys: string[]) => !!g && typeof g === 'object' && keys.every((k) => fig((g as Record<string, unknown>)[k]));

function valid(f: unknown): f is DisplacementFile {
  const x = f as Partial<DisplacementFile> | null;
  if (!x || !Number.isInteger(x.year) || typeof x.source !== 'string' || !x.source || typeof x.licence !== 'string' || !x.licence || typeof x.termsUrl !== 'string' || !/^https:\/\/www\.unhcr\.org\//.test(x.termsUrl) || !x.countries || typeof x.countries !== 'object') return false;
  return Object.entries(x.countries).every(([k, c]) => /^[A-Z]{3}$/.test(k) && !!c && (c.from === undefined || group(c.from, FROM)) && (c.hosted === undefined || group(c.hosted, HOSTED)));
}

// public/data/displacement.json (UNHCR figures, CC BY 4.0), fetched when a dossier opens; null on any failure (the dossier then simply has
// no displacement block). A failure is not cached.
export function loadDisplacement(): Promise<DisplacementFile | null> {
  cached ??= fetch('/data/displacement.json')
    .then((r) => (r.ok ? r.json() : null))
    .then((f: unknown) => (valid(f) ? f : null))
    .catch(() => null)
    .then((f) => {
      if (!f) cached = null;
      return f;
    });
  return cached;
}
export const resetDisplacementCache = () => {
  cached = null;
};
