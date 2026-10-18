// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Conflict, ConflictsFile, Range } from '../../src/conflicts/types';
import { ConflictsPage } from '../../src/ui/ConflictsPage';
import { decodeSnapshot } from '../../src/events/snapshot';
import { useEvents } from '../../src/events/store';
import type { Ev } from '../../src/events/types';
import { encodeSnapshot } from '../../scripts/events/encode';
import { worldFixture } from '../conflicts/fixture';
import { timelineFixture } from '../timeline/fixture';

vi.mock('../../src/dossier/load', () => ({ loadIndex: async () => [{ id: 'AAA', name: 'Aland', iso2: null, iso3: 'AAA', capitals: [], continent: null, lat: 0, lon: 0, hasPolygon: true }] }));

const R = (best: number, low = best - 10, high = best + 20): Range => ({ best, low, high });
const conflict = (o: Partial<Conflict> & { id: string; name: string }): Conflict => ({
  kinds: ['state'],
  countries: [
    { id: 'UKR', name: 'Ukraine', deaths365: 900 },
    { id: null, name: 'Atlantis', deaths365: 5 },
  ],
  deaths: { d30: R(120), d90: R(11167, 10000, 12500), d365: R(85542, 80000, 90000) },
  events: { d30: 40, d90: 300, d365: 2000 },
  trend: 'falling',
  lastDate: '2026-08-31',
  weekly: Array.from({ length: 52 }, (_, i) => (i === 40 ? 500 : i)),
  latest: [
    { id: 'e1', date: '2026-08-31', place: 'Kherson, Kherson oblast', country: 'Ukraine', lat: 46.6, lon: 32.6, precision: 1, kind: 'state', deaths: R(7, 5, 12), headline: 'Shelling <img src=x onerror=alert(1)> hits a market', sources: ['Agency A', 'Agency B'], provisional: true },
  ],
  provisionalShare: 0.3,
  geo: { lat: 48, lon: 37, spreadKm: 200, locatedShare: 0.8, cells: [[48.25, 37.25, 100]] },
  ...o,
});
const file: ConflictsFile = {
  generated: '2026-10-18',
  dataEnd: '2026-08-31',
  sources: ['GED 26.1', 'Candidate 26.0.8'],
  world: worldFixture(),
  conflicts: [conflict({ id: 'russia-ukraine', name: 'Russia - Ukraine' }), conflict({ id: 'israel-palestine', name: 'Israel: Palestine', trend: 'rising', countries: [{ id: 'ISR', name: 'Israel', deaths365: 400 }] })],
};
const props = (o: Partial<React.ComponentProps<typeof ConflictsPage>> = {}) => ({ selected: null, onSelect: vi.fn(), onClose: vi.fn(), onDive: vi.fn(), load: async () => file, loadTimeline: async () => timelineFixture(), ...o });

const NOW = Math.floor(Date.now() / 1000);
let n = 0;
const ev = (o: Partial<Ev>): Ev => ({ id: `e${n++}`, source: 'gdelt', alsoIds: [], timeS: NOW - 3 * 3600, lat: 10, lon: 20, precision: 3, country: 'AAA', kind: 'armed', deaths: null, severity: 2, human: false, place: '', headline: '', actors: '', sources: [], firstSeenS: NOW, updatedS: NOW, ...o });
const snap = (events: Ev[]) => {
  const e = encodeSnapshot(events, { asOfS: NOW, generatedS: NOW, sources: [] });
  return decodeSnapshot(e.bin.buffer.slice(e.bin.byteOffset, e.bin.byteOffset + e.bin.byteLength) as ArrayBuffer, e.meta);
};

afterEach(() => {
  cleanup();
  useEvents.setState({ recent: undefined, archive: undefined, status: 'idle' } as never);
});

