// Downloads the pinned Natural Earth files into data/raw/ne/ (gitignored).
// Usage: npm run map:fetch [-- --accept-new]   (accept-new records fresh SHA-256 hashes)
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { verifySha256 } from './verify.ts';
import { createHash } from 'node:crypto';

type Source = { name: string; url: string; sha256: string; neVersion: string };
const SOURCES = 'data/map/sources.json';
const OUT = 'data/raw/ne';
const acceptNew = process.argv.includes('--accept-new');

const manifest = JSON.parse(readFileSync(SOURCES, 'utf8')) as { files: Source[] };
mkdirSync(OUT, { recursive: true });

for (const f of manifest.files) {
  const res = await fetch(f.url);
  if (!res.ok) throw new Error(`${f.name}: HTTP ${res.status} from ${f.url}`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  const actual = createHash('sha256').update(bytes).digest('hex');
  if (!f.sha256 || !verifySha256(bytes, f.sha256)) {
    if (!acceptNew) {
      console.error(`${f.name}: SHA-256 mismatch (expected ${f.sha256 || 'none'}, got ${actual}). Re-run with --accept-new only if the change is intended.`);
      process.exit(1);
    }
    f.sha256 = actual;
    console.log(`${f.name}: recorded sha256 ${actual}`);
  } else {
    console.log(`${f.name}: sha256 ok`);
  }
  const zip = `${OUT}/${f.name}.zip`;
  writeFileSync(zip, bytes);
  execFileSync('unzip', ['-o', '-q', zip, '-d', OUT]);
}

if (acceptNew) writeFileSync(SOURCES, JSON.stringify(manifest, null, 2) + '\n');
