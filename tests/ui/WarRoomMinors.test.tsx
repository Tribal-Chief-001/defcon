// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Conflict, ConflictsFile, Range } from '../../src/conflicts/types';
import { useTime } from '../../src/time/store';
import type { TimelineFile } from '../../src/timeline/types';
import { WarRoom } from '../../src/ui/WarRoom';
import { worldFixture } from '../conflicts/fixture';
import { timelineFixture } from '../timeline/fixture';

vi.mock('../../src/dossier/load', () => ({ loadIndex: async () => [] }));
vi.mock('../../src/indices/load', async (orig) => ({ ...(await orig<typeof import('../../src/indices/load')>()), loadIndices: async () => null }));

const R = (best: number, low = best - 10, high = best + 20): Range => ({ best, low, high });
const conflict = (o: Partial<Conflict> & { id: string; name: string }): Conflict => ({
  kinds: ['state'],
  countries: [{ id: 'UKR', name: 'Ukraine', deaths365: 900 }],
  deaths: { d30: R(120), d90: R(11167, 10000, 12500), d365: R(85542, 80000, 90000) },
  events: { d30: 40, d90: 300, d365: 2000 },
  trend: 'falling',
  lastDate: '2026-08-31',
  weekly: Array.from({ length: 52 }, (_, i) => i + 1),
  latest: [],
  provisionalShare: 0,
  geo: { lat: 48, lon: 37, spreadKm: 200, locatedShare: 0.9, cells: [[48.25, 37.25, 100]] },
  ...o,
});
const byKind = (state: number[], non: number[], one: number[]) => ({ state, 'non-state': non, 'one-sided': one });
const quiet = conflict({ id: 'quiet', name: 'Quiet - War', trend: 'low data', deaths: { d30: R(0, 0, 0), d90: R(0, 0, 0), d365: R(130, 120, 140) }, events: { d30: 0, d90: 0, d365: 4 }, lastDate: '2026-05-01', weekly: new Array(52).fill(0).map((_, i) => (i === 10 ? 130 : 0)) });
const spiky = conflict({ id: 'spiky', name: 'Spiky - Conflict', provisionalShare: 0.6, weekly: Array.from({ length: 52 }, (_, i) => (i === 30 ? 5000 : 40)) });
const file = (): ConflictsFile => ({ generated: '2026-10-18', dataEnd: '2026-08-31', sources: ['t'], world: worldFixture(), conflicts: [conflict({ id: 'a', name: 'Alpha - Beta' }), quiet, spiky] });
const props = (o: Partial<React.ComponentProps<typeof WarRoom>> = {}) => ({ selected: null, onSelect: vi.fn(), onClose: vi.fn(), onDive: vi.fn(), onFocusPlace: vi.fn(), onHoverPin: vi.fn(), load: async () => file(), loadTimeline: async () => timelineFixture(), ...o });
const Host = (p: Partial<React.ComponentProps<typeof WarRoom>> = {}) => {
  const [sel, set] = useState<string | null>(null);
  return <WarRoom {...props({ selected: sel, onSelect: set, ...p })} />;
};

