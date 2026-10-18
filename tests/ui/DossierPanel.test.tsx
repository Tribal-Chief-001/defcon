// @vitest-environment jsdom
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DossierPanel } from '../../src/ui/DossierPanel';
import { Field } from '../../src/ui/Field';
import { Sparkline } from '../../src/ui/Sparkline';
import { clearDossierCache } from '../../src/dossier/load';
import { decodeSnapshot } from '../../src/events/snapshot';
import { useEvents } from '../../src/events/store';
import { encodeSnapshot } from '../../scripts/events/encode';
import type { Dossier } from '../../src/dossier/types';
import type { Ev } from '../../src/events/types';

const NOW = Date.UTC(2026, 9, 18, 5, 0, 0) / 1000;
const prov = (source: string, asOf: string) => ({ source, asOf });
const base: Dossier = {
  id: 'IND', iso2: 'IN', iso3: 'IND', name: 'India', formalName: 'Republic of India', type: 'Sovereign country', continent: 'Asia', subregion: 'Southern Asia',
  capitals: [{ name: 'New Delhi', lat: 28.6, lon: 77.2 }], neighbours: ['PAK', 'CHN'],
  population: { value: 1463865525, ...prov('World Bank WDI', '2025') }, areaKm2: { value: 3287263, ...prov('World Bank WDI', '2024') },
  gdpUsd: null, milExpUsd: { value: 92057013588, ...prov('SIPRI via World Bank WDI', '2025') }, milExpGdpPct: { value: 2.29, ...prov('SIPRI via World Bank WDI', '2025') },
  governmentType: { value: 'federal parliamentary republic', ...prov('CIA World Factbook (archived)', '2026-01-22') }, languages: null, independence: null, organisations: null,
  un: { value: 'member', ...prov('United Nations member states list', '2026-10-18') }, nato: { value: false, ...prov('NATO member countries page', '2026-10-18') },
};
const index = [
  { id: 'IND', name: 'India', iso2: 'IN', iso3: 'IND', capitals: ['New Delhi'], continent: 'Asia', lat: 1, lon: 2, hasPolygon: true },
  { id: 'PAK', name: 'Pakistan', iso2: 'PK', iso3: 'PAK', capitals: ['Islamabad'], continent: 'Asia', lat: 1, lon: 2, hasPolygon: true },
  { id: 'CHN', name: 'China', iso2: 'CN', iso3: 'CHN', capitals: ['Beijing'], continent: 'Asia', lat: 1, lon: 2, hasPolygon: true },
];
const res = (body: unknown, status = 200) => ({ ok: status === 200, status, json: async () => body }) as Response;
const stubFetch = (dossiers: Record<string, Dossier | 404>, delay: Record<string, Promise<void>> = {}) =>
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if (url.endsWith('/index.json')) return res(index);
    const id = /dossiers\/([A-Z0-9]+)\.json/.exec(url)![1]!;
    await delay[id];
    const d = dossiers[id];
    return d === 404 || !d ? res({}, 404) : res(d);
  }));

const ev = (o: Partial<Ev>): Ev => ({
  id: `e${Math.random()}`, source: 'ucdp', alsoIds: [], timeS: NOW - 3600, lat: 10, lon: 20, precision: 1, country: 'IND', kind: 'armed', deaths: 1, severity: 2, human: true,
  place: '', headline: '', actors: '', sources: [], firstSeenS: NOW, updatedS: NOW, ...o,
});
const snap = (events: Ev[]) => {
  const e = encodeSnapshot(events, { asOfS: NOW, generatedS: NOW, sources: [] });
  return decodeSnapshot(e.bin.buffer.slice(e.bin.byteOffset, e.bin.byteOffset + e.bin.byteLength) as ArrayBuffer, e.meta);
};

