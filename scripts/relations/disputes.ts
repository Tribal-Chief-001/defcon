import type { Dispute } from '../../src/relations/types';

export const UCDP_SOURCE = 'UCDP Georeferenced Event Dataset (state-based violence, both sides governments)';
export const UCDP_URL = 'https://ucdp.uu.se/downloads/';

type Row = Record<string, string | undefined>;

// "Active disputes": pairs of states that appear as opposing governments in UCDP state-based events (type_of_violence 1 with a
// Gleditsch-Ward number on both sides). One record per unordered pair; only events from `minLastYear` on count (`events` is
// that count), so a pair with no recent event has no record; pairs under `minEvents` are dropped (one row is not an active dispute).
// A Gleditsch-Ward number with no id throws: a dispute must never be silently lost or attached to the wrong country.
export function disputesFromGed(rows: Row[], gwToId: Record<string, string>, opts: { minLastYear: number; minEvents?: number }): Dispute[] {
  const pairs = new Map<string, Dispute>();
  for (const r of rows) {
    const year = Number(r.year);
    if (r.type_of_violence !== '1' || !Number.isFinite(year) || year < opts.minLastYear) continue; // older rows never need an id
    const sideA = (r.gwnoa ?? '').split(';').map((g) => g.trim()).filter(Boolean);
    const sideB = (r.gwnob ?? '').split(';').map((g) => g.trim()).filter(Boolean);
    const idOf = (g: string) => {
      const id = gwToId[g];
      if (!id) throw new Error(`no country id for Gleditsch-Ward number ${g} (conflict "${r.conflict_name ?? '?'}")`);
      return id;
    };
    // a side can be a coalition ("2;200;900"): every government on one side opposes every government on the other
    for (const ga of sideA) {
      for (const gb of sideB) {
        const [ia, ib] = [idOf(ga), idOf(gb)];
        if (ia === ib) continue;
        const [x, y] = ia < ib ? [ia, ib] : [ib, ia];
        const key = `${x}|${y}`;
        const cur = pairs.get(key);
        if (!cur) pairs.set(key, { a: x, b: y, conflict: r.conflict_name ?? '', lastYear: year, events: 1, source: UCDP_SOURCE, url: UCDP_URL });
        else {
          cur.events += 1;
          if (year >= cur.lastYear) (cur.lastYear = year, (cur.conflict = r.conflict_name ?? cur.conflict));
        }
      }
    }
  }
  return [...pairs.values()].filter((d) => d.events >= (opts.minEvents ?? 1)).sort((p, q) => p.a.localeCompare(q.a) || p.b.localeCompare(q.b));
}
