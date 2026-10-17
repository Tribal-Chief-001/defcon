import { buildBorders } from './build-borders.ts';

const NE = 'data/raw/ne';
const borders = await buildBorders(
  `${NE}/ne_10m_admin_0_countries_ind.shp`,
  `${NE}/ne_10m_admin_0_countries_ind.dbf`,
  'public/data',
);
console.log('borders', borders);
