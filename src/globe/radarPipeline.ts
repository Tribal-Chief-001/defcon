import { pickEvent } from '../events/pickEvent';
import type { Snapshot } from '../events/snapshot';
import { formatReadout, radarBus, snapTarget } from './radar';

const SNAP_PX = 28;

const km = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const dLat = (lat2 - lat1) * 111.195;
  const dLon = (((lon2 - lon1 + 540) % 360) - 180) * 111.195 * Math.cos((lat1 * Math.PI) / 180);
  return Math.hypot(dLat, dLon);
};

type Project = (lat: number, lon: number) => { x: number; y: number; visible: boolean } | null;

// Turns a cursor position over the globe into what the reticle shows: where it sits (snapped to the nearest visible event within
// 28 px, never while dragging) and its readout.
export function makeRadarHandler(project: Project, snapshots: () => { recent?: Snapshot; archive?: Snapshot }) {
  return (c: { x: number; y: number; lat: number; lon: number } | null, kmPerPx: number, dragging: boolean) => {
    if (!c) return radarBus.emit(null);
    let target: ReturnType<typeof snapTarget> = null;
    if (!dragging) {
      const { recent, archive } = snapshots();
      const hit = pickEvent(recent, archive, c.lat, c.lon, SNAP_PX * kmPerPx);
      if (hit) {
        const { snapshot: s, index: i } = hit;
        const p = project(s.lat[i]!, s.lon[i]!);
        if (p?.visible) target = snapTarget(c, [{ x: p.x, y: p.y, km: km(c.lat, c.lon, s.lat[i]!, s.lon[i]!) }], SNAP_PX);
      }
    }
    radarBus.emit({ x: target?.x ?? c.x, y: target?.y ?? c.y, readout: formatReadout(c.lat, c.lon, target?.km ?? null), snapped: target !== null });
  };
}
