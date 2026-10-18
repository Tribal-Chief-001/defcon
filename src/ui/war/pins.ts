import type { WarPin } from '../../globe/warGeometry';
import type { TimelineEntry, TimelineFile } from '../../timeline/types';

export type PinRow = { entry: TimelineEntry; theatre: string };

// every timeline entry of the theatres a conflict belongs to, in file order
export const entriesFor = (tl: TimelineFile | null | undefined, conflictId: string): PinRow[] =>
  (tl?.theatres ?? []).filter((t) => t.conflicts.includes(conflictId)).flatMap((t) => t.entries.map((entry) => ({ entry, theatre: t.title })));

// the entries that have a place, in order: the position in this list is the pin index on the globe
export const pinnedRows = (rows: PinRow[]): PinRow[] => rows.filter((r) => !!r.entry.at);
export const toPins = (rows: PinRow[]): WarPin[] => pinnedRows(rows).map((r) => ({ lat: r.entry.at!.lat, lon: r.entry.at!.lon, status: r.entry.status, label: r.entry.title }));
export { rowKey } from '../../timeline/key';
