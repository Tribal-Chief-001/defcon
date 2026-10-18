// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Bubbles } from '../../src/viz/Bubbles';
import { RangeBar } from '../../src/viz/RangeBar';
import { Ring } from '../../src/viz/Ring';
import { Spark } from '../../src/viz/Spark';
import { kindLayers, StreamChart, type StreamEvent } from '../../src/viz/StreamChart';

afterEach(cleanup);
const check = async (node: Element) => (await axe.run(node as HTMLElement, { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } })).violations.map((v) => `${v.id}: ${v.help}`);
const weeks = (f: (i: number) => number) => Array.from({ length: 52 }, (_, i) => f(i));

describe('Spark', () => {
  it('draws 52 weeks as a labelled line with the peak in its name, and a flat line for no deaths', () => {
    const { container } = render(<Spark data={weeks((i) => (i === 10 ? 500 : 5))} />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toMatch(/peak 500/);
    expect(container.innerHTML).not.toMatch(/NaN|undefined/);
    cleanup();
    const z = render(<Spark data={weeks(() => 0)} />);
    expect(z.container.querySelector('svg')!.getAttribute('aria-label')).toMatch(/no deaths/i);
    expect(z.container.innerHTML).not.toMatch(/NaN|undefined/);
  });
});

describe('Spark shared scale', () => {
  it('draws a small series low when given a larger shared maximum, but still names its own peak', () => {
    const own = render(<Spark data={weeks(() => 5)} height={28} />);
    const ownY = Number(/L[\d.]+,([\d.]+)/.exec(own.container.querySelector('path:last-of-type')!.getAttribute('d')!)![1]);
    cleanup();
    const shared = render(<Spark data={weeks(() => 5)} height={28} max={2000} />);
    const sharedY = Number(/L[\d.]+,([\d.]+)/.exec(shared.container.querySelector('path:last-of-type')!.getAttribute('d')!)![1]);
    expect(sharedY).toBeGreaterThan(ownY + 10); // nearer the baseline
    expect(shared.container.querySelector('svg')!.getAttribute('aria-label')).toMatch(/peak 5/);
  });
});

describe('RangeBar', () => {
  it('draws low-to-high on a zero-based scale with the best estimate marked, and says so in words', () => {
    const { container } = render(<RangeBar low={80} best={100} high={130} max={200} />);
    expect(container.querySelector('svg')!.getAttribute('aria-label')).toBe('Best estimate 100, range 80 to 130');
    const range = container.querySelector('[data-part="range"]')!;
    expect(Number(range.getAttribute('x1'))).toBeCloseTo(40, 1);
    expect(Number(range.getAttribute('x2'))).toBeCloseTo(65, 1);
    expect(Number(container.querySelector('[data-part="best"]')!.getAttribute('x'))).toBeGreaterThan(48);
  });
  it('words the numbers of its accessible name with a custom formatter (probabilities as percent)', () => {
    const { container } = render(<RangeBar low={0.1} best={0.25} high={0.4} max={1} fmt={(n) => `${Math.round(n * 100)}%`} />);
    expect(container.querySelector('svg')!.getAttribute('aria-label')).toBe('Best estimate 25%, range 10% to 40%');
  });
  it('clamps values beyond the scale and never emits NaN', () => {
    const { container } = render(<RangeBar low={-5} best={50} high={900} max={200} />);
    const range = container.querySelector('[data-part="range"]')!;
    expect(Number(range.getAttribute('x1'))).toBe(0);
    expect(Number(range.getAttribute('x2'))).toBe(100);
    cleanup();
    expect(render(<RangeBar low={0} best={0} high={0} max={0} />).container.innerHTML).not.toMatch(/NaN|undefined/);
  });
});

describe('Ring', () => {
  it('draws three arcs (30, 90, 365 days) relative to the 365-day total and names all three', () => {
    const { container } = render(<Ring d30={500} d90={2000} d365={10000} />);
    expect(container.querySelector('svg')!.getAttribute('aria-label')).toMatch(/30 days 500.*90 days 2,000.*365 days 10,000/);
    expect(container.querySelectorAll('[data-arc]')).toHaveLength(3);
    expect(container.innerHTML).not.toMatch(/NaN|undefined/);
    cleanup();
    expect(render(<Ring d30={0} d90={0} d365={0} />).container.innerHTML).not.toMatch(/NaN|undefined/);
  });
});

describe('Bubbles', () => {
  const items = [
    { id: 'ru', name: 'Russia - Ukraine', value: 85542, trend: 'steady' as const },
    { id: 'ye', name: 'Yemen: Government', value: 1896, trend: 'rising' as const },
    { id: 'pk', name: 'Pakistan: Government', value: 2773, trend: 'steady' as const },
    { id: 'zero', name: 'Quiet', value: 0, trend: 'low data' as const },
  ];
  it('is one button per conflict with deaths, named with name, deaths and trend; zero-death ones are not drawn', () => {
    render(<Bubbles items={items} selected="ye" onSelect={() => {}} />);
    const btns = screen.getAllByRole('button');
    expect(btns).toHaveLength(3);
    expect(screen.getByRole('button', { name: /Russia - Ukraine.*85,542.*steady/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Yemen.*rising/ }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: /Pakistan/ }).getAttribute('aria-pressed')).toBe('false');
  });
  it('selecting a bubble calls onSelect with its id, and its position and size are finite', () => {
    const onSelect = vi.fn();
    const { container } = render(<Bubbles items={items} selected={null} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: /Pakistan/ }));
    expect(onSelect).toHaveBeenCalledWith('pk');
    expect(container.innerHTML).not.toMatch(/NaN|undefined/);
  });
  it('shows the name inside only the big bubbles and renders names as text', () => {
    const { container } = render(<Bubbles items={[{ id: 'a', name: '<img src=x onerror=alert(1)>', value: 100000, trend: 'steady' }, { id: 'b', name: 'Tiny', value: 3, trend: 'steady' }]} selected={null} onSelect={() => {}} />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toContain('<img src=x');
    expect(within(screen.getByRole('button', { name: /Tiny/ })).queryByText('Tiny')).toBeNull();
  });
  it('has no axe violations', async () => {
    const { container } = render(<Bubbles items={items} selected="ye" onSelect={() => {}} />);
    expect(await check(container)).toEqual([]);
  });
});

