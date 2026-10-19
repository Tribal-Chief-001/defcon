import { MAX_BACK_S } from '../time/store';
import { formatHash } from './hashState';

// The address of what is on screen: the open country or conflict and, when time travel is on, the moment of the playhead as an absolute
// time (so the link means the same later). Nothing open and live gives the plain address.
export function shareUrl(o: { origin: string; pathname: string; id: string | null; about: boolean; war: string | null; backS: number; nowS: number }): string {
  const t = Number.isFinite(o.backS) && o.backS > 0 ? o.nowS - o.backS : undefined;
  return `${o.origin}${o.pathname}${formatHash(o.id, o.about, o.war, t)}`;
}

// how far before now a shared moment lies (0 for the present, the future or garbage; capped at the 365-day archive)
export const backFromMoment = (t: number, nowS: number): number => (Number.isFinite(t) && nowS > t ? Math.min(MAX_BACK_S, nowS - t) : 0);
