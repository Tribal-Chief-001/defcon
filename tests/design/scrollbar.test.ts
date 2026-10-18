import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/styles/index.css', 'utf8');
const tokens = readFileSync('src/styles/tokens.css', 'utf8');
const walk = (d: string): string[] => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : /\.tsx?$/.test(f) ? [join(d, f)] : []));

describe('scrollbar (hairline, on-brand)', () => {
  it('is 10 px wide with a transparent track and no arrow buttons', () => {
    expect(css).toMatch(/::-webkit-scrollbar\s*\{[^}]*width:\s*10px/);
    expect(css).toMatch(/::-webkit-scrollbar-track\s*\{[^}]*background:\s*transparent/);
    expect(css).toMatch(/::-webkit-scrollbar-button\s*\{[^}]*display:\s*none/);
  });
  it('has a pill thumb that brightens on hover and turns lime while dragged', () => {
    expect(css).toMatch(/::-webkit-scrollbar-thumb\s*\{[^}]*border-radius:\s*100px/);
    expect(css).toMatch(/::-webkit-scrollbar-thumb:hover\s*\{/);
    expect(css).toMatch(/::-webkit-scrollbar-thumb:active\s*\{[^}]*var\(--lime\)/);
  });
  it('supports Firefox with thin scrollbars and a colour, but only where ::-webkit-scrollbar is unsupported', () => {
    // Chrome 121+ ignores ::-webkit-scrollbar on any element that sets the standard properties, so they must not apply there
    expect(css).toMatch(/@supports not selector\(::-webkit-scrollbar\)\s*\{[^@]*scrollbar-width:\s*thin[^@]*scrollbar-color:\s*[^;]+transparent/);
    const outside = css.replace(/@supports not selector\(::-webkit-scrollbar\)\s*\{[\s\S]*?\}\s*\}/, '');
    expect(outside).not.toMatch(/scrollbar-width/);
    expect(outside).not.toMatch(/scrollbar-color/);
  });
  it('uses no shadow', () => {
    const block = css.slice(css.indexOf('::-webkit-scrollbar'));
    expect(block).not.toMatch(/box-shadow/);
  });
});

describe('type scale', () => {
  it('defines the tokens', () => {
    for (const t of ['--fs-label', '--fs-data', '--fs-body', '--fs-title', '--fs-hero']) expect(tokens).toContain(t);
  });
  it('keeps no label smaller than 11 px anywhere in the UI', () => {
    const small = walk('src').filter((f) => /text-\[(?:[0-9]|10)(?:\.\d+)?px\]/.test(readFileSync(f, 'utf8')));
    expect(small).toEqual([]);
  });
});
