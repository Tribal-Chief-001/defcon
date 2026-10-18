import { latLonToVec3 } from '../lib/geo';
import type { Snapshot } from './snapshot';

export type EventAttrs = {
  position: Float32Array; // xyz on the sphere
  color: Float32Array; // rgb
  size: Float32Array; // base size in px (3 for severity 1 up to 9 for severity 5)
  age: Float32Array; // seconds since the event at build time
  hollow: Float32Array; // 1 = auto-coded (ring), 0 = human-coded (filled)
  phase: Float32Array; // 0..1 per-event offset so ripples do not pulse in unison
  count: number;
};

const ORANGE: [number, number, number] = [1, 0x4d / 255, 0]; // #FF4D00: violence
const BONE: [number, number, number] = [0xed / 255, 0xed / 255, 0xe9 / 255]; // #EDEDE9: protest
// kind index order: armed, civilian, riot, protest, other
const KIND_COLOR = [ORANGE, ORANGE, ORANGE, BONE, BONE];

// Skips events whose coordinates or time are not finite, so no NaN reaches the GPU buffers.
export function buildAttributes(s: Snapshot, radius: number, nowS: number): EventAttrs {
  const position = new Float32Array(s.n * 3);
  const color = new Float32Array(s.n * 3);
  const size = new Float32Array(s.n);
  const age = new Float32Array(s.n);
  const hollow = new Float32Array(s.n);
  const phase = new Float32Array(s.n);
  let c = 0;
  for (let i = 0; i < s.n; i++) {
    const lat = s.lat[i]!;
    const lon = s.lon[i]!;
    const t = s.timeS[i]!;
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || !Number.isFinite(t) || Math.abs(lat) > 90 || Math.abs(lon) > 180) continue;
    const [x, y, z] = latLonToVec3(lat, lon, radius);
    position.set([x, y, z], c * 3);
    color.set(KIND_COLOR[s.kind[i]!] ?? BONE, c * 3);
    size[c] = 3 + (Math.min(5, Math.max(1, s.severity[i]!)) - 1) * 1.5;
    age[c] = Math.max(0, nowS - t);
    hollow[c] = s.human[i] ? 0 : 1;
    phase[c] = ((i * 0.61803398875) % 1 + 1) % 1; // golden-ratio spread
    c++;
  }
  return { position: position.slice(0, c * 3), color: color.slice(0, c * 3), size: size.slice(0, c), age: age.slice(0, c), hollow: hollow.slice(0, c), phase: phase.slice(0, c), count: c };
}
