import { describe, expect, it } from 'vitest';
import { nearbySignals, PRECISION_TEXT } from '../../src/signals/nearby';
import { signalsFixture } from './fixture';

const f = signalsFixture();
const GEN = Date.parse(f.generated) / 1000;
const at = (over: Partial<{ lat: number; lon: number; timeS: number }> = {}) => ({ lat: 12.8, lon: 13.8, timeS: GEN - 3600, ...over });

describe('nearbySignals', () => {
  it('finds a fire cell within 40 km and 2 days, with its distance and detections', () => {
    const n = nearbySignals(f, at());
    expect(n.fires).toHaveLength(1);
    expect(n.fires[0]!.cell.conflictId).toBe('nigeria-is');
    expect(n.fires[0]!.km).toBeGreaterThan(0);
    expect(n.fires[0]!.km).toBeLessThan(40);
    expect(n.state).toBe('found');
  });
  it('ignores a fire cell that is too far or too far apart in time', () => {
    expect(nearbySignals(f, at({ lat: 15, lon: 16 })).fires).toEqual([]);
    expect(nearbySignals(f, at({ timeS: GEN - 4 * 86400 })).fires).toEqual([]);
  });
  it('finds a disaster alert within 300 km and 7 days, and a seismic explosion within 100 km and 3 hours', () => {
    const near = nearbySignals(f, { lat: 14.5, lon: 144.5, timeS: GEN - 3600 });
    expect(near.disasters.map((d) => d.alert.id)).toEqual(['TC1']);
    const quake = nearbySignals(f, { lat: 35.2, lon: 60.3, timeS: GEN - 3600 - 600 });
    expect(quake.seismic).toHaveLength(1);
    expect(nearbySignals(f, { lat: 35.2, lon: 60.3, timeS: GEN - 3600 - 4 * 3600 }).seismic).toEqual([]);
  });
  it('matches a seismic explosion to a human-coded event (dated by day) within a day, without minutes', () => {
    const human = { lat: 35.2, lon: 60.3, timeS: GEN - 3600 - 20 * 3600, human: true };
    const n = nearbySignals(f, human);
    expect(n.seismic).toHaveLength(1);
    expect(n.seismic[0]!.minutes).toBeNull();
    expect(nearbySignals(f, { ...human, human: false }).seismic).toEqual([]); // an auto-coded event has a time of day: 3 hours
  });
  it('says "none" for an event inside the window with nothing near it, and "older" for an event older than the 7-day window', () => {
    expect(nearbySignals(f, at({ lat: -30, lon: 100 })).state).toBe('none');
    expect(nearbySignals(f, at({ timeS: GEN - 9 * 86400 })).state).toBe('older');
  });
  it('is "none" (not an error) for a bad position and for an empty file', () => {
    expect(nearbySignals(f, { lat: Number.NaN, lon: 1, timeS: GEN }).state).toBe('none');
    const empty = { ...f, fires: [], disasters: [], seismic: [], fireTotals: [] };
    expect(nearbySignals(empty, at()).state).toBe('none');
  });
  it('words every precision level of an event', () => {
    for (const p of [1, 2, 3, 4, 5] as const) expect(PRECISION_TEXT[p].length).toBeGreaterThan(5);
    expect(PRECISION_TEXT[5]).toMatch(/region or country/i);
  });
});
