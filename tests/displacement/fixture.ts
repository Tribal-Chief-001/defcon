import type { DisplacementFile } from '../../src/displacement/types';

export const displacementFixture = (): DisplacementFile => ({
  year: 2025,
  generated: '2026-10-19',
  source: 'UNHCR Refugee Population Statistics Database',
  licence: 'CC BY 4.0',
  termsUrl: 'https://www.unhcr.org/what-we-do/data-and-publications/data-and-statistics/terms-use-datasets',
  countries: {
    AFG: { from: { refugees: 2671560, asylumSeekers: 270007, idps: 3199023, returnedRefugees: 1947183, stateless: 0, otherInNeed: 1008969 }, hosted: { refugees: 20869, asylumSeekers: 382 } },
    ABW: { from: { refugees: 0, asylumSeekers: 5, idps: null, returnedRefugees: 0, stateless: 0, otherInNeed: null }, hosted: { refugees: null, asylumSeekers: 0 } },
    NZL: { hosted: { refugees: 1500, asylumSeekers: 200 } },
  },
});
