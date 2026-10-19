// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { signalsFixture } from '../signals/fixture';
import { EventCard } from '../../src/ui/EventCard';
import type { Detail } from '../../src/events/types';

const mocks = vi.hoisted(() => ({ loadSignals: vi.fn() }));
vi.mock('../../src/signals/load', () => ({ loadSignals: mocks.loadSignals }));

const NOW = Date.UTC(2026, 9, 18, 12) / 1000;
const detail: Detail = {
  place: 'Kabul, Afghanistan', headline: 'A headline', actors: 'A - B', deaths: null,
  sources: [{ name: 'example.com', url: 'https://example.com/story' }, { name: 'Reuters' }], alsoIds: ['gdelt:1', 'gdelt:2'],
};
const info = { kind: 'armed' as const, severity: 3 as const, human: false, timeS: NOW - 2 * 3600, precision: 2, country: 'AFG' };
beforeEach(() => mocks.loadSignals.mockReset().mockResolvedValue(null));
afterEach(cleanup);

describe('EventCard', () => {
  it('labels auto-coded events and shows deaths as unavailable when unknown', () => {
    render(<EventCard detail={detail} info={info} nowS={NOW} onClose={() => {}} />);
    expect(screen.getByText('AUTO-CODED')).toBeTruthy();
    expect(screen.getByText('unavailable')).toBeTruthy();
    expect(screen.getByText('Kabul, Afghanistan')).toBeTruthy();
    expect(screen.getByText(/reported 2 h ago/i)).toBeTruthy(); // GDELT only knows when an event was first reported
  });
  it('labels human-coded events and shows a known death count', () => {
    render(<EventCard detail={{ ...detail, deaths: 7 }} info={{ ...info, human: true }} nowS={NOW} onClose={() => {}} />);
    expect(screen.getByText('HUMAN-CODED')).toBeTruthy();
    expect(screen.getByText('7')).toBeTruthy();
    expect(screen.getByText('2026-10-18')).toBeTruthy(); // human-coded events show their date (UCDP has no time of day)
    expect(screen.queryByText(/ago/i)).toBeNull();
  });
  it('renders source links that open safely, and plain text for sources without a URL', () => {
    render(<EventCard detail={detail} info={info} nowS={NOW} onClose={() => {}} />);
    const link = screen.getByRole('link', { name: 'example.com' }) as HTMLAnchorElement;
    expect(link.href).toBe('https://example.com/story');
    expect(link.rel).toContain('noopener');
    expect(link.rel).toContain('noreferrer');
    expect(link.target).toBe('_blank');
    expect(screen.getByText('Reuters').closest('a')).toBeNull();
  });
  it('only links http(s) URLs', () => {
    render(<EventCard detail={{ ...detail, sources: [{ name: 'bad', url: 'javascript:alert(1)' }] }} info={info} nowS={NOW} onClose={() => {}} />);
    expect(screen.queryByRole('link')).toBeNull();
  });
  it('shows a loading state while the detail is not available yet', () => {
    render(<EventCard detail={null} info={info} nowS={NOW} onClose={() => {}} />);
    expect(screen.getByText(/loading detail/i)).toBeTruthy();
  });
  // Declassify is cosmetic: every detail stays readable at every age, only the bars change
  it('always shows the real detail text; the bars shrink for older events and when the scrubber is rewound', async () => {
    const { useTime } = await import('../../src/time/store');
    const barWidth = (c: HTMLElement) => parseFloat((c.querySelector('[data-bar]') as HTMLElement).style.width);
    const fresh = render(<EventCard detail={{ ...detail, deaths: 7 }} info={{ ...info, timeS: NOW - 3600 }} nowS={NOW} onClose={() => {}} />);
    expect(screen.getByText('A - B')).toBeTruthy();
    expect(screen.getByText('7')).toBeTruthy();
    const wFresh = barWidth(fresh.container);
    expect(wFresh).toBe(100);
    cleanup();
    const old = render(<EventCard detail={{ ...detail, deaths: 7 }} info={{ ...info, timeS: NOW - 30 * 86400 }} nowS={NOW} onClose={() => {}} />);
    expect(screen.getByText('A - B')).toBeTruthy();
    expect(screen.getByText('7')).toBeTruthy();
    expect(barWidth(old.container)).toBe(0);
    expect(document.querySelectorAll('[data-bar][aria-hidden="true"]').length).toBeGreaterThan(0);
    cleanup();
    useTime.setState({ backS: 20 * 86400 }); // rewinding the scrubber declassifies: the same fresh event loses its bars
    const scrubbed = render(<EventCard detail={detail} info={{ ...info, timeS: NOW - 3600 }} nowS={NOW} onClose={() => {}} />);
    expect(barWidth(scrubbed.container)).toBe(0);
    useTime.setState({ backS: 0 });
  });
  it('returns focus to the globe when the opener no longer exists', () => {
    const canvas = document.createElement('canvas');
    canvas.id = 'globe-canvas';
    canvas.tabIndex = 0;
    const opener = document.createElement('button');
    document.body.append(canvas, opener);
    opener.focus();
    const { unmount } = render(<EventCard detail={detail} info={info} nowS={NOW} onClose={() => {}} />);
    opener.remove();
    unmount();
    expect(document.activeElement).toBe(canvas);
    canvas.remove();
  });
});

