// Downloads World Bank history (WDI and WGI) for the Violence Risk Index study into data/raw/wb-hist/ (gitignored).
// Usage: npm run index:fetch      Licence: CC BY 4.0 (World Bank dataset terms); WGI: only the six aggregate estimates are used, never
// the per-source files (EIU, Gallup, PRS, S&P, WEF) whose providers restrict redistribution. PV.EST (perceived violence) is left out
// on purpose: it is partly a measure of the thing being predicted.
import { mkdirSync, writeFileSync } from 'node:fs';
import { parseWbHist } from './structural';

export const INDICATORS = ['NY.GDP.PCAP.KD', 'SP.POP.TOTL', 'SP.DYN.IMRT.IN', 'GOV_WGI_GE.EST', 'GOV_WGI_RL.EST', 'GOV_WGI_CC.EST', 'GOV_WGI_VA.EST', 'GOV_WGI_RQ.EST'];
const UA = 'Defcon/0.1 (research showcase)';

async function main() {
  mkdirSync('data/raw/wb-hist', { recursive: true });
  for (const code of INDICATORS) {
    let text = '';
    for (let attempt = 1; ; attempt++) {
      try {
        const res = await fetch(`https://api.worldbank.org/v2/country/all/indicator/${code}?format=json&per_page=20000&date=1989:2025`, { headers: { 'User-Agent': UA } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        text = await res.text();
        parseWbHist(text); // throws on an error reply
        break;
      } catch (e) {
        if (attempt === 3) throw new Error(`${code}: ${(e as Error).message}`);
        await new Promise((r) => setTimeout(r, 500 * attempt));
      }
    }
    writeFileSync(`data/raw/wb-hist/${code}.json`, text);
    const m = parseWbHist(text);
    console.log(`${code}: ${m.size} countries, ${[...m.values()].reduce((s, x) => s + x.size, 0)} values`);
  }
}
if (process.argv[1]?.endsWith('fetch-structural.ts')) main().catch((e) => (console.error(e), process.exit(1)));
