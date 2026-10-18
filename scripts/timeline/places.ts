// Approximate places for the globe pins of the timeline: where a reader would look for the event (a city, an area, a strait), not the
// exact site. Coordinates are those of the named place. Usage: npm run data:timeline-places (idempotent; writes public/data/timeline.json).
import { readFileSync, writeFileSync } from 'node:fs';
import type { TimelineFile } from '../../src/timeline/types';

export const PLACES: Record<string, [lat: number, lon: number, label: string]> = {
  tehran: [35.69, 51.39, 'Tehran'],
  hormuz: [26.57, 56.25, 'Strait of Hormuz'],
  islamabad: [33.68, 73.05, 'Islamabad'],
  mocha: [13.32, 43.25, 'Mocha, Yemen'],
  beirut: [33.89, 35.5, 'Beirut'],
  'south-lebanon': [33.3, 35.45, 'Southern Lebanon'],
  beaufort: [33.32, 35.53, 'Beaufort Castle'],
  nabatieh: [33.37, 35.48, 'Nabatieh area'],
  washington: [38.9, -77.04, 'Washington'],
  lviv: [49.84, 24.03, 'Lviv'],
  'abu-dhabi': [24.45, 54.37, 'Abu Dhabi'],
  kyiv: [50.45, 30.52, 'Kyiv'],
  'bila-tserkva': [49.8, 30.12, 'Bila Tserkva'],
  kostiantynivka: [48.53, 37.71, 'Kostiantynivka'],
  moscow: [55.76, 37.62, 'Moscow'],
  lyman: [48.99, 37.81, 'Lyman'],
  kramatorsk: [48.72, 37.56, 'Kramatorsk'],
  'gaza-city': [31.5, 34.47, 'Gaza City'],
  rafah: [31.3, 34.25, 'Rafah'],
  'kerem-shalom': [31.22, 34.28, 'Kerem Shalom crossing'],
  jalud: [32.06, 35.31, 'Jalud, near Nablus'],
};

// `theatre|date` -> place key; entries not listed here (diplomacy with no single place, several fronts) get no pin
export const PLACE_FOR: Record<string, keyof typeof PLACES> = {
  'iran-war|2026-01-08': 'tehran',
  'iran-war|2026-02-28': 'tehran',
  'iran-war|2026-03-02': 'hormuz',
  'iran-war|2026-03-08': 'tehran',
  'iran-war|2026-04-07': 'islamabad',
  'iran-war|2026-04-12': 'islamabad',
  'iran-war|2026-06-17': 'islamabad',
  'iran-war|2026-07-08': 'hormuz',
  'iran-war|2026-09-10': 'mocha',
  'iran-war|2026-09-26': 'hormuz',
  'iran-war|2026-10-14': 'hormuz',
  'israel-lebanon|2026-03-02': 'beirut',
  'israel-lebanon|2026-03-16': 'south-lebanon',
  'israel-lebanon|2026-04-08': 'beirut',
  'israel-lebanon|2026-04-16': 'south-lebanon',
  'israel-lebanon|2026-06-01': 'beaufort',
  'israel-lebanon|2026-06-19': 'south-lebanon',
  'israel-lebanon|2026-06-26': 'washington',
  'israel-lebanon|2026-07-20': 'south-lebanon',
  'israel-lebanon|2026-09-04': 'nabatieh',
  'israel-lebanon|2026-09-07': 'nabatieh',
  'israel-lebanon|2026-10-14': 'south-lebanon',
  'russia-ukraine|2026-01-09': 'lviv',
  'russia-ukraine|2026-01-23': 'abu-dhabi',
  'russia-ukraine|2026-02-03': 'kyiv',
  'russia-ukraine|2026-05-24': 'bila-tserkva',
  'russia-ukraine|2026-07-02': 'kyiv',
  'russia-ukraine|2026-07-03': 'kostiantynivka',
  'russia-ukraine|2026-09-05': 'moscow',
  'russia-ukraine|2026-09-15': 'lyman',
  'russia-ukraine|2026-09-20': 'moscow',
  'russia-ukraine|2026-10-08': 'kramatorsk',
  'russia-ukraine|2026-10-16': 'washington',
  'israel-gaza|2026-01-14': 'gaza-city',
  'israel-gaza|2026-01-26': 'gaza-city',
  'israel-gaza|2026-01-31': 'rafah',
  'israel-gaza|2026-02-02': 'rafah',
  'israel-gaza|2026-02-19': 'washington',
  'israel-gaza|2026-02-28': 'kerem-shalom',
  'israel-gaza|2026-07-06': 'gaza-city',
  'israel-gaza|2026-07-30': 'gaza-city',
  'israel-gaza|2026-09-23': 'gaza-city',
  'israel-gaza|2026-09-29': 'jalud',
  'israel-gaza|2026-10-14': 'kerem-shalom',
};

export function addPlaces(f: TimelineFile): TimelineFile {
  for (const t of f.theatres)
    for (const e of t.entries) {
      const k = PLACE_FOR[`${t.key}|${e.date}`];
      if (k) e.at = { lat: PLACES[k]![0], lon: PLACES[k]![1], place: PLACES[k]![2] };
    }
  return f;
}

if (process.argv[1]?.endsWith('places.ts')) {
  const path = 'public/data/timeline.json';
  const f = addPlaces(JSON.parse(readFileSync(path, 'utf8')) as TimelineFile);
  writeFileSync(path, JSON.stringify(f, null, 1) + '\n');
  console.log(`${f.theatres.flatMap((t) => t.entries).filter((e) => e.at).length} entries placed`);
}
