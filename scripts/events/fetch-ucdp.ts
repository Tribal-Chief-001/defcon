// Downloads the UCDP GED 26.1 CSV and the monthly candidate CSVs into data/raw/ucdp/ (gitignored), pinned by SHA-256.
// Usage: npm run data:ucdp [-- --accept-new]   (accept-new records fresh hashes; candidate files are provisional and get revised)
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';

type Src = { name: string; kind: 'zip' | 'csv'; url: string; csv: string; version: string; sha256: string };
const MANIFEST = 'data/events/sources.json';
const OUT = 'data/raw/ucdp';
const UA = 'Defcon/0.1 (research showcase)';
const acceptNew = process.argv.includes('--accept-new');

const sha = async (path: string) => {
  const h = createHash('sha256');
  for await (const chunk of createReadStream(path)) h.update(chunk);
  return h.digest('hex');
};

const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8')) as { ucdp: Src[] };
mkdirSync(OUT, { recursive: true });

for (const s of manifest.ucdp) {
  const file = s.kind === 'zip' ? `${OUT}/${s.name}.zip` : `${OUT}/${s.csv}`;
  if (!existsSync(file) || (s.sha256 && (await sha(file)) !== s.sha256)) {
    for (let attempt = 1; ; attempt++) {
      const res = await fetch(s.url, { headers: { 'User-Agent': UA } });
      if (res.ok && res.body) {
        await pipeline(Readable.fromWeb(res.body as never), createWriteStream(file));
        break;
      }
      if (attempt === 3) throw new Error(`${s.name}: HTTP ${res.status} from ${s.url}`);
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
  const actual = await sha(file);
  if (!s.sha256 || actual !== s.sha256) {
    if (!acceptNew) {
      console.error(`${s.name}: SHA-256 mismatch (pinned ${s.sha256 || 'none'}, got ${actual}). Re-run with --accept-new only if the change is intended.`);
      process.exit(1);
    }
    s.sha256 = actual;
    console.log(`${s.name}: recorded sha256 ${actual}`);
  } else console.log(`${s.name}: sha256 ok`);
  if (s.kind === 'zip') execFileSync('unzip', ['-o', '-q', file, '-d', `${OUT}/ged`]);
}
if (acceptNew) writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
