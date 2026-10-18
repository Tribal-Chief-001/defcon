// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Relations } from '../../src/relations/types';

const state = vi.hoisted(() => ({ result: null as unknown, fail: false }));
vi.mock('../../src/relations/load', () => ({ loadRelations: async () => (state.fail ? Promise.reject(new Error('x')) : state.result) }));

import { RelationsBlock } from '../../src/ui/RelationsBlock';

const al = (id: string, name: string, members: string[]) => ({ id, name, kind: 'multilateral' as const, members, source: 'NATO page', url: 'https://www.nato.int/x', asOf: '2026-10-18' });
const rel: Relations = {
  generated: '2026-10-18',
  alliances: [al('nato', 'NATO', ['FRA', 'USA']), al('csto', 'CSTO', ['RUS', 'BLR'])],
  disputes: [{ a: 'RUS', b: 'UKR', conflict: 'Russia - Ukraine', lastYear: 2026, events: 10319, source: 'UCDP', url: 'https://ucdp.uu.se/downloads/' }],
};
const names = new Map([['FRA', 'France'], ['USA', 'United States'], ['RUS', 'Russia'], ['BLR', 'Belarus'], ['UKR', 'Ukraine'], ['IND', 'India'], ['BAD', '<img src=x onerror=alert(1)>']]);

beforeEach(() => {
  state.result = rel;
  state.fail = false;
});
afterEach(cleanup);

describe('RelationsBlock', () => {
  it('shows allies with the alliance name and active disputes with the count, as names not ids', async () => {
    render(<RelationsBlock countryId="RUS" names={names} />);
    expect(await screen.findByText(/Belarus/)).toBeTruthy();
    expect(screen.getAllByText(/CSTO/).length).toBeGreaterThanOrEqual(1);
    expect(document.body.textContent).toMatch(/Ukraine \(Russia - Ukraine: 10,319 events/);
    expect(screen.getByText(/10,319 events, last 2026/)).toBeTruthy();
  });
  it('says none on record (not a redaction bar) for a country with no relations', async () => {
    render(<RelationsBlock countryId="IND" names={names} />);
    await waitFor(() => expect(screen.getAllByText(/none on record/i).length).toBe(2));
  });
  it('shows an unavailable redaction bar when the data fails to load', async () => {
    state.fail = true;
    render(<RelationsBlock countryId="FRA" names={names} />);
    expect((await screen.findAllByText('unavailable')).length).toBeGreaterThanOrEqual(1);
    expect(document.body.textContent).not.toMatch(/undefined|NaN/);
  });
  it('links sources over https only with rel noopener noreferrer', async () => {
    render(<RelationsBlock countryId="FRA" names={names} />);
    await screen.findByText(/United States/);
    const links = Array.from(document.querySelectorAll('a'));
    expect(links.length).toBeGreaterThan(0);
    for (const a of links) {
      expect(a.getAttribute('href')).toMatch(/^https:\/\//);
      expect(a.getAttribute('rel')).toBe('noopener noreferrer');
    }
  });
  it('renders names with markup characters as text', async () => {
    state.result = { ...rel, alliances: [al('x', 'Pact', ['FRA', 'BAD'])] };
    const { container } = render(<RelationsBlock countryId="FRA" names={names} />);
    await screen.findByText(/<img src=x/);
    expect(container.querySelector('img')).toBeNull();
  });
});