beforeEach(() => {
  clearDossierCache();
  useEvents.setState({ recent: undefined, archive: undefined, status: 'idle', error: undefined, archiveError: undefined });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('Field', () => {
  it('shows the value and puts source and date in the accessible name', () => {
    render(<Field label="Population" field={base.population} format={(n) => n.toLocaleString('en-US')} />);
    const row = screen.getByRole('group', { name: /Population: 1,463,865,525\. Source: World Bank WDI, as of 2025/ });
    expect(row.getAttribute('tabindex')).toBe('0');
    expect(row.getAttribute('title')).toMatch(/World Bank WDI/);
  });
  it('shows a redaction bar that says unavailable (no number, no undefined/NaN) for null', () => {
    render(<Field label="GDP" field={null} format={(n: number) => String(n)} />);
    expect(screen.getByRole('group', { name: 'GDP: unavailable' })).toBeTruthy();
    expect(screen.getByText('unavailable')).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/undefined|NaN/);
  });
  it('adds the field note (for example the Factbook sunset) to the title', () => {
    render(<Field label="Government" field={{ value: 'x', source: 'CIA', asOf: '2026-01-22', note: 'discontinued' }} />);
    expect(screen.getByRole('group').getAttribute('title')).toMatch(/discontinued/);
  });
});

describe('Sparkline', () => {
  it('draws a polyline with an accessible title and no NaN for all-zero and normal data', () => {
    const { container, rerender } = render(<Sparkline data={Array(30).fill(0)} />);
    expect(container.querySelector('svg')!.getAttribute('role')).toBe('img');
    expect(container.querySelector('polyline')!.getAttribute('points')).not.toMatch(/NaN/);
    rerender(<Sparkline data={[0, 3, 1, 7, 2]} />);
    expect(screen.getByTitle(/peak 7/i)).toBeTruthy();
    rerender(<Sparkline data={[]} />);
    expect(container.querySelector('polyline')!.getAttribute('points') ?? '').not.toMatch(/NaN/);
  });
});

describe('DossierPanel', () => {
  it('shows the dossier: name, capital, neighbours as names, formatted numbers, unavailable rows, sources footer', async () => {
    stubFetch({ IND: base });
    render(<DossierPanel countryId="IND" onClose={() => {}} nowS={NOW} />);
    expect(await screen.findByRole('heading', { name: 'India' })).toBeTruthy();
    expect(screen.getByText('New Delhi')).toBeTruthy();
    await waitFor(() => expect(screen.getByText(/Pakistan/)).toBeTruthy());
    expect(screen.getByText(/China/)).toBeTruthy();
    expect(screen.getByText('1,463,865,525')).toBeTruthy();
    expect(screen.getByText(/3,287,263 km/)).toBeTruthy();
    expect(screen.getAllByText('unavailable').length).toBeGreaterThanOrEqual(3); // GDP, languages, independence, organisations
    expect(screen.getAllByText(/member/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/^Sources$/i)).toBeTruthy();
    expect(screen.getAllByText(/CC BY 4\.0/).length).toBeGreaterThanOrEqual(1);
  });
  it('shows alternate capitals muted and the capital note as visible text (not only a hover title)', async () => {
    const d: Dossier = { ...base, id: 'BDI', name: 'Burundi', iso3: 'BDI', capitals: [{ name: 'Bujumbura', lat: -3.4, lon: 29.4, note: 'CIA World Factbook lists: Gitega' }, { name: 'Gitega', lat: -3.4, lon: 29.9, alt: true }] };
    stubFetch({ BDI: d });
    render(<DossierPanel countryId="BDI" onClose={() => {}} nowS={NOW} />);
    await screen.findByRole('heading', { name: 'Burundi' });
    expect(screen.getByText(/Gitega \(alt\.\)/)).toBeTruthy();
    expect(screen.getByText('CIA World Factbook lists: Gitega')).toBeTruthy();
  });
  // keyboard: opening moves focus into the panel, closing puts it back where it was
  it('takes focus when it opens and returns it to the opener when it closes', async () => {
    stubFetch({ IND: base });
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();
    const { unmount } = render(<DossierPanel countryId="IND" onClose={() => {}} nowS={NOW} />);
    await screen.findByRole('heading', { name: 'India' });
    expect(document.activeElement).toBe(screen.getByLabelText('Country dossier'));
    unmount();
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });
  it('says "auto-coded data only" instead of a tension level when the window is not comparable', async () => {
    stubFetch({ IND: base });
    useEvents.setState({ recent: snap([ev({ human: false, kind: 'protest' }), ev({ human: false, kind: 'armed', lat: 11 })]), status: 'ready' });
    render(<DossierPanel countryId="IND" onClose={() => {}} nowS={NOW} />);
    await screen.findByRole('heading', { name: 'India' });
    expect(screen.getByText(/auto-coded data only/i)).toBeTruthy();
    expect(screen.queryByText(/tension \d\/5/i)).toBeNull();
    expect(screen.getByText('2')).toBeTruthy(); // total events in 30 days
  });
  it('shows the DEFCON-style level when it is comparable (human-coded)', async () => {
    stubFetch({ IND: base });
    useEvents.setState({ recent: snap([ev({}), ev({ lat: 11 })]), status: 'ready' });
    render(<DossierPanel countryId="IND" onClose={() => {}} nowS={NOW} />);
    await screen.findByRole('heading', { name: 'India' });
    expect(screen.getByText(/tension \d\/5/i)).toBeTruthy();
    expect(screen.getByText(/DEFCON-style/i)).toBeTruthy();
  });
  // Review Focus 6
  it('shows only the latest country when the user switches quickly (a slow first response must not win)', async () => {
    let releaseA!: () => void;
    const slowA = new Promise<void>((r) => (releaseA = r));
    stubFetch({ IND: base, PAK: { ...base, id: 'PAK', name: 'Pakistan', iso3: 'PAK' } }, { IND: slowA });
    const { rerender } = render(<DossierPanel countryId="IND" onClose={() => {}} nowS={NOW} />);
    rerender(<DossierPanel countryId="PAK" onClose={() => {}} nowS={NOW} />);
    expect(await screen.findByRole('heading', { name: 'Pakistan' })).toBeTruthy();
    await act(async () => {
      releaseA();
      await Promise.resolve();
    });
    expect(screen.getByRole('heading', { name: 'Pakistan' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'India' })).toBeNull();
  });
  it('shows an error state with a working close button when the dossier cannot be loaded', async () => {
    stubFetch({ IND: 404 });
    const onClose = vi.fn();
    render(<DossierPanel countryId="IND" onClose={onClose} nowS={NOW} />);
    expect(await screen.findByText(/dossier unavailable/i)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });
  it('renders hostile names and text as text, not HTML', async () => {
    stubFetch({ IND: { ...base, name: '<img src=x onerror=alert(1)>', governmentType: { value: '<b>bold</b>', ...prov('s', 'a') } } });
    const { container } = render(<DossierPanel countryId="IND" onClose={() => {}} nowS={NOW} />);
    await screen.findByRole('heading');
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('b')).toBeNull();
    expect(screen.getByRole('heading').textContent).toBe('<img src=x onerror=alert(1)>');
  });
});
