import { describe, expect, it } from 'vitest';
import { conflictsCsv, csvCell, indicesCsv, safeFileName, toCsv } from '../../src/exports/csv';
import type { Conflict, ConflictsFile } from '../../src/conflicts/types';
import { worldFixture } from '../conflicts/fixture';
import { indicesFixture } from '../indices/fixture';

const R = (best: number, low = best - 1, high = best + 2) => ({ best, low, high });
const conflict = (o: Partial<Conflict>): Conflict => ({ id: 'a', name: 'Alpha - Beta', kinds: ['state', 'one-sided'], countries: [{ id: 'UKR', name: 'Ukraine', deaths365: 5 }, { id: null, name: 'Atlantis', deaths365: 1 }], deaths: { d30: R(10), d90: R(30), d365: R(100) }, events: { d30: 1, d90: 2, d365: 3 }, trend: 'steady', lastDate: '2026-08-30', weekly: new Array(52).fill(1), latest: [], provisionalShare: 0.25, geo: null, ...o });
const file = (cs: Conflict[]): ConflictsFile => ({ generated: '2026-10-19', dataEnd: '2026-08-31', sources: ['t'], world: worldFixture(), conflicts: cs });

describe('csvCell', () => {
  it('leaves plain text and finite numbers alone and writes missing values as empty', () => {
    expect(csvCell('Ukraine')).toBe('Ukraine');
    expect(csvCell(12.5)).toBe('12.5');
    expect(csvCell(-3)).toBe('-3'); // a number, not a formula
    expect(csvCell(null)).toBe('');
    expect(csvCell(undefined)).toBe('');
    expect(csvCell(Number.NaN)).toBe('');
    expect(csvCell(Number.POSITIVE_INFINITY)).toBe('');
    expect(csvCell(true)).toBe('true');
  });
  it('quotes fields with commas, quotes and line breaks, and doubles the quotes', () => {
    expect(csvCell('a, b')).toBe('"a, b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell('line1\nline2')).toBe('"line1\nline2"');
    expect(csvCell('cr\rhere')).toBe('"cr\rhere"'); // a lone CR inside text is quoted
  });
  it('neutralises spreadsheet formulas in text: a leading = + - @ tab or carriage return gets an apostrophe', () => {
    for (const bad of ['=SUM(A1:A9)', '+1+1', '-2+3', '@SUM(1)', '\t=1', '=HYPERLINK("http://x","y")']) {
      const c = csvCell(bad);
      expect(c.replace(/^"/, '').startsWith("'"), bad).toBe(true);
    }
    expect(csvCell('Alpha = Beta')).toBe('Alpha = Beta'); // only the first character matters
  });
});

describe('toCsv', () => {
  it('joins rows with LF and ends with a newline', () => {
    expect(toCsv([['a', 'b'], [1, null]])).toBe('a,b\n1,\n');
  });
});

describe('conflictsCsv', () => {
  it('has a header, one row per conflict, the death ranges, the countries joined and the data end date', () => {
    const lines = conflictsCsv(file([conflict({}), conflict({ id: 'b', name: '=cmd|"/c calc"!A1' })])).trim().split('\n');
    expect(lines[0]).toMatch(/^id,name,kinds,activity_trend,deaths_30d_best,deaths_30d_low,deaths_30d_high,deaths_90d_best/);
    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain('Alpha - Beta');
    expect(lines[1]).toContain('state;one-sided');
    expect(lines[1]).toContain('Ukraine;Atlantis');
    expect(lines[1]).toContain('10,9,12'); // 30-day best, low, high
    expect(lines[1]).toContain('2026-08-31');
    expect(lines[2]).not.toMatch(/^b,=cmd/); // the hostile name is neutralised
    expect(lines[2]).toMatch(/^b,"?'=cmd/);
  });
});

describe('indicesCsv', () => {
  it('has one row per country with the Fatality Index, its ranges, the two probabilities with their intervals and the confidence', () => {
    const f = indicesFixture();
    const names = new Map([['UKR', 'Ukraine'], ['ECU', 'Ecuador'], ['ISL', 'Iceland']]);
    const lines = indicesCsv(f, names).trim().split('\n');
    expect(lines[0]).toMatch(/^country_id,country,fatality_score,fatality_score_low,fatality_score_high,band/);
    expect(lines).toHaveLength(1 + f.countries.length);
    const ukr = lines.find((l) => l.startsWith('UKR,'))!;
    expect(ukr).toContain('Ukraine');
    expect(ukr).toContain('severe');
    expect(ukr).toContain('0.9997');
    const isl = lines.find((l) => l.startsWith('ISL,'))!;
    expect(isl.split(',').slice(-9).join(',')).toBe(',,,,,,,,2026-08-31'); // not modelled: empty risk columns, never zeros
  });
});

describe('safeFileName', () => {
  it('keeps letters, digits, dash, underscore and dot only', () => {
    expect(safeFileName('Defcon conflicts / 2026-08-31?.csv')).toBe('Defcon-conflicts-2026-08-31.csv');
    expect(safeFileName('../../etc/passwd')).toBe('etc-passwd');
    expect(safeFileName('')).toBe('download');
  });
});
