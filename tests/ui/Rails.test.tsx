// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { decodeSnapshot } from '../../src/events/snapshot';
import { useEvents } from '../../src/events/store';
import { useTime } from '../../src/time/store';
import { Rails } from '../../src/ui/Rails';
import { encodeSnapshot } from '../../scripts/events/encode';
import type { Ev } from '../../src/events/types';

vi.mock('../../src/dossier/load', () => ({
  loadIndex: async () => [
    { id: 'AAA', name: 'Aland', iso2: null, iso3: 'AAA', capitals: [], continent: null, lat: 0, lon: 0, hasPolygon: true },
    { id: 'BBB', name: '<img src=x onerror=alert(1)>', iso2: null, iso3: 'BBB', capitals: [], continent: null, lat: 0, lon: 0, hasPolygon: true },
  ],
}));

const NOW = Math.floor(Date.now() / 1000);
let n = 0;
const ev = (o: Partial<Ev>): Ev => ({
  id: `e${n++}`, source: 'ucdp', alsoIds: [], timeS: NOW - 3600, lat: 10, lon: 20, precision: 1, country: 'AAA', kind: 'armed', deaths: 1, severity: 3, human: true,
  place: '', headline: '', actors: '', sources: [], firstSeenS: NOW, updatedS: NOW, ...o,
});
const snap = (events: Ev[]) => {
  const e = encodeSnapshot(events, { asOfS: NOW, generatedS: NOW, sources: [] });
  return decodeSnapshot(e.bin.buffer.slice(e.bin.byteOffset, e.bin.byteOffset + e.bin.byteLength) as ArrayBuffer, e.meta);
};
const props = (o: Partial<Parameters<typeof Rails>[0]> = {}) => ({ dossierOpen: false, cardOpen: false, onDive: vi.fn(), onOpenEvent: vi.fn(), ...o });

beforeEach(() => {
  useTime.setState({ backS: 0, playing: false });
  useEvents.setState({ recent: snap([ev({ country: 'AAA' }), ev({ country: 'AAA' }), ev({ country: 'BBB', timeS: NOW - 600 }), ev({ country: 'ZZZ', timeS: NOW - 1200 })]), archive: undefined, status: 'ready' });
});
afterEach(cleanup);

describe('Rails', () => {
  it('lists hotspots and latest events with country names, falling back to the id, and no NaN or undefined', async () => {
    render(<Rails {...props()} />);
    const hot = screen.getByRole('complementary', { name: /hotspots/i });
    await waitFor(() => expect(hot.textContent).toContain('Aland'));
    expect(hot.textContent).toContain('ZZZ'); // not in the index: the id
    expect(document.body.textContent).not.toMatch(/NaN|undefined/);
    expect(screen.getByRole('complementary', { name: /latest events/i }).textContent).toMatch(/Armed · human/);
  });
  it('shows country names as text, never as markup', async () => {
    const { container } = render(<Rails {...props()} />);
    await waitFor(() => expect(container.textContent).toContain('<img src=x'));
    expect(container.querySelector('img')).toBeNull();
  });
  it('a hotspot dives into the country and a latest row opens that event', async () => {
    const p = props();
    render(<Rails {...p} />);
    const hot = screen.getByRole('complementary', { name: /hotspots/i });
    await waitFor(() => expect(hot.textContent).toContain('Aland'));
    fireEvent.click(screen.getByRole('button', { name: /Aland, 2 events in 7 days/ }));
    expect(p.onDive).toHaveBeenCalledWith('AAA');
    fireEvent.click(screen.getAllByRole('button', { name: /show on the globe/i })[0]!);
    expect(p.onOpenEvent).toHaveBeenCalledTimes(1);
    expect((p.onOpenEvent as ReturnType<typeof vi.fn>).mock.calls[0]![0]).toMatchObject({ lat: 10, lon: 20 });
  });
  it('hides Hotspots while a dossier is open and Latest while an event card is open', () => {
    const a = render(<Rails {...props({ dossierOpen: true })} />);
    expect(screen.queryByRole('complementary', { name: /hotspots/i })).toBeNull();
    expect(screen.getByRole('complementary', { name: /latest events/i })).toBeTruthy();
    a.unmount();
    render(<Rails {...props({ cardOpen: true })} />);
    expect(screen.queryByRole('complementary', { name: /latest events/i })).toBeNull();
    expect(screen.getByRole('complementary', { name: /hotspots/i })).toBeTruthy();
  });
  it('says "live view only" during time travel instead of numbers', () => {
    useTime.setState({ backS: 5 * 86400 });
    render(<Rails {...props()} />);
    expect(screen.getAllByText(/live view only/i).length).toBe(2);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
  it('says so when there is no data or no recent events', () => {
    useEvents.setState({ recent: undefined, archive: undefined });
    const a = render(<Rails {...props()} />);
    expect(screen.getAllByText(/no event data loaded/i).length).toBe(2);
    a.unmount();
    useEvents.setState({ recent: snap([ev({ timeS: NOW - 20 * 86400 })]) });
    render(<Rails {...props()} />);
    expect(screen.getAllByText(/no events in the last 7 days/i).length).toBe(2);
  });
  // review findings
  it('tells screen readers whether a latest event is human-coded or auto-coded', async () => {
    useEvents.setState({ recent: snap([ev({ country: 'AAA', human: true }), ev({ country: 'BBB', human: false, timeS: NOW - 100 })]) });
    render(<Rails {...props()} />);
    const labels = screen.getAllByRole('button', { name: /show on the globe/i }).map((b) => b.getAttribute('aria-label'));
    expect(labels.some((l) => /human-coded/.test(l!))).toBe(true);
    expect(labels.some((l) => /auto-coded/.test(l!))).toBe(true);
  });
  it('keeps both rails inside short screens (own scroll) and the right rail clear of an open dossier below 1500 px', () => {
    const a = render(<Rails {...props()} />);
    for (const el of screen.getAllByRole('complementary')) expect(el.className).toMatch(/max-h-\[calc\(100vh-/);
    expect(screen.getByRole('complementary', { name: /latest events/i }).className).toContain('min-[1100px]:flex');
    a.unmount();
    render(<Rails {...props({ dossierOpen: true })} />);
    expect(screen.getByRole('complementary', { name: /latest events/i }).className).toContain('min-[1500px]:flex');
  });
  it('explains that the order uses the score while the number is the event count, in readable text', () => {
    render(<Rails {...props()} />);
    const note = screen.getByText(/order and bars use/i);
    expect(note.className).toContain('text-[var(--text-muted)]');
  });

  it('renders nothing while the War room is open (suppressed)', () => {
    const { container } = render(<Rails {...props({ suppressed: true })} />);
    expect(container.textContent).toBe('');
    expect(screen.queryByRole('complementary')).toBeNull();
  });
});