describe('StreamChart', () => {
  const by = { state: weeks((i) => 10 + i), 'non-state': weeks(() => 5), 'one-sided': weeks((i) => (i === 40 ? 300 : 2)) };
  const ev: StreamEvent[] = [
    { date: '2026-03-01', title: 'A strike on the capital', status: 'confirmed' },
    { date: '2026-07-03', title: 'Claim and denial', status: 'disputed' },
    { date: '2026-10-14', title: 'After the data', status: 'reported' },
    { date: '2024-01-01', title: 'Before the window', status: 'confirmed' },
  ];
  it('is a labelled group whose summary names the window, the peak week and the kinds', () => {
    render(<StreamChart layers={kindLayers(by)} dataEnd="2026-08-31" />);
    const g = screen.getByRole('group', { name: /deaths per week/i });
    const t = g.textContent ?? '';
    expect(t).toMatch(/weeks ending 8 Sep 2025 to 31 Aug 2026/i);
    expect(t).toMatch(/peak/i);
    for (const k of ['State-based', 'Non-state', 'One-sided']) expect(t).toContain(k);
  });
  it('stacks three areas from a zero baseline and labels the axis with a round maximum and zero', () => {
    const { container } = render(<StreamChart layers={kindLayers(by)} dataEnd="2026-08-31" />);
    expect(container.querySelectorAll('path[data-layer]')).toHaveLength(3);
    const ticks = Array.from(container.querySelectorAll('[data-ytick]')).map((e) => e.textContent);
    expect(ticks[0]).toBe('0');
    expect(ticks[ticks.length - 1]).toBe('500'); // peak week total is 300 + 50 + 5 = 355 -> 500
    expect(ticks[1]).toBe('250');
    expect(container.innerHTML).not.toMatch(/NaN|undefined/);
  });
  it('puts each key event on its date as a button; events after the data end are marked, events before the window are left out', () => {
    const onClick = vi.fn();
    const onHover = vi.fn();
    render(<StreamChart layers={kindLayers(by)} dataEnd="2026-08-31" events={ev} onEventClick={onClick} onEventHover={onHover} />);
    const btns = screen.getAllByRole('button');
    expect(btns).toHaveLength(3);
    expect(screen.getByRole('button', { name: /3 Jul 2026.*Claim and denial.*disputed/i })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Before the window/ })).toBeNull();
    expect(screen.getByRole('group').textContent).toMatch(/after UCDP data/i);
    fireEvent.click(screen.getByRole('button', { name: /A strike on the capital/ }));
    expect(onClick).toHaveBeenCalledWith(0); // the index in the events prop
    fireEvent.mouseEnter(screen.getByRole('button', { name: /Claim and denial/ }));
    expect(onHover).toHaveBeenLastCalledWith(1);
    fireEvent.mouseLeave(screen.getByRole('button', { name: /Claim and denial/ }));
    expect(onHover).toHaveBeenLastCalledWith(null);
  });
  it('says in words how many events are in the after-data band and how many fall before the window', () => {
    render(<StreamChart layers={kindLayers(by)} dataEnd="2026-08-31" events={ev} />);
    const t = screen.getByRole('group').textContent ?? '';
    expect(t).toMatch(/1 key event is after UCDP data \(shaded band\)/);
    expect(t).toMatch(/1 key event before this window is not shown/);
  });
  it('uses a short visible label when the band is narrow, and keeps the long phrase in the text alternative', () => {
    const { container } = render(<StreamChart layers={kindLayers(by)} dataEnd="2026-08-31" events={ev} />);
    const visible = Array.from(container.querySelectorAll('svg text')).map((t) => t.textContent);
    expect(visible).toContain('after data');
    expect(visible).not.toContain('after UCDP data');
  });
  it('shows no "after UCDP data" band when every event is inside the data window', () => {
    render(<StreamChart layers={kindLayers(by)} dataEnd="2026-08-31" events={ev.slice(0, 2)} />);
    expect(screen.getByRole('group').textContent).not.toMatch(/after UCDP data/i);
  });
  it('arrow keys move a scrub tooltip with the week ending date and the deaths per kind, Escape clears it', () => {
    render(<StreamChart layers={kindLayers(by)} dataEnd="2026-08-31" />);
    const g = screen.getByRole('group');
    fireEvent.keyDown(g, { key: 'End' });
    expect(screen.getByRole('status').textContent).toMatch(/Week ending 31 Aug 2026/);
    expect(screen.getByRole('status').textContent).toMatch(/State-based 61/);
    fireEvent.keyDown(g, { key: 'ArrowLeft' });
    expect(screen.getByRole('status').textContent).toMatch(/Week ending 24 Aug 2026/);
    fireEvent.keyDown(g, { key: 'Escape' });
    expect(screen.getByRole('status').textContent).toBe('');
  });
  it('draws any layers it is given, e.g. one series for a single conflict, under its own label', () => {
    render(<StreamChart layers={[{ key: 'd', name: 'Deaths per week', values: weeks((i) => i), fill: 'var(--lime)', opacity: 0.8 }]} dataEnd="2026-08-31" label="Deaths per week in one conflict" />);
    expect(screen.getByRole('group', { name: 'Deaths per week in one conflict' })).toBeTruthy();
    expect(document.querySelectorAll('path[data-layer]')).toHaveLength(1);
  });
  it('survives all zeros and bad numbers', () => {
    const z = { state: weeks(() => 0), 'non-state': weeks(() => Number.NaN), 'one-sided': weeks(() => -3) };
    const { container } = render(<StreamChart layers={kindLayers(z)} dataEnd="2026-08-31" />);
    expect(container.innerHTML).not.toMatch(/NaN|undefined/);
  });
  it('has no axe violations', async () => {
    const { container } = render(<StreamChart layers={kindLayers(by)} dataEnd="2026-08-31" events={ev} />);
    expect(await check(container)).toEqual([]);
  });

  it('writes big axis numbers compactly so they fit (100k, 1.5k)', () => {
    const big = { state: weeks((i) => (i === 3 ? 90000 : 10)), 'non-state': weeks(() => 0), 'one-sided': weeks(() => 0) };
    const { container } = render(<StreamChart layers={kindLayers(big)} dataEnd="2026-08-31" />);
    const ticks = Array.from(container.querySelectorAll('[data-ytick]')).map((e) => e.textContent);
    expect(ticks).toEqual(['0', '50k', '100k']);
  });
});

