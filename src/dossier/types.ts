export type Provenance = { source: string; asOf: string; url?: string };
// null = unavailable: no reliable value (never 0, never a guess)
export type Field<T> = ({ value: T } & Provenance) | null;

// One row of public/data/countries.json (built from the India-POV Natural Earth file and our borders).
export type CountryRow = {
  id: string; // ADM0_A3
  name: string;
  formalName: string | null;
  iso2: string | null;
  iso3: string | null;
  type: string;
  continent: string | null;
  subregion: string | null;
  lat: number; // label point
  lon: number;
  hasPolygon: boolean;
  bbox: [number, number, number, number] | null; // [west, south, east, north]; west > east when crossing the antimeridian
  neighbours: string[];
};

export type Dossier = {
  id: string;
  iso2: string | null;
  iso3: string | null;
  name: string;
  formalName: string | null;
  type: string;
  continent: string | null;
  subregion: string | null;
  capitals: { name: string; lat: number; lon: number; note?: string }[];
  neighbours: string[];
  population: Field<number>;
  areaKm2: Field<number>;
  gdpUsd: Field<number>;
  milExpUsd: Field<number>;
  milExpGdpPct: Field<number>;
  governmentType: Field<string>;
  languages: Field<string>;
  independence: Field<string>;
  organisations: Field<string>;
  un: Field<'member' | 'observer' | 'non-member'>;
  nato: Field<boolean>;
};

export type CountryIndexEntry = {
  id: string;
  name: string;
  iso2: string | null;
  iso3: string | null;
  capitals: string[];
  continent: string | null;
  lat: number;
  lon: number;
  hasPolygon: boolean;
};
