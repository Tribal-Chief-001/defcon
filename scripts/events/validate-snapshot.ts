// Gate before publishing: a broken, empty, stale or inconsistent event snapshot must never replace a good one.
// Usage: npm run data:validate      (exit code 1 and the problems printed when anything is wrong)
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { dayKey, decodeSnapshot, type SnapshotMeta } from '../../src/events/snapshot';
import { KINDS } from '../../src/events/types';

type Opts = { maxAgeS?: number; minRecent?: number };
const NAMES = ['recent', 'archive'] as const;

export async function validateSnapshotDir(dir: string, nowS: number, opts: Opts = {}): Promise<{ ok: boolean; problems: string[] }> {
  // 12 h = the pill's "recent" limit and four publish cycles: a GDELT outage (the cache keeps older files) must turn the run red
  const maxAgeS = opts.maxAgeS ?? 12 * 3600;
  const minRecent = opts.minRecent ?? 500; // a normal 30-day window holds thousands; one event means the parser broke
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

    if (!Number.isFinite(meta.asOfS)) problems.push(`${name}: as-of time is not a finite number`);
    if (name === 'recent' && snap.n < minRecent) problems.push(`recent has ${snap.n} events, at least ${minRecent} required`);
    if (Number.isFinite(meta.asOfS) && nowS - meta.asOfS > maxAgeS) problems.push(`${name}: data is older than ${Math.round(maxAgeS / 3600)} h (as of ${new Date(meta.asOfS * 1000).toISOString()})`);
    if (Number.isFinite(meta.asOfS) && meta.asOfS - nowS > 3600) problems.push(`${name}: as-of time is in the future (${new Date(meta.asOfS * 1000).toISOString()})`);

    const gdelt = meta.sources?.find((x) => x.id === 'gdelt');
    if (gdelt && Number.isFinite(gdelt.coverFromS) && gdelt.asOfS - (gdelt.coverFromS as number) < 5 * 86400)
      problems.push(`${name}: GDELT covers only ${Math.round((gdelt.asOfS - (gdelt.coverFromS as number)) / 86400)} days (at least 5 expected)`);

    let badCoords = 0;
    let badIndex = 0;
    const days = new Set<string>();
    for (let i = 0; i < snap.n; i++) {
      const lat = snap.lat[i]!;
      const lon = snap.lon[i]!;
      if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) badCoords++;
      if (snap.kind[i]! >= KINDS.length || snap.severity[i]! < 1 || snap.severity[i]! > 5 || snap.country[i]! >= snap.countries.length) badIndex++;
      days.add(dayKey(snap.timeS[i]!));
    }
    if (badCoords) problems.push(`${name}: ${badCoords} event(s) with a non-finite or out-of-range coordinate`);
    if (badIndex) problems.push(`${name}: ${badIndex} event(s) with a kind, severity or country index out of range`);

    // every shard must exist, parse, and be long enough for the largest detail index that points into it
    const need = new Map<string, number>();
    for (let i = 0; i < snap.n; i++) {
      const d = dayKey(snap.timeS[i]!);
      need.set(d, Math.max(need.get(d) ?? 0, snap.detailIdx[i]! + 1));
    }
    let missing = 0;
    let firstMissing = '';
    for (const [d, min] of need) {
      const file = join(dir, 'detail', name, `${d}.json`);
      if (!existsSync(file)) {
        if (!missing++) firstMissing = d;
        continue;
      }
      try {
        const shard = JSON.parse(readFileSync(file, 'utf8')) as unknown;
        if (!Array.isArray(shard)) problems.push(`${name}: shard ${d} is not an array`);
        else if (shard.length < min) problems.push(`${name}: shard ${d} is too short (${shard.length} entries, an event points at index ${min - 1})`);
      } catch {
        problems.push(`${name}: shard ${d} is not valid JSON`);
      }
    }
    if (missing) problems.push(`${name}: ${missing} detail shard(s) missing (first: ${firstMissing})`);
    void days;
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
