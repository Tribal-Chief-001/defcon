// Binary struct-of-arrays event snapshot (browser-safe: decode and verify only; the encoder lives in scripts/events/encode.ts).
import type { Detail } from './types';

export type SnapshotMeta = {
  v: 1;
  n: number;
  asOfS: number;
  generatedS: number;
  windowFromS: number;
  windowToS: number;
  countries: string[]; // index 0 is '' (no country)
  offsets: Record<'time' | 'lat' | 'lon' | 'detail' | 'country' | 'kind' | 'severity' | 'precision' | 'human', number>;
  bytes: number;
  sha256: string;
  sources: { id: 'ucdp' | 'gdelt'; name: string; version: string; asOfS: number; coverFromS?: number; url: string; license: string }[];
};

export type Snapshot = {
  n: number;
  timeS: Uint32Array;
  lat: Float32Array;
  lon: Float32Array;
  detailIdx: Uint32Array;
  country: Uint16Array;
  kind: Uint8Array;
  severity: Uint8Array;
  precision: Uint8Array;
  human: Uint8Array;
  countries: string[];
  meta: SnapshotMeta;
};

export type DayShard = Detail[];

const pad4 = (n: number) => (n + 3) & ~3;

// Column order and widths in bytes per event; every column starts on a 4-byte boundary.
export function layoutFor(n: number): { offsets: SnapshotMeta['offsets']; bytes: number } {
  const cols: [keyof SnapshotMeta['offsets'], number][] = [
    ['time', 4], ['lat', 4], ['lon', 4], ['detail', 4], ['country', 2], ['kind', 1], ['severity', 1], ['precision', 1], ['human', 1],
  ];
  const offsets = {} as SnapshotMeta['offsets'];
  let at = 0;
  for (const [name, width] of cols) {
    offsets[name] = at;
    at += pad4(n * width);
  }
  return { offsets, bytes: at };
}

export function dayKey(timeS: number): string {
  return new Date(timeS * 1000).toISOString().slice(0, 10);
}

export function decodeSnapshot(buf: ArrayBuffer, meta: SnapshotMeta): Snapshot {
  const { n } = meta;
  const expect = layoutFor(n);
  if (buf.byteLength !== meta.bytes || buf.byteLength !== expect.bytes)
    throw new Error(`snapshot: expected ${expect.bytes} bytes for ${n} events, got ${buf.byteLength}`);
  for (const [k, v] of Object.entries(expect.offsets))
    if (meta.offsets[k as keyof SnapshotMeta['offsets']] !== v) throw new Error(`snapshot: unexpected offset for ${k}`);
  const o = meta.offsets;
  return {
    n,
    timeS: new Uint32Array(buf, o.time, n),
    lat: new Float32Array(buf, o.lat, n),
    lon: new Float32Array(buf, o.lon, n),
    detailIdx: new Uint32Array(buf, o.detail, n),
    country: new Uint16Array(buf, o.country, n),
    kind: new Uint8Array(buf, o.kind, n),
    severity: new Uint8Array(buf, o.severity, n),
    precision: new Uint8Array(buf, o.precision, n),
    human: new Uint8Array(buf, o.human, n),
    countries: meta.countries,
    meta,
  };
}

// Async because the browser only offers SubtleCrypto. Resolves true when SubtleCrypto is unavailable (it cannot verify).
export async function verifySnapshotHash(buf: ArrayBuffer, meta: SnapshotMeta): Promise<boolean> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) return true;
  const digest = new Uint8Array(await subtle.digest('SHA-256', buf));
  const hex = Array.from(digest, (b) => b.toString(16).padStart(2, '0')).join('');
  return hex === meta.sha256;
}