describe('EventCard: evidence trail', () => {
  const GEN = Date.parse(signalsFixture().generated) / 1000;
  const card = (o: { human?: boolean; at?: { lat: number; lon: number }; timeS?: number; precision?: number; alsoIds?: string[]; sources?: Detail['sources'] } = {}) =>
    render(<EventCard detail={{ ...detail, sources: o.sources ?? detail.sources, alsoIds: o.alsoIds ?? detail.alsoIds }} info={{ ...info, human: o.human ?? false, timeS: o.timeS ?? GEN - 3600, precision: o.precision ?? 2 }} at={o.at} nowS={GEN} onClose={() => {}} />);
  const trail = () => screen.getByRole('region', { name: /evidence trail/i });

  it('says how the event was coded, how precise its place is, and how many sources and merged reports it has', () => {
    card({ human: false, precision: 5, alsoIds: ['a', 'b'] });
    const t = trail().textContent ?? '';
    expect(t).toMatch(/auto-coded from a news report.*not reviewed by a person/i);
    expect(t).toMatch(/only a region or country/i);
    expect(t).toMatch(/2 sources listed/);
    expect(t).toMatch(/merged with 2 other reports/i);
    cleanup();
    card({ human: true, precision: 1, sources: [], alsoIds: [] });
    const u = trail().textContent ?? '';
    expect(u).toMatch(/human-coded by UCDP/i);
    expect(u).toMatch(/exact place/i);
    expect(u).toMatch(/no sources listed/i);
  });

  it('lists the signals near the event as context, with distances and never as confirmation', async () => {
    mocks.loadSignals.mockResolvedValue(signalsFixture());
    card({ at: { lat: 12.8, lon: 13.8 } });
    expect(await screen.findByText(/fire detections/i)).toBeTruthy();
    const t = trail().textContent ?? '';
    expect(t).toMatch(/km away/);
    expect(t).toMatch(/a fire has many causes/i);
    expect(t).toMatch(/not confirmation/i);
    expect(t).not.toMatch(/confirmed|proves an|verified/i);
  });

  it('says plainly when nothing is near, when the event is older than the signals, and when the signals are unavailable', async () => {
    mocks.loadSignals.mockResolvedValue(signalsFixture());
    card({ at: { lat: -30, lon: 100 } });
    expect(await screen.findByText(/no signal near this event/i)).toBeTruthy();
    expect(trail().textContent).toMatch(/proves nothing either way/i);
    cleanup();
    card({ at: { lat: 12.8, lon: 13.8 }, timeS: GEN - 9 * 86400 });
    expect(await screen.findByText(/older than the 7 days/i)).toBeTruthy();
    cleanup();
    mocks.loadSignals.mockResolvedValue(null);
    card({ at: { lat: 12.8, lon: 13.8 } });
    expect(await screen.findByText(/signals are unavailable/i)).toBeTruthy();
  });
});
