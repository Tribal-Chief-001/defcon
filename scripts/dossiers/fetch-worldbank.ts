// Downloads the World Bank WDI indicators used by the dossiers into data/raw/wb/ (gitignored).
// Usage: npm run data:wb
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { WB_INDICATORS, parseWb } from './worldbank';

const UA = 'Defcon/0.1 (research showcase)';
const url = (code: string) => `https://api.worldbank.org/v2/country/all/indicator/${code}?format=json&per_page=500&mrnev=1`;

export async function fetchWorldBank(
  cacheDir: string,
  fetchFn: typeof fetch = fetch,
  sleep: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms)),
): Promise<{ lastupdated: string }> {
  mkdirSync(cacheDir, { recursive: true });
  let lastupdated = '';
  for (const code of Object.values(WB_INDICATORS)) {
    let text = '';
    for (let attempt = 1; ; attempt++) {
      await sleep(100);
      try {
        const res = await fetchFn(url(code), { headers: { 'User-Agent': UA } });
        if (res.ok) {
          text = await res.text();
          break;
        }
        if (attempt === 3) throw new Error(`worldbank: ${code}: HTTP ${res.status}`);
      } catch (e) {
        if (attempt === 3) throw e instanceof Error && e.message.startsWith('worldbank:') ? e : new Error(`worldbank: ${code}: ${(e as Error).message}`);
      }
      await sleep(500 * attempt);
    }
    const json = JSON.parse(text) as [{ pages?: number; lastupdated?: string }, unknown];
    if ((json[0]?.pages ?? 1) !== 1) throw new Error(`worldbank: ${code}: unexpected pages=${json[0]?.pages} (raise per_page)`);
    lastupdated = json[0]?.lastupdated ?? lastupdated;
    writeFileSync(join(cacheDir, `${code}.json`), text);
  }
  writeFileSync(join(cacheDir, 'meta.json'), JSON.stringify({ fetchedAt: new Date().toISOString(), lastupdated }));
  return { lastupdated };
}

if (process.argv[1]?.endsWith('fetch-worldbank.ts')) {
  const meta = await fetchWorldBank('data/raw/wb');
  const countries = JSON.parse(readFileSync('public/data/countries.json', 'utf8')) as { id: string; iso3: string | null; hasPolygon: boolean }[];
  console.log(`World Bank data last updated ${meta.lastupdated}; coverage of our ${countries.length} countries:`);
  for (const [key, code] of Object.entries(WB_INDICATORS)) {
    const m = parseWb(JSON.parse(readFileSync(join('data/raw/wb', `${code}.json`), 'utf8')));
    console.log(`  ${key.padEnd(13)} ${code.padEnd(18)} ${countries.filter((c) => c.iso3 && m.has(c.iso3)).length} countries`);
  }
}
