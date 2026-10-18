// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { decodeSnapshot } from '../../src/events/snapshot';
import { useEvents } from '../../src/events/store';
import { TopBar } from '../../src/ui/TopBar';
import { encodeSnapshot } from '../../scripts/events/encode';
import type { Ev } from '../../src/events/types';

const NOW = Math.floor(Date.now() / 1000);
const ev = (human: boolean, country: string): Ev => ({
  id: `e${Math.random()}`, source: human ? 'ucdp' : 'gdelt', alsoIds: [], timeS: NOW - 3600, lat: 10, lon: 20, precision: 1, country, kind: 'armed', deaths: 1, severity: 2, human,
  place: '', headline: '', actors: '', sources: [], firstSeenS: NOW, updatedS: NOW,
});
const snap = (events: Ev[]) => {
  const e = encodeSnapshot(events, { asOfS: NOW, generatedS: NOW, sources: [] });
  return decodeSnapshot(e.bin.buffer.slice(e.bin.byteOffset, e.bin.byteOffset + e.bin.byteLength) as ArrayBuffer, e.meta);
};

beforeEach(() => {
  window.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
  useEvents.setState({ recent: undefined, archive: undefined, status: 'idle' });
});
afterEach(cleanup);

describe('TopBar', () => {
  it('shows the wordmark and a labelled stats group with --, never 0, while there is no data', () => {
    render(<TopBar />);
    expect(screen.getByText('DEFCON')).toBeTruthy();
    const group = screen.getByRole('group', { name: /global statistics/i });
    expect(group.textContent).toMatch(/events/i);
    expect(group.textContent).toMatch(/human-coded/i);
    expect(group.textContent).toMatch(/events/i);
    expect(group.textContent).toMatch(/countries/i);
    expect(group.textContent).not.toMatch(/\b0\b/);
    expect(group.textContent).toContain('--');
  });
  it('shows the counts of the last 30 days with their windows and a whole-percent share', () => {
    useEvents.setState({ recent: snap([ev(true, 'AAA'), ev(false, 'AAA'), ev(false, 'BBB'), ev(false, 'CCC')]), status: 'ready' });
    render(<TopBar />);
    const group = screen.getByRole('group', { name: /global statistics/i });
    expect(group.textContent).toMatch(/events · 1 d/i); // the events are 1 hour old: the window shown is the data's real span
    expect(group.textContent).toContain('4');
    expect(group.textContent).toContain('25%');
    expect(group.textContent).toContain('3');
    expect(group.textContent).not.toMatch(/NaN|undefined/);
  });
  // review findings
  it('shows -- (not 0) when only the archive is loaded, and names the third number honestly', () => {
    useEvents.setState({ recent: undefined, archive: snap([ev(true, 'AAA')]), status: 'ready' });
    render(<TopBar />);
    const group = screen.getByRole('group', { name: /global statistics/i });
    expect(group.textContent).not.toMatch(/\b0\b/);
    expect(group.textContent).toContain('--');
    expect(group.textContent).toMatch(/countries reported/i);
    expect(group.textContent).not.toMatch(/affected/i);
  });
  it('explains a 0 % human-coded share by where the human-coded data ends', () => {
    const e = encodeSnapshot([ev(false, 'AAA')], { asOfS: NOW, generatedS: NOW, sources: [{ id: 'ucdp', name: 'UCDP', version: 'v', asOfS: Date.UTC(2026, 7, 31) / 1000, url: 'https://x', license: 'x' }] });
    useEvents.setState({ recent: decodeSnapshot(e.bin.buffer.slice(e.bin.byteOffset, e.bin.byteOffset + e.bin.byteLength) as ArrayBuffer, e.meta), status: 'ready' });
    render(<TopBar />);
    expect(screen.getByRole('group', { name: /global statistics/i }).textContent).toMatch(/UCDP data ends 31 Aug/i);
  });
  it('shows the stats from 1200 px, where they no longer collide with the freshness pill', () => {
    render(<TopBar />);
    expect(screen.getByRole('group', { name: /global statistics/i }).className).toContain('min-[1200px]:flex');
  });
  it('has the wordmark as the page heading', () => {
    render(<TopBar />);
    expect(screen.getByRole('heading', { level: 1, name: /defcon/i })).toBeTruthy();
  });
});
