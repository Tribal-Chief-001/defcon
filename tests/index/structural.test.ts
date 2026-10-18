import { describe, expect, it } from 'vitest';
import { latestBefore, latestPublished, neighbourSignals, parseWbHist } from '../../scripts/index/structural';

describe('latestPublished (finding: a WGI value for year Y-1 appears around September of Y)', () => {
  const s = new Map([[2023, 1], [2024, 2], [2025, 3]]);
  it('uses values two or more years before the prediction year', () => {
    expect(latestPublished(s, 2026)).toBe(2); // 2025 is not yet published in August 2026
    expect(latestPublished(s, 2025)).toBe(1);
    expect(latestPublished(new Map([[2025, 9]]), 2026)).toBeNull();
  });
});

describe('latestBefore', () => {
  const s = new Map([[1996, 1], [1998, 2], [2000, 3]]);
  it('uses only years before the prediction year (release lag), newest first', () => {
    expect(latestBefore(s, 2001)).toBe(3);
    expect(latestBefore(s, 2000)).toBe(2); // the year itself is not yet published
    expect(latestBefore(s, 1999)).toBe(2);
  });
  it('gives null when the newest value is older than maxAge years or the series is missing', () => {
    expect(latestBefore(s, 2005)).toBeNull();
    expect(latestBefore(s, 2003)).toBe(3);
    expect(latestBefore(undefined, 2000)).toBeNull();
    expect(latestBefore(new Map(), 2000)).toBeNull();
  });
});

describe('parseWbHist', () => {
  it('reads iso3 -> year -> value, skipping aggregates without a code, null values and bad years', () => {
    const text = JSON.stringify([{ page: 1 }, [
      { countryiso3code: 'AFG', date: '2001', value: 5 },
      { countryiso3code: 'AFG', date: '2002', value: null },
      { countryiso3code: '', date: '2001', value: 9 },
      { countryiso3code: 'FRA', date: 'abc', value: 1 },
      { countryiso3code: 'FRA', date: '2003', value: 7.5 },
    ]]);
    const m = parseWbHist(text);
    expect([...m.keys()].sort()).toEqual(['AFG', 'FRA']);
    expect(m.get('AFG')!.get(2001)).toBe(5);
    expect(m.get('AFG')!.has(2002)).toBe(false);
    expect(m.get('FRA')!.get(2003)).toBe(7.5);
  });
  it('throws a readable error for a World Bank error reply', () => {
    expect(() => parseWbHist(JSON.stringify([{ message: [{ key: 'Invalid value' }] }]))).toThrow(/world bank/i);
  });
});

describe('neighbourSignals', () => {
  const nb = { A: ['B', 'C', 'Z'], B: ['A'] };
  const f12 = new Map([['B|10', 100], ['C|10', 5], ['A|10', 1]]);
  it('sums the neighbours\' 12-month deaths and counts neighbours with at least 25; unknown neighbours count as zero', () => {
    expect(neighbourSignals('A', 10, nb, f12)).toEqual({ nbDeaths: 105, nbInConflict: 1, nbCount: 3 });
    expect(neighbourSignals('B', 10, nb, f12)).toEqual({ nbDeaths: 1, nbInConflict: 0, nbCount: 1 });
  });
  it('is all zeros for a country with no neighbours', () => {
    expect(neighbourSignals('Q', 10, nb, f12)).toEqual({ nbDeaths: 0, nbInConflict: 0, nbCount: 0 });
  });
});
