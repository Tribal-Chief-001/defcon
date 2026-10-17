import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/styles/tokens.css', 'utf8');

describe('design tokens (spec section 4)', () => {
  it.each([
    '--bg: #000000',
    '--text: #EDEDE9',
    '--lime: #D6FF57',
    '--orange: #FF4D00',
    '--cyan: #00FFF0',
    '--border: rgba(255,255,255,.08)',
    '--ease: cubic-bezier(0.16, 1, 0.3, 1)',
  ])('declares %s verbatim', (decl) => {
    expect(css).toContain(decl);
  });
});
