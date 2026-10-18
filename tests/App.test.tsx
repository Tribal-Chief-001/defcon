// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CountryRow } from '../src/dossier/types';
import { decodeSnapshot } from '../src/events/snapshot';
import { useEvents } from '../src/events/store';
import { encodeSnapshot } from '../scripts/events/encode';

const countries = vi.hoisted(() => ({ rows: [] as unknown[], gate: null as Promise<void> | null }));
const globe = vi.hoisted(() => ({ dive: null as { id: string } | null | undefined }));

vi.mock('../src/globe/GlobeCanvas', () => ({
  GlobeCanvas: ({ dive }: { dive?: { id: string } | null }) => {
    globe.dive = dive;
    return <div data-testid="globe" data-dive={dive?.id ?? ''} />;
  },
}));
vi.mock('../src/events/service', () => ({ startEventService: () => () => {} }));
vi.mock('../src/timeline/load', () => ({ loadTimeline: async () => null, resetTimelineCache: () => {} }));
vi.mock('../src/conflicts/load', () => {
  const r = { best: 5, low: 4, high: 9 };
  const c = (id: string, name: string, cid: string | null) => ({ id, name, kinds: ['state'], countries: [{ id: cid, name: 'Indialand', deaths365: 50 }], deaths: { d30: r, d90: r, d365: r }, events: { d30: 1, d90: 1, d365: 1 }, trend: 'steady', lastDate: '2026-08-30', weekly: new Array(52).fill(0), latest: [], provisionalShare: 0, geo: null });
  const file = { generated: '2026-10-18', dataEnd: '2026-08-31', sources: ['t'], world: { deaths: { d30: r, d90: r, d365: r }, byKind: { state: { d90: r, d365: r }, 'non-state': { d90: r, d365: r }, 'one-sided': { d90: r, d365: r } }, weekly: new Array(52).fill(0), weeklyByKind: { state: new Array(52).fill(0), 'non-state': new Array(52).fill(0), 'one-sided': new Array(52).fill(0) }, countries: [], conflictsListed: 2, latest: [] }, conflicts: [c('alpha-war', 'Alpha war', 'IND'), c('beta-war', 'Beta war', null)] };
  return { loadConflicts: async () => file, resetConflictsCache: () => {} };
});
vi.mock('../src/dossier/load', async (orig) => ({
  ...(await orig<typeof import('../src/dossier/load')>()),
  loadCountries: async () => {
    await countries.gate;
    return countries.rows;
  },
  loadIndex: async () => [],
  loadDossier: async (id: string) => ({
    id, iso2: null, iso3: id, name: `Country ${id}`, formalName: null, type: 'Sovereign country', continent: null, subregion: null,
    capitals: [], neighbours: [], population: null, areaKm2: null, gdpUsd: null, milExpUsd: null, milExpGdpPct: null,
    governmentType: null, languages: null, independence: null, organisations: null, un: null, nato: null,
  }),
}));

import { App } from '../src/App';

const row = (id: string, iso3: string): CountryRow => ({
  id, iso3, iso2: null, name: id, formalName: null, type: 'Sovereign country', continent: null, subregion: null, lat: 1, lon: 2, hasPolygon: true, bbox: [0, 0, 4, 4], neighbours: [],
});

beforeEach(() => {
  countries.rows = [row('IND', 'IND'), row('SDS', 'SSD')];
  countries.gate = null;
  globe.dive = undefined;
  window.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
});
afterEach(() => {
  cleanup();
  history.replaceState(null, '', '/');
});

