import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { checkBudgets } from '../../scripts/check-budgets';

const make = (jsBytes: number, lowBytes = 1000, highBytes = 1000, events?: { recent: number; archive: number }, dossiers?: { index: number; one: number }) => {
  const root = mkdtempSync(join(tmpdir(), 'budget-'));
  mkdirSync(join(root, 'dist/assets'), { recursive: true });
  mkdirSync(join(root, 'data'), { recursive: true });
  // random bytes do not compress, so gzip size is about the raw size
  writeFileSync(join(root, 'dist/assets/app.js'), randomBytes(jsBytes));
  writeFileSync(join(root, 'data/borders.low.topo.json'), randomBytes(lowBytes));
  writeFileSync(join(root, 'data/borders.high.topo.json'), randomBytes(highBytes));
  if (events) {
    mkdirSync(join(root, 'data/events'), { recursive: true });
    writeFileSync(join(root, 'data/events/recent.bin'), randomBytes(events.recent));
    writeFileSync(join(root, 'data/events/archive.bin'), randomBytes(events.archive));
  }
  if (dossiers) {
    mkdirSync(join(root, 'data/dossiers'), { recursive: true });
    writeFileSync(join(root, 'data/dossiers/index.json'), randomBytes(dossiers.index));
    writeFileSync(join(root, 'data/dossiers/IND.json'), randomBytes(dossiers.one));
  }
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
  it('passes when the events snapshots are absent', () => {
    expect(checkBudgets(...make(1000)).ok).toBe(true);
  });
  it('fails when recent.bin exceeds 500 KB gzipped, naming the file', () => {
    const r = checkBudgets(...make(1000, 1000, 1000, { recent: 600_000, archive: 1000 }));
    expect(r.ok).toBe(false);
    expect(r.failures.join(' ')).toMatch(/recent\.bin/);
  });
  it('fails when recent plus archive exceed 2 MB gzipped', () => {
    const r = checkBudgets(...make(1000, 1000, 1000, { recent: 400_000, archive: 1_700_000 }));
    expect(r.ok).toBe(false);
    expect(r.failures.join(' ')).toMatch(/events total/i);
  });
  it('passes realistic event snapshot sizes', () => {
    expect(checkBudgets(...make(1000, 1000, 1000, { recent: 300_000, archive: 900_000 })).ok).toBe(true);
  });
  it('fails when the dossier index exceeds 40 KB gzipped, naming the file', () => {
    const r = checkBudgets(...make(1000, 1000, 1000, undefined, { index: 50_000, one: 1000 }));
    expect(r.ok).toBe(false);
    expect(r.failures.join(' ')).toMatch(/dossiers\/index\.json/);
  });
  it('fails when one dossier exceeds 6 KB, naming the file', () => {
    const r = checkBudgets(...make(1000, 1000, 1000, undefined, { index: 1000, one: 7000 }));
    expect(r.ok).toBe(false);
    expect(r.failures.join(' ')).toMatch(/dossiers\/IND\.json/);
  });
  it('passes realistic dossier sizes and absent dossiers', () => {
    expect(checkBudgets(...make(1000, 1000, 1000, undefined, { index: 20_000, one: 3000 })).ok).toBe(true);
    expect(checkBudgets(...make(1000)).ok).toBe(true);
  });
});
