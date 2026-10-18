// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Conflict, ConflictsFile, Range } from '../../src/conflicts/types';
import { decodeSnapshot } from '../../src/events/snapshot';
import { useEvents } from '../../src/events/store';
import type { Ev } from '../../src/events/types';
import { encodeSnapshot } from '../../scripts/events/encode';
import { resetIndicesCache } from '../../src/indices/load';
import { WarRoom } from '../../src/ui/WarRoom';
import { indicesFixture } from '../indices/fixture';
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
  latest: [{ id: 'e1', date: '2026-08-31', place: 'Kherson, Kherson oblast', country: 'Ukraine', lat: 46.6, lon: 32.6, precision: 1, kind: 'state', deaths: R(7, 5, 12), headline: 'Shelling <img src=x onerror=alert(1)> hits a market', sources: ['Agency A', 'Agency B'], provisional: true }],
  provisionalShare: 0.3,
  geo: { lat: 48, lon: 37, spreadKm: 200, locatedShare: 0.12, cells: [[48.25, 37.25, 100]] },
  ...o,
});
const file: ConflictsFile = {
  generated: '2026-10-18',
  dataEnd: '2026-08-31',
  sources: ['GED 26.1', 'Candidate 26.0.8'],
  world: worldFixture(),
  conflicts: [conflict({ id: 'russia-ukraine', name: 'Russia - Ukraine' }), conflict({ id: 'israel-palestine', name: 'Israel: Palestine', trend: 'rising', countries: [{ id: 'ISR', name: 'Israel', deaths365: 400 }], deaths: { d30: R(10), d90: R(401, 397, 421), d365: R(3931, 3500, 4200) } })],
};
const props = (o: Partial<React.ComponentProps<typeof WarRoom>> = {}) => ({ selected: null, onSelect: vi.fn(), onClose: vi.fn(), onDive: vi.fn(), onFocusPlace: vi.fn(), onHoverPin: vi.fn(), load: async () => file, loadTimeline: async () => timelineFixture(), ...o });

