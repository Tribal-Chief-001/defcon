import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

type Header = { key: string; value: string };
type Rule = { source: string; headers: Header[] };
const cfg = JSON.parse(readFileSync('vercel.json', 'utf8')) as { framework: string; buildCommand: string; outputDirectory: string; headers: Rule[] };
const deploy = readFileSync('docs/DEPLOY.md', 'utf8');
const rule = (src: string) => cfg.headers.find((r) => r.source === src);
const value = (r: Rule | undefined, key: string) => r?.headers.find((h) => h.key.toLowerCase() === key.toLowerCase())?.value;

describe('vercel.json', () => {
  it('builds the Vite app into dist', () => {
    expect(cfg).toMatchObject({ framework: 'vite', buildCommand: 'npm run build', outputDirectory: 'dist' });
  });
  it('has well-formed header sources and values', () => {
    for (const r of cfg.headers) {
      expect(r.source.startsWith('/'), r.source).toBe(true);
      expect((r.source.match(/\(/g) ?? []).length, r.source).toBe((r.source.match(/\)/g) ?? []).length);
      expect(r.source, r.source).not.toMatch(/[{}]/);
      for (const h of r.headers) expect(h.value, `${r.source} ${h.key}`).not.toMatch(/[\r\n]/);
    }
  });
  it('sends the security headers on every path', () => {
    const all = rule('/(.*)');
    expect(value(all, 'X-Content-Type-Options')).toBe('nosniff');
    expect(value(all, 'X-Frame-Options')).toBe('DENY');
    expect(value(all, 'Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(value(all, 'Permissions-Policy')).toMatch(/camera=\(\)/);
  });
  it('caches only hashed assets as immutable, and revalidates event data', () => {
    for (const r of cfg.headers) {
      const cc = value(r, 'Cache-Control') ?? '';
      if (/immutable/.test(cc)) expect(r.source).toBe('/assets/(.*)');
    }
    expect(value(rule('/data/events/(.*)'), 'Cache-Control')).toMatch(/must-revalidate/);
    expect(value(rule('/data/events/(.*)'), 'Cache-Control')).toMatch(/max-age=0/);
  });
});

describe('docs/DEPLOY.md', () => {
  it('names the three secrets and tells the owner never to paste them', () => {
    for (const s of ['VERCEL_TOKEN', 'VERCEL_ORG_ID', 'VERCEL_PROJECT_ID']) expect(deploy).toContain(s);
    expect(deploy).toMatch(/never paste/i);
    expect(deploy).toMatch(/gh secret set/);
  });
  it('explains cadence, cost, how to read a failed validation, and what is not verified', () => {
    expect(deploy).toMatch(/every 3 hours/i);
    expect(deploy).toMatch(/2,000/);
    expect(deploy).toMatch(/data:validate/);
    expect(deploy).toMatch(/Not yet verified/i);
    expect(deploy).toMatch(/deploymentEnabled/);
  });
});
