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
  it('lists names it cannot resolve instead of guessing', () => {
    const r = resolveGw(new Map([['345', 'Serbia (Yugoslavia)']]), countries);
    expect(r.gwToId['345']).toBeUndefined();
    expect(r.unmapped).toEqual([{ gw: '345', name: 'Serbia (Yugoslavia)' }]);
  });
});
