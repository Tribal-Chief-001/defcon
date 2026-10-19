import type { SignalsFile } from './types';

let cached: Promise<SignalsFile | null> | null = null;

const num = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const text = (v: unknown) => typeof v === 'string' && v.length > 0;
const point = (p: { lat?: unknown; lon?: unknown } | null) => !!p && num(p.lat) && Math.abs(p.lat) <= 90 && num(p.lon) && Math.abs(p.lon) <= 180;
// links are shown to people: https on the source's own host only
const link = (u: unknown, host: RegExp) => typeof u === 'string' && host.test(u);
const USGS = /^https:\/\/earthquake\.usgs\.gov\//;
const GDACS = /^https:\/\/www\.gdacs\.org\//;

function valid(f: unknown): f is SignalsFile {
  const x = f as Partial<SignalsFile> | null;
  if (!x || typeof x.generated !== 'string' || Number.isNaN(Date.parse(x.generated)) || !Array.isArray(x.sources) || !Array.isArray(x.seismic) || !Array.isArray(x.disasters) || !Array.isArray(x.fires)) return false;
  return (
    x.sources.every((s) => !!s && ['usgs', 'gdacs', 'firms'].includes(s.id) && text(s.name) && typeof s.ok === 'boolean' && num(s.count) && text(s.licence) && text(s.attribution) && typeof s.url === 'string' && /^https:\/\//.test(s.url)) &&
    x.seismic.every((s) => !!s && text(s.id) && point(s) && num(s.time) && (s.mag === null || num(s.mag)) && typeof s.place === 'string' && link(s.url, USGS)) &&
    x.disasters.every((d) => !!d && text(d.id) && point(d) && num(d.time) && ['Orange', 'Red'].includes(d.alert) && text(d.kind) && typeof d.title === 'string' && typeof d.country === 'string' && link(d.url, GDACS)) &&
    x.fires.every((c) => !!c && point(c) && num(c.count) && c.count > 0 && num(c.frp) && num(c.latestS) && text(c.conflictId) && text(c.conflict))
  );
}

// public/data/signals.json (built at ingest time); null on any failure: the War room then says the signals are unavailable.
// A failure is not cached.
export function loadSignals(): Promise<SignalsFile | null> {
  cached ??= fetch('/data/signals.json')
    .then((r) => (r.ok ? r.json() : null))
    .then((f: unknown) => (valid(f) ? f : null))
    .catch(() => null)
    .then((f) => {
      if (!f) cached = null;
      return f;
    });
  return cached;
}
export const resetSignalsCache = () => {
  cached = null;
};
