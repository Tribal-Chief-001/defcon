import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { checkBudgets } from '../../scripts/check-budgets';

const make = (jsBytes: number, lowBytes = 1000, highBytes = 1000) => {
  const root = mkdtempSync(join(tmpdir(), 'budget-'));
  mkdirSync(join(root, 'dist/assets'), { recursive: true });
  mkdirSync(join(root, 'data'), { recursive: true });
  // random bytes do not compress, so gzip size is about the raw size
  writeFileSync(join(root, 'dist/assets/app.js'), randomBytes(jsBytes));
  writeFileSync(join(root, 'data/borders.low.topo.json'), randomBytes(lowBytes));
  writeFileSync(join(root, 'data/borders.high.topo.json'), randomBytes(highBytes));
  return [join(root, 'dist'), join(root, 'data')] as const;
};

describe('checkBudgets', () => {
  it('passes small files', () => {
    expect(checkBudgets(...make(100_000))).toEqual({ ok: true, failures: [] });
  });
  it('fails when total JS is 300 KB gzipped and names the budget', () => {
    const r = checkBudgets(...make(300_000));
    expect(r.ok).toBe(false);
    expect(r.failures.join(' ')).toMatch(/JS/);
  });
  it('fails when the low-detail borders exceed 300 KB gzipped, naming the file', () => {
    const r = checkBudgets(...make(1000, 310_000));
    expect(r.ok).toBe(false);
    expect(r.failures.join(' ')).toMatch(/borders\.low\.topo\.json/);
  });
  it('fails when the high-detail borders exceed 1 MB gzipped, naming the file', () => {
    const r = checkBudgets(...make(1000, 1000, 1_050_000));
    expect(r.ok).toBe(false);
    expect(r.failures.join(' ')).toMatch(/borders\.high\.topo\.json/);
  });
});
