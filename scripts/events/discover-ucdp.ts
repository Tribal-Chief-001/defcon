// Looks for the next monthly UCDP candidate file after the newest one pinned in data/events/sources.json.
//   npm run data:ucdp-discover -- --check    HEAD request only; exit 1 when a newer file exists (the monthly workflow uses this), exit 2 on a network error
//   npm run data:ucdp-discover -- --accept   download it and pin its SHA-256 in the manifest (a reviewed change: the pin is a supply-chain control)
// After --accept: npm run data:conflicts, npm run data:indices, then npm test and commit the three changed data files.
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { existsSync } from 'node:fs';
import { looksLikeUcdpCsv, nextCandidate, probeCandidate, type UcdpSource } from './ucdp-next';

const MANIFEST = 'data/events/sources.json';
const wantsBoth = process.argv.includes('--accept') && process.argv.includes('--check');
const mode = process.argv.includes('--accept') ? 'accept' : process.argv.includes('--check') ? 'check' : null;
if (!mode || wantsBoth) {
  console.error('usage: npm run data:ucdp-discover -- --check | --accept');
  process.exit(64);
}
const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8')) as { ucdp: UcdpSource[] };
const next = nextCandidate(manifest.ucdp);
if (!next) {
  console.error('no candidate file is pinned yet: add the first one by hand');
  process.exit(64);
}
let found: Awaited<ReturnType<typeof probeCandidate>>;
try {
  found = await probeCandidate(fetch, next.url);
} catch (e) {
  console.error(`refusing to probe: ${(e as Error).message}`); // exit 2 (not 1: 1 means "a newer file exists")
  process.exit(2);
}
if (found === 'error') {
  console.error(`could not check ${next.url} (network or server error)`);
  process.exit(2);
}
if (found === 'none') {
  console.log(`no newer UCDP candidate file yet (looked for ${next.csv})`);
  process.exit(0);
}
if (mode === 'check') {
  console.error(`a newer UCDP candidate file exists: ${next.csv}. Run: npm run data:ucdp-discover -- --accept, then npm run data:conflicts and npm run data:indices.`);
  process.exit(1);
}
if (existsSync(`data/raw/ucdp/${next.csv}`)) {
  console.error(`data/raw/ucdp/${next.csv} already exists but is not pinned: move it away first, nothing was written`);
  process.exit(2);
}
// no redirects: the download must come from the probed ucdp.uu.se URL itself
const res = await fetch(next.url, { headers: { 'User-Agent': 'Defcon/0.1 (research showcase)' }, redirect: 'error' });
if (!res.ok) {
  console.error(`download failed: HTTP ${res.status}`);
  process.exit(2);
}
const bytes = Buffer.from(await res.arrayBuffer());
if (!looksLikeUcdpCsv(bytes, res.headers.get('content-type') ?? '')) {
  console.error('the download does not look like a UCDP CSV: nothing was written');
  process.exit(2);
}
mkdirSync('data/raw/ucdp', { recursive: true });
writeFileSync(`data/raw/ucdp/${next.csv}`, bytes);
next.sha256 = createHash('sha256').update(bytes).digest('hex');
manifest.ucdp.push(next);
writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
console.log(`pinned ${next.csv} (${bytes.length} bytes, sha256 ${next.sha256}). Now run: npm run data:conflicts && npm run data:indices`);
