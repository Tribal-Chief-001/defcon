import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { decodeSnapshot, dayKey, verifySnapshotHash } from '../../src/events/snapshot';
import { encodeSnapshot } from '../../scripts/events/encode';
import type { Ev } from '../../src/events/types';

const T0 = Date.UTC(2026, 9, 18, 12, 0, 0) / 1000;
const ev = (o: Partial<Ev> & { id: string }): Ev => ({
  source: 'ucdp', alsoIds: [], timeS: T0, lat: 10, lon: 20, precision: 1, country: 'IND', kind: 'armed', deaths: 3,
  severity: 2, human: true, place: 'P', headline: 'H', actors: 'A', sources: [{ name: 'S' }], firstSeenS: T0, updatedS: T0, ...o,
});
const sources = [{ id: 'ucdp' as const, name: 'UCDP', version: '26.1', asOfS: T0, url: 'https://ucdp.uu.se', license: 'CC BY 4.0' }];
const opts = { asOfS: T0, generatedS: T0 + 5, sources };
const toBuf = (u: Uint8Array) => u.buffer.slice(u.byteOffset, u.byteOffset + u.byteLength) as ArrayBuffer;

const events: Ev[] = [
  ev({ id: 'b', timeS: T0 + 100, lat: -33.9, lon: 151.2, country: 'AUS', kind: 'protest', human: false, severity: 1, precision: 4, deaths: null, place: 'Sydney' }),
  ev({ id: 'a', timeS: T0, lat: 28.6139, lon: 77.209, country: 'IND', kind: 'civilian', severity: 3, deaths: 7, place: 'Delhi' }),
  ev({ id: 'c', timeS: T0 + 86400 + 5, lat: 0, lon: -140, country: null, kind: 'riot', human: false, severity: 2, precision: 5, deaths: null, place: 'Open water' }),
  ev({ id: 'd', timeS: T0 + 100, lat: 5, lon: 6, country: 'NGA', kind: 'other', severity: 1 }),
  ev({ id: 'e', timeS: T0 + 200, lat: 90, lon: 180, country: 'ATA', kind: 'armed', severity: 5, deaths: 500 }),
];

describe('encodeSnapshot / decodeSnapshot', () => {
  const { bin, meta, details } = encodeSnapshot(events, opts);
  const snap = decodeSnapshot(toBuf(bin), meta);

  it('sorts by time then id and keeps every column', () => {
    expect(snap.n).toBe(5);
    expect([...snap.timeS]).toEqual([T0, T0 + 100, T0 + 100, T0 + 200, T0 + 86400 + 5]);
    const order = ['a', 'b', 'd', 'e', 'c'];
    const sorted = order.map((id) => events.find((e) => e.id === id)!);
    sorted.forEach((e, i) => {
      expect(Math.abs(snap.lat[i]! - e.lat)).toBeLessThan(1e-5);
      expect(Math.abs(snap.lon[i]! - e.lon)).toBeLessThan(1e-5);
      expect(snap.kind[i]).toBe(['armed', 'civilian', 'riot', 'protest', 'other'].indexOf(e.kind));
      expect(snap.severity[i]).toBe(e.severity);
      expect(snap.precision[i]).toBe(e.precision);
      expect(snap.human[i]).toBe(e.human ? 1 : 0);
      expect(snap.countries[snap.country[i]!]).toBe(e.country ?? '');
    });
  });
  it('maps a null country to index 0 (empty name)', () => {
    expect(snap.countries[0]).toBe('');
    expect(snap.country[4]).toBe(0);
  });
  it('writes day shards whose entries match detailIdx', () => {
    const idx = 1; // event b
    const d = details.get(dayKey(snap.timeS[idx]!))![snap.detailIdx[idx]!]!;
    expect(d.place).toBe('Sydney');
    expect(details.get(dayKey(T0 + 86400 + 5))![0]!.place).toBe('Open water');
    expect(dayKey(T0)).toBe('2026-10-18');
  });
  it('records byte length and the SHA-256 of the binary', () => {
    expect(meta.bytes).toBe(bin.length);
    expect(meta.sha256).toBe(createHash('sha256').update(bin).digest('hex'));
    expect(meta.n).toBe(5);
    expect(meta.windowToS).toBeGreaterThanOrEqual(T0 + 86400);
  });
  it('pads every column to 4 bytes', () => {
    for (const off of Object.values(meta.offsets)) expect(off % 4).toBe(0);
  });
  it('throws a snapshot error when the buffer is truncated by 1 byte', () => {
    expect(() => decodeSnapshot(toBuf(bin.slice(0, bin.length - 1)), meta)).toThrow(/snapshot/);
  });
  it('throws when the declared count does not match the buffer', () => {
    expect(() => decodeSnapshot(toBuf(bin), { ...meta, n: meta.n + 1 })).toThrow(/snapshot/);
  });
  it('verifies the hash: true for the right data, false when a byte changes', async () => {
    expect(await verifySnapshotHash(toBuf(bin), meta)).toBe(true);
    const bad = bin.slice();
    bad[0] = bad[0]! ^ 0xff;
    expect(await verifySnapshotHash(toBuf(bad), meta)).toBe(false);
  });
  it('encodes and decodes an empty snapshot', () => {
    const e = encodeSnapshot([], opts);
    const s = decodeSnapshot(toBuf(e.bin), e.meta);
    expect(s.n).toBe(0);
    expect(s.timeS.length).toBe(0);
  });
});
