import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/styles/tokens.css', 'utf8');
const token = (name: string) => new RegExp(`--${name}:\\s*([^;]+);`).exec(css)![1]!.trim();

type RGBA = [number, number, number, number];
const parse = (v: string): RGBA => {
  const hex = /^#([0-9a-f]{6})$/i.exec(v);
  if (hex) return [parseInt(hex[1]!.slice(0, 2), 16), parseInt(hex[1]!.slice(2, 4), 16), parseInt(hex[1]!.slice(4, 6), 16), 1];
  const m = /^rgba?\(([^)]+)\)$/.exec(v)!;
  const p = m[1]!.split(',').map((x) => parseFloat(x));
  return [p[0]!, p[1]!, p[2]!, p[3] ?? 1];
};
const over = (fg: RGBA, bg: RGBA): [number, number, number] => [0, 1, 2].map((i) => fg[i]! * fg[3] + bg[i]! * (1 - fg[3])) as [number, number, number];
const lum = ([r, g, b]: [number, number, number]) => {
  const f = (c: number) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (fg: string, bg: string) => {
  const b = parse(bg);
  const l1 = lum(over(parse(fg), b));
  const l2 = lum([b[0], b[1], b[2]]);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};

// every text colour the UI uses must reach WCAG AA (4.5:1) on the true-black background; the accent colours are used for text and
// UI (lime selection, cyan readouts, orange alerts)
describe('colour contrast (WCAG AA) on --bg', () => {
  const bg = token('bg');
  it.each(['text', 'text-muted', 'text-faint', 'lime', 'orange', 'cyan'])('%s is at least 4.5:1', (name) => {
    expect(ratio(token(name), bg), name).toBeGreaterThanOrEqual(4.5);
  });
  it('keeps the hierarchy: text brighter than muted, muted brighter than faint', () => {
    expect(ratio(token('text'), bg)).toBeGreaterThan(ratio(token('text-muted'), bg));
    expect(ratio(token('text-muted'), bg)).toBeGreaterThan(ratio(token('text-faint'), bg));
  });
  it('also holds on the soft background', () => {
    const soft = token('bg-soft');
    for (const name of ['text', 'text-muted', 'text-faint']) expect(ratio(token(name), soft), name).toBeGreaterThanOrEqual(4.5);
  });
});
