// Pure helpers to find the next UCDP candidate file after the newest pinned one. UCDP publishes one candidate CSV per month, named
// GEDEvent_v26_0_9.csv (September 2026); the first release of a year covers a range (GEDEvent_v26_01_26_06.csv).
export type UcdpSource = { name: string; kind: 'zip' | 'csv'; url: string; csv: string; version: string; sha256: string };

const SINGLE = /^GEDEvent_v(\d{2})_0_(\d{1,2})\.csv$/;
const RANGE = /^GEDEvent_v(\d{2})_\d{2}_\d{2}_(\d{2})\.csv$/;

export function newestCandidate(manifest: UcdpSource[]): { year: number; month: number } | null {
  let best: { year: number; month: number } | null = null;
  for (const s of manifest) {
    const m = SINGLE.exec(s.csv) ?? RANGE.exec(s.csv);
    if (!m) continue;
    const c = { year: Number(m[1]), month: Number(m[2]) };
    if (!best || c.year * 12 + c.month > best.year * 12 + best.month) best = c;
  }
  return best;
}

// The manifest entry (without a hash) of the month after the newest pinned candidate; null when there is no candidate to continue from.
export function nextCandidate(manifest: UcdpSource[]): UcdpSource | null {
  const n = newestCandidate(manifest);
  const last = manifest.find((s) => s.kind === 'csv');
  if (!n || !last) return null;
  const year = n.month === 12 ? n.year + 1 : n.year;
  const month = n.month === 12 ? 1 : n.month + 1;
  const csv = `GEDEvent_v${year}_0_${month}.csv`;
  return { name: `candidate-${year}-${String(month).padStart(2, '0')}`, kind: 'csv', url: last.url.replace(/[^/]+$/, csv), csv, version: `Candidate ${year}.0.${month}`, sha256: '' };
}

// HEAD only: "found" for a data file, "none" for 404 (or an HTML page), "error" for anything else (a network failure must not read as "nothing new").
export async function probeCandidate(fetchFn: typeof fetch, url: string): Promise<'found' | 'none' | 'error'> {
  const u = new URL(url);
  if (u.protocol !== 'https:') throw new Error(`candidate URL must be https: ${url}`);
  if (u.hostname !== 'ucdp.uu.se') throw new Error(`candidate URL must be on ucdp.uu.se: ${url}`);
  try {
    const r = await fetchFn(url, { method: 'HEAD', headers: { 'User-Agent': 'Defcon/0.1 (research showcase)' }, redirect: 'manual' });
    if (r.status === 404) return 'none';
    if (r.status !== 200) return 'error';
    return /html/i.test(r.headers.get('content-type') ?? '') ? 'none' : 'found';
  } catch {
    return 'error';
  }
}
