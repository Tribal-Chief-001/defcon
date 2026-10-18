// @vitest-environment jsdom
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CountryRow } from '../src/dossier/types';

const countries = vi.hoisted(() => ({ rows: [] as unknown[], gate: null as Promise<void> | null }));
const globe = vi.hoisted(() => ({ dive: null as { id: string } | null | undefined }));

vi.mock('../src/globe/GlobeCanvas', () => ({
  GlobeCanvas: ({ dive }: { dive?: { id: string } | null }) => {
    globe.dive = dive;
    return <div data-testid="globe" data-dive={dive?.id ?? ''} />;
  },
}));
vi.mock('../src/events/service', () => ({ startEventService: () => () => {} }));
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
    await waitFor(() => expect(screen.getByTestId('globe').getAttribute('data-dive')).toBe('IND'));
    expect(location.hash).toBe('#c=IND');
    expect(await screen.findByRole('heading', { name: 'Country IND' })).toBeTruthy();
  });
  it('accepts an ISO3 code that differs from the map id (SSD -> SDS)', async () => {
    history.replaceState(null, '', '/#c=SSD');
    render(<App />);
    await waitFor(() => expect(screen.getByTestId('globe').getAttribute('data-dive')).toBe('SDS'));
    expect(location.hash).toBe('#c=SDS');
  });
  it('prefers an exact map id over a territory that shares its ISO3 code (FRA vs Clipperton)', async () => {
    countries.rows = [row('CLP', 'FRA'), row('FRA', 'FRA')];
    history.replaceState(null, '', '/#c=FRA');
    render(<App />);
    await waitFor(() => expect(screen.getByTestId('globe').getAttribute('data-dive')).toBe('FRA'));
    expect(location.hash).toBe('#c=FRA');
  });
  it('does not fly anywhere, opens no dossier and clears the hash for an unknown id', async () => {
    history.replaceState(null, '', '/#c=XXX');
    render(<App />);
    await waitFor(() => expect(location.hash).toBe(''));
    expect(screen.getByTestId('globe').getAttribute('data-dive')).toBe('');
    expect(screen.queryByLabelText('Country dossier')).toBeNull();
  });
  it('Esc closes the dossier even while the dive is still loading its country row', async () => {
    let open!: () => void;
    countries.gate = new Promise<void>((r) => (open = r));
    history.replaceState(null, '', '/#c=IND');
    render(<App />);
    await screen.findByLabelText('Country dossier');
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(screen.queryByLabelText('Country dossier')).toBeNull();
    await act(async () => open()); // the late row must not reopen the dive
    expect(screen.getByTestId('globe').getAttribute('data-dive')).toBe('');
    expect(location.hash).toBe('');
  });
});
