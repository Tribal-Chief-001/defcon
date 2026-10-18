import { existsSync, readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import type { Relations } from '../../src/relations/types';

const rel = JSON.parse(readFileSync('public/data/relations.json', 'utf8')) as Relations;
const ids = new Set((JSON.parse(readFileSync('public/data/countries.json', 'utf8')) as { id: string }[]).map((c) => c.id));

describe('committed relations data', () => {
  it('gives every alliance a source, an https url, an ISO date and at least 2 known members', () => {
    expect(rel.alliances.length).toBeGreaterThan(0);
    for (const a of rel.alliances) {
      expect(a.source, a.id).not.toBe('');
      expect(a.url, a.id).toMatch(/^https:\/\//);
      expect(a.asOf, a.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(a.members.length, a.id).toBeGreaterThanOrEqual(2);
      for (const m of a.members) expect(ids.has(m), `${a.id}:${m}`).toBe(true);
      expect(new Set(a.members).size).toBe(a.members.length);
    }
  });
  it('has NATO equal to the official membership list, with the United States and Canada', () => {
    const nato = rel.alliances.find((a) => a.id === 'nato')!;
    const official = (JSON.parse(readFileSync('data/relations/memberships.json', 'utf8')) as { nato: { members: string[] } }).nato.members;
    expect([...nato.members].sort()).toEqual([...official].sort());
    expect(nato.members).toEqual(expect.arrayContaining(['USA', 'CAN']));
    expect(nato.members.length).toBe(32);
  });
  it('gives India no alliance and draws no US-New Zealand ANZUS pair', () => {
    expect(rel.alliances.filter((a) => a.members.includes('IND'))).toEqual([]);
    expect(rel.alliances.filter((a) => a.members.includes('USA') && a.members.includes('NZL'))).toEqual([]);
  });
  it('has disputes with known ids, one record per ordered pair, a source and a url', () => {
    const seen = new Set<string>();
    for (const d of rel.disputes) {
      expect(d.a < d.b).toBe(true);
      expect(ids.has(d.a) && ids.has(d.b)).toBe(true);
      expect(seen.has(`${d.a}|${d.b}`)).toBe(false);
      seen.add(`${d.a}|${d.b}`);
      expect(d.source).toMatch(/UCDP/);
      expect(d.url).toMatch(/^https:\/\//);
      expect(d.events).toBeGreaterThanOrEqual(1);
    }
  });
  it('is small enough to ship (8 KB gzip)', () => {
    expect(existsSync('public/data/relations.json')).toBe(true);
    expect(gzipSync(readFileSync('public/data/relations.json')).length).toBeLessThanOrEqual(8 * 1024);
    expect(statSync('public/data/relations.json').size).toBeGreaterThan(100);
  });
});
