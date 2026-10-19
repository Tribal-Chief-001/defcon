// public/data/displacement.json: UNHCR Refugee Population Statistics Database figures by country (CC BY 4.0; built by hand with
// npm run data:displacement, see docs/DATA-SOURCES.md). A figure is null when UNHCR does not report it ("-"): never shown as 0.
export type FromCountry = { refugees: number | null; asylumSeekers: number | null; idps: number | null; returnedRefugees: number | null; stateless: number | null; otherInNeed: number | null };
export type HostedHere = { refugees: number | null; asylumSeekers: number | null };
export type CountryDisplacement = { from?: FromCountry; hosted?: HostedHere };
export type DisplacementFile = {
  year: number;
  generated: string;
  source: string;
  licence: string;
  termsUrl: string;
  countries: Record<string, CountryDisplacement>; // by ISO3
};
