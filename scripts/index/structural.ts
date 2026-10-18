// Structural inputs for the Violence Risk Index study: World Bank WDI and WGI history, and neighbour violence.
export type Series = Map<number, number>;

// The newest value for a year strictly before `year` (a value for year Y is published during Y+1, so it may not be used for Y), no
// older than `maxAge` years; null when there is none.
export function latestBefore(s: Series | undefined, year: number, maxAge = 3): number | null {
  if (!s) return null;
  for (let y = year - 1; y > year - 1 - maxAge; y--) {
    const v = s.get(y);
    if (v !== undefined) return v;
  }
  return null;
}

// World Bank API JSON ([meta, rows]) -> iso3 -> year -> value. Aggregates have no iso3 code and null values are skipped.
export function parseWbHist(text: string): Map<string, Series> {
  const json = JSON.parse(text) as [{ message?: unknown }, { countryiso3code?: string; date?: string; value?: number | null }[]?];
  if (!Array.isArray(json[1])) throw new Error(`World Bank error reply: ${JSON.stringify(json[0]?.message ?? json[0]).slice(0, 120)}`);
  const out = new Map<string, Series>();
  for (const r of json[1]) {
    const year = Number(r.date);
    if (!r.countryiso3code || !Number.isInteger(year) || typeof r.value !== 'number' || !Number.isFinite(r.value)) continue;
    (out.get(r.countryiso3code) ?? out.set(r.countryiso3code, new Map()).get(r.countryiso3code)!).set(year, r.value);
  }
  return out;
}

// Violence next door: the neighbours' deaths in the last 12 months (f12 by `id|ym`), how many of them had at least 25, and how many
// neighbours there are. A neighbour that is not in the panel (never in GED) counts as zero.
export function neighbourSignals(id: string, ym: number, nb: Record<string, string[]>, f12: Map<string, number>) {
  const list = nb[id] ?? [];
  let nbDeaths = 0;
  let nbInConflict = 0;
  for (const n of list) {
    const d = f12.get(`${n}|${ym}`) ?? 0;
    nbDeaths += d;
    if (d >= 25) nbInConflict++;
  }
  return { nbDeaths, nbInConflict, nbCount: list.length };
}
