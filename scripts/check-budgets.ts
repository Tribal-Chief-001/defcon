// Performance budgets from the spec, measured as gzip transfer size.
// Usage: npm run build && npm run check:budgets
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const JS_BUDGET = 250_000;
const DATA_BUDGETS: [string, number][] = [
  ['borders.low.topo.json', 300_000],
  ['borders.high.topo.json', 1_000_000],
];
const gz = (path: string) => gzipSync(readFileSync(path)).length;
const kb = (n: number) => `${(n / 1000).toFixed(0)} KB`;

export function checkBudgets(distDir: string, dataDir: string): { ok: boolean; failures: string[] } {
  const failures: string[] = [];
  const assets = join(distDir, 'assets');
  const js = existsSync(assets)
    ? readdirSync(assets).filter((f) => f.endsWith('.js')).reduce((sum, f) => sum + gz(join(assets, f)), 0)
    : 0;
  if (js > JS_BUDGET) failures.push(`JS total ${kb(js)} gzip exceeds ${kb(JS_BUDGET)}`);
  for (const [name, cap] of DATA_BUDGETS) {
    const path = join(dataDir, name);
    if (existsSync(path) && gz(path) > cap) failures.push(`${name} ${kb(gz(path))} gzip exceeds ${kb(cap)}`);
  }
  return { ok: failures.length === 0, failures };
}

if (process.argv[1]?.endsWith('check-budgets.ts')) {
  const r = checkBudgets('dist', 'public/data');
  console.log(r.ok ? 'budgets ok' : r.failures.join('\n'));
  process.exit(r.ok ? 0 : 1);
}
