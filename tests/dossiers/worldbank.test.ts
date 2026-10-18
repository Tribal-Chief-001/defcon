import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { WB_INDICATORS, parseWb } from '../../scripts/dossiers/worldbank';
import { fetchWorldBank } from '../../scripts/dossiers/fetch-worldbank';

// tests/fixtures/wb-pop.json: real rows from the 2026-10-18 API response plus one hand-made null row (ERI)
const fixture = JSON.parse(readFileSync('tests/fixtures/wb-pop.json', 'utf8'));

describe('parseWb', () => {
  const m = parseWb(fixture);
  it('returns the value and year per ISO3 code', () => {
    expect(m.get('IND')).toEqual({ value: 1463865525, year: 2025 });
    expect(m.get('SSD')!.value).toBeGreaterThan(1e7);
  });
  it('keeps aggregates with a 3-letter code (never looked up) and skips null values', () => {
    expect(m.has('ARB')).toBe(true);
    expect(m.has('ERI')).toBe(false); // value null in the fixture
  });
  it('skips rows with a missing or malformed code, a non-numeric value or a bad year', () => {
    const bad = [{ page: 1 }, [
      { countryiso3code: '', date: '2025', value: 5 },
      { countryiso3code: 'AB', date: '2025', value: 5 },
      { countryiso3code: 'ABC', date: '2025', value: 'abc' },
      { countryiso3code: 'ABD', date: 'x', value: 5 },
      { countryiso3code: 'ABE', date: '2024', value: '123' },
      { countryiso3code: 'ABF', date: '2024', value: 0 },
    ]];
    const r = parseWb(bad);
    expect([...r.keys()]).toEqual(['ABF']); // a real zero is a value; a numeric string is not accepted
  });
  it.each([[null], [undefined], [[]], [{}], [[{}, 'x']], ['text']])('returns an empty map for %j without throwing', (input) => {
    expect(parseWb(input).size).toBe(0);
  });
});

describe('fetchWorldBank', () => {
  const dir = () => mkdtempSync(join(tmpdir(), 'wb-'));
  const noSleep = async () => {};
  const ok = (code: string, pages = 1) =>
    ({ ok: true, status: 200, text: async () => JSON.stringify([{ page: 1, pages, per_page: 500, total: 1, lastupdated: '2026-10-08' }, [{ countryiso3code: 'IND', date: '2025', value: code.length }]]) }) as Response;

  it('writes one file per indicator and a meta file with fetchedAt and lastupdated', async () => {
    const d = dir();
    const urls: string[] = [];
    await fetchWorldBank(d, (async (u: string) => (urls.push(u), ok(u.match(/indicator\/([^?]+)/)![1]!))) as unknown as typeof fetch, noSleep);
    expect(urls).toHaveLength(5);
    expect(urls[0]).toContain('mrnev=1');
    for (const code of Object.values(WB_INDICATORS)) expect(JSON.parse(readFileSync(join(d, `${code}.json`), 'utf8'))[1][0].countryiso3code).toBe('IND');
    const meta = JSON.parse(readFileSync(join(d, 'meta.json'), 'utf8'));
    expect(meta.lastupdated).toBe('2026-10-08');
    expect(Number.isNaN(Date.parse(meta.fetchedAt))).toBe(false);
  });
  it('retries a failing request 3 times, then fails naming the indicator', async () => {
    let n = 0;
    const fail = (async () => (n++, { ok: false, status: 500, text: async () => '' }) as Response) as unknown as typeof fetch;
    await expect(fetchWorldBank(dir(), fail, noSleep)).rejects.toThrow(/SP\.POP\.TOTL.*500/);
    expect(n).toBe(3);
  });
  it('fails clearly when the response is paginated (more than one page)', async () => {
    await expect(fetchWorldBank(dir(), (async (u: string) => ok(u, 2)) as unknown as typeof fetch, noSleep)).rejects.toThrow(/pages/);
  });
});
