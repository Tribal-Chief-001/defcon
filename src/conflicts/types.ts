// The shape of public/data/conflicts.json (built by scripts/conflicts/build-conflicts.ts from UCDP). Deaths are UCDP estimates:
// `best` with the `low`-`high` range; windows end at the data end date, not at today.
export type Range = { best: number; low: number; high: number };
export type Kind = 'state' | 'non-state' | 'one-sided';

export type ConflictEvent = {
  id: string;
  date: string; // YYYY-MM-DD (UTC)
  place: string;
  country: string;
  lat: number;
  lon: number;
  precision: number;
  kind: Kind;
  deaths: Range;
  headline: string;
  sources: string[];
  provisional: boolean; // from a UCDP candidate file: revised later
};

// Where a conflict happens: the death-weighted centroid (computed on the sphere), how far its deaths spread around it, and the top
// 0.5-degree cells by deaths ([cell-centre lat, lon, deaths]), the "shape" of the conflict on the globe.
// `locatedShare`: the share of the deaths that UCDP located to a province or better (the rest has only a region or country geocode and
// is left out of the picture; the centroid and cells come from the located events, or from all events when none is located).
export type Geo = { lat: number; lon: number; spreadKm: number; locatedShare: number; cells: [number, number, number][] };

export type Conflict = {
  id: string;
  name: string;
  kinds: Kind[];
  countries: { id: string | null; name: string; deaths365: number }[];
  deaths: { d30: Range; d90: Range; d365: Range };
  events: { d30: number; d90: number; d365: number };
  trend: 'rising' | 'steady' | 'falling' | 'low data';
  lastDate: string;
  weekly: number[]; // 52 weeks of best deaths, oldest first; the last week ends at the data end
  weeklyByKind?: Record<Kind, number[]>; // the same weeks split by kind of violence; they add up to `weekly` (absent in older files)
  latest: ConflictEvent[]; // newest first, at most 12
  provisionalShare: number; // 0..1, share of the 365-day events that are provisional
  geo: Geo | null; // null when no event has a usable location
};

// Every valid event in the data, also those of conflicts too small to be listed: the fatalities monitor of the War tracker.
export type World = {
  deaths: { d30: Range; d90: Range; d365: Range };
  byKind: Record<Kind, { d90: Range; d365: Range }>;
  weekly: number[]; // 52 weeks of best deaths, oldest first
  weeklyByKind: Record<Kind, number[]>; // the same weeks split by kind of violence; they add up to `weekly`
  countries: { id: string | null; name: string; deaths90: number; deaths365: number }[]; // top 12 by 90-day deaths
  conflictsListed: number;
  latest: ConflictEvent[]; // the 20 newest events with a usable location, newest first
};

export type ConflictsFile = { generated: string; dataEnd: string; sources: string[]; conflicts: Conflict[]; world: World };
