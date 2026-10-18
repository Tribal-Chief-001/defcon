import type { TimelineFile } from './types';

let cached: Promise<TimelineFile | null> | null = null;

const date = (s: unknown) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
const text = (s: unknown) => typeof s === 'string' && s.length > 0;

function valid(f: unknown): f is TimelineFile {
  const x = f as Partial<TimelineFile> | null;
  if (!x || !date(x.checkedAt) || !Array.isArray(x.theatres) || x.theatres.length === 0) return false;
  return x.theatres.every(
    (t) =>
      !!t &&
      text(t.key) &&
      text(t.title) &&
      Array.isArray(t.conflicts) &&
      Array.isArray(t.entries) &&
      t.entries.every(
        (e) =>
          !!e &&
          date(e.date) &&
          text(e.title) &&
          typeof e.summary === 'string' &&
          ['confirmed', 'reported', 'disputed'].includes(e.status) &&
          Array.isArray(e.sources) &&
          e.sources.every((s) => !!s && text(s.outlet) && text(s.title) && typeof s.url === 'string' && /^https:\/\//.test(s.url) && date(s.published)),
      ),
  );
}

// public/data/timeline.json (curated key events with sources); null on any failure: the tracker then simply has no timeline.
// A failure is not cached.
export function loadTimeline(): Promise<TimelineFile | null> {
  cached ??= fetch('/data/timeline.json')
    .then((r) => (r.ok ? r.json() : null))
    .then((f: unknown) => (valid(f) ? f : null))
    .catch(() => null)
    .then((f) => {
      if (!f) cached = null;
      return f;
    });
  return cached;
}
export const resetTimelineCache = () => {
  cached = null;
};
