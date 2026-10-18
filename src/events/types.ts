export const KINDS = ['armed', 'civilian', 'riot', 'protest', 'other'] as const;
export type Kind = (typeof KINDS)[number];

export type EventSource = { name: string; url?: string };

// One normalised event. `timeS` is unix seconds (UTC) of the event start; `precision` runs from 1 (exact site)
// to 5 (country or region); `country` is the ADM0_A3 of the India-POV map, or null (open water).
export type Ev = {
  id: string;
  source: 'ucdp' | 'gdelt';
  alsoIds: string[];
  timeS: number;
  lat: number;
  lon: number;
  precision: 1 | 2 | 3 | 4 | 5;
  country: string | null;
  kind: Kind;
  deaths: number | null;
  severity: 1 | 2 | 3 | 4 | 5;
  human: boolean;
  place: string;
  headline: string;
  actors: string;
  sources: EventSource[];
  firstSeenS: number;
  updatedS: number;
};

// Text that is only needed when an event is selected; stored in per-day shards, not in the snapshot.
export type Detail = {
  place: string;
  headline: string;
  actors: string;
  deaths: number | null;
  sources: EventSource[];
  alsoIds: string[];
};
