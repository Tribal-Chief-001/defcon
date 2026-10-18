import { decodeSnapshot, verifySnapshotHash, type Snapshot, type SnapshotMeta } from './snapshot';

export type LoadResult =
  | { status: 'ok'; snapshot: Snapshot; etag?: string }
  | { status: 'unchanged' }
  | { status: 'error'; reason: string };

// Fetches `<base>/<name>.meta.json`, then `<base>/<name>.bin`. Never throws: every failure becomes { status: 'error' }
// so the caller can keep showing the last good data. The etag is the snapshot's SHA-256, so a static host without
// conditional requests still avoids re-downloading an unchanged binary.
export async function loadSnapshot(
  base: string,
  name: 'recent' | 'archive',
  prev: { etag?: string } | undefined,
  fetchFn: typeof fetch = fetch,
): Promise<LoadResult> {
  try {
    const headers: Record<string, string> = prev?.etag ? { 'If-None-Match': prev.etag } : {};
    const metaRes = await fetchFn(`${base}/${name}.meta.json`, { headers, cache: 'no-cache' });
    if (metaRes.status === 304) return { status: 'unchanged' };
    if (!metaRes.ok) return { status: 'error', reason: `${name}.meta.json: HTTP ${metaRes.status}` };
    let meta: SnapshotMeta;
    try {
      meta = (await metaRes.json()) as SnapshotMeta;
    } catch {
      return { status: 'error', reason: `${name}.meta.json: not valid JSON` };
    }
    if (typeof meta?.sha256 !== 'string' || typeof meta.n !== 'number') return { status: 'error', reason: `${name}.meta.json: unexpected content` };
    if (prev?.etag && prev.etag === meta.sha256) return { status: 'unchanged' };

    const binRes = await fetchFn(`${base}/${name}.bin`, { cache: 'no-cache' });
    if (!binRes.ok) return { status: 'error', reason: `${name}.bin: HTTP ${binRes.status}` };
    const buf = await binRes.arrayBuffer();
    const snapshot = decodeSnapshot(buf, meta);
    if (!(await verifySnapshotHash(buf, meta))) return { status: 'error', reason: `snapshot: checksum mismatch in ${name}.bin` };
    return { status: 'ok', snapshot, etag: meta.sha256 };
  } catch (e) {
    return { status: 'error', reason: e instanceof Error ? e.message : String(e) };
  }
}
