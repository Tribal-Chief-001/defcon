// public/data/timeline.json: key events of the big wars, curated from news sources (not from UCDP). Every entry names its sources and a
// status: confirmed (two independent sources agree), reported (one reliable source or one claimant), disputed (sources or parties differ).
export type Status = 'confirmed' | 'reported' | 'disputed';
export type TimelineSource = { outlet: string; title: string; url: string; published: string; verified: string };
export type TimelineEntry = { date: string; title: string; summary: string; status: Status; sources: TimelineSource[] };
export type Theatre = { key: string; title: string; conflicts: string[]; note?: string; entries: TimelineEntry[] }; // conflicts: ids in conflicts.json this theatre belongs to
export type TimelineFile = { generated: string; checkedAt: string; theatres: Theatre[] };
