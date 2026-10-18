// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { IndexCard } from '../../src/ui/IndexCard';
import { ecuador, iceland, indicesFixture, ukraine } from '../indices/fixture';

afterEach(cleanup);
const model = indicesFixture().model;
const card = (o: Partial<React.ComponentProps<typeof IndexCard>> = {}) => render(<IndexCard index={ukraine()} model={model} dataEnd="2026-08-31" rankedTotal={63} onMethod={() => {}} {...o} />);
const text = () => screen.getByRole('region', { name: /indices/i }).textContent ?? '';

describe('IndexCard: findings of the review', () => {
  it('shows "<0.01" for a tiny rate instead of 0.00, and builds the baseline AUC with two decimals', () => {
    const u = ukraine();
    u.fatality.per100k = 0.0004;
    card({ index: u, model: { ...model, rise: { ...model.rise, persistenceAuc: 0.05 } } });
    expect(text()).toMatch(/<0\.01 per 100,000/);
    expect(text()).not.toMatch(/0\.00 per 100,000/);
    expect(text()).toMatch(/0\.05 for recent deaths alone/);
  });
  it('says the breakdown is in log-odds, and that a sharp rise is capped at the chance of continuing when it is', () => {
    const u = ukraine();
    u.risk!.rise = { ...u.risk!.continue };
    card({ index: u });
    expect(text()).toMatch(/log-odds/i);
    expect(text()).toMatch(/capped at the chance that violence continues/i);
    cleanup();
    card({ index: ukraine() });
    expect(text()).not.toMatch(/capped at/i);
  });
});

describe('IndexCard: Palestine (finding: UCDP files Gaza and the West Bank under Israel)', () => {
  it('says where the events are counted instead of "no violence recorded"', () => {
    card({ index: undefined, countryId: 'PSX' });
    expect(text()).toMatch(/UCDP files Gaza and West Bank events under Israel/);
    expect(text()).not.toMatch(/no organised violence here/);
  });
});

describe('IndexCard: Fatality Index', () => {
  it('shows the score as a gauge with its range, the band in words, deaths with ranges, per 100,000, trend and rank', () => {
    card();
    expect(screen.getByRole('img', { name: 'Fatality Index: 100 out of 100, range 98 to 100' })).toBeTruthy();
    const t = text();
    expect(t).toMatch(/Severe/);
    expect(t).toMatch(/1,000 or more deaths in 365 days/);
    expect(t).toMatch(/11,071/);
    expect(t).toMatch(/10,500–14,000/);
    expect(t).toMatch(/85,542/);
    expect(t).toMatch(/205\.5 per 100,000/);
    expect(t).toMatch(/Rank 1 of 63/);
    expect(t).toMatch(/activity steady/i);
    expect(screen.getByRole('img', { name: /deaths per month.*peak/i })).toBeTruthy();
  });
  it('says plainly when no organised violence was recorded, and when the country is not in the data at all', () => {
    card({ index: iceland() });
    expect(text()).toMatch(/No organised violence recorded by UCDP in the last 365 days/i);
    cleanup();
    card({ index: undefined });
    expect(text()).toMatch(/UCDP has recorded no organised violence here/i);
    expect(text()).toMatch(/Fatality Index 0/);
  });
});

describe('IndexCard: Instability Index', () => {
  it('shows both probabilities with their 90% intervals, momentum, confidence with its reason and the breakdown', () => {
    card();
    const t = text();
    expect(t).toMatch(/Violence continues/i);
    expect(t).toMatch(/>99\.9%/);
    expect(t).toMatch(/Sharp rise/i);
    expect(t).toMatch(/10%/);
    expect(t).toMatch(/90% interval 6 to 15%/);
    expect(t).toMatch(/Momentum falling/i);
    expect(t).toMatch(/Confidence low/i);
    expect(t).toMatch(/only 12% of the deaths were located/);
    const why = screen.getByRole('list', { name: /why this score/i });
    const first = within(why).getAllByRole('listitem')[0]!;
    expect(first.textContent).toMatch(/Deaths in the last 12 months/);
    expect(first.textContent).toMatch(/raises/i);
    expect(within(why).getAllByRole('listitem').length).toBeGreaterThanOrEqual(4);
  });
  it('gives every probability a text alternative with its interval', () => {
    card({ index: ecuador() });
    expect(screen.getByRole('img', { name: /Violence continues: 50%.*90% interval 40 to 60%/i })).toBeTruthy();
    expect(screen.getByRole('img', { name: /Sharp rise: 32%.*90% interval 20 to 45%/i })).toBeTruthy();
  });
  it('says "not modelled" (and not "low") when there is no risk, and explains why', () => {
    card({ index: iceland() });
    const t = text();
    expect(t).toMatch(/Not modelled/i);
    expect(t).toMatch(/not a low-risk rating/i);
    expect(screen.queryByRole('list', { name: /why this score/i })).toBeNull();
  });
  it('states what it is: a risk estimate, the backtest, the data end, provisional rows and that it is not the official DEFCON level', () => {
    const onMethod = vi.fn();
    card({ onMethod });
    const t = text();
    expect(t).toMatch(/risk estimate/i);
    expect(t).toMatch(/AUC 0\.85/);
    expect(t).toMatch(/0\.74/);
    expect(t).toMatch(/31 Aug 2026/);
    expect(t).toMatch(/provisional/i);
    expect(t).toMatch(/not the official US DEFCON level/i);
    expect(t).not.toMatch(/\bwill\b/);
    fireEvent.click(screen.getByRole('button', { name: /how computed/i }));
    expect(onMethod).toHaveBeenCalled();
  });
  it('renders reasons as text and never produces NaN', () => {
    const u = ukraine();
    u.risk!.confidenceReason = '<img src=x onerror=alert(1)> placed';
    const { container } = card({ index: u });
    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toContain('<img src=x');
    expect(container.innerHTML).not.toMatch(/NaN|undefined/);
  });
  it('has no axe violations in any state', async () => {
    for (const idx of [ukraine(), ecuador(), iceland(), undefined]) {
      const { container, unmount } = card({ index: idx });
      expect((await axe.run(container, { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } })).violations.map((v) => v.id)).toEqual([]);
      unmount();
    }
  });
});
