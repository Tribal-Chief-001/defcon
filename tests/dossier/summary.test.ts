import { describe, expect, it } from 'vitest';
import { countrySummary } from '../../src/dossier/summary';
import { decodeSnapshot, type Snapshot } from '../../src/events/snapshot';
import { KINDS, type Ev } from '../../src/events/types';
import { encodeSnapshot } from '../../scripts/events/encode';

const DAY = 86400;
const NOW = Date.UTC(2026, 9, 18, 15, 0, 0) / 1000;
const TODAY = Math.floor(NOW / DAY) * DAY;
let n = 0;
const ev = (o: Partial<Ev> = {}): Ev => ({
  id: `e${++n}`, source: 'ucdp', alsoIds: [], timeS: TODAY + 100, lat: 10, lon: 20, precision: 1, country: 'IND', kind: 'armed', deaths: 1, severity: 2, human: true,
  place: '', headline: '', actors: '', sources: [], firstSeenS: NOW, updatedS: NOW, ...o,
});
const snap = (events: Ev[], asOfS = NOW): Snapshot => {
  const e = encodeSnapshot(events, { asOfS, generatedS: asOfS, sources: [] });
  return decodeSnapshot(e.bin.buffer.slice(e.bin.byteOffset, e.bin.byteOffset + e.bin.byteLength) as ArrayBuffer, e.meta);
};

describe('countrySummary', () => {
  const s = snap([
    ev({ timeS: TODAY + 10 }), // today, armed, human
    ev({ timeS: TODAY - DAY + 10, kind: 'protest', human: false, lat: 11 }), // yesterday
    ev({ timeS: TODAY - 29 * DAY + 5, kind: 'riot', human: false, lat: 12 }), // oldest bin
    ev({ timeS: TODAY - 30 * DAY - 5, lat: 13 }), // too old
    ev({ country: 'PAK', lat: 14 }), // other country
    ev({ timeS: NOW + 3600, lat: 15 }), // after now
  ]);
  const r = countrySummary([s], 'IND', NOW);

  it('counts the last 30 UTC days for the country, by kind and by coding', () => {
    expect(r.total).toBe(3);
    expect(r.byKind).toMatchObject({ armed: 1, protest: 1, riot: 1, civilian: 0, other: 0 });
    expect(r.human).toBe(1);
    expect(r.auto).toBe(2);
    for (const k of KINDS) expect(typeof r.byKind[k]).toBe('number');
  });
  it('bins by UTC day, oldest first, 30 bins ending today', () => {
    expect(r.daily).toHaveLength(30);
    expect(r.daily[29]).toBe(1);
    expect(r.daily[28]).toBe(1);
    expect(r.daily[0]).toBe(1);
    expect(r.daily.reduce((a, b) => a + b, 0)).toBe(3);
    expect(r.peakDay).toBe(1);
  });
  it('returns zeros and 30 empty bins for an unknown country', () => {
    const z = countrySummary([s], 'ZZZ', NOW);
    expect(z.total).toBe(0);
    expect(z.daily).toEqual(Array(30).fill(0));
    expect(z.peakDay).toBe(0);
  });
  it('handles no snapshots at all, with tension null', () => {
    const z = countrySummary([undefined, undefined], 'IND', NOW);
    expect(z.total).toBe(0);
    expect(z.tension).toBeNull();
    expect(z.daily).toHaveLength(30);
  });
  it('does not count an event twice when it is present in both recent and archive (boundary day)', () => {
    const shared = ev({ timeS: TODAY - 5 * DAY, lat: 20 });
    const a = snap([shared]);
    const b = snap([shared]);
    expect(countrySummary([a, b], 'IND', NOW).total).toBe(1);
  });
  it('still counts two different events that share a time', () => {
    const t = TODAY - 2 * DAY;
    expect(countrySummary([snap([ev({ timeS: t, lat: 1 }), ev({ timeS: t, lat: 2 })])], 'IND', NOW).total).toBe(2);
  });
  it('passes the tension result through, including its comparable flag, from the newest snapshot', () => {
    const older = snap([ev()], NOW - 1000);
    const newer = snap([ev({ human: false })], NOW);
    const r2 = countrySummary([older, newer], 'IND', NOW);
    expect(r2.tension).not.toBeNull();
    expect(r2.tension!.comparable).toBe(false); // the newest snapshot only has an auto-coded event
    expect(countrySummary([newer, older], 'IND', NOW).tension!.comparable).toBe(false);
  });
});
