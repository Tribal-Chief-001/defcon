import { describe, expect, it } from 'vitest';
import { normalise, searchCountries } from '../../src/dossier/search';
import type { CountryIndexEntry } from '../../src/dossier/types';

const e = (id: string, name: string, iso2: string | null, iso3: string | null, capitals: string[] = []): CountryIndexEntry => ({ id, name, iso2, iso3, capitals, continent: null, lat: 0, lon: 0, hasPolygon: true });
const index = [
  e('IND', 'India', 'IN', 'IND', ['New Delhi']),
  e('IDN', 'Indonesia', 'ID', 'IDN', ['Jakarta']),
  e('CIV', "Côte d'Ivoire", 'CI', 'CIV', ['Yamoussoukro']),
  e('CUW', 'Curaçao', 'CW', 'CUW', ['Willemstad']),
  e('FRA', 'France', 'FR', 'FRA', ['Paris']),
  e('USA', 'United States of America', 'US', 'USA', ['Washington D.C.']),
  e('GBR', 'United Kingdom', 'GB', 'GBR', ['London']),
  e('VAT', 'Vatican', 'VA', 'VAT', ['Vatican City']),
  e('BAD', '<b>Bad</b> & "Co"', null, null, []),
];
const ids = (q: string, limit?: number) => searchCountries(index, q, limit).map((r) => r.entry.id);

describe('normalise', () => {
  it('lowercases, strips diacritics and apostrophes, collapses spaces', () => {
    expect(normalise("Cote d'Ivoire")).toBe('cote divoire');
    expect(normalise("Côte d’Ivoire")).toBe('cote divoire');
    expect(normalise('Curaçao')).toBe('curacao');
    expect(normalise('  New   Delhi ')).toBe('new delhi');
    expect(normalise('Washington, D.C.')).toBe('washington d c');
  });
});

describe('searchCountries (Review Focus 4)', () => {
  it('ranks an exact code first', () => {
    expect(ids('ind')[0]).toBe('IND');
    expect(searchCountries(index, 'IN')[0]).toMatchObject({ entry: { id: 'IND' }, via: 'code' });
  });
  it('finds a country by its capital', () => {
    const r = searchCountries(index, 'new d');
    expect(r[0]).toMatchObject({ entry: { id: 'IND' }, via: 'capital', match: 'New Delhi' });
    expect(ids('paris')).toEqual(['FRA']);
  });
  it('is diacritic- and apostrophe-insensitive in both directions', () => {
    expect(ids('cote')).toEqual(['CIV']);
    expect(ids("cote d'ivoire")).toEqual(['CIV']);
    expect(ids('curacao')).toEqual(['CUW']);
    expect(ids('Curaçao')).toEqual(['CUW']);
  });
  it('matches word prefixes and substrings after name and capital prefixes', () => {
    expect(ids('kingdom')).toEqual(['GBR']); // word prefix
    expect(ids('ondo')).toEqual(['GBR']); // substring of the capital London (not of Indonesia)
    expect(ids('un')[0]).not.toBe('FRA');
  });
  it('prefers a name prefix over a capital match, and shorter names first on ties', () => {
    expect(ids('in').slice(0, 2)).toEqual(['IND', 'IDN']); // code IN (IND) first, then Indonesia by name prefix
    expect(ids('ind')).toEqual(['IND', 'IDN']);
  });
  it('returns [] for an empty or blank query or no match', () => {
    expect(ids('')).toEqual([]);
    expect(ids('   ')).toEqual([]);
    expect(ids('zzzz')).toEqual([]);
  });
  it('honours the limit (default 8)', () => {
    expect(ids('i', 2)).toHaveLength(2);
    const many = Array.from({ length: 20 }, (_, i) => e(`A${i}`, `Aland ${i}`, null, null));
    expect(searchCountries(many, 'aland')).toHaveLength(8);
  });
  it('returns hostile names verbatim (escaping is the renderer\'s job)', () => {
    expect(searchCountries(index, 'bad')[0]!.entry.name).toBe('<b>Bad</b> & "Co"');
  });
  it('finds a micro-state with no polygon by name or capital', () => {
    expect(ids('vatican city')[0]).toBe('VAT');
  });
});
