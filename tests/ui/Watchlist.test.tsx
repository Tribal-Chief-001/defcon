// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useEvents } from '../../src/events/store';
import type { Snapshot } from '../../src/events/snapshot';
import { useWatchlist } from '../../src/watchlist/watchlist';
import { useStatus } from '../../src/ui/status';
import { WatchAlerts } from '../../src/ui/WatchAlerts';
import { WatchPanel } from '../../src/ui/WatchPanel';
import { WatchToggle } from '../../src/ui/WatchToggle';

vi.mock('../../src/dossier/load', () => ({ loadIndex: async () => [{ id: 'UKR', name: 'Ukraine' }, { id: 'IND', name: 'India' }] }));

const NOW = Math.floor(Date.now() / 1000);
const snap = (events: { c: string; t: number }[]): Snapshot => {
  const countries = ['', 'UKR', 'IND'];
  return { n: events.length, timeS: Uint32Array.from(events.map((e) => e.t)), lat: new Float32Array(events.length), lon: new Float32Array(events.length), detailIdx: new Uint32Array(events.length), country: Uint16Array.from(events.map((e) => countries.indexOf(e.c))), kind: new Uint8Array(events.length), severity: new Uint8Array(events.length), precision: new Uint8Array(events.length), human: new Uint8Array(events.length), countries, meta: { asOfS: NOW } as never };
};

beforeEach(() => {
  localStorage.clear();
  useWatchlist.setState({ ids: [], seen: {} });
  useEvents.setState({ recent: undefined, archive: undefined, status: 'idle' } as never);
  useStatus.setState({ message: '' });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('WatchToggle', () => {
  it('adds and removes the country, says so, and reads as a pressed button', () => {
    render(<WatchToggle countryId="UKR" name="Ukraine" />);
    const b = screen.getByRole('button', { name: /watch ukraine/i });
    expect(b.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(b);
    expect(useWatchlist.getState().ids).toEqual(['UKR']);
    expect(screen.getByRole('button', { name: /watch ukraine/i }).getAttribute('aria-pressed')).toBe('true');
    expect(useStatus.getState().message).toMatch(/watching ukraine/i);
    fireEvent.click(screen.getByRole('button', { name: /watch ukraine/i }));
    expect(useWatchlist.getState().ids).toEqual([]);
  });
  it('says when the list is full', () => {
    useWatchlist.setState({ ids: Array.from({ length: 20 }, (_, i) => `B${String(i).padStart(2, '0')}`), seen: {} });
    render(<WatchToggle countryId="UKR" name="Ukraine" />);
    fireEvent.click(screen.getByRole('button', { name: /watch ukraine/i }));
    expect(useWatchlist.getState().ids).not.toContain('UKR');
    expect(useStatus.getState().message).toMatch(/full/i);
  });
  it('marks a watched country as seen when its dossier is shown', () => {
    useWatchlist.setState({ ids: ['UKR'], seen: { UKR: 5 } });
    render(<WatchToggle countryId="UKR" name="Ukraine" />);
    expect(useWatchlist.getState().seen.UKR).toBeGreaterThan(NOW - 5);
  });
});

describe('WatchPanel', () => {
  it('is hidden with an empty list, and shows how many new events each watched country has', async () => {
    const { container } = render(<WatchPanel onOpen={() => {}} />);
    expect(container.textContent).toBe('');
    cleanup();
    useWatchlist.setState({ ids: ['UKR', 'IND'], seen: { UKR: NOW - 3600, IND: NOW - 3600 } });
    useEvents.setState({ recent: snap([{ c: 'UKR', t: NOW - 60 }, { c: 'UKR', t: NOW - 120 }]), status: 'ok' } as never);
    render(<WatchPanel onOpen={() => {}} />);
    const open = screen.getByRole('button', { name: /watching \(2 new\)/i });
    fireEvent.click(open);
    const rows = within(await screen.findByRole('list', { name: /watched countries/i })).getAllByRole('listitem');
    expect(rows[0]!.textContent).toMatch(/Ukraine.*2 new events/);
    expect(rows[1]!.textContent).toMatch(/India.*nothing new/);
  });
  it('opens a country, marks it seen and removes it', async () => {
    useWatchlist.setState({ ids: ['UKR'], seen: { UKR: NOW - 3600 } });
    useEvents.setState({ recent: snap([{ c: 'UKR', t: NOW - 60 }]), status: 'ok' } as never);
    const onOpen = vi.fn();
    render(<WatchPanel onOpen={onOpen} />);
    fireEvent.click(screen.getByRole('button', { name: /watching/i }));
    await screen.findByRole('list', { name: /watched countries/i });
    fireEvent.click(screen.getByRole('button', { name: /^open ukraine/i }));
    expect(onOpen).toHaveBeenCalledWith('UKR');
    fireEvent.click(screen.getByRole('button', { name: /mark ukraine as seen/i }));
    expect(useWatchlist.getState().seen.UKR).toBeGreaterThan(NOW - 5);
    expect(screen.getByRole('list', { name: /watched countries/i }).textContent).toMatch(/nothing new/);
    fireEvent.click(screen.getByRole('button', { name: /remove ukraine/i }));
    expect(useWatchlist.getState().ids).toEqual([]);
  });
  it('turns notifications on only by a click, and says when the browser blocks them', async () => {
    const request = vi.fn(async () => 'granted');
    const N = Object.assign(vi.fn(), { permission: 'default', requestPermission: request });
    vi.stubGlobal('Notification', N);
    useWatchlist.setState({ ids: ['UKR'], seen: { UKR: NOW } });
    render(<WatchPanel onOpen={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /watching/i }));
    expect(request).not.toHaveBeenCalled();
    fireEvent.click(await screen.findByRole('button', { name: /enable notifications/i }));
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
    cleanup();
    vi.stubGlobal('Notification', Object.assign(vi.fn(), { permission: 'denied', requestPermission: request }));
    render(<WatchPanel onOpen={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /watching/i }));
    expect((await screen.findByRole('region', { name: /^watching$/i })).textContent).toMatch(/blocked in your browser/i);
  });
  it('says it is kept in this browser and that alerts are not warnings, and has no accessibility violations', async () => {
    useWatchlist.setState({ ids: ['UKR'], seen: { UKR: NOW } });
    render(<WatchPanel onOpen={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /watching/i }));
    const panel = await screen.findByRole('region', { name: /^watching$/i });
    expect(panel.textContent).toMatch(/kept in this browser only/i);
    expect(panel.textContent).toMatch(/not warnings/i);
    expect((await axe.run(panel, { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } })).violations.map((v) => v.id)).toEqual([]);
  });
});

