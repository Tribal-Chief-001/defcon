import { normalise } from '../../src/dossier/search';

// Gleditsch-Ward numbers that never appear as a GED location, plus UCDP names that differ from Natural Earth's.
export const GW_EXTRA: Record<string, string> = { '2': 'USA' };
export const NAME_ALIAS: Record<string, string> = Object.fromEntries(
  Object.entries({ 'DR Congo (Zaire)': 'COD', 'Myanmar (Burma)': 'MMR', 'Russia (Soviet Union)': 'RUS', 'Cambodia (Kampuchea)': 'KHM', 'Yemen (North Yemen)': 'YEM', 'South Sudan': 'SDS', 'United States of America': 'USA', 'Central African Republic': 'CAF', 'Kingdom of eSwatini (Swaziland)': 'SWZ', 'Dominican Republic': 'DOM', 'Ivory Coast': 'CIV', 'Zimbabwe (Rhodesia)': 'ZWE', Congo: 'COG', 'Solomon Islands': 'SLB', 'Bosnia-Herzegovina': 'BIH', 'Serbia (Yugoslavia)': 'SRB', 'Madagascar (Malagasy)': 'MDG' }).map(([k, v]) => [normalise(k), v]),
);

// Maps Gleditsch-Ward numbers (UCDP `country_id`) to Natural Earth country ids; names it cannot resolve are returned, never guessed.
export function resolveGw(gwNames: Map<string, string>, countries: { id: string; name: string }[]) {
  const idByName = new Map(countries.map((c) => [normalise(c.name), c.id]));
  const gwToId: Record<string, string> = { ...GW_EXTRA };
  const unmapped: { gw: string; name: string }[] = [];
  for (const [gw, name] of gwNames) {
    const id = NAME_ALIAS[normalise(name)] ?? idByName.get(normalise(name));
    if (id) gwToId[gw] = id;
    else unmapped.push({ gw, name });
  }
  return { gwToId, unmapped };
}
