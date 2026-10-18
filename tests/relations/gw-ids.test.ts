import { describe, expect, it } from 'vitest';
import { resolveGw } from '../../scripts/relations/gw-ids';

const countries = [
  { id: 'COD', name: 'Dem. Rep. Congo' },
  { id: 'FRA', name: 'France' },
  { id: 'USA', name: 'United States of America' },
  { id: 'SDS', name: 'S. Sudan' },
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
  it('lists names it cannot resolve instead of guessing', () => {
    const r = resolveGw(new Map([['345', 'Serbia (Yugoslavia)']]), countries);
    expect(r.gwToId['345']).toBeUndefined();
    expect(r.unmapped).toEqual([{ gw: '345', name: 'Serbia (Yugoslavia)' }]);
  });
});
