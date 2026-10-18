// One-off: prints the TENSION.scale that maps the median 7-day global score of the UCDP archive to 2.5 (the middle of level 2-3).
// Usage: npx tsx scripts/events/calibrate-tension.ts   (needs npm run data:build first)
import { readFileSync } from 'node:fs';
import { decodeSnapshot, type SnapshotMeta } from '../../src/events/snapshot';
import { TENSION, tension } from '../../src/events/tension';

const DAY = 86400;
const meta = JSON.parse(readFileSync('public/data/events/archive.meta.json', 'utf8')) as SnapshotMeta;
const b = readFileSync('public/data/events/archive.bin');
const archive = decodeSnapshot(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer, meta);
// Only days up to the newest event: UCDP data ends before the archive window does, and an empty tail would skew the median.
const lastEvent = Math.max(...archive.timeS);
const scores: number[] = [];
for (let t = meta.windowFromS + TENSION.windowDays * DAY; t <= lastEvent; t += DAY) scores.push(tension(archive, t).score);
scores.sort((x, y) => x - y);
const median = scores[scores.length >> 1]!;
const q = (p: number) => scores[Math.floor(p * (scores.length - 1))]!;
// level value 2.5 = 1 + 4 * (1 - exp(-m / scale))  =>  scale = m / -ln(1 - 0.375)
const scale = median / -Math.log(1 - 0.375);
console.log(JSON.stringify({ days: scores.length, windowFrom: new Date(meta.windowFromS * 1000).toISOString().slice(0, 10), windowTo: new Date(lastEvent * 1000).toISOString().slice(0, 10), min: q(0), p25: q(0.25), median, p75: q(0.75), max: q(1), scale: Math.round(scale) }));