describe('WatchAlerts and WatchPanel: review findings', () => {
  it('does not crash when the Notification constructor throws (Android Chrome: Illegal constructor), and still announces', async () => {
    const N = Object.assign(vi.fn(() => { throw new TypeError('Illegal constructor'); }), { permission: 'granted', requestPermission: vi.fn() });
    vi.stubGlobal('Notification', N);
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    useWatchlist.setState({ ids: ['UKR'], seen: { UKR: NOW - 3600 } });
    render(<WatchAlerts />);
    act(() => useEvents.setState({ recent: snap([{ c: 'UKR', t: NOW - 60 }]), status: 'ok' } as never));
    await waitFor(() => expect(useStatus.getState().message).toBe('1 new event in Ukraine'));
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
  });
  it('announces only the countries whose count grew, not every watched country', async () => {
    useWatchlist.setState({ ids: ['UKR', 'IND'], seen: { UKR: NOW - 3600, IND: NOW - 3600 } });
    render(<WatchAlerts />);
    act(() => useEvents.setState({ recent: snap([{ c: 'UKR', t: NOW - 60 }]), status: 'ok' } as never));
    await waitFor(() => expect(useStatus.getState().message).toBe('1 new event in Ukraine'));
    act(() => useEvents.setState({ recent: snap([{ c: 'UKR', t: NOW - 60 }, { c: 'IND', t: NOW - 30 }]), status: 'ok' } as never));
    await waitFor(() => expect(useStatus.getState().message).toBe('1 new event in India'));
  });
  it('Esc in the Watching panel closes only the panel (not the dossier or the War room behind it) and returns focus to its button', async () => {
    useWatchlist.setState({ ids: ['UKR'], seen: { UKR: NOW } });
    const outer = vi.fn();
    window.addEventListener('keydown', outer);
    render(<WatchPanel onOpen={() => {}} />);
    const trigger = screen.getByRole('button', { name: /watching/i });
    fireEvent.click(trigger);
    const panel = await screen.findByRole('region', { name: /^watching$/i });
    fireEvent.keyDown(within(panel).getAllByRole('button')[0]!, { key: 'Escape' });
    expect(screen.queryByRole('region', { name: /^watching$/i })).toBeNull();
    expect(outer).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /watching/i }));
    window.removeEventListener('keydown', outer);
  });
  it('enables notifications also where requestPermission uses the old callback style (returns nothing)', async () => {
    const N = Object.assign(vi.fn(), { permission: 'default', requestPermission: vi.fn(() => { (N as unknown as { permission: string }).permission = 'granted'; }) });
    vi.stubGlobal('Notification', N);
    useWatchlist.setState({ ids: ['UKR'], seen: { UKR: NOW } });
    render(<WatchPanel onOpen={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /watching/i }));
    fireEvent.click(await screen.findByRole('button', { name: /enable notifications/i }));
    await waitFor(() => expect(screen.getByRole('region', { name: /^watching$/i }).textContent).toMatch(/notifications are on/i));
  });
});

describe('WatchAlerts', () => {
  it('announces new events of a watched country when a snapshot arrives, once, and not for what was already seen', async () => {
    useWatchlist.setState({ ids: ['UKR'], seen: { UKR: NOW - 3600 } });
    render(<WatchAlerts />);
    expect(useStatus.getState().message).toBe('');
    act(() => useEvents.setState({ recent: snap([{ c: 'UKR', t: NOW - 60 }, { c: 'UKR', t: NOW - 90 }]), status: 'ok' } as never));
    await waitFor(() => expect(useStatus.getState().message).toBe('2 new events in Ukraine'));
    useStatus.setState({ message: '' });
    act(() => useEvents.setState({ recent: snap([{ c: 'UKR', t: NOW - 60 }, { c: 'UKR', t: NOW - 90 }]), status: 'ok' } as never)); // the same events again
    await new Promise((r) => setTimeout(r, 20));
    expect(useStatus.getState().message).toBe('');
  });
  it('shows a browser notification only when it was allowed and the page is hidden', async () => {
    const N = Object.assign(vi.fn(), { permission: 'granted', requestPermission: vi.fn() });
    vi.stubGlobal('Notification', N);
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    useWatchlist.setState({ ids: ['UKR'], seen: { UKR: NOW - 3600 } });
    render(<WatchAlerts />);
    act(() => useEvents.setState({ recent: snap([{ c: 'UKR', t: NOW - 60 }]), status: 'ok' } as never));
    await waitFor(() => expect(N).toHaveBeenCalledWith('Defcon', expect.objectContaining({ body: '1 new event in Ukraine' })));
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
  });
});
