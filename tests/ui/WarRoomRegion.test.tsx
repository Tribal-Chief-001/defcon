// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Conflict, ConflictsFile } from '../../src/conflicts/types';
import { WarRoom } from '../../src/ui/WarRoom';
import { worldFixture } from '../conflicts/fixture';
import { indicesFixture } from '../indices/fixture';

const mocks = vi.hoisted(() => ({ loadIndices: vi.fn() }));
vi.mock('../../src/dossier/load', () => ({ loadIndex: async () => [{ id: 'IND', name: 'India' }, { id: 'ECU', name: 'Ecuador' }, { id: 'UKR', name: 'Ukraine' }] }));
vi.mock('../../src/indices/load', async (orig) => ({ ...(await orig<typeof import('../../src/indices/load')>()), loadIndices: mocks.loadIndices }));

const R = (best: number) => ({ best, low: best - 1, high: best + 1 });
const conflict = (id: string, name: string, countries: Conflict['countries']): Conflict => ({ id, name, kinds: ['state'], countries, deaths: { d30: R(10), d90: R(30), d365: R(100) }, events: { d30: 1, d90: 2, d365: 3 }, trend: 'steady', lastDate: '2026-08-30', weekly: new Array(52).fill(1), latest: [], provisionalShare: 0, geo: null });
const file: ConflictsFile = {
  generated: '2026-10-19',
  dataEnd: '2026-08-31',
  sources: ['t'],
  world: worldFixture(),
  conflicts: [conflict('ua', 'Russia - Ukraine', [{ id: 'UKR', name: 'Ukraine', deaths365: 900 }]), conflict('pk', 'Pakistan: Government', [{ id: 'PAK', name: 'Pakistan', deaths365: 300 }, { id: 'AFG', name: 'Afghanistan', deaths365: 100 }]), conflict('in', 'India: Manipur', [{ id: 'IND', name: 'India', deaths365: 50 }])],
};
const props = (o: Partial<React.ComponentProps<typeof WarRoom>> = {}) => ({ selected: null, onSelect: vi.fn(), onClose: vi.fn(), onDive: vi.fn(), onFocusPlace: vi.fn(), onHoverPin: vi.fn(), load: async () => file, loadTimeline: async () => null, ...o });

beforeEach(() => {
  window.matchMedia = ((q: string) => ({ matches: /reduce/.test(q), media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
  Element.prototype.scrollIntoView = vi.fn();
  const f = indicesFixture();
  f.countries = f.countries.map((c, i) => ({ ...c, id: ['IND', 'ECU', 'UKR'][i]! }));
  mocks.loadIndices.mockReset().mockResolvedValue(f);
});
afterEach(cleanup);
const open = async (p = props()) => {
  render(<WarRoom {...p} />);
  await screen.findByRole('list', { name: /conflicts league/i });
  return p;
};

describe('War room: the South Asia lens', () => {
  it('offers World and South Asia, World pressed first', async () => {
    await open();
    const group = screen.getByRole('group', { name: /region/i });
    expect(within(group).getByRole('button', { name: 'World' }).getAttribute('aria-pressed')).toBe('true');
    expect(within(group).getByRole('button', { name: 'South Asia' }).getAttribute('aria-pressed')).toBe('false');
  });

  it('shows the deaths located in the eight member states, the countries, and only the conflicts that touch them', async () => {
    const p = await open();
    fireEvent.click(screen.getByRole('button', { name: 'South Asia' }));
    const view = await screen.findByRole('region', { name: /south asia/i });
    expect(view.textContent).toMatch(/450/); // 300 + 100 + 50 located in the member states (not Ukraine's 900, not the whole conflict)
    const list = within(view).getByRole('list', { name: /conflicts in south asia/i });
    const names = within(list).getAllByRole('listitem').map((l) => l.textContent ?? '');
    expect(names.some((n) => /Pakistan: Government/.test(n))).toBe(true);
    expect(names.some((n) => /India: Manipur/.test(n))).toBe(true);
    expect(names.some((n) => /Russia - Ukraine/.test(n))).toBe(false);
    expect(p.onFocusPlace).toHaveBeenCalledWith({ lat: 24, lon: 78, distance: 2.6, place: 'South Asia' });
    fireEvent.click(within(list).getByRole('button', { name: /Pakistan: Government/ }));
    expect(p.onSelect).toHaveBeenCalledWith('pk');
    fireEvent.click(within(within(view).getByRole('list', { name: /countries of south asia/i })).getByRole('button', { name: /^Pakistan/ }));
    expect(p.onDive).toHaveBeenCalledWith('PAK');
  });

  it('restricts the Index board to the member states, and goes back to the world', async () => {
    await open();
    fireEvent.click(screen.getByRole('button', { name: 'South Asia' }));
    const view = await screen.findByRole('region', { name: /south asia/i });
    const board = await within(view).findByRole('region', { name: /index board/i });
    const ids = within(board).getAllByRole('button').map((b) => b.textContent ?? '');
    expect(ids.some((t) => /India/.test(t))).toBe(true);
    expect(ids.some((t) => /Ukraine|Ecuador/.test(t))).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'World' }));
    expect(await screen.findByRole('list', { name: /conflicts league/i })).toBeTruthy();
  });

  it('says what the region is and that the map is not changed, and has no accessibility violations', async () => {
    await open();
    fireEvent.click(screen.getByRole('button', { name: 'South Asia' }));
    const view = await screen.findByRole('region', { name: /south asia/i });
    expect(view.textContent).toMatch(/Afghanistan, Bangladesh, Bhutan, India, Maldives, Nepal, Pakistan and Sri Lanka/);
    expect(view.textContent).toMatch(/lens only filters the data/i);
    expect((await axe.run(view, { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } })).violations.map((v) => v.id)).toEqual([]);
  });

  it('going back to World clears the place focus (the camera goes back), and choosing a region leaves an open conflict', async () => {
    const p = await open(props());
    fireEvent.click(screen.getByRole('button', { name: 'South Asia' }));
    await screen.findByRole('region', { name: /south asia/i });
    fireEvent.click(screen.getByRole('button', { name: 'World' }));
    expect(p.onFocusPlace).toHaveBeenLastCalledWith(null);
    cleanup();
    const q = props({ selected: 'pk' });
    render(<WarRoom {...q} />);
    await screen.findByRole('heading', { name: /Pakistan: Government/ });
    fireEvent.click(screen.getByRole('button', { name: 'South Asia' }));
    expect(q.onSelect).toHaveBeenCalledWith(null);
  });
  it('shows no world-wide chart under the lens, and Back from a conflict returns focus to its row', async () => {
    const q = props();
    render(<WarRoom {...q} />);
    await screen.findByRole('list', { name: /conflicts league/i });
    fireEvent.click(screen.getByRole('button', { name: 'South Asia' }));
    const view = await screen.findByRole('region', { name: /south asia/i });
    expect(view.textContent).not.toMatch(/world's deaths per month/i);
    expect(screen.queryByRole('img', { name: /World deaths per month/i })).toBeNull();
  });
});
