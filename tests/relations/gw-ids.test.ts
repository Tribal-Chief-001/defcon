import { describe, expect, it } from 'vitest';
import { resolveGw } from '../../scripts/relations/gw-ids';

const countries = [
  { id: 'COD', name: 'Dem. Rep. Congo' },
  { id: 'FRA', name: 'France' },
  { id: 'USA', name: 'United States of America' },
  { id: 'SDS', name: 'S. Sudan' },
  { id: 'CAF', name: 'Central African Rep.' },
  { id: 'SWZ', name: 'eSwatini' },
  { id: 'DOM', name: 'Dominican Rep.' },
  { id: 'CIV', name: "Côte d'Ivoire" },
  { id: 'ZWE', name: 'Zimbabwe' },
  { id: 'COG', name: 'Congo' },
  { id: 'SLB', name: 'Solomon Is.' },
  { id: 'BIH', name: 'Bosnia and Herz.' },
  { id: 'SRB', name: 'Serbia' },
  { id: 'MDG', name: 'Madagascar' },
];

describe('resolveGw', () => {
  it('maps plain names, UCDP aliases and the United States', () => {
    const r = resolveGw(
      new Map([
        ['220', 'France'],
        ['490', 'DR Congo (Zaire)'],
        ['626', 'South Sudan'],
      ]),
      countries,
    );
    expect(r.gwToId).toMatchObject({ '220': 'FRA', '490': 'COD', '626': 'SDS', '2': 'USA' });
    expect(r.unmapped).toEqual([]);
  });
  it('maps the UCDP names that Natural Earth spells differently', () => {
    const r = resolveGw(new Map([['482', 'Central African Republic'], ['572', 'Kingdom of eSwatini (Swaziland)'], ['42', 'Dominican Republic'], ['437', 'Ivory Coast']]), countries);
    expect(r.gwToId).toMatchObject({ '482': 'CAF', '572': 'SWZ', '42': 'DOM', '437': 'CIV' });
  });
  it('maps the historical UCDP names of Zimbabwe, Congo, Solomon Islands, Bosnia, Serbia and Madagascar', () => {
    const r = resolveGw(new Map([['552', 'Zimbabwe (Rhodesia)'], ['484', 'Congo'], ['940', 'Solomon Islands'], ['346', 'Bosnia-Herzegovina'], ['345', 'Serbia (Yugoslavia)'], ['580', 'Madagascar (Malagasy)']]), countries);
    expect(r.gwToId).toMatchObject({ '552': 'ZWE', '484': 'COG', '940': 'SLB', '346': 'BIH', '345': 'SRB', '580': 'MDG' });
  });
  it('lists names it cannot resolve instead of guessing', () => {
    const r = resolveGw(new Map([['999', 'Atlantis']]), countries);
    expect(r.gwToId['999']).toBeUndefined();
    expect(r.unmapped).toEqual([{ gw: '999', name: 'Atlantis' }]);
  });
});
