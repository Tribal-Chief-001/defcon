// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SignalsFile } from '../../src/signals/types';
import { SignalsBlock } from '../../src/ui/war/SignalsBlock';
import { signalsFixture } from '../signals/fixture';

const mocks = vi.hoisted(() => ({ loadSignals: vi.fn() }));
vi.mock('../../src/signals/load', () => ({ loadSignals: mocks.loadSignals }));

beforeEach(() => mocks.loadSignals.mockReset().mockResolvedValue(signalsFixture()));
afterEach(cleanup);
const show = async (f: SignalsFile | null = signalsFixture(), onFocusPlace = vi.fn()) => {
  mocks.loadSignals.mockResolvedValue(f);
  render(<SignalsBlock onFocusPlace={onFocusPlace} />);
  await screen.findByRole('region', { name: /signals/i });
  return onFocusPlace;
};

describe('SignalsBlock', () => {
  it('says what signals are and are not: context, not confirmed events, and no effect on any number or index', async () => {
    await show();
    const t = screen.getByRole('region', { name: /signals/i }).textContent ?? '';
    expect(t).toMatch(/context, not conflict events/i);
    expect(t).toMatch(/a fire has many causes/i);
    expect(t).toMatch(/never change a conflict number or an index/i);
    expect(t).not.toMatch(/\bwill\b|proves? an attack/i);
  });

  it('groups the fires by conflict, most detections first, and shows each conflict once with its cells and strongest power', async () => {
    await show();
    const rows = within(screen.getByRole('list', { name: /fires in conflict areas/i })).getAllByRole('listitem');
    expect(rows).toHaveLength(2);
    expect(rows[0]!.textContent).toMatch(/Nigeria: Islamic State/);
    expect(rows[0]!.textContent).toMatch(/222 detections/); // 182 + 40
    expect(rows[0]!.textContent).toMatch(/2 cells/);
    expect(rows[0]!.textContent).toMatch(/113 MW/); // strongest detection (112.5 rounded)
    expect(rows[1]!.textContent).toMatch(/Sudan: Government.*90 detections/);
  });

  it('shows the busiest cell of a conflict on the map', async () => {
    const onFocusPlace = await show();
    fireEvent.click(within(screen.getByRole('list', { name: /fires in conflict areas/i })).getAllByRole('button', { name: /show on the map/i })[0]!);
    expect(onFocusPlace).toHaveBeenCalledWith({ lat: 12.75, lon: 13.75, place: 'Nigeria: Islamic State (most fire detections)' });
  });

  it('lists the disaster alerts with a level, a kind, an https link that opens safely, and the seismic events with a magnitude', async () => {
    await show();
    const d = within(screen.getByRole('list', { name: /disaster alerts/i })).getAllByRole('listitem');
    expect(d).toHaveLength(2);
    expect(d[0]!.textContent).toMatch(/Red/);
    const a = within(d[0]!).getByRole('link') as HTMLAnchorElement;
    expect(a.href).toMatch(/^https:\/\/www\.gdacs\.org\//);
    expect(a.rel).toMatch(/noopener/);
    expect(a.target).toBe('_blank');
    const s = within(screen.getByRole('list', { name: /seismic explosions/i })).getAllByRole('listitem');
    expect(s[0]!.textContent).toMatch(/M 3\.4/);
  });

  it('says plainly when there is nothing to list (not "all quiet")', async () => {
    const f = signalsFixture();
    f.seismic = [];
    f.fires = [];
    f.sources[0]!.count = 0;
    f.sources[2]!.count = 0;
    await show(f);
    const t = screen.getByRole('region', { name: /signals/i }).textContent ?? '';
    expect(t).toMatch(/no explosion-type seismic events/i);
    expect(t).toMatch(/no fire detections in the conflict areas/i);
    expect(t).not.toMatch(/all quiet|calm|peace/i);
  });

  it('says which source failed, and shows the others', async () => {
    const f = signalsFixture();
    f.sources[1] = { ...f.sources[1]!, ok: false, count: 0, error: 'HTTP 500' };
    f.disasters = [];
    await show(f);
    const t = screen.getByRole('region', { name: /signals/i }).textContent ?? '';
    expect(t).toMatch(/GDACS.*unavailable/i);
    expect(screen.getByRole('list', { name: /fires in conflict areas/i })).toBeTruthy();
  });

  it('names every source with its licence and attribution, and says when the feed was built', async () => {
    await show();
    const t = screen.getByRole('region', { name: /signals/i }).textContent ?? '';
    expect(t).toMatch(/U\.S\. Geological Survey/);
    expect(t).toMatch(/Global Disaster Alert and Coordination System/);
    expect(t).toMatch(/Fire Information for Resource Management System/);
    expect(t).toMatch(/CC BY 4\.0/);
    expect(t).toMatch(/Updated 19 Oct 06:34 UTC/);
  });

  it('says "unavailable" and nothing else when the file cannot be loaded', async () => {
    mocks.loadSignals.mockResolvedValue(null);
    render(<SignalsBlock onFocusPlace={() => {}} />);
    await waitFor(() => expect(screen.getByText(/signals are unavailable/i)).toBeTruthy());
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('has no accessibility violations', async () => {
    await show();
    const r = await axe.run(screen.getByRole('region', { name: /signals/i }), { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } });
    expect(r.violations.map((v) => v.id)).toEqual([]);
  });
});
