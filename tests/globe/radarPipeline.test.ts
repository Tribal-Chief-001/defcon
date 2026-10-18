import { afterEach, describe, expect, it } from 'vitest';
import { decodeSnapshot } from '../../src/events/snapshot';
import { encodeSnapshot } from '../../scripts/events/encode';
import { makeRadarHandler } from '../../src/globe/radarPipeline';
import { radarBus, type RadarView } from '../../src/globe/radar';
import type { Ev } from '../../src/events/types';

const NOW = Date.UTC(2026, 9, 18, 5) / 1000;
const ev = (lat: number, lon: number): Ev => ({
  id: `e${lat}${lon}`, source: 'ucdp', alsoIds: [], timeS: NOW - 3600, lat, lon, precision: 1, country: 'IND', kind: 'armed', deaths: 1, severity: 2, human: true,
  place: '', headline: '', actors: '', sources: [], firstSeenS: NOW, updatedS: NOW,
});
const snap = (events: Ev[]) => {
  const e = encodeSnapshot(events, { asOfS: NOW, generatedS: NOW, sources: [] });
  return decodeSnapshot(e.bin.buffer.slice(e.bin.byteOffset, e.bin.byteOffset + e.bin.byteLength) as ArrayBuffer, e.meta);
};
const seen: (RadarView | null)[] = [];
radarBus.subscribe((v) => seen.push(v));
afterEach(() => (seen.length = 0));

const project = (visible = true) => (lat: number, lon: number) => ({ x: lon * 10, y: lat * 10, visible });
const run = (opts: { visible?: boolean; dragging?: boolean; events?: Ev[] } = {}) => {
  const handler = makeRadarHandler(project(opts.visible ?? true), () => ({ recent: snap(opts.events ?? [ev(10, 20)]), archive: undefined }));
  handler({ x: 201, y: 101, lat: 10.1, lon: 20.1 }, 11, opts.dragging ?? false); // 1.1 px of cursor distance each axis: inside the snap radius
  return seen.at(-1);
};

describe('makeRadarHandler', () => {
  it('snaps to the nearest event within 28 px and reports the distance in km', () => {
    const v = run()!;
    expect(v.snapped).toBe(true);
    expect(v.x).toBe(200);
    expect(v.y).toBe(100);
    expect(v.readout).toMatch(/^10\.10N 20\.10E \/\/ EVENT \d+ KM$/);
  });
  it('does not snap while dragging, to a hidden (far side) event, or when there is none near', () => {
    expect(run({ dragging: true })!.snapped).toBe(false);
    expect(run({ visible: false })!.snapped).toBe(false);
    expect(run({ events: [ev(60, 120)] })!.snapped).toBe(false);
    expect(run({ events: [] })!.readout).toBe('10.10N 20.10E');
  });
  it('hides the reticle when the cursor leaves the globe', () => {
    makeRadarHandler(project(), () => ({ recent: undefined, archive: undefined }))(null, 11, false);
    expect(seen.at(-1)).toBeNull();
  });
});
