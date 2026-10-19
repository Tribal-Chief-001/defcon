// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetIndicesCache } from '../../src/indices/load';
import { indicesFixture } from '../indices/fixture';
import { decodeSnapshot } from '../../src/events/snapshot';
import { useEvents } from '../../src/events/store';
import { errorLog } from '../../src/lib/errorLog';
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
  it('shows local diagnostics (or says there are none) with a copy button', () => {
    errorLog.clear();
    const a = render(<AboutPage onClose={() => {}} />);
    expect(a.container.querySelector('[data-diagnostics]')!.textContent).toMatch(/no errors recorded/i);
    expect(screen.getByRole('button', { name: /copy diagnostics/i })).toBeTruthy();
    a.unmount();
    errorLog.record(new Error('panel exploded'), 'dossier');
    const b = render(<AboutPage onClose={() => {}} />);
    expect(b.container.querySelector('[data-diagnostics]')!.textContent).toMatch(/dossier: panel exploded/);
    errorLog.clear();
  });
  // review findings: keys must work even when focus has fallen back to the page, and the privacy text must be true
  it('closes with Esc and keeps Tab inside even when focus is on the body (a click on plain text)', () => {
    let closed = 0;
    render(<AboutPage onClose={() => closed++} />);
    (document.activeElement as HTMLElement).blur();
    expect(document.activeElement).toBe(document.body);
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(closed).toBe(1);
    const proceeded = fireEvent.keyDown(document.body, { key: 'Tab' });
    expect(proceeded).toBe(false);
    expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true);
  });
  it('lists everything the app stores in the browser, as the code does it', () => {
    const walk = (d: string): string[] => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : /\.tsx?$/.test(f) ? [join(d, f)] : []));
    const src = walk('src').filter((f) => !f.endsWith('AboutPage.tsx')).map((f) => readFileSync(f, 'utf8')).join('\n');
    const usesLocal = /localStorage\./.test(src);
    const usesSession = /sessionStorage/.test(src);
    expect(usesLocal && usesSession).toBe(true); // the audit below must be updated if either goes away
    render(<AboutPage onClose={() => {}} />);
    const text = document.body.textContent ?? '';
    expect(text).toMatch(/local storage/i);
    expect(text).toMatch(/session storage/i);
    expect(text).not.toMatch(/only thing stored/i);
  });
});

describe('AboutPage: the method of the indices', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    resetIndicesCache();
  });
  it('includes the Fatality and Instability method with the backtest table', async () => {
    resetIndicesCache();
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(indicesFixture()), { status: 200 })));
    render(<AboutPage onClose={() => {}} />);
    expect(await screen.findByRole('table', { name: /backtest results/i })).toBeTruthy();
    expect(screen.getByRole('heading', { name: /fatality and instability indices/i })).toBeTruthy();
  });
});

describe('AboutPage: opening at the method (finding: "How computed" landed at the top)', () => {
  it('scrolls the method section into view when asked, and not otherwise', () => {
    const scrolled: Element[] = [];
    Element.prototype.scrollIntoView = function (this: Element) { scrolled.push(this); };
    const { unmount } = render(<AboutPage onClose={() => {}} toMethod />);
    expect(scrolled).toHaveLength(1);
    expect(scrolled[0]!.hasAttribute('data-method')).toBe(true);
    unmount();
    scrolled.length = 0;
    render(<AboutPage onClose={() => {}} />);
    expect(scrolled).toHaveLength(0);
  });
});

describe('AboutPage: the Signals sources', () => {
  it('lists USGS, GDACS and NASA FIRMS with their licences', () => {
    render(<AboutPage onClose={() => {}} />);
    const t = screen.getByRole('dialog').textContent ?? '';
    expect(t).toMatch(/USGS earthquake feed/);
    expect(t).toMatch(/public domain, credit U\.S\. Geological Survey/);
    expect(t).toMatch(/GDACS.*CC BY 4\.0|CC BY 4\.0, credit to GDACS/);
    expect(t).toMatch(/NASA FIRMS.*open data|NASA open data, acknowledgement requested/);
  });
});

describe('AboutPage: UNHCR and open data', () => {
  it('lists UNHCR with its licence and points to the open data file list', () => {
    render(<AboutPage onClose={() => {}} />);
    const t = screen.getByRole('dialog').textContent ?? '';
    expect(t).toMatch(/UNHCR Refugee Population Statistics Database/);
    expect(t).toMatch(/CC BY 4\.0, credit UNHCR/);
    const a = screen.getByRole('link', { name: /list of files and rules/i }) as HTMLAnchorElement;
    expect(a.href).toBe('https://github.com/Tribal-Chief-001/defcon/blob/main/docs/OPEN-DATA.md');
  });
});
