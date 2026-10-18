import type { Ev, EventSource } from '../../src/events/types';

const DAY = 86400;
const MAX_SOURCES = 5; // sources kept on a merged GDELT event
const FOLD_SOURCES = 3; // GDELT sources added to a UCDP event it is folded into
const FOLD_DEG = 0.3;
const FOLD_DAYS = 2; // GDELT time is when an event was first reported, up to 2 days after it happened
const ARTICLE_DEG = 1; // the same article only merges events this close ...
const ARTICLE_DAYS = 1; // ... and this many days apart
const CELL = 0.5;

const valid = (e: Ev) =>
  Number.isFinite(e.lat) && Number.isFinite(e.lon) && Number.isFinite(e.timeS) && Math.abs(e.lat) <= 90 && Math.abs(e.lon) <= 180;
const dayOf = (e: Ev) => Math.floor(e.timeS / DAY);
const r2 = (x: number) => Math.round(x * 100) / 100;
const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
const violent = (k: Ev['kind']) => k === 'armed' || k === 'civilian';

// host + path of a source URL, without query or fragment, so the same article under different tracking parameters matches.
const URL_RE = /^https?:\/\/(?:www\.)?([^/?#:]+)(?::\d+)?([^?#]*)/i;
// null for a homepage-style URL (empty or "/" path): it identifies no single article.
const articleKey = (url?: string): string | null => {
  const m = url ? URL_RE.exec(url) : null;
  if (!m || m[2] === '' || m[2] === '/') return null;
  return (m[1]! + m[2]!).toLowerCase();
};

const uniqSources = (list: EventSource[], max: number): EventSource[] => {
  const seen = new Set<string>();
  const out: EventSource[] = [];
  for (const s of list) {
    const k = s.url ?? s.name;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(s);
    if (out.length === max) break;
  }
  return out;
};

const nearby = (a: Ev, b: Ev) => Math.abs(a.lat - b.lat) <= ARTICLE_DEG && Math.abs(a.lon - b.lon) <= ARTICLE_DEG && Math.abs(dayOf(a) - dayOf(b)) <= ARTICLE_DAYS;

// Rows of the same kind that share a place and day, or the same article, are one event.
function dedupeGdelt(events: Ev[]): Ev[] {
  const parent = events.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i]!)));
  const union = (a: number, b: number) => void (parent[find(a)] = find(b));
  const byPlace = new Map<string, number>();
  const byArticle = new Map<string, number>();
  events.forEach((e, i) => {
    const kp = `${e.kind}|${r2(e.lat)},${r2(e.lon)}|${dayOf(e)}`;
    const p = byPlace.get(kp);
    if (p === undefined) byPlace.set(kp, i);
    else union(i, p);
    for (const s of e.sources) {
      const a = articleKey(s.url);
      if (!a) continue;
      const ka = `${e.kind}|${a}`;
      const q = byArticle.get(ka);
      if (q === undefined) byArticle.set(ka, i);
      else if (nearby(events[q]!, e)) union(i, q); // a roundup or live blog must not collapse distant places or other days
    }
  });
  const groups = new Map<number, Ev[]>();
  events.forEach((e, i) => {
    const r = find(i);
    (groups.get(r) ?? groups.set(r, []).get(r)!).push(e);
  });
  return [...groups.values()].map((g) => {
    g.sort((a, b) => cmp(a.id, b.id));
    const [head, ...rest] = g as [Ev, ...Ev[]];
    return {
      ...head,
      alsoIds: [...head.alsoIds, ...rest.flatMap((e) => [e.id, ...e.alsoIds])],
      sources: uniqSources(g.flatMap((e) => e.sources), MAX_SOURCES),
      severity: Math.max(...g.map((e) => e.severity)) as Ev['severity'],
    };
  });
}

export function mergeEvents(events: Ev[], pick: (lat: number, lon: number) => string | null): Ev[] {
  const ok = events.filter(valid);
  const ucdp = ok.filter((e) => e.source === 'ucdp').map((e) => ({ ...e, alsoIds: [...e.alsoIds], sources: [...e.sources] }));
  const gdelt = dedupeGdelt(ok.filter((e) => e.source === 'gdelt'));

  // Spatial hash of UCDP events (0.5 degree cells) for folding GDELT events into them.
  const cells = new Map<string, Ev[]>();
  for (const e of ucdp) {
    const k = `${Math.floor(e.lat / CELL)},${Math.floor(e.lon / CELL)}`;
    (cells.get(k) ?? cells.set(k, []).get(k)!).push(e);
  }
  const rest: Ev[] = [];
  for (const e of gdelt) {
    let best: Ev | null = null;
    let bestD = Infinity;
    if (violent(e.kind)) {
      const cy = Math.floor(e.lat / CELL);
      const cx = Math.floor(e.lon / CELL);
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++)
          for (const u of cells.get(`${cy + dy},${cx + dx}`) ?? []) {
            if (!violent(u.kind) || Math.abs(dayOf(u) - dayOf(e)) > FOLD_DAYS) continue;
            const dLat = Math.abs(u.lat - e.lat);
            const dLon = Math.abs(u.lon - e.lon);
            if (dLat > FOLD_DEG || dLon > FOLD_DEG) continue;
            const d = dLat * dLat + dLon * dLon;
            if (d < bestD) {
              bestD = d;
              best = u;
            }
          }
    }
    if (best) {
      best.alsoIds.push(e.id, ...e.alsoIds);
      best.sources = [...best.sources, ...uniqSources(e.sources, FOLD_SOURCES)];
    } else rest.push(e);
  }

  return [...ucdp, ...rest]
    .map((e) => ({ ...e, country: pick(e.lat, e.lon) }))
    .sort((a, b) => a.timeS - b.timeS || cmp(a.id, b.id));
}
