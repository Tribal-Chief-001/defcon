// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Coverage } from '../../src/ui/Coverage';
import { decodeSnapshot } from '../../src/events/snapshot';
import { useEvents } from '../../src/events/store';
import { encodeSnapshot } from '../../scripts/events/encode';

const D = 86400;
const NOW = Date.UTC(2026, 9, 18, 1, 0, 0) / 1000;
const snapWith = (sources: Parameters<typeof encodeSnapshot>[1]['sources']) => {
  const e = encodeSnapshot([], { asOfS: NOW, generatedS: NOW, sources });
  return decodeSnapshot(e.bin.buffer.slice(0) as ArrayBuffer, e.meta);
};
const sources = [
  { id: 'ucdp' as const, name: 'UCDP', version: 'x', asOfS: Date.UTC(2026, 7, 31) / 1000, coverFromS: NOW - 365 * D, url: 'https://ucdp.uu.se', license: 'CC BY 4.0' },
  { id: 'gdelt' as const, name: 'GDELT', version: 'y', asOfS: NOW - 900, coverFromS: NOW - 7 * D, url: 'https://www.gdeltproject.org', license: 'free' },
];
beforeEach(() => useEvents.setState({ recent: undefined, archive: undefined, status: 'idle', error: undefined, archiveError: undefined }));
afterEach(cleanup);

// review finding: the UI must say what each kind of dot means and what the data does NOT cover
describe('Coverage', () => {
  it('explains filled vs hollow dots and the coverage of each source', () => {
    useEvents.setState({ recent: snapWith(sources), status: 'ready' });
    render(<Coverage />);
    expect(screen.getByText(/human-coded/i)).toBeTruthy();
    expect(screen.getAllByText(/auto-coded/i).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/to 31 aug 2026/i)).toBeTruthy();
    expect(screen.getByText(/last 7 days/i)).toBeTruthy();
    expect(screen.getByText(/protests are auto-coded only/i)).toBeTruthy();
  });
  it('renders nothing when no data is loaded', () => {
    const { container } = render(<Coverage />);
    expect(container.textContent).toBe('');
  });
});
