// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearDossierCache } from '../../src/dossier/load';
import { decodeSnapshot } from '../../src/events/snapshot';
import { useEvents } from '../../src/events/store';
import type { Dossier } from '../../src/dossier/types';
import type { Relations } from '../../src/relations/types';
import { useTime } from '../../src/time/store';
import { encodeSnapshot } from '../../scripts/events/encode';
import { AboutPage } from '../../src/ui/AboutPage';
import { worldFixture } from '../conflicts/fixture';
import { ConflictsPage } from '../../src/ui/ConflictsPage';
import { CommandPalette } from '../../src/ui/CommandPalette';
import { DossierPanel } from '../../src/ui/DossierPanel';
import { EventCard } from '../../src/ui/EventCard';
import { NightWatch } from '../../src/ui/NightWatch';
import { Rails } from '../../src/ui/Rails';
import { RelationsBlock } from '../../src/ui/RelationsBlock';
import { Reticle } from '../../src/ui/Reticle';
import { Scrubber } from '../../src/ui/Scrubber';
import { SkipLink } from '../../src/ui/SkipLink';
import { SoundToggle } from '../../src/ui/SoundToggle';
import { StatusRegion } from '../../src/ui/status';
import { TopBar } from '../../src/ui/TopBar';

const rel: Relations = { generated: '2026-10-18', alliances: [{ id: 'nato', name: 'NATO', kind: 'multilateral', members: ['FRA', 'USA'], source: 's', url: 'https://x.org', asOf: '2026-10-18' }], disputes: [] };
vi.mock('../../src/relations/load', () => ({ loadRelations: async () => rel }));

