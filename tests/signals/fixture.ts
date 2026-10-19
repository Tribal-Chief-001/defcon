import type { SignalsFile } from '../../src/signals/types';

const T = Date.UTC(2026, 9, 19, 6) / 1000;
export const signalsFixture = (): SignalsFile => ({
  generated: '2026-10-19T06:34:29.000Z',
  windows: { seismicDays: 7, disasterDays: 7, fireHours: 24 },
  sources: [
    { id: 'usgs', name: 'USGS earthquake feed (explosion-type events)', ok: true, count: 1, fetchedS: T, licence: 'Public domain (U.S. Government work)', attribution: 'U.S. Geological Survey', url: 'https://earthquake.usgs.gov/earthquakes/feed/' },
    { id: 'gdacs', name: 'GDACS disaster alerts (Orange and Red)', ok: true, count: 2, fetchedS: T, licence: 'CC BY 4.0 (European Union); credit to GDACS', attribution: 'Global Disaster Alert and Coordination System (GDACS)', url: 'https://www.gdacs.org/' },
    { id: 'firms', name: 'NASA FIRMS thermal anomalies (VIIRS 375 m, last 24 hours)', ok: true, count: 3, fetchedS: T, licence: 'NASA open data; acknowledgement requested', attribution: "NASA's Fire Information for Resource Management System (FIRMS), part of NASA's LANCE and ESDIS", url: 'https://firms.modaps.eosdis.nasa.gov/' },
  ],
  seismic: [{ id: 'us1', time: T - 3600, lat: 35.1, lon: 60.2, mag: 3.4, type: 'explosion', place: '12 km N of Somewhere', url: 'https://earthquake.usgs.gov/earthquakes/eventpage/us1' }],
  disasters: [
    { id: 'TC1', time: T - 7200, lat: 14, lon: 144, kind: 'TC', alert: 'Red', title: 'Red notification for tropical cyclone TEST-26', country: 'Guam', url: 'https://www.gdacs.org/report.aspx?eventtype=TC&eventid=1' },
    { id: 'DR2', time: T - 86400, lat: 0, lon: 20, kind: 'DR', alert: 'Orange', title: 'Drought is on going in Testland', country: 'Testland', url: 'https://www.gdacs.org/report.aspx?eventtype=DR&eventid=2' },
  ],
  fires: [
    { lat: 12.75, lon: 13.75, count: 182, frp: 112.5, latestS: T - 1800, conflictId: 'nigeria-is', conflict: 'Nigeria: Islamic State' },
    { lat: 13.25, lon: 13.25, count: 40, frp: 30, latestS: T - 3600, conflictId: 'nigeria-is', conflict: 'Nigeria: Islamic State' },
    { lat: 14.25, lon: 31.75, count: 90, frp: 55, latestS: T - 900, conflictId: 'sudan', conflict: 'Sudan: Government' },
  ],
});
