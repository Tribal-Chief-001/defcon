import type { Relations } from './types';

let cached: Promise<Relations | null> | null = null;

// public/data/relations.json; null on any failure (the globe then has no arcs). A failure is not cached.
export function loadRelations(): Promise<Relations | null> {
  cached ??= fetch('/data/relations.json')
    .then((r) => (r.ok ? (r.json() as Promise<Relations>) : null))
    .then((r) => (r && Array.isArray(r.alliances) && Array.isArray(r.disputes) ? r : null))
    .catch(() => null)
    .then((r) => {
      if (!r) cached = null;
      return r;
    });
  return cached;
}
