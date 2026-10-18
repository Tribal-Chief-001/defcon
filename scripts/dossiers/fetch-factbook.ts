// Downloads the Factbook mirror's country files into data/raw/factbook/ (gitignored) and records the mirror commit.
// Usage: npm run data:factbook
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { matchFactbook, parseFactbook, type FactbookFacts } from './factbook';

const REPO = 'factbook/factbook.json';
const UA = 'Defcon/0.1 (research showcase)';
const CONCURRENCY = 4;
const SPACING_MS = 100;
const SKIP_DIRS = new Set(['meta', 'oceans', 'world']);

export async function fetchFactbook(
  cacheDir: string,
  fetchFn: typeof fetch = fetch,
  sleep: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms)),
): Promise<{ files: string[]; commitDate: string; dataDate: string; sha: string }> {
  mkdirSync(cacheDir, { recursive: true });
  const headers = { 'User-Agent': UA, Accept: 'application/vnd.github+json' };
  const treeRes = await fetchFn(`https://api.github.com/repos/${REPO}/git/trees/master?recursive=1`, { headers });
  if (!treeRes.ok) throw new Error(`factbook: tree request failed: HTTP ${treeRes.status}`);
  const tree = ((await treeRes.json()) as { tree: { path: string }[] }).tree;
  const paths = tree.map((t) => t.path).filter((p) => /^[a-z-]+\/[a-z]{2}\.json$/.test(p) && !SKIP_DIRS.has(p.split('/')[0]!));
  const comRes = await fetchFn(`https://api.github.com/repos/${REPO}/commits?per_page=30`, { headers });
  if (!comRes.ok) throw new Error(`factbook: commits request failed: HTTP ${comRes.status}`);
  const commits = (await comRes.json()) as { sha: string; commit: { message: string; committer: { date: string } } }[];
  const com = commits[0];
  const sha = com?.sha ?? '';
  const commitDate = (com?.commit.committer.date ?? '').slice(0, 10);
  // The CIA stopped publishing the Factbook on 2026-02-04; the mirror's data date is its last weekly "auto-update" commit.
  const dataDate = (commits.find((c) => /^auto-update/i.test(c.commit.message))?.commit.committer.date ?? com?.commit.committer.date ?? '').slice(0, 10);

  let oldSha = '';
  try {
    oldSha = (JSON.parse(readFileSync(join(cacheDir, 'meta.json'), 'utf8')) as { sha?: string }).sha ?? '';
  } catch {
    /* first run */
  }
  let gate: Promise<void> = Promise.resolve();
  const startGate = () => (gate = gate.then(() => sleep(SPACING_MS)));
  const names = paths.map((p) => p.replace('/', '_')).sort();
  const queue = paths.filter((p) => !(oldSha === sha && existsSync(join(cacheDir, p.replace('/', '_')))));
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      for (let p = queue.shift(); p; p = queue.shift()) {
        for (let attempt = 1; ; attempt++) {
          await startGate();
          try {
            const r = await fetchFn(`https://raw.githubusercontent.com/${REPO}/master/${p}`, { headers: { 'User-Agent': UA } });
            if (r.ok) {
              writeFileSync(join(cacheDir, p.replace('/', '_')), await r.text());
              break;
            }
            if (attempt === 3) throw new Error(`factbook: ${p}: HTTP ${r.status}`);
          } catch (e) {
            if (attempt === 3) throw e;
          }
          await sleep(500 * attempt);
        }
      }
    }),
  );
  writeFileSync(join(cacheDir, 'meta.json'), JSON.stringify({ commitDate, dataDate, sha, fetchedAt: new Date().toISOString(), url: `https://github.com/${REPO}` }));
  return { files: names, commitDate, dataDate, sha };
}

if (process.argv[1]?.endsWith('fetch-factbook.ts')) {
  const r = await fetchFactbook('data/raw/factbook');
  const caps = JSON.parse(readFileSync('public/data/capitals.json', 'utf8')) as { country: string; lat: number; lon: number }[];
  const facts: Record<string, FactbookFacts> = {};
  for (const f of readdirSync('data/raw/factbook').filter((x) => x.endsWith('.json') && x !== 'meta.json')) facts[f] = parseFactbook(JSON.parse(readFileSync(join('data/raw/factbook', f), 'utf8')));
  const m = matchFactbook(facts, caps);
  console.log(`factbook mirror ${r.sha.slice(0, 7)} (repo ${r.commitDate}, data ${r.dataDate}): ${r.files.length} files; matched ${Object.keys(m.byCountry).length} countries by capital; unmatched ${m.unmatched.length} (territories and others)`);
  console.log('with government type', Object.values(m.byCountry).filter((k) => facts[k]?.governmentType).length, 'languages', Object.values(m.byCountry).filter((k) => facts[k]?.languages).length, 'independence', Object.values(m.byCountry).filter((k) => facts[k]?.independence).length);
}
