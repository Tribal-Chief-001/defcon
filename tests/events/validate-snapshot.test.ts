import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildSnapshots, writeSnapshots } from '../../scripts/events/build-snapshot';
import { validateSnapshotDir } from '../../scripts/events/validate-snapshot';
import type { Ev } from '../../src/events/types';

const DAY = 86400;
const NOW = Date.UTC(2026, 9, 18, 12) / 1000;
let n = 0;
const ev = (o: Partial<Ev>): Ev => ({
  id: `e${n++}`, source: 'ucdp', alsoIds: [], timeS: NOW - 3600, lat: 10, lon: 20, precision: 1, country: 'AAA', kind: 'armed', deaths: 1, severity: 2, human: true,
  place: 'p', headline: '', actors: '', sources: [], firstSeenS: NOW, updatedS: NOW, ...o,
});
const sources = [{ id: 'gdelt' as const, name: 'g', version: 'v', asOfS: NOW - 600, coverFromS: NOW - 7 * DAY, url: 'https://x', license: 'x' }];
let dir = '';
const write = (events: Ev[], asOf = NOW - 600) => {
  const src = [{ ...sources[0]!, asOfS: asOf }];
  const { recent, archive } = buildSnapshots({ events, nowS: asOf, sources: src });
  writeSnapshots(dir, recent, archive);
};
const good = () => [ev({}), ev({ timeS: NOW - 5 * DAY }), ev({ timeS: NOW - 60 * DAY, lat: -20, lon: 100 })];

beforeEach(() => (dir = mkdtempSync(join(tmpdir(), 'snap-'))));
afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe('validateSnapshotDir', () => {
  it('passes a good, fresh snapshot pair', async () => {
    write(good());
    expect(await validateSnapshotDir(dir, NOW)).toEqual({ ok: true, problems: [] });
  });
  it('fails when a file is missing', async () => {
    write(good());
    rmSync(join(dir, 'recent.bin'));
    const r = await validateSnapshotDir(dir, NOW);
    expect(r.ok).toBe(false);
    expect(r.problems.join('\n')).toMatch(/recent\.bin.*missing/i);
  });
  it('fails on a changed byte (hash mismatch)', async () => {
    write(good());
    const f = join(dir, 'recent.bin');
    const b = readFileSync(f);
    b[b.length - 1] = b[b.length - 1]! ^ 0xff;
    writeFileSync(f, b);
    expect((await validateSnapshotDir(dir, NOW)).problems.join('\n')).toMatch(/recent.*sha256/i);
  });
  it('fails when there are no recent events', async () => {
    write([ev({ timeS: NOW - 60 * DAY })]);
    expect((await validateSnapshotDir(dir, NOW)).problems.join('\n')).toMatch(/recent.*at least 1/i);
  });
  it('fails when the data is older than 48 h or in the future by more than an hour', async () => {
    write(good(), NOW - 3 * DAY);
    expect((await validateSnapshotDir(dir, NOW)).problems.join('\n')).toMatch(/older than 48 h/i);
    rmSync(dir, { recursive: true });
    dir = mkdtempSync(join(tmpdir(), 'snap-'));
    write(good(), NOW + 2 * 3600);
    expect((await validateSnapshotDir(dir, NOW)).problems.join('\n')).toMatch(/in the future/i);
  });
  it('fails on a non-finite or out-of-range coordinate', async () => {
    write([...good(), ev({ lat: NaN }), ev({ lat: 95, lon: 3 })]);
    const text = (await validateSnapshotDir(dir, NOW)).problems.join('\n');
    expect(text).toMatch(/recent.*coordinate/i);
  });
  it('fails when a detail shard is missing', async () => {
    write(good());
    const day = new Date((NOW - 3600) * 1000).toISOString().slice(0, 10);
    rmSync(join(dir, 'detail', 'recent', `${day}.json`));
    expect((await validateSnapshotDir(dir, NOW)).problems.join('\n')).toMatch(/shard/i);
  });
  it('fails when the recent and archive windows overlap', async () => {
    write(good());
    const f = join(dir, 'archive.meta.json');
    const meta = JSON.parse(readFileSync(f, 'utf8'));
    meta.windowToS += 10 * DAY;
    writeFileSync(f, JSON.stringify(meta));
    expect((await validateSnapshotDir(dir, NOW)).problems.join('\n')).toMatch(/overlap/i);
  });
  it('reports every problem, not just the first', async () => {
    write([ev({ timeS: NOW - 60 * DAY })], NOW - 3 * DAY);
    const r = await validateSnapshotDir(dir, NOW);
    expect(r.problems.length).toBeGreaterThanOrEqual(2);
  });
});
