import { readFileSync } from 'node:fs';
import { buildBorders } from './build-borders.ts';

const NE = 'data/raw/ne';
const borders = await buildBorders(
  `${NE}/ne_10m_admin_0_countries_ind.shp`,
  `${NE}/ne_10m_admin_0_countries_ind.dbf`,
  'public/data',
);
console.log('borders', borders);

import { buildCapitals } from './build-places.ts';
const countryIds = new Set((JSON.parse(readFileSync('public/data/countries.json', 'utf8')) as { id: string }[]).map((c) => c.id));
const caps = await buildCapitals(
  `${NE}/ne_10m_populated_places_simple.shp`,
  `${NE}/ne_10m_populated_places_simple.dbf`,
  'public/data/capitals.json',
  countryIds,
);
console.log('capitals', caps.length);