// review finding: a shared #c=IND link must still be there, and still dive, when the page opens
describe('App deep links and dive state', () => {
  it('dives into the country in the URL hash on load and keeps the hash', async () => {
    history.replaceState(null, '', '/#c=IND');
    render(<App />);
    await waitFor(() => expect(screen.getByTestId('globe').getAttribute('data-dive')).toBe('IND'), { timeout: 4000 });
    await waitFor(() => expect(location.hash).toBe('#c=IND'), { timeout: 4000 }); // the hash effect runs after the render
    expect(await screen.findByRole('heading', { name: 'Country IND' }, { timeout: 4000 })).toBeTruthy();
  });
  it('accepts an ISO3 code that differs from the map id (SSD -> SDS)', async () => {
    history.replaceState(null, '', '/#c=SSD');
    render(<App />);
    await waitFor(() => expect(screen.getByTestId('globe').getAttribute('data-dive')).toBe('SDS'), { timeout: 4000 });
    await waitFor(() => expect(location.hash).toBe('#c=SDS'), { timeout: 4000 }); // the hash effect runs after the render
  });
  it('prefers an exact map id over a territory that shares its ISO3 code (FRA vs Clipperton)', async () => {
    countries.rows = [row('CLP', 'FRA'), row('FRA', 'FRA')];
    history.replaceState(null, '', '/#c=FRA');
    render(<App />);
    await waitFor(() => expect(screen.getByTestId('globe').getAttribute('data-dive')).toBe('FRA'), { timeout: 4000 });
    await waitFor(() => expect(location.hash).toBe('#c=FRA'), { timeout: 4000 }); // the hash effect runs after the render
  });
  it('does not fly anywhere, opens no dossier and clears the hash for an unknown id', async () => {
    history.replaceState(null, '', '/#c=XXX');
    render(<App />);
    await waitFor(() => expect(location.hash).toBe(''), { timeout: 4000 });
    expect(screen.getByTestId('globe').getAttribute('data-dive')).toBe('');
    expect(screen.queryByLabelText('Country dossier')).toBeNull();
  });
  it('Esc closes the dossier even while the dive is still loading its country row', async () => {
    let open!: () => void;
    countries.gate = new Promise<void>((r) => (open = r));
    history.replaceState(null, '', '/#c=IND');
    render(<App />);
    await screen.findByLabelText('Country dossier', undefined, { timeout: 4000 });
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(screen.queryByLabelText('Country dossier')).toBeNull();
    await act(async () => open()); // the late row must not reopen the dive
    expect(screen.getByTestId('globe').getAttribute('data-dive')).toBe('');
    expect(location.hash).toBe('');
  });

  // keyboard: Esc closes the topmost layer only
  it('Esc inside the open palette closes the palette but leaves the dossier open', async () => {
    history.replaceState(null, '', '/#c=IND');
    render(<App />);
    await screen.findByRole('heading', { name: 'Country IND' }, { timeout: 4000 });
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    const box = await screen.findByRole('combobox');
    fireEvent.keyDown(box, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull(), { timeout: 4000 });
    expect(screen.getByLabelText('Country dossier')).toBeTruthy();
    expect(location.hash).toBe('#c=IND');
  });
  it('announces a dive in a polite live status region', async () => {
    history.replaceState(null, '', '/#c=IND');
    render(<App />);
    const status = await screen.findByRole('status', undefined, { timeout: 4000 });
    await waitFor(() => expect(status.textContent).toMatch(/Showing Country IND|Showing IND/), { timeout: 4000 });
    expect(status.getAttribute('aria-live')).toBe('polite');
  });

  it('opens About from #about on load without diving, and Esc closes it and restores the hash', async () => {
    history.replaceState(null, '', '/#about');
    render(<App />);
    const dialog = await screen.findByRole('dialog', undefined, { timeout: 4000 });
    expect(dialog).toBeTruthy();
    expect(screen.getByTestId('globe').getAttribute('data-dive')).toBe('');
    fireEvent.keyDown(dialog, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull(), { timeout: 4000 });
    await waitFor(() => expect(location.hash).toBe(''), { timeout: 4000 });
  });
  it('the top-bar About button opens it, and closing it brings the dossier link back', async () => {
    history.replaceState(null, '', '/#c=IND');
    render(<App />);
    await screen.findByRole('heading', { name: 'Country IND' }, { timeout: 4000 });
    fireEvent.click(screen.getByRole('button', { name: /^about$/i }));
    const dialog = await screen.findByRole('dialog', undefined, { timeout: 4000 });
    await waitFor(() => expect(location.hash).toBe('#about'), { timeout: 4000 });
    fireEvent.click(within(dialog).getByRole('button', { name: /close/i }));
    await waitFor(() => expect(location.hash).toBe('#c=IND'), { timeout: 4000 });
  });

  it("a Hotspots row opens that country's dossier", async () => {
    const NOW = Math.floor(Date.now() / 1000);
    const e = encodeSnapshot(
      [{ id: 'x1', source: 'ucdp', alsoIds: [], timeS: NOW - 3600, lat: 10, lon: 20, precision: 1, country: 'IND', kind: 'armed', deaths: 1, severity: 3, human: true, place: '', headline: '', actors: '', sources: [], firstSeenS: NOW, updatedS: NOW }],
      { asOfS: NOW, generatedS: NOW, sources: [] },
    );
    useEvents.setState({ recent: decodeSnapshot(e.bin.buffer.slice(e.bin.byteOffset, e.bin.byteOffset + e.bin.byteLength) as ArrayBuffer, e.meta), status: 'ready' });
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: /open dossier/i }, { timeout: 4000 }));
    expect(await screen.findByRole('heading', { name: 'Country IND' }, { timeout: 4000 })).toBeTruthy();
    useEvents.setState({ recent: undefined });
  });

  // review finding: a Latest row must open exactly the event it shows, even when several share a place and time
  it('a Latest row opens its own event, not a neighbour at the same place and time', async () => {
    const NOW = Math.floor(Date.now() / 1000);
    const same = { source: 'gdelt' as const, alsoIds: [], timeS: NOW - 600, lat: 10, lon: 20, precision: 3 as const, country: 'IND', kind: 'armed' as const, deaths: null, human: false, place: '', headline: '', actors: '', sources: [], firstSeenS: NOW, updatedS: NOW };
    const e = encodeSnapshot([{ ...same, id: 'a', severity: 1 }, { ...same, id: 'b', severity: 3 }], { asOfS: NOW, generatedS: NOW, sources: [] });
    const snap = decodeSnapshot(e.bin.buffer.slice(e.bin.byteOffset, e.bin.byteOffset + e.bin.byteLength) as ArrayBuffer, e.meta);
    useEvents.setState({ recent: snap, status: 'ready' });
    const shown = [...Array(snap.n).keys()].map((i) => snap.severity[i]!);
    const wanted = Math.max(...shown); // the row shows one of them; whichever it is, the card must agree
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => [{ place: 'P0', headline: '', actors: '', deaths: null, sources: [], alsoIds: [] }, { place: 'P1', headline: '', actors: '', deaths: null, sources: [], alsoIds: [] }] }) as Response));
    render(<App />);
    const row = (await screen.findAllByRole('button', { name: /show on the globe/i }, { timeout: 4000 }))[0]!;
    const rowSeverity = Number(/severity (\d) of 5/.exec(row.getAttribute('aria-label')!)![1]);
    fireEvent.click(row);
    const card = await screen.findByLabelText('Event details', undefined, { timeout: 4000 });
    await waitFor(() => expect(card.textContent).toMatch(new RegExp(`SEV ${rowSeverity}/5`)), { timeout: 4000 });
    expect(wanted).toBeGreaterThanOrEqual(rowSeverity);
    vi.unstubAllGlobals();
    useEvents.setState({ recent: undefined });
  });
});

