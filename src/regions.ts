import type { Conflict } from './conflicts/types';

// The South Asia lens: the eight member states of SAARC (the South Asian Association for Regional Cooperation). The lens only filters data
// that is already loaded; it never draws or labels a border (the map stays the India-official Natural Earth data).
export const SOUTH_ASIA = ['AFG', 'BGD', 'BTN', 'IND', 'LKA', 'MDV', 'NPL', 'PAK'] as const;
export const SOUTH_ASIA_VIEW = { lat: 24, lon: 78, distance: 2.6 };

const has = (ids: readonly string[], id: string | null) => id !== null && ids.includes(id);

// the conflicts that have deaths in one of the countries
export const conflictsInRegion = (conflicts: Conflict[], ids: readonly string[]): Conflict[] => conflicts.filter((c) => c.countries.some((k) => has(ids, k.id)));

// deaths in the last 365 days that UCDP locates in these countries (not the whole of a conflict that reaches beyond them), per country, most first
export function regionTotals(conflicts: Conflict[], ids: readonly string[]): { deaths365: number; countries: { id: string; name: string; deaths365: number }[] } {
  const m = new Map<string, { id: string; name: string; deaths365: number }>();
  for (const c of conflicts)
    for (const k of c.countries) {
      if (k.id === null || !has(ids, k.id)) continue;
      const g = m.get(k.id) ?? { id: k.id, name: k.name, deaths365: 0 };
      g.deaths365 += k.deaths365;
      m.set(k.id, g);
    }
  const countries = [...m.values()].sort((a, b) => b.deaths365 - a.deaths365 || a.name.localeCompare(b.name));
  return { deaths365: countries.reduce((s, k) => s + k.deaths365, 0), countries };
}
