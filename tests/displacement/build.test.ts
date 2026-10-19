import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { buildDisplacement, figure, parseUnhcr, URL_BASE } from '../../scripts/displacement/build-displacement';

const fx = (n: string) => JSON.parse(readFileSync(`tests/fixtures/unhcr/${n}.json`, 'utf8')) as unknown;

describe('figure (UNHCR writes "-" for a figure it does not report)', () => {
  it('reads numbers and numeric strings, keeps a real 0, and gives null for "-", empty and odd values', () => {
    expect(figure(2671560)).toBe(2671560);
    expect(figure('5')).toBe(5);
    expect(figure('0')).toBe(0);
    expect(figure(0)).toBe(0);
    for (const v of ['-', '', null, undefined, 'n/a', Number.NaN, -5, '-3', {}, [] as unknown]) expect(figure(v), String(v)).toBeNull();
  });
});

describe('parseUnhcr', () => {
  it('reads the figures by country of origin (the real sample), with IDPs of the country and not-reported as null', () => {
    const m = parseUnhcr(fx('coo'), 'coo');
    expect(m.get('AFG')).toEqual({ refugees: 2671560, asylumSeekers: 270007, idps: 3199023, returnedRefugees: 1947183, stateless: 0, otherInNeed: 1008969 });
    expect(m.get('ABW')).toMatchObject({ refugees: 0, asylumSeekers: 5 });
    expect((m.get('UKR') as { idps: number }).idps).toBeGreaterThan(1_000_000);
  });
  it('reads the figures by country of asylum', () => {
    const m = parseUnhcr(fx('coa'), 'coa');
    expect(m.get('AFG')).toMatchObject({ refugees: 20869, asylumSeekers: 382 });
    expect(m.get('ISR')).toMatchObject({ refugees: 1274, asylumSeekers: 29682 });
  });
  it('keys by the ISO3 code, not by UNHCR\'s own code (Sudan is SUD at UNHCR and SDN in ISO; finding on the real data)', () => {
    const m = parseUnhcr({ items: [{ coo: 'SUD', coo_iso: 'SDN', refugees: 2820737 }, { coo: 'GAZ', coo_iso: 'PSE', refugees: 48323 }, { coo: 'XXX', coo_iso: '-', refugees: 1 }] }, 'coo');
    expect(m.get('SDN')).toMatchObject({ refugees: 2820737 });
    expect(m.get('PSE')).toMatchObject({ refugees: 48323 });
    expect(m.has('SUD')).toBe(false);
    expect(m.has('XXX')).toBe(false);
    expect(parseUnhcr({ items: [{ coa: 'ALG', coa_iso: 'DZA', refugees: 9 }] }, 'coa').has('DZA')).toBe(true);
  });
  it('skips rows without a three-letter code and survives garbage', () => {
    const row = { coo_iso: '-', refugees: 5 };
    expect(parseUnhcr({ items: [row, { coo_iso: 'ABCD', refugees: 1 }, null, 7, { coo_iso: 'xyz', refugees: 3 }] }, 'coo').size).toBe(1); // 'xyz' becomes XYZ
    expect(parseUnhcr(null, 'coo').size).toBe(0);
    expect(parseUnhcr({ items: 'x' }, 'coo').size).toBe(0);
    expect(parseUnhcr('<html>', 'coa').size).toBe(0);
  });
});

describe('buildDisplacement', () => {
  const reply = (year: number, mode: 'coo' | 'coa', page: number) => ({ page, maxPages: 2, items: [{ ...(mode === 'coo' ? { coo: 'XXX', coo_iso: page === 1 ? 'AFG' : 'UKR' } : { coa: 'XXX', coa_iso: page === 1 ? 'AFG' : 'UKR' }), refugees: page, asylum_seekers: '-', idps: 7, returned_refugees: '0', stateless: '0', ooc: '-', year }] });
  const fetchFn = (empty: number[] = []) =>
    vi.fn(async (url: string) => {
      const u = new URL(url);
      const year = Number(u.searchParams.get('year'));
      const mode = u.searchParams.get('coo_all') ? 'coo' : 'coa';
      if (empty.includes(year)) return new Response(JSON.stringify({ page: 1, maxPages: 0, items: [] }), { status: 200 });
      return new Response(JSON.stringify(reply(year, mode, Number(u.searchParams.get('page') ?? 1))), { status: 200 });
    });
  it('uses the newest year that has data, reads every page and merges origin and asylum figures by ISO3, with the licence and the terms link', async () => {
    const f = fetchFn([2026]);
    const out = await buildDisplacement(f as never, 2026, '2026-10-19');
    expect(out.year).toBe(2025);
    expect(Object.keys(out.countries).sort()).toEqual(['AFG', 'UKR']);
    expect(out.countries.AFG!.from).toMatchObject({ refugees: 1, asylumSeekers: null, idps: 7, returnedRefugees: 0 });
    expect(out.countries.UKR!.hosted).toMatchObject({ refugees: 2 });
    expect(out.licence).toMatch(/CC BY 4\.0/);
    expect(out.source).toBe('UNHCR Refugee Population Statistics Database');
    expect(out.termsUrl).toBe('https://www.unhcr.org/what-we-do/data-and-publications/data-and-statistics/terms-use-datasets');
    expect(out.generated).toBe('2026-10-19');
    for (const c of f.mock.calls.map((x) => String(x[0]))) expect(c.startsWith(URL_BASE)).toBe(true);
  });
  it('fails (so nothing is written) when no recent year has data or the API answers with an error', async () => {
    await expect(buildDisplacement(fetchFn([2026, 2025, 2024]) as never, 2026, 'x')).rejects.toThrow(/no UNHCR data/i);
    await expect(buildDisplacement((async () => new Response('x', { status: 500 })) as never, 2026, 'x')).rejects.toThrow(/HTTP 500|no UNHCR data/);
  });
});
