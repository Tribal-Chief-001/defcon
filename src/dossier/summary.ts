import type { Snapshot } from '../events/snapshot';
import { tension } from '../events/tension';
import { KINDS, type Kind } from '../events/types';

const DAY = 86400;

export type CountrySummary = {
  total: number;
  byKind: Record<Kind, number>;
  human: number;
  auto: number;
  daily: number[]; // 30 UTC days, oldest first, the last bin is the day of nowS
  peakDay: number;
  tension: ReturnType<typeof tension> | null; // from the newest snapshot only
};

// Events of one country in the last 30 UTC days across snapshots; an event present in two snapshots (the boundary day) counts once.
export function countrySummary(snaps: (Snapshot | undefined)[], countryId: string, nowS: number): CountrySummary {
  const from = Math.floor(nowS / DAY) * DAY - 29 * DAY;
  const byKind = Object.fromEntries(KINDS.map((k) => [k, 0])) as Record<Kind, number>;
  const daily = Array<number>(30).fill(0);
  const seen = new Set<string>();
  let human = 0;
  let auto = 0;
  let total = 0;
  const present = snaps.filter((s): s is Snapshot => !!s);
  for (const s of present) {
    for (let i = 0; i < s.n; i++) {
      const t = s.timeS[i]!;
      if (t < from || t > nowS || s.countries[s.country[i]!] !== countryId) continue;
      const key = `${t}|${s.lat[i]}|${s.lon[i]}|${s.kind[i]}`;
      if (seen.has(key)) continue;
      seen.add(key);
      total++;
      byKind[KINDS[s.kind[i]!] ?? 'other']++;
      if (s.human[i]) human++;
      else auto++;
      daily[Math.min(29, Math.floor((t - from) / DAY))]!++;
    }
  }
  const newest = present.reduce<Snapshot | undefined>((a, s) => (!a || s.meta.asOfS > a.meta.asOfS ? s : a), undefined);
  return { total, byKind, human, auto, daily, peakDay: Math.max(0, ...daily), tension: newest ? tension(newest, nowS, { country: countryId }) : null };
}
