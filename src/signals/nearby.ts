import { distanceKm } from '../globe/warGeometry';
import type { DisasterSignal, FireCell, SeismicSignal, SignalsFile } from './types';

// What the Signals feed has near one event, as context for its evidence trail. Matching radii and time windows are deliberately small:
// a fire cell within 40 km and 2 days, a seismic explosion within 100 km and 3 hours, a disaster alert within 300 km and 7 days.
// Nothing here confirms an event, and an empty result proves nothing either way.
export type Nearby = {
  state: 'found' | 'none' | 'older';
  fires: { cell: FireCell; km: number }[];
  disasters: { alert: DisasterSignal; km: number }[];
  seismic: { event: SeismicSignal; km: number; minutes: number }[];
};

export const PRECISION_TEXT: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'an exact place',
  2: 'a place within about 25 km',
  3: 'a district',
  4: 'a province or state',
  5: 'only a region or country',
};

const DAY = 86400;

export function nearbySignals(f: SignalsFile, ev: { lat: number; lon: number; timeS: number }): Nearby {
  const none: Nearby = { state: 'none', fires: [], disasters: [], seismic: [] };
  if (![ev.lat, ev.lon, ev.timeS].every(Number.isFinite)) return none;
  const built = Date.parse(f.generated) / 1000;
  if (ev.timeS < built - f.windows.seismicDays * DAY) return { ...none, state: 'older' }; // the feeds cannot speak about it
  const km = (p: { lat: number; lon: number }) => distanceKm(ev, p);
  const fires = f.fires.map((cell) => ({ cell, km: km(cell) })).filter((x) => x.km <= 40 && Math.abs(ev.timeS - x.cell.latestS) <= 2 * DAY).sort((a, b) => a.km - b.km);
  const disasters = f.disasters.map((alert) => ({ alert, km: km(alert) })).filter((x) => x.km <= 300 && Math.abs(ev.timeS - x.alert.time) <= 7 * DAY).sort((a, b) => a.km - b.km);
  const seismic = f.seismic.map((event) => ({ event, km: km(event), minutes: Math.round(Math.abs(ev.timeS - event.time) / 60) })).filter((x) => x.km <= 100 && x.minutes <= 180).sort((a, b) => a.km - b.km);
  return { state: fires.length + disasters.length + seismic.length > 0 ? 'found' : 'none', fires, disasters, seismic };
}
