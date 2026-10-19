// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CountryIndex, IndicesFile } from '../../src/indices/types';
import { IndexBoard } from '../../src/ui/war/IndexBoard';
import { ecuador, indicesFixture, ukraine } from '../indices/fixture';

const mocks = vi.hoisted(() => ({ loadIndices: vi.fn(), loadIndex: vi.fn(), downloadText: vi.fn(() => true) }));
vi.mock('../../src/indices/load', async (orig) => ({ ...(await orig<typeof import('../../src/indices/load')>()), loadIndices: mocks.loadIndices }));
vi.mock('../../src/dossier/load', () => ({ loadIndex: mocks.loadIndex }));
vi.mock('../../src/exports/download', () => ({ downloadText: mocks.downloadText }));

afterEach(cleanup);

// 20 countries: id Cnn has rank nn + 1 (Ukraine is rank 1), so the list of 15 stops at C14, and a rise probability that does NOT follow the rank
const country = (n: number): CountryIndex => {
  const base = ecuador();
  const p = ((n * 7) % 20) / 40 + 0.01; // 0.01 ... 0.5, shuffled against the rank
  return { ...base, id: `C${String(n).padStart(2, '0')}`, fatality: { ...base.fatality, rank: n + 1, score: 90 - n, scoreLow: 80 - n, scoreHigh: 95 - n, deaths90: { best: 1000 - n * 10, low: 900 - n * 10, high: 1200 - n * 10 } }, risk: { ...base.risk!, rise: { p, lo: p / 2, hi: Math.min(1, p * 1.5) } } };
};
const file = (): IndicesFile => {
  const f = indicesFixture();
  f.countries = [...Array.from({ length: 20 }, (_, i) => country(i + 1)), ukraine()]; // listed out of order on purpose
  return f;
};
const names = Array.from({ length: 20 }, (_, i) => ({ id: `C${String(i + 1).padStart(2, '0')}`, name: `Country ${i + 1}` })).concat([{ id: 'UKR', name: 'Ukraine' }]);

beforeEach(() => {
  mocks.loadIndices.mockReset().mockResolvedValue(file());
  mocks.loadIndex.mockReset().mockResolvedValue(names);
});
const board = async (o: Partial<React.ComponentProps<typeof IndexBoard>> = {}) => {
  const r = render(<IndexBoard onDive={() => {}} onMethod={() => {}} {...o} />);
  await screen.findByRole('list', { name: /most deadly now/i });
  return r;
};

describe('IndexBoard', () => {
  it('lists the 15 most deadly countries by Fatality Index rank, with names, scores and death ranges', async () => {
    await board();
    const rows = within(screen.getByRole('list', { name: /most deadly now/i })).getAllByRole('listitem');
    expect(rows).toHaveLength(15);
    expect(rows[0]!.textContent).toMatch(/Ukraine/);
    expect(rows.map((r) => r.textContent).join('|')).toMatch(/Country 14/);
    expect(rows.map((r) => r.textContent).join('|')).not.toMatch(/Country 15/);
    expect(rows[1]!.textContent).toMatch(/score 89/i);
    expect(rows[1]!.textContent).toMatch(/990/);
    expect(rows[1]!.textContent).toMatch(/890–1,190/);
  });

  it('lists the 15 countries with the highest chance of a sharp rise, in order of probability, with intervals and confidence', async () => {
    await board();
    const list = screen.getByRole('list', { name: /highest risk of a sharp rise/i });
    const rows = within(list).getAllByRole('listitem');
    expect(rows).toHaveLength(15);
    const pcts = rows.map((r) => Number(/Best estimate ([\d.]+)%/.exec(within(r).getByRole('img').getAttribute('aria-label') ?? '')![1]));
    expect([...pcts].sort((a, b) => b - a)).toEqual(pcts);
    expect(pcts[0]).toBeGreaterThan(pcts[14]!);
    expect(rows[0]!.textContent).toMatch(/90% interval/);
    expect(rows[0]!.textContent).toMatch(/confidence (high|medium|low)/i);
  });

  it('makes every row a button that dives into the country', async () => {
    const onDive = vi.fn();
    await board({ onDive });
    fireEvent.click(within(screen.getByRole('list', { name: /most deadly now/i })).getByRole('button', { name: /Country 3(?!\d)/ }));
    expect(onDive).toHaveBeenCalledWith('C03');
    fireEvent.click(within(screen.getByRole('list', { name: /highest risk of a sharp rise/i })).getAllByRole('button')[0]!);
    expect(onDive).toHaveBeenCalledTimes(2);
  });

  it('shows the world monthly deaths with its peak, and says what the indices are and are not', async () => {
    await board();
    expect(screen.getByRole('img', { name: /World deaths per month.*peak/i })).toBeTruthy();
    const t = document.body.textContent ?? '';
    expect(t).toMatch(/not the official US DEFCON level/i);
    expect(t).toMatch(/risk estimate/i);
    expect(t).not.toMatch(/\bwill\b/);
  });

  it('downloads the indices of every country as a CSV with the names', async () => {
    await board();
    fireEvent.click(screen.getByRole('button', { name: 'Download CSV: indices of every country' }));
    const [name, text] = mocks.downloadText.mock.calls[0] as unknown as [string, string];
    expect(name).toBe('defcon-indices-2026-08-31.csv');
    expect(text.split('\n')[0]).toMatch(/^country_id,country,fatality_score/);
    expect(text).toContain('Ukraine');
  });

  it('opens the method from the "How computed" button', async () => {
    const onMethod = vi.fn();
    await board({ onMethod });
    fireEvent.click(screen.getByRole('button', { name: /how computed/i }));
    expect(onMethod).toHaveBeenCalled();
  });

  it('falls back to the id when the name is unknown, and says so plainly when the file cannot be loaded', async () => {
    mocks.loadIndex.mockResolvedValue([]);
    await board();
    expect(within(screen.getByRole('list', { name: /most deadly now/i })).getAllByRole('listitem')[1]!.textContent).toMatch(/C01/);
    cleanup();
    mocks.loadIndices.mockResolvedValue(null);
    render(<IndexBoard onDive={() => {}} onMethod={() => {}} />);
    await waitFor(() => expect(screen.getByText(/indices are unavailable/i)).toBeTruthy());
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('has no accessibility violations', async () => {
    const { container } = await board();
    const res = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(res.violations.map((v) => v.id)).toEqual([]);
  });
});
