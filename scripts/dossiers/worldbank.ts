export const WB_INDICATORS = {
  population: 'SP.POP.TOTL',
  areaKm2: 'AG.SRF.TOTL.K2',
  gdpUsd: 'NY.GDP.MKTP.CD',
  milExpUsd: 'MS.MIL.XPND.CD', // SIPRI Military Expenditure Database, republished by the World Bank
  milExpGdpPct: 'MS.MIL.XPND.GD.ZS',
} as const;

export type WbValue = { value: number; year: number };

// World Bank API response (`mrnev=1`: the most recent non-empty value per country): [meta, rows].
// Only finite numeric values with a 3-letter code and a numeric year are kept; everything else is "unavailable".
export function parseWb(json: unknown): Map<string, WbValue> {
  const out = new Map<string, WbValue>();
  const rows = Array.isArray(json) ? json[1] : undefined;
  if (!Array.isArray(rows)) return out;
  for (const r of rows as Record<string, unknown>[]) {
    const code = r?.countryiso3code;
    const year = Number(r?.date);
    if (typeof code !== 'string' || !/^[A-Z]{3}$/.test(code)) continue;
    if (typeof r.value !== 'number' || !Number.isFinite(r.value) || !Number.isFinite(year)) continue;
    out.set(code, { value: r.value, year });
  }
  return out;
}