// color-contrast cannot run in jsdom (no layout or paint): it is covered by tests/a11y/contrast.test.ts on the design tokens
const check = async (node: Element) => {
  const r = await axe.run(node as HTMLElement, { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } });
  return r.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(' | ')})`);
};

const NOW = Math.floor(Date.now() / 1000);
const snap = () => {
  const e = encodeSnapshot([], { asOfS: NOW, generatedS: NOW, windowFromS: NOW - 365 * 86400, windowToS: NOW, sources: [] });
  return decodeSnapshot(e.bin.buffer.slice(e.bin.byteOffset, e.bin.byteOffset + e.bin.byteLength) as ArrayBuffer, e.meta);
};
const dossier: Dossier = {
  id: 'FRA', iso2: 'FR', iso3: 'FRA', name: 'France', formalName: 'French Republic', type: 'Sovereign country', continent: 'Europe', subregion: 'Western Europe',
  capitals: [{ name: 'Paris', lat: 48.8, lon: 2.3 }], neighbours: ['DEU'], population: { value: 68e6, source: 'World Bank WDI', asOf: '2025' }, areaKm2: null, gdpUsd: null,
  milExpUsd: null, milExpGdpPct: null, governmentType: null, languages: null, independence: null, organisations: null,
  un: { value: 'member', source: 'UN', asOf: '2026-10-18' }, nato: { value: true, source: 'NATO', asOf: '2026-10-18' },
};
const res = (body: unknown, status = 200) => ({ ok: status === 200, status, json: async () => body }) as Response;

beforeEach(() => {
  clearDossierCache();
  useTime.setState({ backS: 0, playing: false });
  useEvents.setState({ recent: snap(), archive: undefined, status: 'ready' });
  window.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
  vi.stubGlobal('fetch', vi.fn(async (url: string) => (url.endsWith('/index.json') ? res([{ id: 'FRA', name: 'France', iso2: 'FR', iso3: 'FRA', capitals: ['Paris'], continent: 'Europe', lat: 1, lon: 2, hasPolygon: true }]) : /dossiers\/(\w+)\.json/.test(url) ? res(dossier) : res({}, 404))));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('axe (rules jsdom supports)', () => {
  it('canary: the harness really detects a violation (an image without alt text, a button without a name)', async () => {
    const { container } = render(<div><img src="x.png" /><button /></div>);
    const found = (await check(container)).join('\n');
    expect(found).toMatch(/image-alt/);
    expect(found).toMatch(/button-name/);
  });
  it('top bar with its controls row', async () => {
    const { container } = render(<TopBar><CommandPalette index={[]} onPick={() => {}} /><SoundToggle /></TopBar>);
    expect(await check(container)).toEqual([]);
  });
  it('the open command palette', async () => {
    render(<CommandPalette index={[{ id: 'FRA', name: 'France', iso2: 'FR', iso3: 'FRA', capitals: ['Paris'], continent: 'Europe', lat: 1, lon: 2, hasPolygon: true }]} onPick={() => {}} />);
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'fra' } });
    expect(await check(document.body)).toEqual([]);
  });
  it('a loaded dossier and a failed one', async () => {
    const { container, unmount } = render(<DossierPanel countryId="FRA" onClose={() => {}} nowS={NOW} />);
    await screen.findByRole('heading', { name: 'France' });
    expect(await check(container)).toEqual([]);
    unmount();
    clearDossierCache();
    const failed = render(<DossierPanel countryId="XXX" onClose={() => {}} nowS={NOW} />);
    await waitFor(() => expect(screen.getByText(/dossier unavailable/i)).toBeTruthy());
    expect(await check(failed.container)).toEqual([]);
  });
  it('an event card with and without detail', async () => {
    const info = { kind: 'armed' as const, severity: 3, human: true, timeS: NOW - 3600, precision: 2, country: 'FRA' };
    const detail = { place: 'Paris', headline: 'h', actors: 'A', deaths: 1, sources: [{ name: 'src', url: 'https://example.com' }], alsoIds: [] };
    const a = render(<EventCard detail={detail} info={info} onClose={() => {}} />);
    expect(await check(a.container)).toEqual([]);
    a.unmount();
    const b = render(<EventCard detail={null} info={info} onClose={() => {}} />);
    expect(await check(b.container)).toEqual([]);
  });
  it('the About page with and without a snapshot', async () => {
    const a = render(<AboutPage onClose={() => {}} />);
    expect(await check(a.container)).toEqual([]);
    a.unmount();
    useEvents.setState({ recent: undefined, archive: undefined });
    const b = render(<AboutPage onClose={() => {}} />);
    expect(await check(b.container)).toEqual([]);
  });
  it('the War tracker: list, detail, error and loading states', async () => {
    const r = { best: 5, low: 4, high: 9 };
    const c = { id: 'a', name: 'Alpha war', kinds: ['state' as const], countries: [{ id: 'IND', name: 'India', deaths365: 5 }], deaths: { d30: r, d90: r, d365: r }, events: { d30: 1, d90: 1, d365: 1 }, trend: 'rising' as const, lastDate: '2026-08-30', weekly: Array.from({ length: 52 }, (_, i) => i), latest: [{ id: 'e', date: '2026-08-30', place: 'Town', country: 'India', lat: 1, lon: 2, precision: 1, kind: 'state' as const, deaths: r, headline: 'Shelling', sources: ['Agency'], provisional: true }], provisionalShare: 0.5 };
    const file = { generated: '2026-10-18', dataEnd: '2026-08-31', sources: ['t'], conflicts: [c], world: worldFixture() };
    const a = render(<ConflictsPage selected={null} onSelect={() => {}} onClose={() => {}} onDive={() => {}} load={async () => file} />);
    expect(await check(a.container)).toEqual([]); // loading
    await screen.findByRole('button', { name: /Alpha war/ });
    expect(await check(a.container)).toEqual([]);
    a.unmount();
    const b = render(<ConflictsPage selected="a" onSelect={() => {}} onClose={() => {}} onDive={() => {}} load={async () => file} />);
    await screen.findByRole('region', { name: 'Alpha war' });
    expect(await check(b.container)).toEqual([]);
    b.unmount();
    const w = render(<ConflictsPage selected="world" onSelect={() => {}} onClose={() => {}} onDive={() => {}} load={async () => file} />);
    await screen.findByRole('region', { name: /World overview/ });
    expect(await check(w.container)).toEqual([]);
    w.unmount();
    const d = render(<ConflictsPage selected={null} onSelect={() => {}} onClose={() => {}} onDive={() => {}} load={async () => Promise.reject(new Error('Could not load the conflicts data'))} />);
    await screen.findByRole('alert');
    expect(await check(d.container)).toEqual([]);
  });
  it('the Hotspots and Latest rails', async () => {
    const { container } = render(<Rails dossierOpen={false} cardOpen={false} onDive={() => {}} onOpenEvent={() => {}} />);
    expect(await check(container)).toEqual([]);
  });
  it('the scrubber', async () => {
    const { container } = render(<Scrubber />);
    expect(await check(container)).toEqual([]);
  });
  it('the relations block', async () => {
    const { container } = render(<RelationsBlock countryId="FRA" names={new Map([['USA', 'United States']])} />);
    await screen.findByText(/United States/);
    expect(await check(container)).toEqual([]);
  });
  it('Night Watch, the reticle, the skip link and the status region', async () => {
    const { container } = render(<><SkipLink /><StatusRegion /><NightWatch active caption="PARIS // 2026-10-18 04:12 UTC // ARMED CONFLICT" /><Reticle /></>);
    expect(await check(container)).toEqual([]);
  });
});
