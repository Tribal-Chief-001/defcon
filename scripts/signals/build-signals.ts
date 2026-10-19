// Builds public/data/signals.json: context signals beside the conflict data (fires near conflict areas, humanitarian disaster alerts,
// explosion-type seismic events). Run at ingest time (npm run data:signals); a failing source never fails the build, it is reported as
// failed in the file. Signals never change a conflict number, a score or an index.
import { readFileSync, writeFileSync } from 'node:fs';
import type { DisasterSignal, SeismicSignal, SignalSource, SignalsFile } from '../../src/signals/types';
import { fireCells, fireTotals, parseFirmsCsv, type ConflictArea } from './firms';
import { parseGdacsRss } from './gdacs';
import { parseUsgs } from './usgs';
import { validateSignals } from './validate';

export const URLS = {
  usgs: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson',
  gdacs: 'https://www.gdacs.org/xml/rss_7d.xml',
  firms: 'https://firms.modaps.eosdis.nasa.gov/data/active_fire/suomi-npp-viirs-c2/csv/SUOMI_VIIRS_C2_Global_24h.csv',
} as const;

const META: Record<keyof typeof URLS, Omit<SignalSource, 'ok' | 'count' | 'fetchedS' | 'error'>> = {
  usgs: { id: 'usgs', name: 'USGS earthquake feed (explosion-type events)', licence: 'Public domain (U.S. Government work)', attribution: 'U.S. Geological Survey', url: 'https://earthquake.usgs.gov/earthquakes/feed/' },
  gdacs: { id: 'gdacs', name: 'GDACS disaster alerts (Orange and Red)', licence: 'CC BY 4.0 (European Union); credit to GDACS', licenceUrl: 'https://creativecommons.org/licenses/by/4.0/', attribution: 'Global Disaster Alert and Coordination System (GDACS)', url: 'https://www.gdacs.org/' },
  firms: { id: 'firms', name: 'NASA FIRMS thermal anomalies (VIIRS 375 m, last 24 hours)', licence: 'NASA open data; acknowledgement requested', attribution: "We acknowledge the use of data and/or imagery from NASA's Fire Information for Resource Management System (FIRMS) (https://earthdata.nasa.gov/firms), part of NASA's Land, Atmosphere Near real-time Capability for Earth observations (LANCE) (https://earthdata.nasa.gov/lance) and NASA's Earth Science Data and Information System (ESDIS).", url: 'https://firms.modaps.eosdis.nasa.gov/' },
};
const WEEK = 7 * 86400;
const FIRE_MAX_AGE = 36 * 3600; // the "24 h" file can lag behind real time

async function get(fetchFn: typeof fetch, url: string, timeoutMs: number, maxBytes: number): Promise<string> {
  const res = await fetchFn(url, { headers: { 'User-Agent': 'Defcon/0.1 (research showcase)' }, signal: AbortSignal.timeout(timeoutMs), redirect: 'error' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const len = Number(res.headers.get('content-length'));
  if (Number.isFinite(len) && len > maxBytes) throw new Error(`response too large (${len} bytes)`);
  const body = await res.text();
  if (body.length > maxBytes) throw new Error(`response too large (${body.length} bytes)`);
  return body;
}

export async function buildSignals(o: { fetchFn: typeof fetch; nowS: number; conflicts: ConflictArea[]; timeoutMs?: number; maxBytes?: number; maxFireCells?: number }): Promise<SignalsFile> {
  const timeoutMs = o.timeoutMs ?? 30_000;
  const maxBytes = o.maxBytes ?? 15_000_000;
  let seismic: SeismicSignal[] = [];
  let disasters: DisasterSignal[] = [];
  let fires: SignalsFile['fires'] = [];
  let totals: SignalsFile['fireTotals'] = [];
  const future = o.nowS + 86400; // an item dated after this is a bad date upstream: dropped, it must not fail the run
  const sources: SignalSource[] = [];
  const run = async (id: keyof typeof URLS, work: (body: string) => number) => {
    const src: SignalSource = { ...META[id], ok: false, count: 0, fetchedS: o.nowS };
    try {
      src.count = work(await get(o.fetchFn, URLS[id], timeoutMs, maxBytes));
      src.ok = true;
    } catch (e) {
      src.error = (e instanceof Error ? e.message : String(e)).slice(0, 160);
    }
    sources.push(src);
  };
  await run('usgs', (body) => {
    // tiny explosion-type events (magnitude under 2) are local blasts, not signals
    seismic = parseUsgs(JSON.parse(body) as unknown).filter((s) => s.time >= o.nowS - WEEK && s.time <= future && (s.mag === null || s.mag >= 2)).sort((a, b) => b.time - a.time).slice(0, 200);
    return seismic.length;
  });
  await run('gdacs', (body) => {
    if (!/<rss[\s>]/.test(body)) throw new Error('not an RSS feed');
    disasters = parseGdacsRss(body).filter((d) => d.time <= future).sort((a, b) => b.time - a.time).slice(0, 100);
    return disasters.length;
  });
  await run('firms', (body) => {
    if (!body.startsWith('latitude,')) throw new Error('not a FIRMS CSV');
    const all = fireCells(parseFirmsCsv(body).filter((d) => d.time >= o.nowS - FIRE_MAX_AGE && d.time <= future), o.conflicts);
    totals = fireTotals(all).slice(0, 60); // true totals per conflict, taken before the cell list is capped
    fires = all.slice(0, o.maxFireCells ?? 800);
    return fires.length;
  });
  return { generated: new Date(o.nowS * 1000).toISOString(), windows: { seismicDays: 7, disasterDays: 7, fireHours: 24 }, sources, seismic, disasters, fires, fireTotals: totals };
}

async function main() {
  const conflicts = (JSON.parse(readFileSync('public/data/conflicts.json', 'utf8')) as { conflicts: { id: string; name: string; geo: { cells: [number, number, number][] } | null }[] }).conflicts
    .filter((c) => c.geo)
    .map((c) => ({ id: c.id, name: c.name, cells: c.geo!.cells }));
  const nowS = Math.floor(Date.now() / 1000);
  const f = await buildSignals({ fetchFn: fetch, nowS, conflicts });
  const problems = validateSignals(f, nowS);
  if (problems.length) {
    console.error(`signals.json is malformed, nothing written:\n- ${problems.join('\n- ')}`); // a code bug: this fails the build, a down source does not
    process.exit(1);
  }
  writeFileSync('public/data/signals.json', JSON.stringify(f));
  for (const s of f.sources) console.log(`${s.id}: ${s.ok ? `ok, ${s.count}` : `FAILED (${s.error})`}`);
}

if (process.argv[1]?.endsWith('build-signals.ts')) main().catch((e) => (console.error(e), process.exit(1)));
