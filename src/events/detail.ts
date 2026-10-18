import { dayKey, type Snapshot } from './snapshot';
import type { Detail } from './types';

const shards = new Map<string, Promise<Detail[] | null>>();
export const clearDetailCache = () => shards.clear();

// The text of one event, from its per-day shard (fetched once, cached). Returns null on any failure.
export async function fetchDetail(
  base: string,
  name: 'recent' | 'archive',
  s: Snapshot,
  index: number,
  fetchFn: typeof fetch = fetch,
): Promise<Detail | null> {
  const timeS = s.timeS[index];
  const at = s.detailIdx[index];
  if (timeS === undefined || at === undefined) return null;
  // the snapshot version is part of the URL: after a rebuild detailIdx values shift, so an old cached shard must never be reused
  const url = `${base}/detail/${name}/${dayKey(timeS)}.json?v=${s.meta.sha256.slice(0, 12)}`;
  let p = shards.get(url);
  if (!p) {
    p = fetchFn(url)
      .then((r) => (r.ok ? (r.json() as Promise<Detail[]>) : null))
      .catch(() => null);
    shards.set(url, p);
  }
  const arr = await p;
  if (!arr) shards.delete(url); // allow a retry later
  return arr?.[at] ?? null;
}
