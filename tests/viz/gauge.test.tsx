// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, describe, expect, it } from 'vitest';
import { Gauge, arcPath } from '../../src/viz/Gauge';

afterEach(cleanup);

describe('arcPath', () => {
  it('draws a circular arc between two angles and never emits NaN', () => {
    const d = arcPath(50, 50, 40, 135, 405);
    expect(d.startsWith('M')).toBe(true);
    expect(d).toMatch(/A40,40/);
    expect(arcPath(50, 50, 40, 10, 10)).not.toMatch(/NaN/);
  });
});

describe('Gauge', () => {
  it('names the value, the scale and the range in words, and shows the number', () => {
    const { container } = render(<Gauge value={72.5} low={60} high={80} label="Fatality Index" />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toBe('Fatality Index: 73 out of 100, range 60 to 80');
    expect(container.textContent).toContain('73');
  });
  it('clamps values outside 0-100 and keeps low <= value <= high', () => {
    const { container } = render(<Gauge value={140} low={-10} high={300} label="x" />);
    expect(container.querySelector('svg')!.getAttribute('aria-label')).toBe('x: 100 out of 100, range 0 to 100');
    expect(container.innerHTML).not.toMatch(/NaN|undefined/);
  });
  it('survives bad numbers', () => {
    const { container } = render(<Gauge value={Number.NaN} low={Number.NaN} high={Number.NaN} label="x" />);
    expect(container.innerHTML).not.toMatch(/NaN|undefined/);
    expect(container.querySelector('svg')!.getAttribute('aria-label')).toBe('x: 0 out of 100, range 0 to 0');
  });
  it('has no axe violations', async () => {
    const { container } = render(<Gauge value={50} low={40} high={60} label="Fatality Index" />);
    expect((await axe.run(container, { rules: { 'color-contrast': { enabled: false } } })).violations).toEqual([]);
  });
});
