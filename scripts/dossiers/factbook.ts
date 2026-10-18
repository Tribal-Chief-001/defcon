// The CIA World Factbook (community mirror factbook/factbook.json). Only the fields listed in FactbookFacts are imported:
// free-text sections (disputes, geography, ...) are never read, so the Factbook's cartography cannot leak into India's dossier.
export type FactbookFacts = {
  governmentType?: string;
  languages?: string;
  independence?: string;
  organisations?: string;
  capitalName?: string;
  capitalLat?: number;
  capitalLon?: number;
};

// "28 36 N, 77 12 E" -> decimal degrees
export function parseDms(text: string): { lat: number; lon: number } | null {
  const m = /^\s*(\d+)\s+(\d+)\s*([NS]),\s*(\d+)\s+(\d+)\s*([EW])\s*$/.exec(text ?? '');
  if (!m) return null;
  const lat = (+m[1]! + +m[2]! / 60) * (m[3] === 'S' ? -1 : 1);
  const lon = (+m[4]! + +m[5]! / 60) * (m[6] === 'W' ? -1 : 1);
  return Number.isFinite(lat) && Number.isFinite(lon) ? { lat: Math.round(lat * 1e4) / 1e4, lon: Math.round(lon * 1e4) / 1e4 } : null;
}

type Node = { text?: unknown } | undefined;
const ENT: Record<string, string> = {
  nbsp: ' ', amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', ndash: '–', mdash: '—',
  eacute: 'é', Eacute: 'É', egrave: 'è', ecirc: 'ê', euml: 'ë', iacute: 'í', Iacute: 'Í', iuml: 'ï', uacute: 'ú', uuml: 'ü',
  aacute: 'á', Aacute: 'Á', atilde: 'ã', auml: 'ä', aring: 'å', oacute: 'ó', Oacute: 'Ó', ocirc: 'ô', oslash: 'ø', ntilde: 'ñ',
  Ntilde: 'Ñ', ccedil: 'ç', Scaron: 'Š', scaron: 'š',
};
// the Factbook JSON carries html entities (for example &nbsp;); show real characters, one space between words
const clean = (s: string) =>
  s.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&([a-z]+);/gi, (m, n) => ENT[n] ?? ENT[n.toLowerCase()] ?? m).replace(/\s+/g, ' ').trim();
const text = (n: Node): string | undefined => {
  const t = typeof n?.text === 'string' ? clean(n.text) : '';
  return t || undefined;
};

export function parseFactbook(json: unknown): FactbookFacts {
  const j = (json && typeof json === 'object' ? json : {}) as Record<string, Record<string, unknown> | undefined>;
  const gov = j.Government;
  const out: FactbookFacts = {};
  const put = <K extends keyof FactbookFacts>(k: K, v: FactbookFacts[K] | undefined) => {
    if (v !== undefined) out[k] = v;
  };
  put('governmentType', text(gov?.['Government type'] as Node));
  put('languages', text((j['People and Society']?.Languages as { Languages?: Node } | undefined)?.Languages));
  put('independence', text(gov?.Independence as Node));
  put('organisations', text(gov?.['International organization participation'] as Node));
  const cap = gov?.Capital as { name?: Node; 'geographic coordinates'?: Node } | undefined;
  put('capitalName', text(cap?.name));
  const c = parseDms(text(cap?.['geographic coordinates']) ?? '');
  if (c) {
    out.capitalLat = c.lat;
    out.capitalLon = c.lon;
  }
  return out;
}

const D2R = Math.PI / 180;
const km = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const a = Math.sin(((lat2 - lat1) * D2R) / 2) ** 2 + Math.cos(lat1 * D2R) * Math.cos(lat2 * D2R) * Math.sin(((lon2 - lon1) * D2R) / 2) ** 2;
  return 2 * 6371.0088 * Math.asin(Math.min(1, Math.sqrt(a)));
};
const MAX_KM = 80;

// Matches Factbook files to our countries by capital coordinates (Factbook files use FIPS codes, we use ADM0_A3).
// Closest pairs win; a country is claimed by one file and a file by one country; the rest are `unmatched`.
export function matchFactbook(
  files: Record<string, FactbookFacts>,
  caps: { country: string; lat: number; lon: number }[],
): { byCountry: Record<string, string>; unmatched: string[] } {
  const pairs: { key: string; country: string; d: number }[] = [];
  for (const [key, f] of Object.entries(files)) {
    if (f.capitalLat === undefined || f.capitalLon === undefined) continue;
    const best = new Map<string, number>();
    for (const c of caps) {
      const d = km(f.capitalLat, f.capitalLon, c.lat, c.lon);
      if (d <= MAX_KM && d < (best.get(c.country) ?? Infinity)) best.set(c.country, d);
    }
    for (const [country, d] of best) pairs.push({ key, country, d });
  }
  pairs.sort((a, b) => a.d - b.d || (a.key < b.key ? -1 : 1));
  const byCountry: Record<string, string> = {};
  const used = new Set<string>();
  for (const p of pairs) {
    if (byCountry[p.country] || used.has(p.key)) continue;
    byCountry[p.country] = p.key;
    used.add(p.key);
  }
  return { byCountry, unmatched: Object.keys(files).filter((k) => !used.has(k)).sort() };
}
