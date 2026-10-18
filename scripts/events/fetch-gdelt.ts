// Downloads GDELT 2.0 15-minute event exports into a cache directory and reports what the filters keep.
// Usage: npm run data:gdelt [-- --days N]   (default 7; cached files are never fetched again)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { unzipSync } from 'fflate';
import { readGdeltFile } from './gdelt';

const BASE = 'http://data.gdeltproject.org/gdeltv2';
const UA = 'Defcon/0.1 (research showcase)';
const SLOT_S = 900;
const RECENT_S = 2 * 3600; // slots this young may simply not be published yet: never mark them missing
const CONCURRENCY = 4;
const SPACING_MS = 100;

const stamp = (s: number) => new Date(s * 1000).toISOString().replace(/[-:T]/g, '').slice(0, 14);

// The newest fully published slot first, then backwards in 15-minute steps.
export function slotStamps(nowS: number, count: number): string[] {
  const newest = Math.floor(nowS / SLOT_S) * SLOT_S - SLOT_S;
  return Array.from({ length: count }, (_, i) => stamp(newest - i * SLOT_S));
}

type Opts = { days: number; cacheDir: string; nowS: number; fetchFn?: typeof fetch; sleep?: (ms: number) => Promise<void> };

export async function fetchGdelt(o: Opts): Promise<string[]> {
  const fetchFn = o.fetchFn ?? fetch;
  const sleep = o.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  mkdirSync(o.cacheDir, { recursive: true });
  const stamps = slotStamps(o.nowS, Math.max(1, Math.round(o.days * 96)));
  const paths = new Map<string, string>();
  let gate: Promise<void> = Promise.resolve(); // serialises request starts, at least SPACING_MS apart
  const startGate = () => (gate = gate.then(() => sleep(SPACING_MS)));

  const one = async (st: string) => {
    const csv = join(o.cacheDir, `${st}.export.CSV`);
    const missing = join(o.cacheDir, `${st}.missing`);
    if (existsSync(csv)) return void paths.set(st, csv);
    if (existsSync(missing)) return;
    const slotS = Date.UTC(+st.slice(0, 4), +st.slice(4, 6) - 1, +st.slice(6, 8), +st.slice(8, 10), +st.slice(10, 12)) / 1000;
    for (let attempt = 1; attempt <= 3; attempt++) {
      await startGate();
      try {
        const res = await fetchFn(`${BASE}/${st}.export.CSV.zip`, { headers: { 'User-Agent': UA } });
        if (res.ok) {
          const files = unzipSync(new Uint8Array(await res.arrayBuffer()));
          const first = Object.values(files)[0];
          if (first) {
            writeFileSync(csv, first);
            paths.set(st, csv);
          }
          return;
        }
        if (res.status === 404) {
          if (o.nowS - slotS > RECENT_S) writeFileSync(missing, '');
          return;
        }
      } catch {
        /* network error: retry */
      }
      await sleep(500 * attempt);
    }
  };

  const queue = [...stamps];
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      for (let st = queue.shift(); st; st = queue.shift()) await one(st);
    }),
  );
  return stamps.filter((s) => paths.has(s)).map((s) => paths.get(s)!);
}

if (process.argv[1]?.endsWith('fetch-gdelt.ts')) {
  const i = process.argv.indexOf('--days');
  const days = i > 0 ? Number(process.argv[i + 1]) : 7;
  const nowS = Math.floor(Date.now() / 1000);
  const t0 = Date.now();
  const files = await fetchGdelt({ days, cacheDir: 'data/raw/gdelt', nowS });
  const secs = (Date.now() - t0) / 1000;
  let rows = 0;
  const kinds: Record<string, number> = {};
  let kept = 0;
  for (const f of files) {
    rows += readFileSync(f, 'utf8').split('\n').filter(Boolean).length;
    for (const e of readGdeltFile(f, nowS)) {
      kept++;
      kinds[e.kind] = (kinds[e.kind] ?? 0) + 1;
    }
  }
  console.log(`gdelt: ${files.length} files in cache, ${rows} rows read, ${kept} kept ${JSON.stringify(kinds)}; fetch phase ${secs.toFixed(0)} s`);
}