const NOW = Math.floor(Date.now() / 1000);
let n = 0;
const ev = (o: Partial<Ev>): Ev => ({ id: `e${n++}`, source: 'gdelt', alsoIds: [], timeS: NOW - 3 * 3600, lat: 10, lon: 20, precision: 3, country: 'AAA', kind: 'armed', deaths: null, severity: 2, human: false, place: '', headline: '', actors: '', sources: [], firstSeenS: NOW, updatedS: NOW, ...o });
const snap = (events: Ev[], asOfS = NOW) => {
  const e = encodeSnapshot(events, { asOfS, generatedS: asOfS, sources: [] });
  return decodeSnapshot(e.bin.buffer.slice(e.bin.byteOffset, e.bin.byteOffset + e.bin.byteLength) as ArrayBuffer, e.meta);
};
const check = async (node: Element) => (await axe.run(node as HTMLElement, { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } })).violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((x) => x.target.join(' ')).join(' | ')})`);

beforeEach(() => {
  // numerals appear at once (no count-up) so assertions do not wait for animation
  window.matchMedia = ((q: string) => ({ matches: /reduce/.test(q), media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(() => {
  cleanup();
  useEvents.setState({ recent: undefined, archive: undefined, status: 'idle' } as never);
});

const overview = async (p = props()) => {
  render(<WarRoom {...p} />);
  await screen.findByRole('list', { name: /conflicts league/i });
  return p;
};

describe('WarRoom shell', () => {
  it('is a docked region, not a modal: no dialog, no aria-modal', async () => {
    await overview();
    expect(screen.getByRole('region', { name: 'War room' })).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.querySelector('[aria-modal]')).toBeNull();
  });
  it('shows a loading state, an error state and an empty state', async () => {
    render(<WarRoom {...props({ load: () => new Promise(() => {}) })} />);
    expect(screen.getByText(/loading/i)).toBeTruthy();
    cleanup();
    render(<WarRoom {...props({ load: async () => Promise.reject(new Error('Could not load the conflicts data')) })} />);
    expect((await screen.findByRole('alert')).textContent).toMatch(/could not load the conflicts data/i);
    cleanup();
    render(<WarRoom {...props({ load: async () => ({ ...file, conflicts: [] }) })} />);
    expect(await screen.findByText(/no conflicts in this data/i)).toBeTruthy();
  });
  it('Esc and the close button close it, and Tab is not trapped', async () => {
    const p = await overview();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(p.onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: /close war room/i }));
    expect(p.onClose).toHaveBeenCalledTimes(2);
    expect(fireEvent.keyDown(window, { key: 'Tab' })).toBe(true); // not default-prevented: focus may leave for the globe
  });
  it('says what the data is: end date, human-coded, provisional, estimates', async () => {
    await overview();
    const t = screen.getByRole('region', { name: 'War room' }).textContent ?? '';
    expect(t).toMatch(/31 Aug 2026/);
    expect(t).toMatch(/human-coded/i);
    expect(t).toMatch(/provisional/i);
    expect(t).toMatch(/estimates/i);
  });
  it('cites both UCDP publications with the DOI and the licence', async () => {
    await overview();
    const foot = screen.getByRole('region', { name: 'War room' }).querySelector('footer')!.textContent ?? '';
    expect(foot).toMatch(/Davies, Pettersson and Öberg \(2026\)/);
    expect(foot).toMatch(/10\.1093\/jopres\/xjag046/);
    expect(foot).toMatch(/Sundberg and Melander \(2013\)/);
    expect(foot).toMatch(/Hegre.*\(2020\)/);
    expect(foot).toMatch(/CC BY 4\.0/);
    expect(screen.getByRole('link', { name: /ucdp\.uu\.se/i }).getAttribute('href')).toBe('https://ucdp.uu.se/');
  });
});

describe('Overview reachability', () => {
  const many = (n: number): ConflictsFile => ({
    ...file,
    conflicts: Array.from({ length: n }, (_, i) =>
      conflict({ id: `c${i}`, name: `Conflict ${i}`, deaths: { d30: R(1), d90: R(Math.max(0, 500 - i * 10)), d365: R(1000 - i) }, trend: 'steady' }),
    ).concat([conflict({ id: 'old-massacre', name: 'Old massacre', deaths: { d30: R(0), d90: R(0), d365: R(19899, 18000, 21000) }, trend: 'low data' })]),
  });
  it('lists every conflict, not only the top ones, and filters them by name or country', async () => {
    const p = props({ load: async () => many(45) });
    render(<WarRoom {...p} />);
    const all = await screen.findByRole('list', { name: /all conflicts/i });
    expect(within(all).getAllByRole('button')).toHaveLength(46);
    fireEvent.change(screen.getByRole('searchbox', { name: /filter conflicts/i }), { target: { value: 'massacre' } });
    expect(within(screen.getByRole('list', { name: /all conflicts/i })).getAllByRole('button')).toHaveLength(1);
    fireEvent.click(within(screen.getByRole('list', { name: /all conflicts/i })).getByRole('button', { name: /Old massacre/ }));
    expect(p.onSelect).toHaveBeenCalledWith('old-massacre');
    fireEvent.change(screen.getByRole('searchbox', { name: /filter conflicts/i }), { target: { value: 'zzzz' } });
    expect(screen.getByText(/no conflicts match/i)).toBeTruthy();
  });
  it('ranks the bubbles by deaths in 365 days and says it shows the top 30 of the total', async () => {
    render(<WarRoom {...props({ load: async () => many(45) })} />);
    const bubbles = await screen.findByRole('group', { name: /conflicts by deaths/i });
    const names = within(bubbles).getAllByRole('button').map((b) => b.getAttribute('aria-label')!);
    expect(names).toHaveLength(30);
    expect(names.some((n) => /Old massacre/.test(n))).toBe(true); // 19,899 deaths in a year but none in the last 90 days
    expect(screen.getByRole('region', { name: 'War room' }).textContent).toMatch(/Top 30 of 46 conflicts by deaths in the last 365 days/);
  });
  it('draws the league sparklines on one shared scale and says so', async () => {
    await overview();
    expect(screen.getByRole('region', { name: 'War room' }).textContent).toMatch(/sparklines share one scale/i);
  });
});

describe('Overview', () => {
  it('opens with the world numbers: hero, three windows with ranges, the ring and the by-kind split', async () => {
    await overview();
    const r = screen.getByRole('region', { name: 'War room' });
    const t = r.textContent ?? '';
    expect(t).toMatch(/9,000/);
    for (const w of ['Last 30 days', 'Last 90 days', 'Last 365 days']) expect(t).toContain(w);
    expect(screen.getByRole('img', { name: /Deaths: 30 days 300, 90 days 2,000, 365 days 9,000/ })).toBeTruthy();
    for (const k of ['State-based', 'Non-state', 'One-sided']) expect(t).toContain(k);
    expect(t).toMatch(/7,000/);
    expect(t).toMatch(/Deaths in protests and riots themselves are not counted/i);
    expect(t).toMatch(/Killings of protesters by armed actors/i);
    expect(t).toMatch(/Protest datasets such as ACLED/i);
  });
  it('has the stream chart with the timeline events as buttons, the bubbles, the league and the countries', async () => {
    await overview();
    expect(screen.getByRole('group', { name: /deaths per week/i })).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /A big strike hits/ }).length).toBeGreaterThan(0);
    const bubbles = screen.getByRole('group', { name: /conflicts by deaths/i });
    expect(within(bubbles).getAllByRole('button')).toHaveLength(2);
    const league = screen.getByRole('list', { name: /conflicts league/i });
    expect(within(league).getAllByRole('button')).toHaveLength(2);
    expect(within(league).getByRole('button', { name: /Russia - Ukraine/ }).textContent).toMatch(/11,167/);
  });
  it('selects a conflict from a bubble or a league row, and a stream event selects its theatre and shows its place', async () => {
    const p = await overview();
    fireEvent.click(within(screen.getByRole('group', { name: /conflicts by deaths/i })).getByRole('button', { name: /Israel: Palestine/ }));
    expect(p.onSelect).toHaveBeenLastCalledWith('israel-palestine');
    fireEvent.click(within(screen.getByRole('list', { name: /conflicts league/i })).getByRole('button', { name: /Russia - Ukraine/ }));
    expect(p.onSelect).toHaveBeenLastCalledWith('russia-ukraine');
    const stream = screen.getByRole('group', { name: /deaths per week/i });
    fireEvent.click(within(stream).getByRole('button', { name: /A big strike hits/ }));
    expect(p.onSelect).toHaveBeenLastCalledWith('russia-ukraine');
    expect(p.onFocusPlace).toHaveBeenLastCalledWith({ lat: 50.45, lon: 30.52, place: 'Kyiv' });
  });
  it('lists the countries with most deaths as dive buttons, and a country without an id as text', async () => {
    const p = await overview();
    const c = screen.getByRole('list', { name: /most deaths in the last 90 days/i });
    fireEvent.click(within(c).getByRole('button', { name: /Ukraine/ }));
    expect(p.onDive).toHaveBeenCalledWith('UKR');
    expect(within(c).queryByRole('button', { name: /Atlantis/ })).toBeNull();
    expect(within(c).getByText(/Atlantis/)).toBeTruthy();
  });
  it('shows the newest key events of all theatres with their theatre and "Show on the map"', async () => {
    const p = await overview();
    const tl = await screen.findByRole('region', { name: /key events/i });
    expect(tl.textContent).toMatch(/Strikes despite ceasefire/);
    expect(tl.textContent).toMatch(/Israel - Gaza/);
    expect(tl.textContent).toMatch(/Sources are mostly/); // the file's limits
    fireEvent.click(within(tl).getAllByRole('button', { name: /show on the map/i })[0]!);
    expect(p.onFocusPlace).toHaveBeenLastCalledWith({ lat: 31.3, lon: 34.25, place: 'Rafah' });
  });
  it('lists the latest human-coded events as text, never as markup', async () => {
    await overview();
    const t = screen.getByRole('region', { name: 'War room' }).textContent ?? '';
    expect(t).toContain('Drone strike <b>hits</b> a camp');
    expect(document.querySelector('b')).toBeNull();
  });
  it('shows the newest news reports (auto-coded): armed and civilian only, never human-coded events, one per country, with the country name', async () => {
    useEvents.setState({ recent: snap([ev({ country: 'AAA', kind: 'armed' }), ev({ country: 'AAA', kind: 'armed', timeS: NOW - 7200 }), ev({ country: 'BBB', kind: 'protest' }), ev({ country: 'CCC', kind: 'armed', human: true, source: 'ucdp' })]), status: 'ready' } as never);
    await overview();
    const sec = await screen.findByRole('list', { name: /newest reports/i });
    await waitFor(() => expect(sec.textContent).toMatch(/Aland/));
    expect(sec.textContent).toMatch(/auto-coded/i);
    expect(within(sec).getAllByRole('listitem')).toHaveLength(1);
    expect(document.body.textContent).not.toMatch(/NaN|undefined/);
  });
  it('says so when no reports are loaded, when none are attacks, and when the news data is old', async () => {
    await overview();
    expect(screen.getByRole('region', { name: 'War room' }).textContent).toMatch(/No recent reports loaded/i);
    cleanup();
    useEvents.setState({ recent: snap([ev({ kind: 'protest' })]), status: 'ready' } as never);
    await overview();
    expect(screen.getByRole('region', { name: 'War room' }).textContent).toMatch(/No armed or civilian reports in the last 7 days/i);
    cleanup();
    const old = NOW - 3 * 86400;
    useEvents.setState({ recent: snap([ev({ country: 'AAA', timeS: old - 3600 })], old), status: 'ready' } as never);
    await overview();
    const t = screen.getByRole('region', { name: 'War room' }).textContent ?? '';
    expect(t).toMatch(/news data is from .* not live/i);
    expect(t).not.toMatch(/No armed or civilian reports in the last 7 days/i);
  });
  it('shows an unavailable note when the timeline cannot be loaded, and the rest still works', async () => {
    await overview(props({ loadTimeline: async () => null }));
    await waitFor(() => expect(screen.getByRole('region', { name: 'War room' }).textContent).toMatch(/Timeline unavailable/));
    expect(screen.getByRole('list', { name: /conflicts league/i })).toBeTruthy();
  });
  it('an unknown selected id shows the overview, not a crash', async () => {
    render(<WarRoom {...props({ selected: 'zzz' })} />);
    expect(await screen.findByRole('list', { name: /conflicts league/i })).toBeTruthy();
  });
});

describe('Conflict view', () => {
  const open = async (o: Partial<React.ComponentProps<typeof WarRoom>> = {}) => {
    const p = props({ selected: 'russia-ukraine', ...o });
    render(<WarRoom {...p} />);
    await screen.findByRole('heading', { name: 'Russia - Ukraine' });
    return p;
  };
  it('shows the name, kinds, activity trend, the three windows with ranges and event counts', async () => {
    await open();
    const t = screen.getByRole('region', { name: 'War room' }).textContent ?? '';
    expect(t).toMatch(/State-based/);
    expect(t).toMatch(/activity trend falling/i);
    for (const w of ['Last 30 days', 'Last 90 days', 'Last 365 days']) expect(t).toContain(w);
    expect(t).toMatch(/85,542/);
    expect(t).toMatch(/80,000/);
    expect(t).toMatch(/to 31 Aug 2026/);
    expect(screen.getByRole('img', { name: 'Best estimate 120, range 110 to 140' })).toBeTruthy();
    expect(t).toMatch(/Only 12% of the deaths could be placed on the map/i);
  });
  it('has a deaths-and-events chart, the editorial timeline of its theatre only, and its countries', async () => {
    await open();
    expect(screen.getByRole('group', { name: /deaths per week in this conflict/i })).toBeTruthy();
    const tl = await screen.findByRole('region', { name: /key events/i });
    expect(tl.textContent).toMatch(/Talks stall/);
    expect(tl.textContent).toMatch(/A note about the front line/);
    expect(tl.textContent).not.toMatch(/Strikes despite ceasefire/);
  });
  it('a country with an id is a button that dives; one without an id is plain text', async () => {
    const p = await open();
    const c = screen.getByRole('list', { name: /countries in the data/i });
    fireEvent.click(within(c).getByRole('button', { name: /Ukraine/ }));
    expect(p.onDive).toHaveBeenCalledWith('UKR');
    expect(within(c).queryByRole('button', { name: /Atlantis/ })).toBeNull();
  });
  it('tells the globe which pin is hovered and where to fly from a timeline card', async () => {
    const p = await open();
    const tl = await screen.findByRole('region', { name: /key events/i });
    const items = within(tl).getAllByRole('listitem');
    const marchItem = items.find((i) => /A big strike hits/.test(i.textContent ?? ''))!;
    fireEvent.mouseEnter(marchItem);
    expect(p.onHoverPin).toHaveBeenLastCalledWith(0);
    fireEvent.mouseLeave(marchItem);
    expect(p.onHoverPin).toHaveBeenLastCalledWith(null);
    fireEvent.click(within(marchItem).getByRole('button', { name: /show on the map/i }));
    expect(p.onFocusPlace).toHaveBeenLastCalledWith({ lat: 50.45, lon: 30.52, place: 'Kyiv' });
  });
  it('a click on a stream event marks and scrolls to its timeline card', async () => {
    await open();
    const stream = screen.getByRole('group', { name: /deaths per week in this conflict/i });
    fireEvent.click(within(stream).getByRole('button', { name: /Talks stall/ }));
    const tl = await screen.findByRole('region', { name: /key events/i });
    await waitFor(() => expect(within(tl).getAllByRole('listitem').some((li) => li.getAttribute('data-highlight') === 'true')).toBe(true));
  });
  it('lists the latest events as text, never as markup, and the back button returns to the overview', async () => {
    const p = await open();
    const t = screen.getByRole('region', { name: 'War room' }).textContent ?? '';
    expect(t).toContain('Shelling <img src=x onerror=alert(1)> hits a market');
    expect(document.querySelector('img')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /world overview/i }));
    expect(p.onSelect).toHaveBeenCalledWith(null);
  });
  it('has no axe violations in the overview or in a conflict', async () => {
    const p = await overview();
    expect(await check(screen.getByRole('region', { name: 'War room' }))).toEqual([]);
    cleanup();
    await open({ onSelect: p.onSelect });
    expect(await check(screen.getByRole('region', { name: 'War room' }))).toEqual([]);
  });
});

describe('WarRoom: Index board', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    resetIndicesCache();
  });
  it('shows the Index board in the overview and opens the method from it', async () => {
    resetIndicesCache();
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(indicesFixture()), { status: 200 })));
    const onMethod = vi.fn();
    render(<WarRoom {...props()} onMethod={onMethod} />);
    const board = await screen.findByRole('region', { name: /index board/i });
    expect(within(board).getByRole('list', { name: /most deadly now/i })).toBeTruthy();
    fireEvent.click(within(board).getByRole('button', { name: /how computed/i }));
    expect(onMethod).toHaveBeenCalled();
  });
});
