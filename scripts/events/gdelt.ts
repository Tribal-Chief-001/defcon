import { readFileSync } from 'node:fs';
import { severity } from '../../src/events/severity';
import type { Ev, Kind } from '../../src/events/types';

// Quality filters for auto-coded GDELT rows. Documented in docs/DATA-SOURCES.md; the owner reviews them.
export const GDELT_FILTER = {
  minSources: 2, // keep when NumSources >= 2 ...
  minMentionsAlone: 3, // ... or NumMentions >= 3 for a single source
  maxLagDays: 2, // event date at most this many days before DATEADDED
  allowedGeoTypes: [2, 3, 4, 5], // 2 US state, 3 US city, 4 world city, 5 world state (0 none and 1 country centroid are unusable)
} as const;

// CAMEO EventCode -> kind: 145x riot, other 14x protest, 19x armed, 18x and 20x violence against civilians/individuals.
export function cameoKind(code: string): Kind | null {
  const root = code.slice(0, 2);
  if (root === '14') return code.startsWith('145') ? 'riot' : 'protest';
  if (root === '19') return 'armed';
  if (root === '18' || root === '20') return 'civilian';
  return null;
}

const num = (s: string | undefined): number | null => {
  if (s === undefined || s.trim() === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};
const dayS = (yyyymmdd: string): number | null => {
  if (!/^\d{8}$/.test(yyyymmdd)) return null;
  return Date.UTC(+yyyymmdd.slice(0, 4), +yyyymmdd.slice(4, 6) - 1, +yyyymmdd.slice(6, 8)) / 1000;
};
const PRECISION: Record<number, Ev['precision']> = { 4: 2, 3: 2, 5: 4, 2: 4 };

const hostOf = (url: string): string | null => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
};

// cols = the 61 tab-separated fields of a GDELT 2.0 export row (no header). Column numbers: see the plan.
export function gdeltRowToEv(cols: string[], nowS: number): Ev | null {
  if (cols.length < 61) return null;
  const kind = cameoKind(cols[26] ?? '');
  const geoType = num(cols[51]);
  const lat = num(cols[56]);
  const lon = num(cols[57]);
  const day = dayS(cols[1] ?? '');
  const added = dayS((cols[59] ?? '').slice(0, 8));
  if (!kind || geoType === null || !(GDELT_FILTER.allowedGeoTypes as readonly number[]).includes(geoType)) return null;
  if (lat === null || lon === null || (lat === 0 && lon === 0) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  if (day === null || added === null) return null;
  const lagDays = (added - day) / 86400;
  if (lagDays < -1 || lagDays > GDELT_FILTER.maxLagDays) return null;
  const mentions = num(cols[31]) ?? 0;
  const sources = num(cols[32]) ?? 0;
  if (sources < GDELT_FILTER.minSources && mentions < GDELT_FILTER.minMentionsAlone) return null;
  const url = (cols[60] ?? '').trim();
  const host = url ? hostOf(url) : null;
  return {
    id: `gdelt:${cols[0]}`,
    source: 'gdelt',
    alsoIds: [],
    timeS: day + 12 * 3600, // GDELT has no time of day: the event day is placed at midday UTC
    lat,
    lon,
    precision: PRECISION[geoType] ?? 4,
    country: null,
    kind,
    deaths: null,
    severity: severity({ kind, deaths: null, human: false, goldstein: num(cols[30]) ?? undefined, numSources: sources }),
    human: false,
    place: (cols[52] ?? '').trim(),
    headline: '',
    actors: [cols[6], cols[16]].map((s) => (s ?? '').trim()).filter(Boolean).join(' / '),
    sources: host ? [{ name: host, url }] : [],
    firstSeenS: nowS,
    updatedS: nowS,
  };
}

export function readGdeltFile(path: string, nowS: number): Ev[] {
  const out: Ev[] = [];
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    if (!line) continue;
    const e = gdeltRowToEv(line.split('\t'), nowS);
    if (e) out.push(e);
  }
  return out;
}
