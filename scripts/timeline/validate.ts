import type { TimelineFile } from '../../src/timeline/types';

const STATUS = ['confirmed', 'reported', 'disputed'];
// hosts seen in search results that are content farms or personal mirrors, never acceptable as a source
const BLOCKED = ['duckdns.org', 'buymeacoffee.com', 'codejungle.org', 'thottingal.in', 'socialpruf.com', 'blogspot.com', 'wordpress.com'];
const TWO_LEVEL = new Set(['co.uk', 'org.uk', 'com.au', 'co.in', 'co.il', 'com.tr', 'co.za']);

const isDate = (s: unknown): s is string => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && new Date(`${s}T00:00:00Z`).toISOString().slice(0, 10) === s;
const addDays = (s: string, n: number) => new Date(Date.parse(`${s}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

// the organisation behind a URL: the registrable domain (uk.reuters.com and www.reuters.com are both reuters.com)
export function registrable(host: string): string {
  const p = host.toLowerCase().replace(/^www\./, '').split('.');
  const two = p.slice(-2).join('.');
  return TWO_LEVEL.has(two) ? p.slice(-3).join('.') : two;
}

// Returns the list of problems (empty = valid). A "confirmed" or "disputed" entry needs two sources from different organisations.
export function validateTimeline(f: TimelineFile, opts: { conflictIds: Set<string> }): string[] {
  const out: string[] = [];
  const bad = (m: string) => out.push(m);
  if (!isDate(f.generated)) bad('generated is not a date');
  if (!isDate(f.checkedAt)) bad('checkedAt is not a date');
  const checked = isDate(f.checkedAt) ? f.checkedAt : '9999-12-31';
  if (!Array.isArray(f.theatres) || f.theatres.length === 0) return [...out, 'no theatres'];
  const keys = new Set<string>();
  for (const t of f.theatres) {
    const where = `theatre ${t.key}`;
    if (!/^[a-z0-9-]{1,40}$/.test(t.key ?? '')) bad(`${where}: key must be [a-z0-9-]`);
    if (keys.has(t.key)) bad(`${where}: duplicate theatre`);
    keys.add(t.key);
    if (!t.title?.trim()) bad(`${where}: title is empty`);
    if (!Array.isArray(t.conflicts) || t.conflicts.length === 0) bad(`${where}: conflicts must name at least one conflict id`);
    for (const c of t.conflicts ?? []) if (!opts.conflictIds.has(c)) bad(`${where}: unknown conflict ${c}`);
    if (!Array.isArray(t.entries) || t.entries.length === 0) {
      bad(`${where}: no entries`);
      continue;
    }
    let prev = '';
    t.entries.forEach((e, i) => {
      const at = `${where} entry ${i + 1} (${e.date})`;
      if (!isDate(e.date)) bad(`${at}: date is not a valid date`);
      else {
        if (e.date > checked) bad(`${at}: date after checkedAt`);
        if (prev && e.date < prev) bad(`${at}: entries must be chronological`);
        prev = e.date;
      }
      if (!e.title?.trim() || e.title.length > 100) bad(`${at}: title must be 1-100 characters`);
      if (!e.summary?.trim() || e.summary.length > 450 || words(e.summary) > 60) bad(`${at}: summary must be 1-60 words and at most 450 characters`);
      if (!STATUS.includes(e.status)) bad(`${at}: unknown status ${e.status}`);
      if (!Array.isArray(e.sources) || e.sources.length === 0) {
        bad(`${at}: no sources`);
        return;
      }
      const urls = new Set<string>();
      const orgs = new Set<string>();
      const outlets = new Set<string>();
      for (const s of e.sources) {
        if (!s.outlet?.trim()) bad(`${at}: source outlet is empty`);
        if (!s.title?.trim()) bad(`${at}: source title is empty`);
        if (!s.verified?.trim()) bad(`${at}: source verified note is empty`);
        let host = '';
        try {
          const u = new URL(s.url);
          if (u.protocol !== 'https:') bad(`${at}: source url must be https: ${s.url}`);
          host = u.hostname;
        } catch {
          bad(`${at}: source url is not a valid url`);
        }
        if (host && BLOCKED.some((b) => host === b || host.endsWith(`.${b}`))) bad(`${at}: blocked source host ${host}`);
        if (urls.has(s.url)) bad(`${at}: duplicate url ${s.url}`);
        urls.add(s.url);
        if (host) orgs.add(registrable(host));
        outlets.add((s.outlet ?? '').trim().toLowerCase());
        if (!isDate(s.published)) bad(`${at}: source published is not a date`);
        else {
          if (s.published > checked) bad(`${at}: source published after checkedAt`);
          if (isDate(e.date) && s.published < addDays(e.date, -1)) bad(`${at}: source published before the event`);
        }
      }
      if ((e.status === 'confirmed' || e.status === 'disputed') && (orgs.size < 2 || outlets.size < 2)) bad(`${at}: ${e.status} needs 2 independent sources (different outlets and domains)`);
    });
  }
  return out;
}