beforeEach(() => {
  window.matchMedia = ((q: string) => ({ matches: /reduce/.test(q), media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
  Element.prototype.scrollIntoView = vi.fn();
  useTime.setState({ backS: 0, playing: false });
});
afterEach(cleanup);
const overview = async (ui = <Host />) => {
  render(ui);
  await screen.findByRole('list', { name: /conflicts league/i });
};
const open = async (name: RegExp) => {
  fireEvent.click(within(screen.getByRole('list', { name: /conflicts league/i })).getByRole('button', { name }));
  await screen.findByRole('heading', { name: name });
};

describe('War room: wording and notes', () => {
  it('says "no deaths in 90 days, last event <date>" for a conflict without deaths in 90 days, not "low data"', async () => {
    await overview();
    await open(/Quiet - War/);
    const head = screen.getByRole('heading', { name: /Quiet - War/ }).parentElement!.textContent ?? '';
    expect(head).toMatch(/no deaths in 90 days, last event 1 May 2026/);
    expect(head).not.toMatch(/low data/);
  });
  it('says the rings on the globe are not live activity', async () => {
    await overview();
    expect(screen.getByRole('region', { name: 'War room' }).textContent).toMatch(/rings.*not live activity/i);
  });
  it('notes spiky weeks and provisional newest weeks under the weekly chart, and only then', async () => {
    await overview();
    await open(/Spiky - Conflict/);
    const t = screen.getByRole('region', { name: 'War room' }).textContent ?? '';
    expect(t).toMatch(/single date can make one week spike/i);
    expect(t).toMatch(/newest weeks .* provisional/i);
    cleanup();
    await overview();
    await open(/Alpha - Beta/);
    const u = screen.getByRole('region', { name: 'War room' }).textContent ?? '';
    expect(u).not.toMatch(/can make one week spike/i);
    expect(u).not.toMatch(/newest weeks .* provisional/i);
  });
  it('says when time travel is on and goes back to live from the room', async () => {
    useTime.setState({ backS: 7200 });
    await overview();
    expect(screen.getByRole('region', { name: 'War room' }).textContent).toMatch(/time travel is on/i);
    fireEvent.click(screen.getByRole('button', { name: /back to live/i }));
    expect(useTime.getState().backS).toBe(0);
    await waitFor(() => expect(screen.queryByRole('button', { name: /back to live/i })).toBeNull());
  });
});

describe('War room: selection and focus', () => {
  it('treats an unknown selected id as no selection (and tells the owner of the state)', async () => {
    const p = props({ selected: 'no-such-conflict' });
    await overview(<WarRoom {...p} />);
    await waitFor(() => expect(p.onSelect).toHaveBeenCalledWith(null));
  });
  it('moves focus to the conflict heading when one opens, and back to its row on Back', async () => {
    await overview();
    await open(/Alpha - Beta/);
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: /Alpha - Beta/ }));
    fireEvent.click(screen.getByRole('button', { name: /World overview/ }));
    await screen.findByRole('list', { name: /conflicts league/i });
    expect((document.activeElement as HTMLElement).textContent).toMatch(/Alpha - Beta/);
  });
  it('has a live region from the first render, empty once loaded', async () => {
    render(<WarRoom {...props({ load: () => new Promise(() => {}) })} />);
    expect(screen.getByRole('region', { name: 'War room' }).querySelector('[data-war-status]')!.textContent).toMatch(/loading conflicts/i);
    cleanup();
    await overview();
    expect(screen.getByRole('region', { name: 'War room' }).querySelector('[data-war-status]')!.textContent).toBe('');
  });
  it('uses no heading for the hero numeral', async () => {
    await overview();
    expect(screen.queryAllByRole('heading').some((h) => /^\d[\d,]*$/.test(h.textContent ?? ''))).toBe(false);
  });
});

describe('War room: timeline states', () => {
  it('shows a loading line while the timeline loads, and "Timeline unavailable." only in the overview when it failed', async () => {
    render(<Host loadTimeline={() => new Promise(() => {})} />);
    await screen.findByRole('list', { name: /conflicts league/i });
    expect(screen.getByText(/loading the timeline/i)).toBeTruthy();
    cleanup();
    await overview(<Host loadTimeline={async () => null} />);
    expect(screen.getByText(/timeline unavailable/i)).toBeTruthy();
    await open(/Alpha - Beta/);
    expect(screen.queryByText(/timeline unavailable/i)).toBeNull(); // a conflict that no theatre covers must not claim a missing timeline
  });
  it('shows the newest 8 entries by default', async () => {
    const tl: TimelineFile = timelineFixture();
    const base = tl.theatres[0]!.entries[0]!;
    tl.theatres[0]!.entries = Array.from({ length: 12 }, (_, i) => ({ ...base, date: `2026-04-${String(i + 1).padStart(2, '0')}`, title: `Event ${i + 1}` }));
    await overview(<Host loadTimeline={async () => tl} />);
    const list = await screen.findByRole('list', { name: /key events/i });
    expect(within(list).getAllByRole('listitem').length).toBeLessThanOrEqual(8);
    expect(within(list).getAllByRole('listitem').length).toBeGreaterThanOrEqual(8);
  });
  it('keeps bubbles and stream dots out of the tab order (the league and the timeline list are the keyboard equivalents)', async () => {
    await overview();
    const bubbles = screen.getAllByRole('button', { name: /deaths in 365 days, activity/ });
    expect(bubbles.every((b) => b.getAttribute('tabindex') === '-1')).toBe(true);
    const dots = screen.getAllByRole('button', { name: /\(confirmed\)|\(reported\)|\(disputed\)/ }).filter((b) => b.className.includes('absolute'));
    expect(dots.every((b) => b.getAttribute('tabindex') === '-1')).toBe(true);
  });
});

describe('War room: a conflict\'s weekly chart by kind', () => {
  it('stacks the weeks by kind of violence when the data has them, and keeps one layer when it does not', async () => {
    const f = file();
    const w = Array.from({ length: 52 }, (_, i) => i + 1);
    f.conflicts[0] = conflict({ id: 'a', name: 'Alpha - Beta', weekly: w, weeklyByKind: byKind(w.map((v) => v - 1), w.map(() => 1), w.map(() => 0)) });
    render(<Host load={async () => f} />);
    await screen.findByRole('list', { name: /conflicts league/i });
    await open(/Alpha - Beta/);
    expect(document.querySelectorAll('[data-layer="state"], [data-layer="non-state"], [data-layer="one-sided"]').length).toBe(3);
    cleanup();
    await overview();
    await open(/Alpha - Beta/);
    expect(document.querySelectorAll('[data-layer="deaths"]').length).toBe(1);
  });
});
