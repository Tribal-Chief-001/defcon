import { describe, expect, it } from 'vitest';
import { relationsFor } from '../../src/relations/lookup';
import type { Relations } from '../../src/relations/types';

const al = (id: string, name: string, members: string[]) => ({ id, name, kind: 'multilateral' as const, members, source: 's', url: 'https://x', asOf: '2026-10-18' });
const rel: Relations = {
  generated: '2026-10-18',
  alliances: [al('nato', 'NATO', ['FRA', 'USA', 'POL']), al('x', 'Other pact', ['FRA', 'POL', 'ZZZ'])],
  disputes: [{ a: 'RUS', b: 'UKR', conflict: 'Russia - Ukraine', lastYear: 2026, events: 99, source: 'UCDP', url: 'https://ucdp.uu.se/downloads/' }],
};

describe('relationsFor', () => {
  it('lists allies without the country itself, de-duplicated with every alliance name', () => {
    const r = relationsFor(rel, 'FRA');
    expect(r.allies.map((a) => a.id)).toEqual(['POL', 'USA', 'ZZZ']);
    expect(r.allies.find((a) => a.id === 'POL')!.via).toEqual(['NATO', 'Other pact']);
    expect(r.allies.find((a) => a.id === 'FRA')).toBeUndefined();
  });
  it('lists disputes from either side', () => {
    expect(relationsFor(rel, 'UKR').disputes).toEqual([{ id: 'RUS', conflict: 'Russia - Ukraine', events: 99 }]);
    expect(relationsFor(rel, 'RUS').disputes.map((d) => d.id)).toEqual(['UKR']);
  });
  it('is empty for a country with none, an unknown id and null relations', () => {
    expect(relationsFor(rel, 'IND')).toEqual({ allies: [], disputes: [] });
    expect(relationsFor(rel, 'NOPE')).toEqual({ allies: [], disputes: [] });
    expect(relationsFor(null, 'FRA')).toEqual({ allies: [], disputes: [] });
  });
});
