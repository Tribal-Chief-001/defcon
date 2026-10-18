// Sourced relations between countries. Ids are Natural Earth ADM0_A3 (the same ids as the map and the dossiers).
export type Alliance = {
  id: string;
  name: string;
  kind: 'multilateral' | 'bilateral';
  members: string[];
  source: string;
  url: string;
  asOf: string;
  note?: string;
};

// A state-based UCDP dyad whose two sides are both governments. `a` sorts before `b`.
export type Dispute = { a: string; b: string; conflict: string; lastYear: number; events: number; source: string; url: string };

export type Relations = { generated: string; alliances: Alliance[]; disputes: Dispute[] };
