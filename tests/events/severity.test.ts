import { describe, expect, it } from 'vitest';
import { severity } from '../../src/events/severity';
import { KINDS, type Kind } from '../../src/events/types';

describe('severity: human-coded armed and civilian events by deaths', () => {
  it.each([
    [0, 1], [1, 2], [4, 2], [5, 3], [24, 3], [25, 4], [99, 4], [100, 5], [5000, 5],
  ])('deaths %i -> severity %i', (deaths, sev) => {
    expect(severity({ kind: 'armed', deaths, human: true })).toBe(sev);
    expect(severity({ kind: 'civilian', deaths, human: true })).toBe(sev);
  });
  it('treats null and NaN deaths as 1 (unknown, no claim)', () => {
    expect(severity({ kind: 'armed', deaths: null, human: true })).toBe(1);
    expect(severity({ kind: 'armed', deaths: NaN, human: true })).toBe(1);
  });
  it('human riot keeps its base of 2 and can rise with deaths; human protest base is 1', () => {
    expect(severity({ kind: 'riot', deaths: 0, human: true })).toBe(2);
    expect(severity({ kind: 'riot', deaths: 30, human: true })).toBe(4);
    expect(severity({ kind: 'protest', deaths: null, human: true })).toBe(1);
  });
});

describe('severity: auto-coded events never claim fatalities, so they are capped at 3', () => {
  it('armed/civilian start at 2; Goldstein <= -9.5 adds 1', () => {
    expect(severity({ kind: 'armed', deaths: null, human: false, goldstein: -5 })).toBe(2);
    expect(severity({ kind: 'armed', deaths: null, human: false, goldstein: -9.5 })).toBe(3);
    expect(severity({ kind: 'civilian', deaths: null, human: false, goldstein: -10 })).toBe(3);
  });
  it('ignores any deaths value on auto-coded events and never exceeds 3', () => {
    expect(severity({ kind: 'armed', deaths: 500, human: false, goldstein: -10 })).toBe(3);
  });
  it('protest is 1 and riot is 2; 10 or more sources add 1 (cap 3)', () => {
    expect(severity({ kind: 'protest', deaths: null, human: false })).toBe(1);
    expect(severity({ kind: 'riot', deaths: null, human: false })).toBe(2);
    expect(severity({ kind: 'protest', deaths: null, human: false, numSources: 10 })).toBe(2);
    expect(severity({ kind: 'riot', deaths: null, human: false, numSources: 50 })).toBe(3);
  });
  it('other is 1', () => {
    expect(severity({ kind: 'other', deaths: null, human: false })).toBe(1);
  });
});

describe('severity bounds', () => {
  it('is always an integer in 1..5 for odd inputs', () => {
    const odd = [undefined, NaN, -5, 0, 1e9, Infinity, -Infinity, null] as const;
    for (const kind of KINDS as readonly Kind[])
      for (const human of [true, false])
        for (const d of odd)
          for (const g of odd) {
            const s = severity({ kind, deaths: d as number | null, human, goldstein: g as number | undefined, numSources: g as number | undefined });
            expect(Number.isInteger(s) && s >= 1 && s <= 5).toBe(true);
          }
  });
});
