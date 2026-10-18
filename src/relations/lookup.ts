import type { Relations } from './types';

export type CountryRelations = {
  allies: { id: string; via: string[] }[];
  disputes: { id: string; conflict: string; events: number }[];
};

// Allies of `id` (every alliance it shares, one entry per ally) and its active disputes; empty for no data or an unknown id.
export function relationsFor(rel: Relations | null, id: string): CountryRelations {
  const allies = new Map<string, string[]>();
  const disputes: CountryRelations['disputes'] = [];
  if (rel) {
    for (const a of rel.alliances) {
      if (!a.members.includes(id)) continue;
      for (const m of a.members) if (m !== id) allies.set(m, [...(allies.get(m) ?? []), a.name]);
    }
    for (const d of rel.disputes) {
      if (d.a === id) disputes.push({ id: d.b, conflict: d.conflict, events: d.events });
      else if (d.b === id) disputes.push({ id: d.a, conflict: d.conflict, events: d.events });
    }
  }
  return {
    allies: [...allies].map(([aid, via]) => ({ id: aid, via })).sort((x, y) => x.id.localeCompare(y.id)),
    disputes: disputes.sort((x, y) => x.id.localeCompare(y.id)),
  };
}
