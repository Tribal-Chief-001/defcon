import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync('index.html', 'utf8');
const png = (p: string) => {
  const b = readFileSync(`public/${p}`);
  expect(b.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
};
const attr = (tag: RegExp) => tag.exec(html)?.[1];

describe('brand assets (logo, favicon, share image)', () => {
  it('index.html links an SVG icon, a 32 px PNG, an Apple touch icon and the manifest, and all of them exist', () => {
    const links = [
      attr(/<link rel="icon" href="([^"]+\.svg)" type="image\/svg\+xml"/),
      attr(/<link rel="icon" href="([^"]+\.png)" sizes="32x32"/),
      attr(/<link rel="apple-touch-icon" href="([^"]+)"/),
      attr(/<link rel="manifest" href="([^"]+)"/),
    ];
    for (const l of links) {
      expect(l, 'missing link').toBeTruthy();
      expect(existsSync(`public${l}`), l).toBe(true);
    }
  });
  it('has the PNG sizes the links promise', () => {
    expect(png('favicon-32.png')).toEqual({ w: 32, h: 32 });
    expect(png('apple-touch-icon.png')).toEqual({ w: 180, h: 180 });
    expect(png('icon-192.png')).toEqual({ w: 192, h: 192 });
    expect(png('icon-512.png')).toEqual({ w: 512, h: 512 });
    expect(png('og.png')).toEqual({ w: 1200, h: 630 });
  });
  it('has share metadata with https URLs and an image that exists', () => {
    expect(html).toMatch(/<meta name="description" content="[^"]{40,}"/);
    expect(html).toMatch(/<meta property="og:title" content="Defcon[^"]*"/);
    expect(attr(/<meta property="og:image" content="(https:\/\/[^"]+)"/)).toMatch(/\/og\.png$/);
    expect(html).toMatch(/<meta name="twitter:card" content="summary_large_image"/);
    expect(html).toMatch(/<meta property="og:image:width" content="1200"/);
  });
  it('ships clean SVGs: no scripts, event handlers or external references', () => {
    for (const f of ['favicon.svg', 'logo-mark.svg']) {
      const s = readFileSync(`public/${f}`, 'utf8');
      expect(s.startsWith('<svg')).toBe(true);
      expect(s).not.toMatch(/<script|\son\w+=|href=|xlink:|<foreignObject|<image/i);
      expect(s).toMatch(/<title>Defcon<\/title>/);
    }
  });
  it('has a valid web manifest with existing icons and the black theme', () => {
    const m = JSON.parse(readFileSync('public/site.webmanifest', 'utf8')) as { name: string; theme_color: string; background_color: string; icons: { src: string }[] };
    expect(m.name).toBe('Defcon');
    expect(m.theme_color).toBe('#000000');
    expect(m.background_color).toBe('#000000');
    for (const i of m.icons) expect(existsSync(`public${i.src}`), i.src).toBe(true);
  });
  it('uses only palette colours in the logo', () => {
    const colours = new Set<string>();
    for (const f of ['favicon.svg', 'logo-mark.svg']) for (const m of readFileSync(`public/${f}`, 'utf8').matchAll(/#[0-9a-fA-F]{3,6}\b/g)) colours.add(m[0].toUpperCase());
    for (const c of colours) expect(['#000', '#EDEDE9', '#D6FF57']).toContain(c);
  });
});
