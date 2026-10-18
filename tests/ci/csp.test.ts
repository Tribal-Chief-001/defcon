import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

type Rule = { source: string; headers: { key: string; value: string }[] };
const cfg = JSON.parse(readFileSync('vercel.json', 'utf8')) as { headers: Rule[] };
const all = cfg.headers.find((r) => r.source === '/(.*)')!;
const header = (k: string) => all.headers.find((h) => h.key.toLowerCase() === k.toLowerCase())?.value;
const csp = (header('Content-Security-Policy') ?? '').split(';').map((d) => d.trim()).filter(Boolean);
const dir = (name: string) => csp.find((d) => d.startsWith(`${name} `) || d === name);
const vals = (name: string) => (dir(name) ?? '').split(/\s+/).slice(1);

describe('Content-Security-Policy in vercel.json', () => {
  it('is present on every path', () => {
    expect(csp.length).toBeGreaterThan(6);
  });
  it('allows scripts only from the site itself: no inline, no eval, no wildcard, no https:', () => {
    const v = vals('script-src');
    expect(v).toEqual(["'self'"]);
  });
  it('blocks plugins, framing, base-tag and form hijacking', () => {
    expect(dir('object-src')).toBe("object-src 'none'");
    expect(dir('frame-ancestors')).toBe("frame-ancestors 'none'");
    expect(dir('base-uri')).toBe("base-uri 'self'");
    expect(dir('form-action')).toBe("form-action 'none'");
  });
  it('keeps everything else same-origin: default, connect, fonts, workers, images', () => {
    expect(vals('default-src')).toEqual(["'self'"]);
    expect(vals('connect-src')).toEqual(["'self'"]);
    expect(vals('font-src')).toEqual(["'self'"]);
    expect(vals('worker-src')).toEqual(["'self'"]);
    expect(vals('img-src').every((x) => ["'self'", 'data:'].includes(x))).toBe(true);
  });
  it('allows inline styles only as attributes (React style props), not style elements', () => {
    expect(vals('style-src')).toEqual(["'self'"]);
    expect(vals('style-src-attr')).toEqual(["'unsafe-inline'"]);
  });
  it('only uses known directive names and source keywords', () => {
    const names = new Set(['default-src', 'script-src', 'style-src', 'style-src-attr', 'img-src', 'font-src', 'connect-src', 'worker-src', 'object-src', 'base-uri', 'form-action', 'frame-ancestors', 'upgrade-insecure-requests', 'manifest-src', 'media-src']);
    for (const d of csp) expect(names.has(d.split(/\s+/)[0]!), d).toBe(true);
    for (const d of csp) for (const v of d.split(/\s+/).slice(1)) expect(v, d).toMatch(/^('self'|'none'|'unsafe-inline'|data:|blob:)$/);
  });
  it('sends the other hardening headers', () => {
    expect(header('Strict-Transport-Security')).toMatch(/max-age=\d{7,}/);
    expect(header('Cross-Origin-Opener-Policy')).toBe('same-origin');
    expect(header('Cross-Origin-Resource-Policy')).toBe('same-origin');
    for (const h of all.headers) expect(h.value, h.key).not.toMatch(/[\r\n]/);
  });
  it('the built page has no inline script (needs npm run build first)', () => {
    if (!existsSync('dist/index.html')) return; // verified in CI after the build step
    const html = readFileSync('dist/index.html', 'utf8');
    const inline = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter((m) => !/\bsrc=/.test(m[1]!) || m[2]!.trim());
    expect(inline.map((m) => m[0].slice(0, 80))).toEqual([]);
    expect(html).not.toMatch(/\son\w+=/i); // no inline event handlers
  });
});
