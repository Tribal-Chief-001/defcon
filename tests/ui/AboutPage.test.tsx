// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { decodeSnapshot } from '../../src/events/snapshot';
import { useEvents } from '../../src/events/store';
import { AboutPage } from '../../src/ui/AboutPage';
import { encodeSnapshot } from '../../scripts/events/encode';

const NOW = Date.UTC(2026, 9, 18, 9) / 1000;
const snap = () => {
  const e = encodeSnapshot([], {
    asOfS: NOW, generatedS: NOW, sources: [
      { id: 'ucdp', name: 'UCDP GED / Candidate', version: 'GED 26.1 (1989-2025)', asOfS: Date.UTC(2026, 7, 31) / 1000, coverFromS: NOW - 365 * 86400, url: 'https://ucdp.uu.se/downloads/', license: 'CC BY 4.0' },
      { id: 'gdelt', name: 'GDELT 2.0 Events', version: '672 15-minute files', asOfS: NOW, coverFromS: NOW - 7 * 86400, url: 'https://www.gdeltproject.org', license: 'free; cite the GDELT Project' },
    ],
  });
  return decodeSnapshot(e.bin.buffer.slice(e.bin.byteOffset, e.bin.byteOffset + e.bin.byteLength) as ArrayBuffer, e.meta);
};

beforeEach(() => useEvents.setState({ recent: undefined, archive: undefined, status: 'idle' }));
afterEach(cleanup);

describe('AboutPage', () => {
  it('is a labelled modal dialog that closes with Esc and with the button', () => {
    let closed = 0;
    render(<AboutPage onClose={() => closed++} />);
    const d = screen.getByRole('dialog');
    expect(d.getAttribute('aria-modal')).toBe('true');
    expect(screen.getByRole('heading', { name: /about and sources/i })).toBeTruthy();
    fireEvent.keyDown(d, { key: 'Escape' });
    expect(closed).toBe(1);
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(closed).toBe(2);
  });
  it('states the map policy and that the tension index is not the official DEFCON level', () => {
    render(<AboutPage onClose={() => {}} />);
    expect(screen.getAllByText(/India's official map/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Natural Earth/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/not the official US DEFCON level/i).length).toBeGreaterThanOrEqual(1);
  });
  it('lists the event sources of the loaded snapshot with licence, version, as-of and coverage', () => {
    useEvents.setState({ recent: snap(), status: 'ready' });
    render(<AboutPage onClose={() => {}} />);
    expect(screen.getByText('UCDP GED / Candidate')).toBeTruthy();
    expect(screen.getByText(/GED 26\.1/)).toBeTruthy();
    expect(screen.getAllByText(/CC BY 4\.0/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('GDELT 2.0 Events')).toBeTruthy();
    expect(screen.getByText(/2026-08-31/)).toBeTruthy();
  });
  it('still renders, saying there is no event data, with no snapshot loaded, and lists the static dossier sources', () => {
    render(<AboutPage onClose={() => {}} />);
    expect(screen.getByText(/no event data loaded/i)).toBeTruthy();
    for (const s of [/World Bank/, /CIA World Factbook/, /Natural Earth/, /United Nations/]) expect(screen.getAllByText(s).length).toBeGreaterThanOrEqual(1);
  });
  it('says what the data does not cover and that nothing is tracked', () => {
    render(<AboutPage onClose={() => {}} />);
    expect(screen.getAllByText(/auto-coded/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/no cookies/i)).toBeTruthy();
    expect(screen.getByText(/no analytics/i)).toBeTruthy();
  });
  it('links over https only with rel noopener noreferrer, and shows source text as text', () => {
    useEvents.setState({ recent: snap(), status: 'ready' });
    render(<AboutPage onClose={() => {}} />);
    const links = Array.from(document.querySelectorAll('a'));
    expect(links.length).toBeGreaterThan(0);
    for (const a of links) {
      expect(a.getAttribute('href')).toMatch(/^https:\/\//);
      expect(a.getAttribute('rel')).toBe('noopener noreferrer');
    }
  });
  it('keeps Tab inside the dialog and takes focus when it opens', () => {
    render(<AboutPage onClose={() => {}} />);
    expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true);
    const focusables = screen.getByRole('dialog').querySelectorAll<HTMLElement>('a[href], button');
    const last = focusables[focusables.length - 1]!;
    last.focus();
    const proceeded = fireEvent.keyDown(last, { key: 'Tab' });
    expect(proceeded).toBe(false); // wrapped to the first element
    expect(document.activeElement).toBe(focusables[0]);
  });
});
