import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildSnapshots, swapDir, writeSnapshots } from '../../scripts/events/build-snapshot';
import type { Ev } from '../../src/events/types';

const NOW = Date.UTC(2026, 9, 18, 12) / 1000;
const ev = (id: string, timeS: number): Ev => ({
  id, source: 'ucdp', alsoIds: [], timeS, lat: 1, lon: 2, precision: 1, country: null, kind: 'armed', deaths: 1, severity: 2, human: true,
  place: id, headline: '', actors: '', sources: [], firstSeenS: NOW, updatedS: NOW,
});
const dir = () => mkdtempSync(join(tmpdir(), 'snap-'));

// review finding: a rebuild must never leave the app without data
describe('writeSnapshots and swapDir', () => {
  const built = buildSnapshots({ events: [ev('a', NOW - 100), ev('b', NOW - 40 * 86400)], nowS: NOW, sources: [] });

  it('writes bin, meta and detail shards for both snapshots', () => {
    const d = dir();
    writeSnapshots(d, built.recent, built.archive);
    for (const f of ['recent.bin', 'recent.meta.json', 'archive.bin', 'archive.meta.json']) expect(existsSync(join(d, f))).toBe(true);
    expect(existsSync(join(d, 'detail/recent/2026-10-18.json'))).toBe(true);
    expect(JSON.parse(readFileSync(join(d, 'recent.meta.json'), 'utf8')).n).toBe(1);
  });
  it('replaces the target directory with the new one and leaves no .old directory', () => {
    const root = dir();
    const target = join(root, 'events');
    mkdirSync(target);
    writeFileSync(join(target, 'old.txt'), 'old');
    const tmp = join(root, 'events.tmp');
    mkdirSync(tmp);
    writeFileSync(join(tmp, 'new.txt'), 'new');
    swapDir(tmp, target);
    expect(existsSync(join(target, 'new.txt'))).toBe(true);
    expect(existsSync(join(target, 'old.txt'))).toBe(false);
    expect(existsSync(`${target}.old`)).toBe(false);
    expect(existsSync(tmp)).toBe(false);
  });
  it('keeps the existing target untouched when the new directory does not exist', () => {
    const root = dir();
    const target = join(root, 'events');
    mkdirSync(target);
    writeFileSync(join(target, 'keep.txt'), 'keep');
    expect(() => swapDir(join(root, 'missing'), target)).toThrow(/does not exist/);
    expect(readFileSync(join(target, 'keep.txt'), 'utf8')).toBe('keep');
  });
});