describe('App War tracker', () => {
  it('the top-bar button opens it, #war mirrors it, and Esc closes it and clears the hash', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /^war tracker$/i }));
    const dialog = await screen.findByRole('dialog', { name: /war tracker/i }, { timeout: 4000 });
    await waitFor(() => expect(location.hash).toBe('#war'), { timeout: 4000 });
    await within(dialog).findByRole('button', { name: /Alpha war/ }, { timeout: 4000 });
    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull(), { timeout: 4000 });
    await waitFor(() => expect(location.hash).toBe(''), { timeout: 4000 });
  });
  it('opens one conflict from #war=<id> on load and writes the selection back to the hash', async () => {
    history.replaceState(null, '', '/#war=beta-war');
    render(<App />);
    const detail = await screen.findByRole('region', { name: 'Beta war' }, { timeout: 4000 });
    expect(detail).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Alpha war/ }));
    await waitFor(() => expect(location.hash).toBe('#war=alpha-war'), { timeout: 4000 });
  });
  it('an unknown #war=zzz shows the list, not a crash', async () => {
    history.replaceState(null, '', '/#war=zzz');
    render(<App />);
    expect(await screen.findByRole('button', { name: /Alpha war/ }, { timeout: 4000 })).toBeTruthy();
    expect(screen.queryByRole('region', { name: /war/i })).toBeNull();
  });
  it('a country in the detail closes the tracker and dives into it', async () => {
    history.replaceState(null, '', '/#war=alpha-war');
    render(<App />);
    const detail = await screen.findByRole('region', { name: 'Alpha war' }, { timeout: 4000 });
    fireEvent.click(within(detail).getByRole('button', { name: /Indialand/ }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull(), { timeout: 4000 });
    await waitFor(() => expect(location.hash).toBe('#c=IND'), { timeout: 4000 });
    await waitFor(() => expect(screen.getByTestId('globe').getAttribute('data-dive')).toBe('IND'), { timeout: 4000 });
  });
});
