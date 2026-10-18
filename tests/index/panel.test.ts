import { describe, expect, it } from 'vitest';
import { aggregate, buildPanel, ym } from '../../scripts/index/panel';

const ev = (gw: string, y: number, m: number, best: number, type = 1) => ({ gw, name: gw, ym: ym(y, m), best, type });

describe('country-month panel', () => {
  it('sums fatalities per country-month by violence type and keeps zero months', () => {
    const agg = aggregate([ev('A', 2000, 1, 10), ev('A', 2000, 1, 5, 3), ev('A', 2000, 3, 7, 2)]);
    const rows = buildPanel(agg, ym(2000, 1), ym(2000, 6), { minHistory: 0 });
    const jan = rows.find((r) => r.ym === ym(2000, 1))!;
    expect(jan).toMatchObject({ fat: 15, state: 10, onesided: 5, events: 2 });
    expect(rows.find((r) => r.ym === ym(2000, 2))!.fat).toBe(0);
    expect(rows).toHaveLength(6);
  });

  it('rolling sums include the current month, labels look only at the next three months', () => {
    const agg = aggregate([ev('A', 2000, 1, 30), ev('A', 2000, 4, 30), ev('A', 2000, 9, 1)]);
    const r = buildPanel(agg, ym(2000, 1), ym(2000, 12), { minHistory: 0 });
    const at = (m: number) => r.find((x) => x.ym === ym(2000, m))!;
    expect(at(3).f3).toBe(30); // Jan..Mar
    expect(at(1).label3).toBe(1); // Feb..Apr holds 30 >= 25
    expect(at(2).label3).toBe(1);
    expect(at(5).label3).toBe(0); // May..Jul is empty
    expect(at(1).f3).toBe(30);
  });

  it('has no label when the three-month future is not fully observed (no leakage by truncation)', () => {
    const r = buildPanel(aggregate([ev('A', 2000, 12, 99)]), ym(2000, 1), ym(2000, 12), { minHistory: 0 });
    expect(r.find((x) => x.ym === ym(2000, 10))!.label3).toBeNull();
    expect(r.find((x) => x.ym === ym(2000, 9))!.label3).toBe(1);
  });

  it('rise label needs both >= 25 and at least double the previous three months', () => {
    const agg = aggregate([ev('A', 2000, 1, 20), ev('A', 2000, 4, 30), ev('B', 2000, 1, 40), ev('B', 2000, 4, 30)]);
    const r = buildPanel(agg, ym(2000, 1), ym(2000, 12), { minHistory: 0 });
    const a = r.find((x) => x.gw === 'A' && x.ym === ym(2000, 3))!; // prev 20, next 30
    const b = r.find((x) => x.gw === 'B' && x.ym === ym(2000, 3))!; // prev 40, next 30
    expect(a.labelRise).toBe(0); // next 30 is not >= 2 * 20
    expect(b.labelRise).toBe(0); // next 30 is below the previous 40
    const c = buildPanel(aggregate([ev('C', 2000, 1, 10), ev('C', 2000, 4, 30)]), ym(2000, 1), ym(2000, 12), { minHistory: 0 });
    expect(c.find((x) => x.ym === ym(2000, 3))!.labelRise).toBe(1); // 30 >= 2 * 10 and >= 25
  });

  it('drops the first minHistory months so rolling windows are complete', () => {
    const r = buildPanel(aggregate([ev('A', 1989, 1, 1)]), ym(1989, 1), ym(1992, 12), { minHistory: 36 });
    expect(r[0]!.ym).toBe(ym(1991, 12));
  });

  it('has the summed deaths of the next 3, 6 and 12 months, null while that window is not fully observed', () => {
    const agg = aggregate([ev('A', 2000, 2, 10), ev('A', 2000, 6, 20), ev('A', 2000, 12, 40)]);
    const r = buildPanel(agg, ym(2000, 1), ym(2000, 12), { minHistory: 0 });
    const at = (m: number) => r.find((x) => x.ym === ym(2000, m))!;
    expect(at(1)).toMatchObject({ next3: 10, next6: 30, next12: null }); // Feb..Apr, Feb..Jul, Feb..Jan(2001) not observed
    expect(at(6)).toMatchObject({ next3: 0, next6: 40 }); // Jul..Sep is empty; Jul..Dec holds Dec
  });
});

