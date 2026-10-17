import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const files = (readdirSync('src', { recursive: true }) as string[])
  .filter((f) => /\.(css|ts|tsx)$/.test(f))
  .map((f) => join('src', f));

const forbidden: [string, RegExp][] = [
  ['box-shadow (spec: 1px borders, no shadows)', /box-shadow/],
  ['gradient text (background-clip: text)', /background-clip:\s*text/],
  ['lucide-react import (no stock icon packs)', /lucide-react/],
];

describe('forbidden design patterns', () => {
  it('scans at least one source file', () => {
    expect(files.length).toBeGreaterThan(0);
  });
  it.each(forbidden)('no %s in src', (_label, pattern) => {
    const hits = files.filter((f) => pattern.test(readFileSync(f, 'utf8')));
    expect(hits).toEqual([]);
  });
});
