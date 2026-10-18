import { decodeSnapshot, verifySnapshotHash, type Snapshot, type SnapshotMeta } from './snapshot';

export type LoadResult =
  | { status: 'ok'; snapshot: Snapshot; etag?: string }
  | { status: 'unchanged' }
  | { status: 'error'; reason: string };

const fin = (x: unknown) => typeof x === 'number' && Number.isFinite(x);
// The meta file comes from the network: check its shape before anything uses it (a NaN asOfS would crash the UI).
const validMeta = (m: unknown): m is SnapshotMeta => {
  const x = m as Partial<SnapshotMeta> | null;
  return (
    !!x &&
    x.v === 1 &&
    ['n', 'asOfS', 'generatedS', 'windowFromS', 'windowToS', 'bytes'].every((k) => fin((x as Record<string, unknown>)[k])) &&
    typeof x.sha256 === 'string' &&
    Array.isArray(x.countries) &&
    x.countries.every((c) => typeof c === 'string') &&
    Array.isArray(x.sources) &&
    !!x.offsets &&
    typeof x.offsets === 'object' &&
    Object.values(x.offsets).every(fin)
  );
};

// Fetches `<base>/<name>.meta.json`, then `<base>/<name>.bin`. Never throws: every failure becomes { status: 'error' }
// so the caller can keep showing the last good data. The etag is the snapshot's SHA-256, so a static host without
// conditional requests still avoids re-downloading an unchanged binary. The etag also carries asOfS: the data time lives in
// the meta file, so identical bytes with a newer asOfS are a new snapshot (the label must move).
export async function loadSnapshot(
  base: string,
  name: 'recent' | 'archive',
  prev: { etag?: string } | undefined,
  fetchFn: typeof fetch = fetch,
  timeoutMs = 15_000,
): Promise<LoadResult> {
  try {
    const headers: Record<string, string> = prev?.etag ? { 'If-None-Match': prev.etag } : {};
    const metaRes = await fetchFn(`${base}/${name}.meta.json`, { headers, cache: 'no-cache', signal: AbortSignal.timeout(timeoutMs) });
    if (metaRes.status === 304) return { status: 'unchanged' };
    if (!metaRes.ok) return { status: 'error', reason: `${name}.meta.json: HTTP ${metaRes.status}` };
    let meta: SnapshotMeta;
    try {
      meta = (await metaRes.json()) as SnapshotMeta;
    } catch {
      return { status: 'error', reason: `${name}.meta.json: not valid JSON` };
    }
    if (!validMeta(meta)) return { status: 'error', reason: `${name}.meta.json: unexpected content` };
    const etag = `${meta.sha256}:${meta.asOfS}`;
    if (prev?.etag && prev.etag === etag) return { status: 'unchanged' };

    const binRes = await fetchFn(`${base}/${name}.bin`, { cache: 'no-cache', signal: AbortSignal.timeout(timeoutMs) });
    if (!binRes.ok) return { status: 'error', reason: `${name}.bin: HTTP ${binRes.status}` };
    const buf = await binRes.arrayBuffer();
    const snapshot = decodeSnapshot(buf, meta);
    if (!(await verifySnapshotHash(buf, meta))) return { status: 'error', reason: `snapshot: checksum mismatch in ${name}.bin` };
    return { status: 'ok', snapshot, etag };
  } catch (e) {
    return { status: 'error', reason: e instanceof Error ? e.message : String(e) };
  }
}
