// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { EventCard } from '../../src/ui/EventCard';
import type { Detail } from '../../src/events/types';

const NOW = Date.UTC(2026, 9, 18, 12) / 1000;
const detail: Detail = {
  place: 'Kabul, Afghanistan', headline: 'A headline', actors: 'A - B', deaths: null,
  sources: [{ name: 'example.com', url: 'https://example.com/story' }, { name: 'Reuters' }], alsoIds: ['gdelt:1', 'gdelt:2'],
};
const info = { kind: 'armed' as const, severity: 3 as const, human: false, timeS: NOW - 2 * 3600, precision: 2, country: 'AFG' };
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
});
