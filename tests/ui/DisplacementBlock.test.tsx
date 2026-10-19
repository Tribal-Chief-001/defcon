// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DisplacementBlock } from '../../src/ui/DisplacementBlock';
import { displacementFixture } from '../displacement/fixture';

const mocks = vi.hoisted(() => ({ loadDisplacement: vi.fn() }));
vi.mock('../../src/displacement/load', () => ({ loadDisplacement: mocks.loadDisplacement }));

beforeEach(() => mocks.loadDisplacement.mockReset().mockResolvedValue(displacementFixture()));
afterEach(cleanup);
const region = () => screen.getByRole('region', { name: /displacement/i });

describe('DisplacementBlock', () => {
  it('shows the figures of a country with the year, in words, and never mixes them with deaths', async () => {
    render(<DisplacementBlock iso3="AFG" />);
    await screen.findByRole('region', { name: /displacement/i });
    const t = region().textContent ?? '';
    expect(t).toMatch(/UNHCR, 2025/);
    expect(t).toMatch(/Refugees from this country.*2,671,560/);
    expect(t).toMatch(/Asylum-seekers from this country.*270,007/);
    expect(t).toMatch(/Displaced inside the country.*3,199,023/);
    expect(t).toMatch(/Refugees hosted here.*20,869/);
    expect(t).toMatch(/not conflict deaths/i);
  });
  it('writes "none reported" for a 0 (UNHCR\'s API writes 0 where it has no figure) and "not reported" for a missing one, never a bare 0 (review finding)', async () => {
    render(<DisplacementBlock iso3="ABW" />);
    await screen.findByRole('region', { name: /displacement/i });
    const t = region().textContent ?? '';
    expect(t).toMatch(/Displaced inside the country.*not reported/);
    expect(t).toMatch(/Refugees from this country.*none reported/);
    expect(t).not.toMatch(/Refugees from this country\s*0\b/);
    expect(t).toMatch(/Refugees hosted here.*not reported/);
  });
  it('shows only what exists for a country that only hosts, and a plain line for a country UNHCR has nothing on', async () => {
    render(<DisplacementBlock iso3="NZL" />);
    await screen.findByRole('region', { name: /displacement/i });
    expect(region().textContent).toMatch(/Refugees hosted here.*1,500/);
    expect(region().textContent).not.toMatch(/Refugees from this country/);
    cleanup();
    render(<DisplacementBlock iso3="ZZZ" />);
    await screen.findByRole('region', { name: /displacement/i });
    expect(region().textContent).toMatch(/no UNHCR figures for this country in 2025/i);
  });
  it('credits UNHCR as it asks, links the terms and the methodology, and does not imply endorsement', async () => {
    render(<DisplacementBlock iso3="AFG" />);
    await screen.findByRole('region', { name: /displacement/i });
    expect(region().textContent).toMatch(/UNHCR Refugee Population Statistics Database/);
    expect(region().textContent).toMatch(/CC BY 4\.0/);
    const links = screen.getAllByRole('link').map((a) => (a as HTMLAnchorElement).href);
    expect(links).toContain('https://www.unhcr.org/what-we-do/data-and-publications/data-and-statistics/terms-use-datasets');
    expect(links).toContain('https://www.unhcr.org/refugee-statistics/methodology/');
    expect(region().textContent).not.toMatch(/endorse|approved by|in partnership/i);
  });
  it('is not shown for a territory that shares its parent\'s ISO3 code (Ashmore and Cartier is not Australia)', async () => {
    const { container } = render(<DisplacementBlock iso3="AFG" territory />);
    await new Promise((r) => setTimeout(r, 10));
    expect(container.textContent).toBe('');
  });
  it('renders nothing for a country without an ISO3 code and nothing when the file cannot be loaded', async () => {
    const { container } = render(<DisplacementBlock iso3={null} />);
    expect(container.textContent).toBe('');
    cleanup();
    mocks.loadDisplacement.mockResolvedValue(null);
    const r = render(<DisplacementBlock iso3="AFG" />);
    await waitFor(() => expect(mocks.loadDisplacement).toHaveBeenCalled());
    await new Promise((res) => setTimeout(res, 10));
    expect(r.container.textContent).toBe('');
  });
  it('has no accessibility violations', async () => {
    render(<DisplacementBlock iso3="AFG" />);
    await screen.findByRole('region', { name: /displacement/i });
    expect((await axe.run(region(), { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } })).violations.map((v) => v.id)).toEqual([]);
  });
});
