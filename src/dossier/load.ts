import type { CountryIndexEntry, CountryRow, Dossier } from './types';

const BASE = '/data/dossiers';
const ID = /^[A-Z0-9]{3}$/; // ADM0_A3: nothing else may reach the URL
const dossiers = new Map<string, Promise<Dossier | null>>();
let indexP: Promise<CountryIndexEntry[]> | undefined;
let countriesP: Promise<CountryRow[]> | undefined;

export const clearDossierCache = () => {
  dossiers.clear();
  indexP = undefined;
  countriesP = undefined;
};

const valid = (x: unknown, id: string): x is Dossier => {
  const d = x as Partial<Dossier> | null;
  return !!d && typeof d === 'object' && d.id === id && typeof d.name === 'string' && Array.isArray(d.capitals) && Array.isArray(d.neighbours);
};

// One country's dossier, or null on any failure (404, bad JSON, wrong id). Never throws; a failure is not cached.
export function loadDossier(id: string, fetchFn: typeof fetch = fetch): Promise<Dossier | null> {
  if (!ID.test(id)) return Promise.resolve(null);
  let p = dossiers.get(id);
  if (!p) {
    p = (async () => {
      try {
        const r = await fetchFn(`${BASE}/${id}.json`);
        if (!r.ok) return null;
        const j: unknown = await r.json();
        return valid(j, id) ? j : null;
      } catch {
        return null;
      }
    })();
    dossiers.set(id, p);
    void p.then((d) => d === null && dossiers.delete(id));
  }
  return p;
}

// The search index (id, name, codes, capitals, label point); [] on failure.
export function loadIndex(fetchFn: typeof fetch = fetch): Promise<CountryIndexEntry[]> {
  if (!indexP) {
    indexP = (async () => {
      try {
        const r = await fetchFn(`${BASE}/index.json`);
        const j: unknown = r.ok ? await r.json() : null;
        return Array.isArray(j) ? (j as CountryIndexEntry[]) : [];
      } catch {
        return [];
      }
    })();
    void indexP.then((x) => x.length === 0 && (indexP = undefined));
  }
  return indexP;
}

// The country rows (bounding box, label point) used by Country Dive; [] on failure.
export function loadCountries(fetchFn: typeof fetch = fetch): Promise<CountryRow[]> {
  if (!countriesP) {
    countriesP = (async () => {
      try {
        const r = await fetchFn('/data/countries.json');
        const j: unknown = r.ok ? await r.json() : null;
        return Array.isArray(j) ? (j as CountryRow[]) : [];
      } catch {
        return [];
      }
    })();
    void countriesP.then((x) => x.length === 0 && (countriesP = undefined));
  }
  return countriesP;
}
