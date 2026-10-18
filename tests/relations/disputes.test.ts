import { describe, expect, it } from 'vitest';
import { disputesFromGed } from '../../scripts/relations/disputes';

const gw = { '365': 'RUS', '369': 'UKR', '700': 'AFG', '770': 'PAK', '2': 'USA', '200': 'GBR' };
const row = (a: string, b: string, year = '2025', over: Record<string, string> = {}) => ({
  type_of_violence: '1', gwnoa: a, gwnob: b, year, conflict_name: 'Russia - Ukraine', ...over,
});

describe('disputesFromGed', () => {
  it('merges both directions of a pair into one dispute with an event count', () => {
    const r = disputesFromGed([row('365', '369'), row('365', '369'), row('369', '365', '2026')], gw, { minLastYear: 2025 });
    expect(r).toEqual([expect.objectContaining({ a: 'RUS', b: 'UKR', events: 3, lastYear: 2026, conflict: 'Russia - Ukraine' })]);
  });
  it('ignores other violence types and rows without two government sides', () => {
    expect(disputesFromGed([row('365', '369', '2025', { type_of_violence: '2' })], gw, { minLastYear: 2025 })).toEqual([]);
    expect(disputesFromGed([row('365', '')], gw, { minLastYear: 2025 })).toEqual([]);
    expect(disputesFromGed([row('365', '365')], gw, { minLastYear: 2025 })).toEqual([]);
  });
  it('drops pairs that were last active before minLastYear', () => {
    expect(disputesFromGed([row('365', '369', '2022')], gw, { minLastYear: 2025 })).toEqual([]);
  });
  it('throws, naming the number and the conflict, when a GW number has no id', () => {
    expect(() => disputesFromGed([row('365', '9999', '2025', { conflict_name: 'Test war' })], gw, { minLastYear: 2025 })).toThrow(/9999.*Test war/);
  });
  it('sorts by a then b and carries the source', () => {
    const r = disputesFromGed([row('770', '700', '2026', { conflict_name: 'Afghanistan - Pakistan' }), row('365', '369')], gw, { minLastYear: 2025 });
    expect(r.map((d) => `${d.a}-${d.b}`)).toEqual(['AFG-PAK', 'RUS-UKR']);
    expect(r[0]!.source).toMatch(/UCDP/);
    expect(r[0]!.url).toMatch(/^https:\/\/ucdp\.uu\.se/);
  });
  it('pairs every government of a coalition side with every government of the other side', () => {
    const r = disputesFromGed([row('2;200', '369', '2025', { conflict_name: 'Coalition - Ukraine' })], gw, { minLastYear: 2025 });
    expect(r.map((d) => `${d.a}-${d.b}`)).toEqual(['GBR-UKR', 'UKR-USA']);
  });
  it('counts only events inside the window and never needs ids for older rows', () => {
    const r = disputesFromGed([row('365', '369', '2010'), row('9999', '369', '1991'), row('365', '369', '2025')], gw, { minLastYear: 2025 });
    expect(r).toEqual([expect.objectContaining({ a: 'RUS', b: 'UKR', events: 1 })]);
  });
});
