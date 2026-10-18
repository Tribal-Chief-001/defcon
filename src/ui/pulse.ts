import type { Snapshot } from '../events/snapshot';

const LIME: [number, number, number] = [0xd6, 0xff, 0x57];
const ORANGE: [number, number, number] = [0xff, 0x4d, 0x00];

// Heartbeat period: quicker as more events arrive per hour, between 600 ms and 4 s.
export function pulsePeriodMs(eventsPerHour: number): number {
  if (!Number.isFinite(eventsPerHour) || eventsPerHour <= 0) return 4000;
  return Math.max(600, Math.min(4000, 4000 / (1 + eventsPerHour / 2)));
}

// Lime to orange with the tension level; lime when the tension is not comparable (D-031: never imply a measure we do not have).
export function pulseColor(level: 1 | 2 | 3 | 4 | 5, comparable: boolean): string {
  const t = comparable ? (Math.max(1, Math.min(5, level)) - 1) / 4 : 0;
  const [r, g, b] = LIME.map((c, i) => Math.round(c + (ORANGE[i]! - c) * t));
  return `rgb(${r}, ${g}, ${b})`;
}

// How many spikes a snapshot refresh should raise: events newer than the newest event of the previous snapshot, at most 12; none on the first load or
// when the snapshot did not change.
export function spikesFor(prev: Snapshot | undefined, next: Snapshot): number {
  if (!prev || prev.meta.sha256 === next.meta.sha256) return 0;
  let newest = 0;
  for (let i = 0; i < prev.n; i++) newest = Math.max(newest, prev.timeS[i]!);
  let n = 0;
  for (let i = 0; i < next.n; i++) if (next.timeS[i]! > newest) n++;
  return Math.min(12, n);
}
