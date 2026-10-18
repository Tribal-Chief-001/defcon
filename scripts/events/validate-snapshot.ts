// Gate before publishing: a broken, empty, stale or inconsistent event snapshot must never replace a good one.
// Usage: npm run data:validate      (exit code 1 and the problems printed when anything is wrong)
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { dayKey, decodeSnapshot, type SnapshotMeta } from '../../src/events/snapshot';

type Opts = { maxAgeS?: number; minRecent?: number };
const NAMES = ['recent', 'archive'] as const;

export async function validateSnapshotDir(dir: string, nowS: number, opts: Opts = {}): Promise<{ ok: boolean; problems: string[] }> {
  const maxAgeS = opts.maxAgeS ?? 48 * 3600;
  const minRecent = opts.minRecent ?? 1;
  const problems: string[] = [];
  const metas: Partial<Record<(typeof NAMES)[number], SnapshotMeta>> = {};

  for (const name of NAMES) {
    const binPath = join(dir, `${name}.bin`);
    const metaPath = join(dir, `${name}.meta.json`);
    if (!existsSync(binPath)) problems.push(`${name}.bin is missing`);
    if (!existsSync(metaPath)) problems.push(`${name}.meta.json is missing`);
    if (!existsSync(binPath) || !existsSync(metaPath)) continue;

    let meta: SnapshotMeta;
    try {
      meta = JSON.parse(readFileSync(metaPath, 'utf8')) as SnapshotMeta;
    } catch {
      problems.push(`${name}.meta.json is not valid JSON`);
      continue;
    }
    metas[name] = meta;
    const bytes = readFileSync(binPath);
    const sha = createHash('sha256').update(bytes).digest('hex');
    if (sha !== meta.sha256) problems.push(`${name}: sha256 of the data does not match the meta`);

    let snap: ReturnType<typeof decodeSnapshot>;
    try {
      snap = decodeSnapshot(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer, meta);
    } catch (e) {
      problems.push(`${name}: cannot be decoded (${(e as Error).message})`);
      continue;
    }

    if (name === 'recent' && snap.n < minRecent) problems.push(`recent has ${snap.n} events, at least ${minRecent} required`);
    if (nowS - meta.asOfS > maxAgeS) problems.push(`${name}: data is older than ${Math.round(maxAgeS / 3600)} h (as of ${new Date(meta.asOfS * 1000).toISOString()})`);
    if (meta.asOfS - nowS > 3600) problems.push(`${name}: as-of time is in the future (${new Date(meta.asOfS * 1000).toISOString()})`);

    let badCoords = 0;
    const days = new Set<string>();
    for (let i = 0; i < snap.n; i++) {
      const lat = snap.lat[i]!;
      const lon = snap.lon[i]!;
      if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) badCoords++;
      days.add(dayKey(snap.timeS[i]!));
    }
    if (badCoords) problems.push(`${name}: ${badCoords} event(s) with a non-finite or out-of-range coordinate`);
    const missing = [...days].filter((d) => !existsSync(join(dir, 'detail', name, `${d}.json`)));
    if (missing.length) problems.push(`${name}: ${missing.length} detail shard(s) missing (first: ${missing[0]})`);
  }

  if (metas.recent && metas.archive && metas.archive.windowToS > metas.recent.windowFromS) problems.push('recent and archive windows overlap');
  return { ok: problems.length === 0, problems };
}

if (process.argv[1]?.endsWith('validate-snapshot.ts')) {
  const dir = process.argv[2] ?? 'public/data/events';
  const r = await validateSnapshotDir(dir, Math.floor(Date.now() / 1000));
  if (r.ok) console.log(`snapshot ok (${dir})`);
  else {
    console.error(`snapshot INVALID (${dir}):\n- ${r.problems.join('\n- ')}`);
    process.exit(1);
  }
}
