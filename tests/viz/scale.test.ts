import { describe, expect, it } from 'vitest';
import { addDays, areaPath, linePath, monthTicks, niceMax, scaleLinear, stackAreas, weekEnd } from '../../src/viz/scale';

describe('scaleLinear', () => {
  it('maps the domain onto the range and survives an empty domain', () => {
    const s = scaleLinear(0, 10, 100, 200);
    expect(s(0)).toBe(100);
    expect(s(5)).toBe(150);
    expect(s(10)).toBe(200);
    expect(scaleLinear(3, 3, 7, 9)(3)).toBe(7);
  });
});

describe('niceMax', () => {
  it('rounds up to 1, 2, 5 times a power of ten and never returns zero or NaN', () => {
    expect(niceMax(0)).toBe(1);
    expect(niceMax(-4)).toBe(1);
    expect(niceMax(Number.NaN)).toBe(1);
    expect(niceMax(0.7)).toBe(1);
    expect(niceMax(1)).toBe(1);
    expect(niceMax(1.1)).toBe(2);
    expect(niceMax(3)).toBe(5);
    expect(niceMax(5)).toBe(5);
    expect(niceMax(5.1)).toBe(10);
    expect(niceMax(432)).toBe(500);
    expect(niceMax(5157)).toBe(10000);
  });
});

describe('dates', () => {
  it('adds days across month ends', () => {
    expect(addDays('2026-08-31', 1)).toBe('2026-09-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
  it('week i ends 7 days before week i+1; the last week ends at the data end', () => {
    expect(weekEnd('2026-08-31', 51)).toBe('2026-08-31');
    expect(weekEnd('2026-08-31', 50)).toBe('2026-08-24');
    expect(weekEnd('2026-08-31', 0)).toBe('2025-09-08');
  });
  it('month ticks mark the weeks where a new month starts, with a short label', () => {
    const t = monthTicks('2026-08-31');
    expect(t.length).toBeGreaterThanOrEqual(11);
    expect(t.length).toBeLessThanOrEqual(13);
    expect(t.every((x) => x.i >= 0 && x.i <= 51)).toBe(true);
    expect(t.map((x) => x.i)).toEqual([...t.map((x) => x.i)].sort((a, b) => a - b));
    expect(t.some((x) => x.label === 'Jan')).toBe(true);
  });
});

describe('stackAreas', () => {
  it('stacks from zero in the given order, per week', () => {
    const s = stackAreas([[1, 2, 3], [4, 0, 1], [0, 5, 2]]);
    expect(s[0]).toEqual({ y0: [0, 0, 0], y1: [1, 2, 3] });
    expect(s[1]).toEqual({ y0: [1, 2, 3], y1: [5, 2, 4] });
    expect(s[2]).toEqual({ y0: [5, 2, 4], y1: [5, 7, 6] });
  });
  it('treats negative or non-finite values as zero so a stack never goes backwards', () => {
    const s = stackAreas([[-3, Number.NaN, 2]]);
    expect(s[0]!.y1).toEqual([0, 0, 2]);
  });
});

describe('paths', () => {
  it('builds a closed area path and an open line path with finite numbers only', () => {
    const a = areaPath([0, 10, 20], [0, 0, 0], [5, 10, 5]);
    expect(a.startsWith('M0,')).toBe(true);
    expect(a.endsWith('Z')).toBe(true);
    expect(a).not.toMatch(/NaN|undefined/);
    const l = linePath([0, 10], [3, 4]);
    expect(l).toBe('M0,3L10,4');
    expect(linePath([], [])).toBe('');
  });
});
