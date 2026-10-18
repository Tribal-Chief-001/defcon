import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { matchFactbook, parseDms, parseFactbook, type FactbookFacts } from '../../scripts/dossiers/factbook';
import { fetchFactbook } from '../../scripts/dossiers/fetch-factbook';

const fx = (k: string) => JSON.parse(readFileSync(`tests/fixtures/factbook/${k}.json`, 'utf8'));
const caps = [
  { name: 'New Delhi', country: 'IND', lat: 28.6, lon: 77.2, rank: 1 },
  { name: 'Bujumbura', country: 'BDI', lat: -3.3822, lon: 29.3644, rank: 1 },
  { name: 'Apia', country: 'WSM', lat: -13.8333, lon: -171.7333, rank: 1 },
];

describe('parseDms', () => {
  it('converts degrees and minutes with hemisphere signs', () => {
    expect(parseDms('28 36 N, 77 12 E')).toEqual({ lat: 28.6, lon: 77.2 });
    const s = parseDms('33 52 S, 151 12 W')!;
    expect(s.lat).toBeCloseTo(-33.8667, 3);
    expect(s.lon).toBeCloseTo(-151.2, 3);
  });
  it.each([[''], ['garbage'], ['28 N, 77 E'], ['x']])('returns null for %j', (t) => {
    expect(parseDms(t)).toBeNull();
  });
});

describe('parseFactbook (only the enumerated fields)', () => {
  const f = parseFactbook(fx('in'));
  it('extracts government type, languages, independence, organisations and the capital', () => {
    expect(f.governmentType).toBe('federal parliamentary republic');
    expect(f.languages).toMatch(/^Hindi/);
    expect(f.independence).toMatch(/1947/);
    expect(f.organisations).toMatch(/UN/);
    expect(f).toMatchObject({ capitalName: 'New Delhi', capitalLat: 28.6, capitalLon: 77.2 });
  });
  it('has no other keys: no disputes or geography text leaks (India map policy)', () => {
    expect(Object.keys(f).sort()).toEqual(['capitalLat', 'capitalLon', 'capitalName', 'governmentType', 'independence', 'languages', 'organisations']);
    expect(JSON.stringify(f)).not.toMatch(/trimmed fixture|Disputes/);
  });
  it('returns {} for empty or odd input without throwing', () => {
    for (const x of [{}, null, undefined, [], 'x', { Government: null }]) expect(parseFactbook(x)).toEqual({});
  });
  it('decodes the html entities the Factbook text carries and collapses whitespace', () => {
    const j = { ...fx('in'), 'People and Society': { Languages: { Languages: { text: 'Hindi 43.6%;&nbsp; English &amp; more &quot;x&quot; it&#39;s' } } } };
    expect(parseFactbook(j).languages).toBe('Hindi 43.6%; English & more "x" it\'s');
  });
  it('decodes the accented letters and typographic quotes found in the real data', () => {
    const j = { ...fx('in'), 'People and Society': { Languages: { Languages: { text: 'caf&eacute; d&rsquo;Ivoire &ndash; Cura&ccedil;ao &Eacute;&uuml;&ntilde; &lt;5%' } } } };
    expect(parseFactbook(j).languages).toBe('café d’Ivoire – Curaçao Éüñ <5%');
  });
  it('omits a field that is missing rather than inventing it', () => {
    const noLang = { ...fx('in'), 'People and Society': {} };
    expect('languages' in parseFactbook(noLang)).toBe(false);
  });
});

describe('matchFactbook (by capital coordinates, Review Focus 3)', () => {
  const files: Record<string, FactbookFacts> = {
    'south-asia/in': parseFactbook(fx('in')),
    'africa/by': parseFactbook(fx('bi')),
    'oceania/ws': parseFactbook(fx('ws')),
    'oceania/wf': parseFactbook(fx('wf')),
    'oceania/none': { governmentType: 'x' },
  };
  const m = matchFactbook(files, caps);
  it('matches India and Burundi (62 km between Gitega and Bujumbura)', () => {
    expect(m.byCountry.IND).toBe('south-asia/in');
    expect(m.byCountry.BDI).toBe('africa/by');
  });
  it('lets only the nearer file claim a country: Samoa wins, Wallis and Futuna is unmatched (its mirror coordinates are near Apia)', () => {
    expect(m.byCountry.WSM).toBe('oceania/ws');
    expect(m.unmatched).toContain('oceania/wf');
  });
  it('puts a file without capital coordinates in unmatched', () => {
    expect(m.unmatched).toContain('oceania/none');
  });
  it('does not throw on empty inputs and never maps one file to two countries', () => {
    expect(matchFactbook({}, caps)).toEqual({ byCountry: {}, unmatched: [] });
    expect(matchFactbook(files, [])).toMatchObject({ byCountry: {} });
    const keys = Object.values(m.byCountry);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('fetchFactbook', () => {
  const noSleep = async () => {};
  it('downloads the listed country files and writes meta with the mirror commit date and sha', async () => {
    const d = mkdtempSync(join(tmpdir(), 'fb-'));
    const calls: string[] = [];
    const fetchFn = (async (u: string) => {
      calls.push(u);
      if (u.includes('/git/trees/')) return { ok: true, status: 200, json: async () => ({ tree: [{ path: 'south-asia/in.json' }, { path: 'africa/by.json' }, { path: 'meta/categories.json' }, { path: 'world/xx.json' }, { path: 'README.md' }] }) } as Response;
      if (u.includes('/commits')) return { ok: true, status: 200, json: async () => [{ sha: 'abc123', commit: { message: 'Merge pull request #23 from x/patch-1', committer: { date: '2026-09-11T13:19:23Z' } } }, { sha: 'def456', commit: { message: 'auto-update week 4', committer: { date: '2026-01-22T22:32:10Z' } } }] } as Response;
      return { ok: true, status: 200, text: async () => '{"Government":{}}' } as Response;
    }) as unknown as typeof fetch;
    const r = await fetchFactbook(d, fetchFn, noSleep);
    expect(r.files).toEqual(['africa_by.json', 'south-asia_in.json']);
    // the data date is the last weekly auto-update commit (the CIA stopped publishing in Feb 2026), not the repo's latest commit
    expect(JSON.parse(readFileSync(join(d, 'meta.json'), 'utf8'))).toMatchObject({ commitDate: '2026-09-11', sha: 'abc123', dataDate: '2026-01-22' });
    expect(r.dataDate).toBe('2026-01-22');
    expect(calls.filter((c) => c.includes('raw.githubusercontent.com'))).toHaveLength(2);
  });
  it('falls back to the latest commit date when no auto-update commit is listed', async () => {
    const d = mkdtempSync(join(tmpdir(), 'fb-'));
    const fetchFn = (async (u: string) => {
      if (u.includes('/git/trees/')) return { ok: true, status: 200, json: async () => ({ tree: [] }) } as Response;
      return { ok: true, status: 200, json: async () => [{ sha: 'z', commit: { message: 'readme', committer: { date: '2026-09-11T00:00:00Z' } } }] } as Response;
    }) as unknown as typeof fetch;
    expect((await fetchFactbook(d, fetchFn, noSleep)).dataDate).toBe('2026-09-11');
  });
  it('fails clearly when the tree request fails', async () => {
    const d = mkdtempSync(join(tmpdir(), 'fb-'));
    await expect(fetchFactbook(d, (async () => ({ ok: false, status: 403 }) as Response) as unknown as typeof fetch, noSleep)).rejects.toThrow(/403/);
  });
});
