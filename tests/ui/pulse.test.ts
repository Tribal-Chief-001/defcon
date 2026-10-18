import { describe, expect, it } from 'vitest';
import { decodeSnapshot } from '../../src/events/snapshot';
import { pulseColor, pulsePeriodMs, spikesFor } from '../../src/ui/pulse';
import { encodeSnapshot } from '../../scripts/events/encode';
import type { Ev } from '../../src/events/types';

describe('pulsePeriodMs', () => {
  it('shortens as the event rate rises and clamps to 600..4000 ms', () => {
    expect(pulsePeriodMs(0)).toBe(4000);
    expect(pulsePeriodMs(2)).toBeLessThan(pulsePeriodMs(1));
    expect(pulsePeriodMs(1000)).toBe(600);
    expect(pulsePeriodMs(-5)).toBe(4000);
  });
  it('is 4000 for non-finite rates', () => {
    expect(pulsePeriodMs(NaN)).toBe(4000);
    expect(pulsePeriodMs(Infinity)).toBe(4000);
  });
});

describe('pulseColor', () => {
  it('is exactly lime when the tension is not comparable', () => {
    expect(pulseColor(5, false)).toBe('rgb(214, 255, 87)');
    expect(pulseColor(1, false)).toBe('rgb(214, 255, 87)');
  });
  it('blends lime to orange with the level when comparable', () => {
    expect(pulseColor(1, true)).toBe('rgb(214, 255, 87)');
    expect(pulseColor(5, true)).toBe('rgb(255, 77, 0)');
    expect(pulseColor(3, true)).toBe('rgb(235, 166, 44)');
  });
});

const NOW = Date.UTC(2026, 9, 18, 5) / 1000;
const ev = (i: number, timeS: number): Ev => ({
  id: `e${i}`, source: 'gdelt', alsoIds: [], timeS, lat: 1, lon: 2, precision: 3, country: 'IND', kind: 'armed', deaths: null, severity: 2, human: false,
  place: '', headline: '', actors: '', sources: [], firstSeenS: timeS, updatedS: timeS,
});
const snap = (events: Ev[], asOfS: number, tag: string) => {
  const e = encodeSnapshot(events, { asOfS, generatedS: asOfS, sources: [{ id: 'gdelt', name: tag, version: tag, asOfS, url: 'https://x', license: 'x' }] });
  return decodeSnapshot(e.bin.buffer.slice(e.bin.byteOffset, e.bin.byteOffset + e.bin.byteLength) as ArrayBuffer, e.meta);
};

describe('spikesFor', () => {
  const prev = snap([ev(1, NOW - 600)], NOW - 900, 'a');
  it('is 0 for the first load and for an unchanged snapshot', () => {
    expect(spikesFor(undefined, prev)).toBe(0);
    expect(spikesFor(prev, prev)).toBe(0);
  });
  it('counts the events newer than the previous snapshot when the snapshot changed', () => {
    const next = snap([ev(1, NOW - 600), ev(2, NOW - 100), ev(3, NOW - 50), ev(4, NOW - 10)], NOW, 'b');
    expect(spikesFor(prev, next)).toBe(3);
  });
  it('caps at 12', () => {
    const many = snap(Array.from({ length: 30 }, (_, i) => ev(i, NOW - i)), NOW, 'c');
    expect(spikesFor(prev, many)).toBe(12);
  });
});
