// Builds the recent (30 days) and archive (the 335 days before) event snapshots from the cached sources.
// Usage: npm run data:build      (after npm run data:ucdp and npm run data:gdelt)
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { createPicker } from '../../src/globe/pick';
import type { SnapshotMeta } from '../../src/events/snapshot';
import type { Ev } from '../../src/events/types';
import { encodeSnapshot } from './encode';
import { readGdeltFile } from './gdelt';
import { mergeEvents } from './merge';
import { streamUcdp } from './ucdp';

const DAY = 86400;
export type Encoded = ReturnType<typeof encodeSnapshot>;

export function buildSnapshots(i: { events: Ev[]; nowS: number; sources: SnapshotMeta['sources'] }): { recent: Encoded; archive: Encoded } {
  const cut = i.nowS - 30 * DAY;
  const from = i.nowS - 365 * DAY;
  const asOfS = Math.max(...i.sources.map((s) => s.asOfS), 0);
  const common = { asOfS, generatedS: i.nowS, sources: i.sources };
  return {
    recent: encodeSnapshot(i.events.filter((e) => e.timeS >= cut), { ...common, windowFromS: cut, windowToS: i.nowS }),
    archive: encodeSnapshot(i.events.filter((e) => e.timeS >= from && e.timeS < cut), { ...common, windowFromS: from, windowToS: cut }),
  };
}

const OUT = 'public/data/events';

export function writeSnapshots(dir: string, recent: Encoded, archive: Encoded): void {
  mkdirSync(dir, { recursive: true });
  for (const [name, enc] of [['recent', recent], ['archive', archive]] as const) {
    writeFileSync(join(dir, `${name}.bin`), enc.bin);
    writeFileSync(join(dir, `${name}.meta.json`), JSON.stringify(enc.meta));
    mkdirSync(join(dir, 'detail', name), { recursive: true });
    for (const [day, shard] of enc.details) writeFileSync(join(dir, 'detail', name, `${day}.json`), JSON.stringify(shard));
  }
}

// Replaces `target` with the fully written `tmp` directory, so a failed build leaves the previous data in place
// (the target is missing only for the instant between the two renames).
export function swapDir(tmp: string, target: string): void {
  if (!existsSync(tmp)) throw new Error(`swapDir: ${tmp} does not exist`);
  const old = `${target}.old`;
  rmSync(old, { recursive: true, force: true });
  if (existsSync(target)) renameSync(target, old);
  renameSync(tmp, target);
  rmSync(old, { recursive: true, force: true });
}
const stampS = (f: string) => {
  const m = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/.exec(f);
  return m ? Date.UTC(+m[1]!, +m[2]! - 1, +m[3]!, +m[4]!, +m[5]!, +m[6]!) / 1000 : 0;
};

async function main() {
  const nowS = Math.floor(Date.now() / 1000);
  const since = nowS - 365 * DAY;
  const manifest = JSON.parse(readFileSync('data/events/sources.json', 'utf8')) as { ucdp: { csv: string; version: string }[] };

  const ucdp: Ev[] = [];
  for (const s of manifest.ucdp) for await (const e of streamUcdp(`data/raw/ucdp/${s.csv}`, since, nowS)) ucdp.push(e);

  const gdelt: Ev[] = [];
  let gdeltAsOf = 0;
  const files = readdirSync('data/raw/gdelt').filter((f) => f.endsWith('.export.CSV'));
  for (const f of files) {
    gdeltAsOf = Math.max(gdeltAsOf, stampS(f));
    gdelt.push(...readGdeltFile(join('data/raw/gdelt', f), nowS).filter((e) => e.timeS >= since));
  }

  const pick = createPicker(JSON.parse(readFileSync('public/data/borders.high.topo.json', 'utf8')));
  const merged = mergeEvents([...ucdp, ...gdelt], pick);
  const sources: SnapshotMeta['sources'] = [
    { id: 'ucdp', name: 'UCDP GED / Candidate', version: manifest.ucdp.map((s) => s.version).join('; '), asOfS: ucdp.reduce((m, e) => Math.max(m, e.timeS), 0), coverFromS: ucdp.reduce((m, e) => Math.min(m, e.timeS), Infinity), url: 'https://ucdp.uu.se/downloads/', license: 'CC BY 4.0' },
    { id: 'gdelt', name: 'GDELT 2.0 Events', version: `${files.length} 15-minute files`, asOfS: gdeltAsOf, coverFromS: gdelt.reduce((m, e) => Math.min(m, e.timeS), Infinity), url: 'https://www.gdeltproject.org', license: 'free; cite the GDELT Project' },
  ];
  const { recent, archive } = buildSnapshots({ events: merged, nowS, sources });

  rmSync(`${OUT}.tmp`, { recursive: true, force: true });
  writeSnapshots(`${OUT}.tmp`, recent, archive);
  swapDir(`${OUT}.tmp`, OUT);

  const by = (list: Ev[], key: (e: Ev) => string) => list.reduce<Record<string, number>>((m, e) => ((m[key(e)] = (m[key(e)] ?? 0) + 1), m), {});
  console.log(`read: ucdp ${ucdp.length}, gdelt kept ${gdelt.length}; after merge ${merged.length}`);
  console.log('merged by source', JSON.stringify(by(merged, (e) => e.source)), 'by kind', JSON.stringify(by(merged, (e) => e.kind)));
  console.log('with country', merged.filter((e) => e.country).length, 'ocean/none', merged.filter((e) => !e.country).length);
  for (const name of ['recent', 'archive']) {
    const bin = readFileSync(join(OUT, `${name}.bin`));
    console.log(`${name}: n=${name === 'recent' ? recent.meta.n : archive.meta.n}, ${bin.length} bytes raw, ${gzipSync(bin).length} bytes gzip`);
  }
  console.log('as of', new Date(Math.max(...sources.map((s) => s.asOfS)) * 1000).toISOString(), 'detail dir', statSync(join(OUT, 'detail')).isDirectory());
}

if (process.argv[1]?.endsWith('build-snapshot.ts')) await main();
