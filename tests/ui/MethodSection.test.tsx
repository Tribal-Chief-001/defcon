// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MethodSection } from '../../src/ui/MethodSection';
import { indicesFixture } from '../indices/fixture';

const mocks = vi.hoisted(() => ({ loadIndices: vi.fn() }));
vi.mock('../../src/indices/load', async (orig) => ({ ...(await orig<typeof import('../../src/indices/load')>()), loadIndices: mocks.loadIndices }));

afterEach(cleanup);
beforeEach(() => mocks.loadIndices.mockReset().mockResolvedValue(indicesFixture()));
const shown = async () => {
  const r = render(<MethodSection />);
  await screen.findByRole('table', { name: /backtest results/i });
  return r;
};

describe('MethodSection', () => {
  it('defines both indices, the bands and the 90% interval', async () => {
    await shown();
    const t = document.body.textContent ?? '';
    expect(t).toMatch(/Fatality Index/);
    expect(t).toMatch(/Instability Index/);
    expect(t).toMatch(/100 × log10\(1 \+ deaths in 90 days\) ÷ log10\(10,001\)/);
    expect(t).toMatch(/25 to 999/);
    expect(t).toMatch(/5th to 95th percentile/);
  });

  it('lists every model feature from the data file', async () => {
    await shown();
    const list = screen.getByRole('list', { name: /model features/i });
    expect(within(list).getAllByRole('listitem')).toHaveLength(indicesFixture().model.features.length);
    expect(list.textContent).toMatch(/Government effectiveness/);
  });

  it('prints the backtest numbers of the data file, with the persistence baseline', async () => {
    await shown();
    const t = screen.getByRole('table', { name: /backtest results/i }).textContent ?? '';
    expect(t).toMatch(/0\.846/); // rise AUC
    expect(t).toMatch(/0\.742/); // persistence AUC for rise
    expect(t).toMatch(/0\.983/);
    expect(t).toMatch(/10\.5%/); // Brier skill
    expect(t).toMatch(/7,410/);
    expect(document.body.textContent).toMatch(/2021-01 to 2025-09/);
  });

  it('shows the backtest year by year, from the data file', async () => {
    await shown();
    const t = screen.getByRole('table', { name: /backtest by year/i });
    expect(within(t).getAllByRole('row')).toHaveLength(1 + indicesFixture().model.rolling.length);
    expect(t.textContent).toMatch(/2024/);
    expect(t.textContent).toMatch(/0\.810/); // the rise AUC of 2024
  });
  it('gives the calibration as a table (predicted against observed per bin and the 30%+ bucket) next to the chart', async () => {
    await shown();
    const t = screen.getByRole('table', { name: /calibration.*sharp rise/i });
    expect(within(t).getAllByRole('row')).toHaveLength(1 + 5 + 1);
    expect(t.textContent).toMatch(/0\.5%/);
    expect(t.textContent).toMatch(/30% or more/);
    expect(screen.getByRole('img', { name: /calibration.*sharp rise.*predicted.*observed/i })).toBeTruthy();
  });

  it('states the limits, including the ones that are specific to this model', async () => {
    await shown();
    const t = screen.getByRole('list', { name: /limits/i }).textContent ?? '';
    for (const re of [new RegExp(`${indicesFixture().countries.length} countries`), /estimates/, /perceptions/, /one time split/, /training/i, /onset/i, /provisional/i, /not modelled/i, /spread evenly/i, /extrapolat/i, /a year after/i, /Gaza and the West Bank/i, /not the official US DEFCON level/i]) expect(t).toMatch(re);
  });

  it('cites UCDP and the World Bank with their licences, as links', async () => {
    await shown();
    const t = document.body.textContent ?? '';
    expect(t).toMatch(/CC BY 4\.0/);
    expect(t).toMatch(/Davies, Pettersson and Öberg/);
    expect(t).toMatch(/Kaufmann/);
    expect(screen.getAllByRole('link').every((a) => a.getAttribute('href')?.startsWith('https://'))).toBe(true);
  });

  it('says so, and shows nothing else, when the data file cannot be loaded', async () => {
    mocks.loadIndices.mockResolvedValue(null);
    render(<MethodSection />);
    await waitFor(() => expect(screen.getByText(/method is unavailable/i)).toBeTruthy());
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('has no accessibility violations', async () => {
    const { container } = await shown();
    expect((await axe.run(container, { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } })).violations.map((v) => v.id)).toEqual([]);
  });
});
