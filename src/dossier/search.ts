import type { CountryIndexEntry } from './types';

// Lower case, no diacritics, no apostrophes, single spaces: "Côte d'Ivoire" and "cote divoire" are the same.
export const normalise = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export type SearchResult = { entry: CountryIndexEntry; via: 'name' | 'capital' | 'code'; match: string };

// 98 exact name, 90 name prefix, 70 word prefix, 50 substring; capitals 88 / 80 / 65 / 45; an exact ISO or id code 100.
const textScore = (text: string, q: string, exact: number, prefix: number, word: number, sub: number): number =>
  text === q ? exact : text.startsWith(q) ? prefix : text.includes(` ${q}`) ? word : text.includes(q) ? sub : 0;

export function searchCountries(index: CountryIndexEntry[], query: string, limit = 8): SearchResult[] {
  const q = normalise(query);
  if (!q) return [];
  const found: (SearchResult & { score: number; nameLen: number })[] = [];
  for (const entry of index) {
    let best: { score: number; via: SearchResult['via']; match: string } | null = null;
    const take = (score: number, via: SearchResult['via'], match: string) => {
      if (score > 0 && (!best || score > best.score)) best = { score, via, match };
    };
    for (const code of [entry.iso3, entry.iso2, entry.id]) if (code && code.toLowerCase() === q) take(100, 'code', code);
    const name = normalise(entry.name);
    take(textScore(name, q, 98, 90, 70, 50), 'name', entry.name);
    for (const c of entry.capitals) take(textScore(normalise(c), q, 88, 80, 65, 45), 'capital', c);
    if (best) {
      const b = best as { score: number; via: SearchResult['via']; match: string };
      found.push({ entry, via: b.via, match: b.match, score: b.score, nameLen: entry.name.length });
    }
  }
  found.sort((a, b) => b.score - a.score || a.nameLen - b.nameLen || a.entry.name.localeCompare(b.entry.name));
  return found.slice(0, limit).map(({ entry, via, match }) => ({ entry, via, match }));
}
