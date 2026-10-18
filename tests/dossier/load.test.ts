import { describe, expect, it } from 'vitest';
import { clearDossierCache, loadCountries, loadDossier, loadIndex } from '../../src/dossier/load';

const dossier = (id: string) => ({ id, name: id, capitals: [], neighbours: [], iso2: null, iso3: null, population: null, un: { value: 'member', source: 's', asOf: 'a' } });
const reply = (body: unknown, status = 200) =>
  ({ ok: status >= 200 && status < 300, status, json: async () => (typeof body === 'string' ? JSON.parse(body) : body) }) as Response;

describe('loadDossier (Review Focus 6)', () => {
  it('returns the dossier and caches it (one fetch for two calls)', async () => {
    clearDossierCache();
    let n = 0;
    const f = (async () => (n++, reply(dossier('IND')))) as unknown as typeof fetch;
    expect((await loadDossier('IND', f))?.id).toBe('IND');
    expect((await loadDossier('IND', f))?.id).toBe('IND');
    expect(n).toBe(1);
  });
  it.each([
    ['a 404', () => reply({}, 404)],
    ['invalid JSON', () => reply('{not json')],
    ['a non-object', () => reply('42')],
    ['a mismatched id', () => reply(dossier('PAK'))],
    ['a missing capitals array', () => reply({ id: 'IND', name: 'India', neighbours: [] })],
  ])('returns null for %s, without throwing', async (_n, make) => {
    clearDossierCache();
    expect(await loadDossier('IND', (async () => make()) as unknown as typeof fetch)).toBeNull();
  });
  it('returns null on a network error and lets a later call retry', async () => {
    clearDossierCache();
    let n = 0;
    const f = (async () => {
      n++;
      if (n === 1) throw new TypeError('offline');
      return reply(dossier('IND'));
    }) as unknown as typeof fetch;
    expect(await loadDossier('IND', f)).toBeNull();
    expect((await loadDossier('IND', f))?.id).toBe('IND');
  });
  it('rejects an id that is not a plain ADM0_A3 code (no path tricks)', async () => {
    clearDossierCache();
    let n = 0;
    const f = (async () => (n++, reply(dossier('X')))) as unknown as typeof fetch;
    for (const bad of ['../x', 'in', 'IND/../PAK', '', 'TOOLONG1']) expect(await loadDossier(bad, f)).toBeNull();
    expect(n).toBe(0);
  });
});

describe('loadIndex', () => {
  it('returns the entries, caches, and [] on failure', async () => {
    let n = 0;
    const ok = (async () => (n++, reply([{ id: 'IND', name: 'India', iso2: 'IN', iso3: 'IND', capitals: ['New Delhi'], continent: 'Asia', lat: 1, lon: 2, hasPolygon: true }]))) as unknown as typeof fetch;
    const a = await loadIndex(ok);
    expect(a).toHaveLength(1);
    await loadIndex(ok);
    expect(n).toBe(1);
    clearDossierCache();
    expect(await loadIndex((async () => reply({}, 500)) as unknown as typeof fetch)).toEqual([]);
    clearDossierCache();
    expect(await loadIndex((async () => reply('"not an array"')) as unknown as typeof fetch)).toEqual([]);
  });
});

describe('loadCountries', () => {
  it('returns the country rows (with bbox and label point), caches, and [] on failure', async () => {
    clearDossierCache();
    let n = 0;
    const rows = [{ id: 'IND', name: 'India', lat: 22, lon: 79, bbox: [68, 6, 97, 37], hasPolygon: true }];
    const ok = (async () => (n++, reply(rows))) as unknown as typeof fetch;
    expect(await loadCountries(ok)).toHaveLength(1);
    await loadCountries(ok);
    expect(n).toBe(1);
    clearDossierCache();
    expect(await loadCountries((async () => reply({}, 404)) as unknown as typeof fetch)).toEqual([]);
    clearDossierCache();
    expect(await loadCountries((async () => { throw new TypeError('offline'); }) as unknown as typeof fetch)).toEqual([]);
  });
});
