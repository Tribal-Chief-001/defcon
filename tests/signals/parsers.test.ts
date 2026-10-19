import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { aggregateFires, cellKey, parseFirmsCsv } from '../../scripts/signals/firms';
import { parseGdacsRss } from '../../scripts/signals/gdacs';
import { parseUsgs } from '../../scripts/signals/usgs';

const fx = (n: string) => readFileSync(`tests/fixtures/signals/${n}`, 'utf8');

describe('parseUsgs', () => {
  it('keeps explosion-type events and drops earthquakes and industrial blasts, with seconds, coordinates and an https link', () => {
    const out = parseUsgs(JSON.parse(fx('usgs.geojson')));
    expect(out.length).toBe(2); // the fixture has 2 earthquakes, 2 explosions and 1 quarry blast
    for (const s of out) {
      expect(s.type).toBe('explosion');
      expect(Number.isFinite(s.lat) && Math.abs(s.lat) <= 90 && Number.isFinite(s.lon) && Math.abs(s.lon) <= 180).toBe(true);
      expect(s.time).toBeGreaterThan(1.7e9); // seconds, not milliseconds
      expect(s.time).toBeLessThan(1e11);
      expect(s.url).toMatch(/^https:\/\/earthquake\.usgs\.gov\//);
      expect(s.id.length).toBeGreaterThan(3);
    }
  });
  it('survives odd input: null magnitude, a missing geometry, a non-object, not a feature collection', () => {
    const f = (p: object, g: unknown) => ({ type: 'Feature', id: 'x1', properties: { type: 'explosion', time: 1.79e12, place: 'p', url: 'https://earthquake.usgs.gov/e', ...p }, geometry: g });
    expect(parseUsgs({ features: [f({ mag: null }, { coordinates: [10, 20, 5] })] })[0]!.mag).toBeNull();
    expect(parseUsgs({ features: [f({}, null), f({}, { coordinates: ['a', 1] }), null, 7, f({ time: 'x' }, { coordinates: [1, 2, 3] })] })).toEqual([]);
    expect(parseUsgs(null)).toEqual([]);
    expect(parseUsgs({ features: 'x' })).toEqual([]);
    expect(parseUsgs('<html>')).toEqual([]);
  });
  it('drops a link that is not https on usgs.gov (the link is shown to people)', () => {
    const f = { type: 'Feature', id: 'y', properties: { type: 'explosion', time: 1.79e12, place: 'p', url: 'javascript:alert(1)' }, geometry: { coordinates: [1, 2, 3] } };
    expect(parseUsgs({ features: [f] })[0]!.url).toBe('https://earthquake.usgs.gov/earthquakes/eventpage/y');
  });
});

describe('parseGdacsRss', () => {
  it('keeps Orange and Red alerts only, with kind, country, time and an https gdacs.org link', () => {
    const out = parseGdacsRss(fx('gdacs.xml'));
    expect(out.length).toBe(2);
    expect(out.map((d) => d.alert).sort()).toEqual(['Orange', 'Red']);
    for (const d of out) {
      expect(d.kind).toMatch(/^[A-Z]{2}$/);
      expect(Number.isFinite(d.lat) && Number.isFinite(d.lon)).toBe(true);
      expect(d.time).toBeGreaterThan(1.7e9);
      expect(d.url).toMatch(/^https:\/\/www\.gdacs\.org\//);
      expect(d.title.length).toBeGreaterThan(5);
      expect(d.title).not.toMatch(/&amp;|&lt;/);
    }
  });
  it('returns [] for HTML or garbage instead of an XML feed, and skips an item without a point', () => {
    expect(parseGdacsRss('<!doctype html><html><body>Service unavailable</body></html>')).toEqual([]);
    expect(parseGdacsRss('')).toEqual([]);
    expect(parseGdacsRss('<rss><channel><item><title>x</title><gdacs:alertlevel>Red</gdacs:alertlevel></item></channel></rss>')).toEqual([]);
  });
  it('drops a link that is not https on gdacs.org', () => {
    const item = (link: string) => `<rss><channel><item><title>Red flood in X</title><link>${link}</link><gdacs:eventtype>FL</gdacs:eventtype><gdacs:eventid>9</gdacs:eventid><gdacs:alertlevel>Red</gdacs:alertlevel><gdacs:country>X</gdacs:country><gdacs:fromdate>Mon, 19 Oct 2026 05:18:36 GMT</gdacs:fromdate><geo:Point><geo:lat>1</geo:lat><geo:long>2</geo:long></geo:Point></item></channel></rss>`;
    expect(parseGdacsRss(item('http://evil.example/x'))[0]!.url).toBe('https://www.gdacs.org/report.aspx?eventtype=FL&eventid=9');
  });
});

describe('parseFirmsCsv', () => {
  it('keeps high and nominal confidence detections with a UTC time and the radiative power, and drops low confidence', () => {
    const out = parseFirmsCsv(fx('firms.csv'));
    expect(out.length).toBe(5); // 6 rows, 1 low
    expect(out[0]).toMatchObject({ lat: expect.any(Number), lon: expect.any(Number), frp: expect.any(Number) });
    expect(out.every((d) => d.time > 1.7e9 && d.time < 1e11 && Number.isFinite(d.frp))).toBe(true);
    // 2026-10-18 03:36 UTC
    expect(out[0]!.time).toBe(Date.UTC(2026, 9, 18, 3, 36) / 1000);
  });
  it('skips bad rows and returns [] without the expected header', () => {
    const hdr = 'latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,confidence,version,bright_ti5,frp,daynight';
    expect(parseFirmsCsv(`${hdr}\nx,10,300,0.4,0.4,2026-10-18,0336,N,nominal,2.0NRT,270,3.1,N\n95,10,300,0.4,0.4,2026-10-18,0336,N,nominal,2.0NRT,270,3.1,N\n10,10,300,0.4,0.4,2026-13-18,0336,N,nominal,2.0NRT,270,3.1,N\n10,10,300,0.4,0.4,2026-10-18,0336,N,h,2.0NRT,270,3.1,N`).length).toBe(1);
    expect(parseFirmsCsv('<html>not a csv</html>')).toEqual([]);
    expect(parseFirmsCsv('')).toEqual([]);
  });
});

describe('aggregateFires', () => {
  const conflicts = [{ id: 'c1', name: 'Conflict One', cells: [[48.25, 37.25, 100]] as [number, number, number][] }];
  const det = (lat: number, lon: number, frp = 2, time = 1.79e9) => ({ lat, lon, frp, time });
  it('counts detections per 0.5-degree cell inside or next to a conflict cell and ignores the rest of the world', () => {
    const out = aggregateFires([det(48.3, 37.3, 5, 100), det(48.4, 37.4, 9, 200), det(48.8, 37.3, 1, 150), det(10, 10)], conflicts);
    expect(out.length).toBe(2); // the cell itself and the next cell north (neighbour); the point at 10,10 is far away
    const here = out.find((c) => c.lat === 48.25)!;
    expect(here).toMatchObject({ count: 2, frp: 9, latestS: 200, conflictId: 'c1', conflict: 'Conflict One', lon: 37.25 });
  });
  it('wraps over the antimeridian and does not run off the poles', () => {
    const edge = [{ id: 'e', name: 'Edge', cells: [[10.25, 179.75, 5]] as [number, number, number][] }];
    expect(aggregateFires([det(10.3, -179.8)], edge).length).toBe(1);
    const pole = [{ id: 'p', name: 'Pole', cells: [[89.75, 0.25, 5]] as [number, number, number][] }];
    expect(() => aggregateFires([det(89.99, 0.3), det(90, 180)], pole)).not.toThrow();
  });
  it('sorts by detections, applies the cap after sorting, and gives nothing for no conflict cells', () => {
    const many = [{ id: 'm', name: 'M', cells: [[0.25, 0.25, 5]] as [number, number, number][] }];
    const out = aggregateFires([det(0.3, 0.3), det(0.3, 0.3), det(0.3, 0.3), det(0.8, 0.3), det(0.8, 0.3), det(-0.2, 0.3)], many, 2);
    expect(out.map((c) => c.count)).toEqual([3, 2]);
    expect(aggregateFires([det(0.3, 0.3)], [])).toEqual([]);
  });
  it('has a stable cell key', () => {
    expect(cellKey(48.3, 37.3)).toBe(cellKey(48.49, 37.01));
    expect(cellKey(48.3, 37.3)).not.toBe(cellKey(48.6, 37.3));
  });
});
