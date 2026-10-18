import { createHash } from 'node:crypto';
import { dayKey, layoutFor, type SnapshotMeta } from '../../src/events/snapshot';
import { KINDS, type Detail, type Ev } from '../../src/events/types';

export function encodeSnapshot(
  events: Ev[],
  opts: { asOfS: number; generatedS: number; sources: SnapshotMeta['sources']; windowFromS?: number; windowToS?: number },
): { bin: Uint8Array; meta: SnapshotMeta; details: Map<string, Detail[]> } {
  const sorted = [...events].sort((a, b) => a.timeS - b.timeS || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const n = sorted.length;
  const countries = ['', ...[...new Set(sorted.map((e) => e.country).filter((c): c is string => !!c))].sort()];
  const countryIdx = new Map(countries.map((c, i) => [c, i]));
  const { offsets, bytes } = layoutFor(n);
  const buf = new ArrayBuffer(bytes);
  const time = new Uint32Array(buf, offsets.time, n);
  const lat = new Float32Array(buf, offsets.lat, n);
  const lon = new Float32Array(buf, offsets.lon, n);
  const detail = new Uint32Array(buf, offsets.detail, n);
  const country = new Uint16Array(buf, offsets.country, n);
  const kind = new Uint8Array(buf, offsets.kind, n);
  const severity = new Uint8Array(buf, offsets.severity, n);
  const precision = new Uint8Array(buf, offsets.precision, n);
  const human = new Uint8Array(buf, offsets.human, n);

  const details = new Map<string, Detail[]>();
  sorted.forEach((e, i) => {
    time[i] = e.timeS;
    lat[i] = e.lat;
    lon[i] = e.lon;
    country[i] = countryIdx.get(e.country ?? '') ?? 0;
    kind[i] = KINDS.indexOf(e.kind);
    severity[i] = e.severity;
    precision[i] = e.precision;
    human[i] = e.human ? 1 : 0;
    const day = dayKey(e.timeS);
    const shard = details.get(day) ?? details.set(day, []).get(day)!;
    detail[i] = shard.length;
    shard.push({ place: e.place, headline: e.headline, actors: e.actors, deaths: e.deaths, sources: e.sources, alsoIds: e.alsoIds });
  });

  const bin = new Uint8Array(buf);
  const meta: SnapshotMeta = {
    v: 1,
    n,
    asOfS: opts.asOfS,
    generatedS: opts.generatedS,
    windowFromS: opts.windowFromS ?? (n ? sorted[0]!.timeS : opts.asOfS),
    windowToS: opts.windowToS ?? (n ? Math.max(sorted[n - 1]!.timeS, opts.asOfS) : opts.asOfS),
    countries,
    offsets,
    bytes,
    sha256: createHash('sha256').update(bin).digest('hex'),
    sources: opts.sources,
  };
  return { bin, meta, details };
}