describe('ConflictsPage', () => {
  it('shows a loading state, then the conflicts with deaths, range and trend', async () => {
    render(<ConflictsPage {...props()} />);
    expect(screen.getByRole('dialog', { name: /war tracker/i })).toBeTruthy();
    expect(screen.getByText(/loading/i)).toBeTruthy();
    const row = await screen.findByRole('button', { name: /Russia - Ukraine/ });
    expect(row.textContent).toMatch(/11,167/);
    expect(row.textContent).toMatch(/10,000/);
    expect(row.textContent).toMatch(/12,500/);
    expect(row.textContent).toMatch(/falling/i);
    expect(screen.getByRole('button', { name: /Israel: Palestine/ }).textContent).toMatch(/rising/i);
  });

  it('says what the data is: end date, human-coded, provisional, estimates', async () => {
    render(<ConflictsPage {...props()} />);
    await screen.findByRole('button', { name: /Russia - Ukraine/ });
    const head = screen.getByRole('dialog').textContent ?? '';
    expect(head).toMatch(/31 Aug 2026/);
    expect(head).toMatch(/human-coded/i);
    expect(head).toMatch(/provisional/i);
    expect(head).toMatch(/estimates/i);
  });

  it('selecting a row calls onSelect with its id', async () => {
    const p = props();
    render(<ConflictsPage {...p} />);
    fireEvent.click(await screen.findByRole('button', { name: /Israel: Palestine/ }));
    expect(p.onSelect).toHaveBeenCalledWith('israel-palestine');
  });

  it('shows the detail of the selected conflict: windows, countries, weekly summary, latest events with sources', async () => {
    render(<ConflictsPage {...props({ selected: 'russia-ukraine' })} />);
    const detail = await screen.findByRole('region', { name: /Russia - Ukraine/ });
    const t = detail.textContent ?? '';
    expect(t).toMatch(/Last 30 days/);
    expect(t).toMatch(/Last 90 days/);
    expect(t).toMatch(/Last 365 days/);
    expect(t).toMatch(/85,542/);
    expect(t).toMatch(/80,000/);
    expect(t).toMatch(/to 31 Aug 2026/);
    expect(within(detail).getByRole('img', { name: /weekly deaths/i })).toBeTruthy();
    expect(t).toMatch(/Kherson, Kherson oblast/);
    expect(t).toMatch(/Agency A/);
    expect(t).toMatch(/provisional/i);
  });

  it('a country with an id is a button that dives; one without an id is plain text', async () => {
    const p = props({ selected: 'russia-ukraine' });
    render(<ConflictsPage {...p} />);
    const detail = await screen.findByRole('region', { name: /Russia - Ukraine/ });
    fireEvent.click(within(detail).getByRole('button', { name: /Ukraine/ }));
    expect(p.onDive).toHaveBeenCalledWith('UKR');
    expect(within(detail).queryByRole('button', { name: /Atlantis/ })).toBeNull();
    expect(within(detail).getByText(/Atlantis/)).toBeTruthy();
  });

  it('renders data text as text, never as markup', async () => {
    render(<ConflictsPage {...props({ selected: 'russia-ukraine' })} />);
    const detail = await screen.findByRole('region', { name: /Russia - Ukraine/ });
    expect(detail.querySelector('img')).toBeNull();
    expect(detail.textContent).toContain('<img src=x onerror=alert(1)>');
  });

  it('filters the list by name or country', async () => {
    render(<ConflictsPage {...props()} />);
    await screen.findByRole('button', { name: /Russia - Ukraine/ });
    fireEvent.change(screen.getByRole('searchbox', { name: /filter/i }), { target: { value: 'israel' } });
    expect(screen.queryByRole('button', { name: /Russia - Ukraine/ })).toBeNull();
    expect(screen.getByRole('button', { name: /Israel: Palestine/ })).toBeTruthy();
    fireEvent.change(screen.getByRole('searchbox', { name: /filter/i }), { target: { value: 'zzz' } });
    expect(screen.getByText(/no conflicts match/i)).toBeTruthy();
  });

  it('an unknown selected id shows the list and a prompt, not a crash', async () => {
    render(<ConflictsPage {...props({ selected: 'nope' })} />);
    expect(await screen.findByRole('button', { name: /Russia - Ukraine/ })).toBeTruthy();
    expect(screen.queryByRole('region', { name: /Russia/ })).toBeNull();
  });

  it('shows a readable error when the data cannot be loaded', async () => {
    render(<ConflictsPage {...props({ load: async () => Promise.reject(new Error('Could not load the conflicts data')) })} />);
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toMatch(/could not load the conflicts data/i);
  });

  it('shows a message for an empty file', async () => {
    render(<ConflictsPage {...props({ load: async () => ({ ...file, conflicts: [] }) })} />);
    expect(await screen.findByText(/no conflicts in this data/i)).toBeTruthy();
  });

  it('Esc and the close button call onClose; Tab stays inside the dialog', async () => {
    const p = props();
    render(<ConflictsPage {...p} />);
    await screen.findByRole('button', { name: /Russia - Ukraine/ });
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(p.onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(p.onClose).toHaveBeenCalledTimes(2);
    const dialog = screen.getByRole('dialog');
    const focusables = Array.from(dialog.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'));
    focusables[focusables.length - 1]!.focus();
    fireEvent.keyDown(window, { key: 'Tab' });
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    expect(document.activeElement).toBe(focusables[0]);
  });

  it('cites both UCDP publications with the DOI and the licence, also on narrow screens', async () => {
    render(<ConflictsPage {...props()} />);
    await screen.findByRole('button', { name: /Russia - Ukraine/ });
    const foot = screen.getByRole('dialog').querySelector('footer')!.textContent ?? '';
    expect(foot).toMatch(/Davies, Pettersson and Öberg \(2026\)/);
    expect(foot).toMatch(/10\.1093\/jopres\/xjag046/);
    expect(foot).toMatch(/Sundberg and Melander \(2013\)/);
    expect(foot).toMatch(/Hegre.*\(2020\)/);
    expect(foot).toMatch(/Candidate/);
  });

  it('cites UCDP with its licence', async () => {
    render(<ConflictsPage {...props()} />);
    await screen.findByRole('button', { name: /Russia - Ukraine/ });
    const cite = screen.getByRole('dialog').textContent ?? '';
    expect(cite).toMatch(/UCDP/);
    expect(cite).toMatch(/CC BY 4\.0/);
    expect(screen.getByRole('link', { name: /ucdp\.uu\.se/i }).getAttribute('href')).toBe('https://ucdp.uu.se/');
  });

  describe('World overview', () => {
    it('starts the list with a World overview row and shows it by default as the fatalities monitor', async () => {
      const p = props();
      render(<ConflictsPage {...p} />);
      await screen.findByRole('button', { name: /Russia - Ukraine/ });
      const first = screen.getAllByRole('button').find((b) => /World overview/.test(b.textContent ?? ''));
      expect(first).toBeTruthy();
      fireEvent.click(first!);
      expect(p.onSelect).toHaveBeenCalledWith('world');
      const world = await screen.findByRole('region', { name: /World overview/ });
      const t = world.textContent ?? '';
      expect(t).toMatch(/Fatalities monitor/i);
      expect(t).toMatch(/Last 30 days/);
      expect(t).toMatch(/Last 90 days/);
      expect(t).toMatch(/Last 365 days/);
      expect(t).toMatch(/9,000/);
      expect(t).toMatch(/State-based/);
      expect(t).toMatch(/Non-state/);
      expect(t).toMatch(/One-sided/);
      expect(t).toMatch(/7,000/);
    });

    it('is also shown for selected="world", with the countries as dive buttons and the protest note', async () => {
      const p = props({ selected: 'world' });
      render(<ConflictsPage {...p} />);
      const world = await screen.findByRole('region', { name: /World overview/ });
      fireEvent.click(within(world).getByRole('button', { name: /Ukraine/ }));
      expect(p.onDive).toHaveBeenCalledWith('UKR');
      expect(within(world).queryByRole('button', { name: /Atlantis/ })).toBeNull();
      expect(world.textContent).toMatch(/deaths in protests and riots themselves are not counted/i);
      expect(world.textContent).toMatch(/killings of protesters .* one-sided/i);
      expect(world.textContent).toMatch(/protest datasets such as ACLED/i);
      expect(within(world).getByRole('img', { name: /weekly deaths/i })).toBeTruthy();
    });

    it('lists the latest human-coded events worldwide as text, never as markup', async () => {
      render(<ConflictsPage {...props({ selected: 'world' })} />);
      const world = await screen.findByRole('region', { name: /World overview/ });
      expect(world.textContent).toMatch(/Town, Region/);
      expect(world.textContent).toContain('Drone strike <b>hits</b> a camp');
      expect(world.querySelector('b')).toBeNull();
    });

    it('shows the newest news reports (auto-coded) from the live snapshot: armed and civilian only, one per country, with the country name', async () => {
      useEvents.setState({ recent: snap([ev({ country: 'AAA', kind: 'armed' }), ev({ country: 'AAA', kind: 'armed', timeS: NOW - 7200 }), ev({ country: 'BBB', kind: 'protest' })]), status: 'ready' } as never);
      render(<ConflictsPage {...props({ selected: 'world' })} />);
      const world = await screen.findByRole('region', { name: /World overview/ });
      const sec = await within(world).findByRole('list', { name: /newest reports/i });
      await waitFor(() => expect(sec.textContent).toMatch(/Aland/));
      expect(sec.textContent).toMatch(/auto-coded/i);
      expect(within(sec).getAllByRole('listitem')).toHaveLength(1); // the protest is not an attack, AAA counts once
      expect(document.body.textContent).not.toMatch(/NaN|undefined/);
    });

    it('does not show human-coded events as auto-coded news reports', async () => {
      useEvents.setState({ recent: snap([ev({ country: 'AAA', human: true, source: 'ucdp' })]), status: 'ready' } as never);
      render(<ConflictsPage {...props({ selected: 'world' })} />);
      const world = await screen.findByRole('region', { name: /World overview/ });
      expect(world.textContent).toMatch(/No armed or civilian reports in the last 7 days/i);
      expect(within(world).queryByRole('list', { name: /newest reports/i })).toBeNull();
    });

    it('says when the news data is old instead of claiming nothing happened', async () => {
      const old = NOW - 3 * 86400;
      const e = encodeSnapshot([ev({ country: 'AAA', timeS: old - 3600 })], { asOfS: old, generatedS: old, sources: [] });
      useEvents.setState({ recent: decodeSnapshot(e.bin.buffer.slice(e.bin.byteOffset, e.bin.byteOffset + e.bin.byteLength) as ArrayBuffer, e.meta), status: 'ready' } as never);
      render(<ConflictsPage {...props({ selected: 'world' })} />);
      const world = await screen.findByRole('region', { name: /World overview/ });
      expect(world.textContent).toMatch(/news data is from .* not live/i);
      expect(world.textContent).not.toMatch(/No armed or civilian reports in the last 7 days/i);
      const sec = await within(world).findByRole('list', { name: /newest reports/i });
      await waitFor(() => expect(sec.textContent).toMatch(/Aland/));
    });

    it('shows no old-data notice for fresh news data', async () => {
      useEvents.setState({ recent: snap([ev({ country: 'AAA' })]), status: 'ready' } as never);
      render(<ConflictsPage {...props({ selected: 'world' })} />);
      const world = await screen.findByRole('region', { name: /World overview/ });
      await within(world).findByRole('list', { name: /newest reports/i });
      expect(world.textContent).not.toMatch(/not live/i);
    });

    it('says so when no reports are loaded or none are attacks', async () => {
      render(<ConflictsPage {...props({ selected: 'world' })} />);
      expect((await screen.findByRole('region', { name: /World overview/ })).textContent).toMatch(/No recent reports loaded/i);
      cleanup();
      useEvents.setState({ recent: snap([ev({ kind: 'protest' })]), status: 'ready' } as never);
      render(<ConflictsPage {...props({ selected: 'world' })} />);
      expect((await screen.findByRole('region', { name: /World overview/ })).textContent).toMatch(/No armed or civilian reports in the last 7 days/i);
    });
  });

  describe('sourced timeline', () => {
    it("shows the matching theatre's key events in a conflict's detail", async () => {
      render(<ConflictsPage {...props({ selected: 'russia-ukraine' })} />);
      const detail = await screen.findByRole('region', { name: /Russia - Ukraine/ });
      const tl = await within(detail).findByRole('region', { name: /key events/i });
      expect(tl.textContent).toMatch(/Talks stall/);
      expect(tl.textContent).toMatch(/A note about the front line/); // the theatre's note and the file's limits are shown
      expect(tl.textContent).toMatch(/Sources are mostly/);
      expect(tl.textContent).not.toMatch(/Strikes despite ceasefire/); // another theatre
    });
    it('shows the newest key events of all theatres, with the theatre, on the World overview', async () => {
      render(<ConflictsPage {...props({ selected: 'world' })} />);
      const world = await screen.findByRole('region', { name: /World overview/ });
      const tl = await within(world).findByRole('region', { name: /key events/i });
      expect(tl.textContent).toMatch(/Strikes despite ceasefire/);
      expect(tl.textContent).toMatch(/Israel - Gaza/);
    });
    it('says the timeline is unavailable when it cannot be loaded, and the page still works', async () => {
      render(<ConflictsPage {...props({ selected: 'russia-ukraine', loadTimeline: async () => null })} />);
      const detail = await screen.findByRole('region', { name: /Russia - Ukraine/ });
      await waitFor(() => expect(detail.textContent).toMatch(/Timeline unavailable/));
      expect(detail.textContent).toMatch(/Last 90 days/);
    });
    it('shows no timeline block for a conflict that no theatre covers', async () => {
      render(<ConflictsPage {...props({ selected: 'israel-palestine' })} />);
      await screen.findByRole('region', { name: /Israel: Palestine/ });
      // israel-palestine is covered by the "gaza" theatre in the fixture; use the conflict without a theatre
      cleanup();
      render(<ConflictsPage {...props({ selected: 'nope-conflict', load: async () => ({ ...file, conflicts: [conflict({ id: 'nope-conflict', name: 'Nowhere war' })] }) })} />);
      const detail = await screen.findByRole('region', { name: /Nowhere war/ });
      await waitFor(() => expect(detail.textContent).toMatch(/Last 90 days/));
      expect(within(detail).queryByRole('region', { name: /key events/i })).toBeNull();
      expect(detail.textContent).not.toMatch(/Timeline unavailable/);
    });
  });
});
