import { describe, expect, it, vi } from 'vitest';
import { looksLikeUcdpCsv, newestCandidate, nextCandidate, probeCandidate, type UcdpSource } from '../../scripts/events/ucdp-next';

const src = (name: string, csv: string): UcdpSource => ({ name, kind: 'csv', url: `https://ucdp.uu.se/downloads/candidateged/${csv}`, csv, version: 'x', sha256: 'a'.repeat(64) });
const manifest = [
  { name: 'ged261', kind: 'zip', url: 'https://ucdp.uu.se/downloads/ged/ged261-csv.zip', csv: 'ged/GEDEvent_v26_1.csv', version: 'GED 26.1', sha256: 'b'.repeat(64) } as UcdpSource,
  src('candidate-26-01-06', 'GEDEvent_v26_01_26_06.csv'),
  src('candidate-26-07', 'GEDEvent_v26_0_7.csv'),
  src('candidate-26-08', 'GEDEvent_v26_0_8.csv'),
];

describe('newestCandidate', () => {
  it('finds the latest month among single-month and range files', () => {
    expect(newestCandidate(manifest)).toEqual({ year: 26, month: 8 });
    expect(newestCandidate(manifest.slice(0, 2))).toEqual({ year: 26, month: 6 });
  });
  it('is null without a candidate file', () => expect(newestCandidate(manifest.slice(0, 1))).toBeNull());
});

describe('nextCandidate', () => {
  it('names the file of the month after the newest one, in the same style as the pinned files', () => {
    expect(nextCandidate(manifest)).toEqual({ name: 'candidate-26-09', kind: 'csv', url: 'https://ucdp.uu.se/downloads/candidateged/GEDEvent_v26_0_9.csv', csv: 'GEDEvent_v26_0_9.csv', version: 'Candidate 26.0.9', sha256: '' });
  });
  it('rolls over the year after December', () => {
    const dec = [...manifest.slice(0, 1), src('candidate-26-12', 'GEDEvent_v26_0_12.csv')];
    expect(nextCandidate(dec)!.csv).toBe('GEDEvent_v27_0_1.csv');
  });
  it('is null when there is no candidate to continue from', () => expect(nextCandidate(manifest.slice(0, 1))).toBeNull());
});

describe('probeCandidate (HEAD only, never downloads)', () => {
  const reply = (status: number, type = 'text/csv') => vi.fn(async () => new Response(null, { status, headers: { 'content-type': type } }));
  it('is "found" for a CSV answer, "none" for 404, and "error" for anything else or a network failure', async () => {
    const f = reply(200);
    expect(await probeCandidate(f as never, 'https://ucdp.uu.se/x.csv')).toBe('found');
    expect(f).toHaveBeenCalledWith('https://ucdp.uu.se/x.csv', expect.objectContaining({ method: 'HEAD' }));
    expect(await probeCandidate(reply(404) as never, 'https://ucdp.uu.se/x.csv')).toBe('none');
    expect(await probeCandidate(reply(500) as never, 'https://ucdp.uu.se/x.csv')).toBe('error');
    expect(await probeCandidate(reply(200, 'text/html') as never, 'https://ucdp.uu.se/x.csv')).toBe('none'); // a soft 404 page is not a data file
    expect(await probeCandidate((async () => { throw new Error('offline'); }) as never, 'https://ucdp.uu.se/x.csv')).toBe('error');
  });
  it('refuses a URL that is not https on the UCDP host', async () => {
    await expect(probeCandidate(reply(200) as never, 'http://ucdp.uu.se/x.csv')).rejects.toThrow(/https/);
    await expect(probeCandidate(reply(200) as never, 'https://evil.example/x.csv')).rejects.toThrow(/ucdp\.uu\.se/);
  });
});

describe('looksLikeUcdpCsv (finding: an HTML page containing "id" passed the old check)', () => {
  const bytes = (t: string) => new TextEncoder().encode(t.padEnd(2000, 'x'));
  it('accepts a UCDP CSV (header starts with id,relid), also after a byte-order mark', () => {
    expect(looksLikeUcdpCsv(bytes('id,relid,year,active_year\n1,2,3'), 'text/csv')).toBe(true);
    expect(looksLikeUcdpCsv(bytes('\uFEFFid,relid,year\n1,2,3'), 'application/octet-stream')).toBe(true);
  });
  it('rejects an HTML page, a CSV of another shape, an HTML content type and a tiny file', () => {
    expect(looksLikeUcdpCsv(bytes('<!doctype html><meta name="viewport" content="width=device-width">'), 'text/csv')).toBe(false);
    expect(looksLikeUcdpCsv(bytes('name,value\n1,2'), 'text/csv')).toBe(false);
    expect(looksLikeUcdpCsv(bytes('id,relid,year'), 'text/html; charset=utf-8')).toBe(false);
    expect(looksLikeUcdpCsv(new TextEncoder().encode('id,relid'), 'text/csv')).toBe(false);
  });
});
