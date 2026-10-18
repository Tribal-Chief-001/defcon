import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { NATO_MEMBERS, loadMemberships, membershipOf, natoPageCheck, parseUnMembers, parseUnObservers, resolveNames } from '../../scripts/dossiers/memberships';

const countries = JSON.parse(readFileSync('public/data/countries.json', 'utf8')) as { id: string; name: string; formalName: string | null }[];

describe('parsers (trimmed real fragments of the official pages)', () => {
  it('reads UN member names that precede "Date of Admission"', () => {
    const names = parseUnMembers(readFileSync('tests/fixtures/un-members.html', 'utf8'));
    expect(names.slice(0, 3)).toEqual(['Afghanistan', 'Albania', 'Algeria']);
    expect(names).not.toContain('Back to top');
    expect(names.every((n) => !/Date of Admission/.test(n))).toBe(true);
  });
  it('reads only the observer states between the observer heading and the resolution note (not other pages parts)', () => {
    const html = '<p>UN Office at Vienna</p><p>Permanent Observer Mission x</p><p>Non-Member States having received a standing invitation to participate</p><h3>Holy See</h3><p>Permanent Observer of Mission of the Holy See</p><h3>State of Palestine</h3><p>Permanent Observer Mission of Palestine</p><p>By resolution A/RES/67/19</p><p>Elsewhere</p><p>Permanent Observer foo</p>';
    expect(parseUnObservers(html)).toEqual(['Holy See', 'State of Palestine']);
  });
  it('checks the curated NATO list against the NATO page: the claimed member count and every name present', () => {
    const page = '<p>At present, NATO has 32 member countries.</p>' + NATO_MEMBERS.map((n) => `<li>${n}</li>`).join('');
    expect(natoPageCheck(page, NATO_MEMBERS)).toEqual({ claimed: 32, missing: [] });
    expect(natoPageCheck('<p>At present, NATO has 33 member countries. Albania</p>', ['Albania', 'Atlantis'])).toEqual({ claimed: 33, missing: ['Atlantis'] });
    expect(natoPageCheck('', ['Albania'])).toEqual({ claimed: null, missing: ['Albania'] });
  });
  it('returns [] for unrelated or empty html', () => {
    expect(parseUnMembers('')).toEqual([]);
    expect(parseUnObservers('<p>nothing</p>')).toEqual([]);
  });
});

describe('resolveNames', () => {
  it('maps official names to ADM0_A3, including renamed and parenthesised ones, and reports what it cannot map', () => {
    const r = resolveNames(['India', 'Türkiye', 'Bahamas (The)', 'Czechia', 'Republic of Korea', 'Venezuela, Bolivarian Republic of', 'South Sudan', 'Naoero', 'Atlantis'], countries);
    expect(r.ids).toEqual(expect.arrayContaining(['IND', 'TUR', 'BHS', 'CZE', 'KOR', 'VEN', 'SDS', 'NRU']));
    expect(r.unmapped).toEqual(['Atlantis']);
  });
});

describe('data/relations/memberships.json', () => {
  const m = loadMemberships();
  const ids = new Set(countries.map((c) => c.id));
  it('has 32 NATO members, including the newest, and not the partners the Factbook text confuses with members', () => {
    expect(m.nato.members).toHaveLength(32);
    for (const id of ['FIN', 'SWE', 'USA', 'TUR']) expect(m.nato.members).toContain(id);
    for (const id of ['JOR', 'MLT']) expect(m.nato.members).not.toContain(id);
  });
  it('has 193 UN members and the two observers (Holy See, Palestine)', () => {
    expect(m.un.members).toHaveLength(193);
    expect([...m.un.observers].sort()).toEqual(['PSX', 'VAT']); // Palestine is PSX in Natural Earth ids (ISO3 PSE)
  });
  it('uses only ids of our India-POV country list, no duplicates, no overlap between members and observers', () => {
    for (const id of [...m.un.members, ...m.un.observers, ...m.nato.members]) expect(ids.has(id)).toBe(true);
    expect(new Set(m.un.members).size).toBe(m.un.members.length);
    expect(m.un.members.filter((x) => m.un.observers.includes(x))).toEqual([]);
  });
  it('records the sources and the date', () => {
    expect(m.un.source).toMatch(/^https:\/\/www\.un\.org/);
    expect(m.nato.source).toMatch(/^https:\/\/www\.nato\.int/);
    expect(m.un.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  it('membershipOf gives member, observer and non-member answers', () => {
    expect(membershipOf(m, 'IND')).toEqual({ un: 'member', nato: false });
    expect(membershipOf(m, 'FIN')).toEqual({ un: 'member', nato: true });
    expect(membershipOf(m, 'VAT')).toEqual({ un: 'observer', nato: false });
    expect(membershipOf(m, 'TWN')).toEqual({ un: 'non-member', nato: false });
  });
});
