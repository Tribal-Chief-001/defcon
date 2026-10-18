import { describe, expect, it } from 'vitest';
import { selectCapitals, type Capital } from '../../src/globe/labels';

const cap = (country: string, name: string, lat: number, lon: number, rank: number): Capital => ({ country, name, lat, lon, rank });
// A ring of capitals around the view centre (lat 0, lon 0), plus the antipode.
const caps: Capital[] = [
  cap('AAA', 'A0', 0, 0, 0),
  cap('BBB', 'B1', 5, 10, 1),
  cap('CCC', 'C2', -5, -10, 2),
  cap('DDD', 'D3', 10, 5, 3),
  cap('EEE', 'E4', -10, 5, 4),
  cap('FFF', 'F6', 8, -8, 6),
  cap('GGG', 'G8', -8, 8, 8),
  cap('ZZZ', 'Antipode', 0, 180, 0),
  cap('FRA', 'Paris', 70, 2, 5),
];
const view = (distance: number, lat = 0, lon = 0) => ({ lat, lon, distance });
const names = (l: Capital[]) => l.map((c) => c.name);

describe('selectCapitals', () => {
  it('shows nothing when zoomed far out and not diving', () => {
    expect(selectCapitals(caps, view(3.6), null)).toEqual([]);
    expect(selectCapitals(caps, view(3.3), null)).toEqual([]);
  });
  it('shows only the top ranks at mid distance, at most 12', () => {
    const r = selectCapitals(caps, view(2.8), null);
    expect(names(r)).toEqual(['A0', 'B1', 'C2']);
    const many = Array.from({ length: 40 }, (_, i) => cap(`C${i}`, `N${i}`, i % 10, i % 10, 1));
    expect(selectCapitals(many, view(2.8), null).length).toBeLessThanOrEqual(12);
  });
  it('shows ranks up to 4 at middle zoom and up to 7 close in, capped', () => {
    expect(names(selectCapitals(caps, view(2.0), null))).toEqual(['A0', 'B1', 'C2', 'D3', 'E4']);
    expect(names(selectCapitals(caps, view(1.5), null))).toEqual(['A0', 'B1', 'C2', 'D3', 'E4', 'F6']);
    const many = Array.from({ length: 80 }, (_, i) => cap(`C${i}`, `N${i}`, (i % 8) - 4, (i % 9) - 4, 3));
    expect(selectCapitals(many, view(1.5), null).length).toBe(40);
    expect(selectCapitals(many, view(1.5), null, 10).length).toBe(10);
  });
  it('drops capitals on the far side of the globe', () => {
    expect(names(selectCapitals(caps, view(1.5), null))).not.toContain('Antipode');
    expect(names(selectCapitals(caps, view(1.5, 0, 180), null))).toContain('Antipode');
  });
  it('always includes the dived country even when its rank would hide it', () => {
    expect(names(selectCapitals(caps, view(2.8, 48, 2), null))).not.toContain('Paris');
    expect(names(selectCapitals(caps, view(2.8, 48, 2), 'FRA'))).toContain('Paris');
    expect(names(selectCapitals(caps, view(3.6, 48, 2), 'FRA'))).toEqual(['Paris']);
  });
  it('has no duplicates, a deterministic order, and handles empty input', () => {
    const r = selectCapitals(caps, view(1.5, 20, 0), 'AAA');
    expect(new Set(names(r)).size).toBe(r.length);
    expect(names(selectCapitals([...caps].reverse(), view(1.5), null))).toEqual(names(selectCapitals(caps, view(1.5), null)));
    expect(selectCapitals([], view(1.5), 'FRA')).toEqual([]);
  });
  it('never marks Natural Earth alternate capitals (Lagos, Kyoto), not even for the dived country', () => {
    const more = [...caps, { ...cap('NGA', 'Lagos', 1, 1, 0), alt: true as const }];
    expect(names(selectCapitals(more, view(1.5), null))).not.toContain('Lagos');
    expect(names(selectCapitals(more, view(1.5), 'NGA'))).not.toContain('Lagos');
  });
  it('is safe with a non-finite view', () => {
    expect(selectCapitals(caps, view(NaN), null)).toEqual([]);
  });
});
