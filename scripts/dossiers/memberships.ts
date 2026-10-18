import { readFileSync } from 'node:fs';

export type Memberships = {
  un: { members: string[]; observers: string[]; source: string; observerSource: string; asOf: string };
  nato: { members: string[]; source: string; asOf: string };
};

const ENTITIES: Record<string, string> = { amp: '&', nbsp: ' ', lt: '<', gt: '>', quot: '"', apos: "'", uuml: 'ü', ocirc: 'ô', eacute: 'é', egrave: 'è', ccedil: 'ç', atilde: 'ã', iacute: 'í', aacute: 'á', oacute: 'ó', ntilde: 'ñ' };
const decode = (s: string) =>
  s.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);

// Visible text of an html page as trimmed non-empty lines.
const lines = (html: string): string[] =>
  decode(html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, '\n'))
    .split('\n')
    .map((l) => l.replace(/ /g, ' ').trim())
    .filter(Boolean);

// UN member list page: every member is a line followed by "Date of Admission: dd-mm-yyyy".
export function parseUnMembers(html: string): string[] {
  const l = lines(html);
  return l.filter((_, i) => /^Date of Admission/i.test(l[i + 1] ?? '') && !/^Date of Admission/i.test(l[i]!));
}

// UN non-member observer states page: between the "standing invitation" heading and the resolution note, each state is a
// line followed by "Permanent Observer Mission...". (Other parts of the page also contain such lines.)
export function parseUnObservers(html: string): string[] {
  const l = lines(html);
  const start = l.findIndex((x) => /standing invitation/i.test(x));
  if (start < 0) return [];
  const out: string[] = [];
  for (let i = start + 1; i < l.length && !/^By resolution/i.test(l[i]!); i++) if (/^Permanent Observer/i.test(l[i + 1] ?? '') && !/^Permanent Observer/i.test(l[i]!)) out.push(l[i]!);
  return out;
}

// NATO's member list is prose on its page ("NATO's founding member countries were: ...", one paragraph per accession), so the
// 32 members are written down here and CHECKED against the page: the page must claim the same count and mention every name.
export const NATO_MEMBERS = [
  'Albania', 'Belgium', 'Bulgaria', 'Canada', 'Croatia', 'Czechia', 'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece',
  'Hungary', 'Iceland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 'Montenegro', 'Netherlands', 'North Macedonia', 'Norway',
  'Poland', 'Portugal', 'Romania', 'Slovakia', 'Slovenia', 'Spain', 'Sweden', 'Türkiye', 'United Kingdom', 'United States',
] as const;

export function natoPageCheck(html: string, names: readonly string[]): { claimed: number | null; missing: string[] } {
  const text = lines(html).join(' ');
  const m = /NATO has (\d+) member countries/i.exec(text);
  const flat = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return {
    claimed: m ? +m[1]! : null,
    missing: names.filter((n) => !flat.includes(n.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase())),
  };
}

const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\(.*?\)/g, '') // "Bahamas (The)" -> "bahamas"
    .replace(/\bsaint\b/g, 'st')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// Official names that differ from Natural Earth's names (normalised official name -> ADM0_A3).
const ALIASES: Record<string, string> = {
  'democratic people s republic of korea': 'PRK',
  'republic of korea': 'KOR',
  'russian federation': 'RUS',
  'syrian arab republic': 'SYR',
  'viet nam': 'VNM',
  'lao people s democratic republic': 'LAO',
  'republic of moldova': 'MDA',
  'united republic of tanzania': 'TZA',
  'united states of america': 'USA',
  turkiye: 'TUR',
  congo: 'COG',
  'democratic republic of the congo': 'COD',
  'cote d ivoire': 'CIV',
  eswatini: 'SWZ',
  'brunei darussalam': 'BRN',
  'cabo verde': 'CPV',
  'timor leste': 'TLS',
  'state of palestine': 'PSX',
  'holy see': 'VAT',
  'venezuela bolivarian republic of': 'VEN',
  naoero: 'NRU',
  'equatorial guinea': 'GNQ',
  'marshall islands': 'MHL',
  'solomon islands': 'SLB',
  'south sudan': 'SDS',
  'united kingdom of great britain and northern ireland': 'GBR',
};

export function resolveNames(names: string[], countries: { id: string; name: string; formalName: string | null }[]): { ids: string[]; unmapped: string[] } {
  const byName = new Map<string, string>();
  for (const c of countries) {
    byName.set(norm(c.name), c.id);
    if (c.formalName) byName.set(norm(c.formalName), c.id);
  }
  const ids: string[] = [];
  const unmapped: string[] = [];
  for (const n of names) {
    const id = ALIASES[norm(n)] ?? byName.get(norm(n));
    if (id) ids.push(id);
    else unmapped.push(n);
  }
  return { ids, unmapped };
}

export function loadMemberships(path = 'data/relations/memberships.json'): Memberships {
  return JSON.parse(readFileSync(path, 'utf8')) as Memberships;
}

export function membershipOf(m: Memberships, id: string): { un: 'member' | 'observer' | 'non-member'; nato: boolean } {
  return { un: m.un.members.includes(id) ? 'member' : m.un.observers.includes(id) ? 'observer' : 'non-member', nato: m.nato.members.includes(id) };
}
