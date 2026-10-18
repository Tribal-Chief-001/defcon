// Performance budgets from the spec, measured as gzip transfer size.
// Usage: npm run build && npm run check:budgets
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

// What the page loads at start (the entry script and its module preloads) must stay under 250 KB gzip; all JavaScript including lazy
// chunks (About, the War room) under 275 KB. A lazy chunk costs nothing until its feature opens.
const JS_INITIAL_BUDGET = 250_000;
const JS_BUDGET = 275_000;
const DATA_BUDGETS: [string, number][] = [
  ['borders.low.topo.json', 300_000],
  ['borders.high.topo.json', 1_000_000],
];
const EVENTS_RECENT = 500_000;
const EVENTS_TOTAL = 2_000_000;
const DOSSIER_INDEX = 40_000;
const DOSSIER_ONE = 6_000;
const gz = (path: string) => gzipSync(readFileSync(path)).length;
const kb = (n: number) => `${(n / 1000).toFixed(0)} KB`;

export function checkBudgets(distDir: string, dataDir: string): { ok: boolean; failures: string[] } {
  const failures: string[] = [];
  const assets = join(distDir, 'assets');
  const js = existsSync(assets)
    ? readdirSync(assets).filter((f) => f.endsWith('.js')).reduce((sum, f) => sum + gz(join(assets, f)), 0)
    : 0;
  const indexHtml = join(distDir, 'index.html');
  const loaded = existsSync(indexHtml)
    ? [...readFileSync(indexHtml, 'utf8').matchAll(/(?:<script[^>]*\ssrc|<link[^>]*modulepreload[^>]*\shref)="\/?([^"]+\.js)"/g)].map((m) => join(distDir, m[1]!)).filter((p) => existsSync(p))
    : [];
  const initial = loaded.length > 0 ? loaded.reduce((sum, p) => sum + gz(p), 0) : js; // no index.html: everything counts as initial
  if (initial > JS_INITIAL_BUDGET) failures.push(`initial JS ${kb(initial)} gzip exceeds ${kb(JS_INITIAL_BUDGET)}`);
  if (js > JS_BUDGET) failures.push(`JS total ${kb(js)} gzip exceeds ${kb(JS_BUDGET)}`);
  for (const [name, cap] of DATA_BUDGETS) {
    const path = join(dataDir, name);
    if (existsSync(path) && gz(path) > cap) failures.push(`${name} ${kb(gz(path))} gzip exceeds ${kb(cap)}`);
  }
  const recent = join(dataDir, 'events/recent.bin');
  const archive = join(dataDir, 'events/archive.bin');
  const r = existsSync(recent) ? gz(recent) : 0;
  const a = existsSync(archive) ? gz(archive) : 0;
  if (r > EVENTS_RECENT) failures.push(`events/recent.bin ${kb(r)} gzip exceeds ${kb(EVENTS_RECENT)}`);
  if (r + a > EVENTS_TOTAL) failures.push(`events total (recent + archive) ${kb(r + a)} gzip exceeds ${kb(EVENTS_TOTAL)}`);
  const rel = join(dataDir, 'relations.json');
  if (existsSync(rel) && gz(rel) > 8 * 1024) failures.push(`relations.json ${kb(gz(rel))} gzip exceeds 8.0 KB`);
  const dossierDir = join(dataDir, 'dossiers');
  if (existsSync(dossierDir)) {
    for (const f of readdirSync(dossierDir).filter((x) => x.endsWith('.json'))) {
      const path = join(dossierDir, f);
      if (f === 'index.json') {
        if (gz(path) > DOSSIER_INDEX) failures.push(`dossiers/index.json ${kb(gz(path))} gzip exceeds ${kb(DOSSIER_INDEX)}`);
      } else if (readFileSync(path).length > DOSSIER_ONE) failures.push(`dossiers/${f} ${readFileSync(path).length} bytes exceeds ${DOSSIER_ONE} bytes`);
    }
  }
  return { ok: failures.length === 0, failures };
}

if (process.argv[1]?.endsWith('check-budgets.ts')) {
  const r = checkBudgets('dist', 'public/data');
  console.log(r.ok ? 'budgets ok' : r.failures.join('\n'));
  process.exit(r.ok ? 0 : 1);
}
