// How old the key-events timeline is: whole days from its `checkedAt` date to now (NaN for a malformed date).
// npm run data:timeline-age [-- --max-days 45]   exits 1 when older than the limit (the monthly workflow uses this; the owner is emailed)
import { readFileSync } from 'node:fs';

export function ageDays(checkedAt: string, nowS: number): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(checkedAt);
  if (!m) return Number.NaN;
  return Math.floor((nowS - Date.UTC(+m[1]!, +m[2]! - 1, +m[3]!) / 1000) / 86400);
}

if (process.argv[1]?.endsWith('age.ts')) {
  const i = process.argv.indexOf('--max-days');
  const max = i > 0 ? Number(process.argv[i + 1]) : 45;
  const tl = JSON.parse(readFileSync('public/data/timeline.json', 'utf8')) as { checkedAt: string };
  const age = ageDays(tl.checkedAt, Date.now() / 1000);
  console.log(`timeline checked ${tl.checkedAt}: ${age} days ago (limit ${max})`);
  if (!(age <= max)) {
    console.error('the timeline is out of date: re-read the sources and update public/data/timeline.json (see docs/DATA-SOURCES.md)');
    process.exit(1);
  }
}
