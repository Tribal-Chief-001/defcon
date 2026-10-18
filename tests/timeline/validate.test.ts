import { describe, expect, it } from 'vitest';
import { validateTimeline } from '../../scripts/timeline/validate';
import type { TimelineEntry, TimelineFile, TimelineSource } from '../../src/timeline/types';

const src = (o: Partial<TimelineSource> = {}): TimelineSource => ({ outlet: 'Reuters', title: 'A report', url: 'https://www.reuters.com/world/a-report/', published: '2026-03-01', verified: 'date and claim read on the page', ...o });
const entry = (o: Partial<TimelineEntry> = {}): TimelineEntry => ({ date: '2026-03-01', title: 'Something happened', summary: 'A neutral summary of what happened, attributed to who said it.', status: 'confirmed', sources: [src(), src({ outlet: 'BBC', url: 'https://www.bbc.com/news/x', title: 'Another report' })], ...o });
const file = (entries: TimelineEntry[] = [entry()], o: Partial<TimelineFile['theatres'][0]> = {}): TimelineFile => ({ generated: '2026-10-18', checkedAt: '2026-10-18', theatres: [{ key: 'iran-war', title: 'US/Israel - Iran', conflicts: ['iran'], entries, ...o }] });
const ids = new Set(['iran']);
const problems = (f: TimelineFile) => validateTimeline(f, { conflictIds: ids });

describe('validateTimeline', () => {
  it('accepts a well-formed file', () => {
    expect(problems(file())).toEqual([]);
  });
  it('rejects bad header dates and an empty file', () => {
    expect(problems({ ...file(), checkedAt: 'soon' }).join()).toMatch(/checkedAt/);
    expect(problems({ ...file(), theatres: [] }).join()).toMatch(/no theatres/);
  });
  it('checks theatre keys, titles, conflict ids and that it has entries', () => {
    expect(problems(file([entry()], { key: 'Bad Key' })).join()).toMatch(/key/);
    expect(problems(file([entry()], { conflicts: ['nope'] })).join()).toMatch(/unknown conflict/);
    expect(problems(file([entry()], { conflicts: [] })).join()).toMatch(/conflicts/);
    expect(problems(file([])).join()).toMatch(/no entries/);
    expect(problems({ ...file(), theatres: [file().theatres[0]!, file().theatres[0]!] }).join()).toMatch(/duplicate theatre/);
  });
  it('requires valid, non-future, chronological entry dates', () => {
    expect(problems(file([entry({ date: '2026-02-30' })])).join()).toMatch(/date/);
    expect(problems(file([entry({ date: '2026-10-19', sources: [src({ published: '2026-10-19' }), src({ outlet: 'BBC', url: 'https://www.bbc.com/a', published: '2026-10-19' })] })])).join()).toMatch(/after checkedAt/);
    expect(problems(file([entry({ date: '2026-04-01' }), entry({ date: '2026-03-01' })])).join()).toMatch(/chronological/);
  });
  it('limits title and summary length and rejects empty text', () => {
    expect(problems(file([entry({ title: '' })])).join()).toMatch(/title/);
    expect(problems(file([entry({ title: 'x'.repeat(101) })])).join()).toMatch(/title/);
    expect(problems(file([entry({ summary: 'word '.repeat(61) })])).join()).toMatch(/summary/);
    expect(problems(file([entry({ summary: 'word '.repeat(59) })]))).toEqual([]); // attribution needs words: up to 60 are fine
    expect(problems(file([entry({ summary: '' })])).join()).toMatch(/summary/);
  });
  it('requires a known status', () => {
    expect(problems(file([entry({ status: 'true' as never })])).join()).toMatch(/status/);
  });
  it('requires https sources with a parseable URL, no blocked low-quality hosts, a verified note and a sane publish date', () => {
    const bad = (s: Partial<TimelineSource>) => problems(file([entry({ status: 'reported', sources: [src(s)] })])).join();
    expect(bad({ url: 'http://www.reuters.com/a' })).toMatch(/https/);
    expect(bad({ url: 'not a url' })).toMatch(/url/);
    expect(bad({ url: 'https://someone.duckdns.org/a' })).toMatch(/blocked/);
    expect(bad({ verified: '' })).toMatch(/verified/);
    expect(bad({ outlet: '' })).toMatch(/outlet/);
    expect(bad({ published: '2026-02-27' })).toMatch(/published before/); // a report cannot precede the event by more than a day
    expect(bad({ published: '2026-11-01' })).toMatch(/after checkedAt/);
  });
  it('rejects duplicate URLs within an entry', () => {
    expect(problems(file([entry({ sources: [src(), src({ outlet: 'BBC' })] })])).join()).toMatch(/duplicate url/);
  });
  it('confirmed needs two independent organisations: different outlets and different registrable domains', () => {
    const only = (sources: TimelineSource[]) => problems(file([entry({ sources })])).join();
    expect(only([src()])).toMatch(/confirmed needs 2/);
    expect(only([src(), src({ url: 'https://www.reuters.com/other/', title: 'Same outlet again' })])).toMatch(/confirmed needs 2/);
    expect(only([src(), src({ outlet: 'Reuters syndicated', url: 'https://uk.reuters.com/x' })])).toMatch(/confirmed needs 2/); // same registrable domain
    expect(only([src(), src({ outlet: 'BBC', url: 'https://www.bbc.co.uk/news/x' })])).toBe('');
    expect(only([src({ outlet: 'BBC', url: 'https://www.bbc.co.uk/news/x' }), src({ outlet: 'Guardian', url: 'https://www.theguardian.com/world/x' })])).toBe('');
    expect(problems(file([entry({ status: 'reported', sources: [src()] })]))).toEqual([]); // one source is fine for reported
    expect(problems(file([entry({ status: 'disputed', sources: [src()] })])).join()).toMatch(/disputed needs 2/);
  });
});
