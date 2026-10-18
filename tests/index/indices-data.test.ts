import { readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { FEATURES } from '../../scripts/index/model';
import type { IndicesFile } from '../../src/indices/types';

const PATH = 'public/data/indices.json';
const f = JSON.parse(readFileSync(PATH, 'utf8')) as IndicesFile;
const by = new Map(f.countries.map((c) => [c.id, c]));

describe('public/data/indices.json', () => {
  it('has a valid header, the UCDP country universe and a small size', () => {
    expect(f.dataEnd).toBe('2026-08-31');
    expect(f.seriesEnd).toBe('2026-08');
    expect(f.countries.length).toBeGreaterThanOrEqual(120);
    expect(new Set(f.countries.map((c) => c.id)).size).toBe(f.countries.length);
    expect(statSync(PATH).size).toBeLessThan(200_000);
    expect(gzipSync(readFileSync(PATH)).length).toBeLessThan(60_000);
    expect(f.world.monthly).toHaveLength(120);
  });

  it('has a consistent Fatality Index for every country', () => {
    for (const c of f.countries) {
      const x = c.fatality;
      expect(c.id).toMatch(/^[A-Za-z0-9]{3}$/);
      expect(x.scoreLow, c.id).toBeGreaterThanOrEqual(0);
      expect(x.scoreLow, c.id).toBeLessThanOrEqual(x.score);
      expect(x.score, c.id).toBeLessThanOrEqual(x.scoreHigh);
      expect(x.scoreHigh, c.id).toBeLessThanOrEqual(100);
      for (const r of [x.deaths90, x.deaths365]) expect(r.low <= r.best && r.best <= r.high && r.low >= 0, c.id).toBe(true);
      expect(x.deaths90.best, c.id).toBeLessThanOrEqual(x.deaths365.best);
      expect(x.band, c.id).toBe(x.deaths365.best <= 0 ? 'none' : x.deaths365.best < 25 ? 'minor' : x.deaths365.best < 1000 ? 'active' : 'severe');
      expect(x.monthly, c.id).toHaveLength(120);
      expect(x.monthly.every((v) => Number.isFinite(v) && v >= 0)).toBe(true);
      expect(x.per100k === null || x.per100k >= 0).toBe(true);
    }
  });

  it('ranks the countries with deaths in the last 90 days from 1; countries with equal deaths share a rank (finding: arbitrary tie order)', () => {
    const ranked = f.countries.filter((c) => c.fatality.rank !== null);
    expect(ranked.every((c) => c.fatality.deaths90.best > 0)).toBe(true);
    expect(f.countries.filter((c) => c.fatality.deaths90.best > 0).every((c) => c.fatality.rank !== null)).toBe(true);
    for (const c of ranked) expect(c.fatality.rank, c.id).toBe(1 + ranked.filter((o) => o.fatality.deaths90.best > c.fatality.deaths90.best).length);
    expect(ranked.some((c) => ranked.some((o) => o !== c && o.fatality.rank === c.fatality.rank))).toBe(true); // the real data has ties
  });

  it('invents no range: where low, best and high deaths are equal the score has no range, and a tiny rate is not rounded to zero', () => {
    for (const c of f.countries) {
      const d = c.fatality.deaths90;
      if (d.low === d.best && d.best === d.high) expect(c.fatality.scoreHigh - c.fatality.scoreLow, c.id).toBeLessThanOrEqual(0.1); // only the rounding of one decimal
      if (c.fatality.deaths365.best > 0 && c.fatality.per100k !== null) expect(c.fatality.per100k, c.id).toBeGreaterThan(0);
    }
    const zero = f.countries.find((c) => c.fatality.deaths365.best === 0);
    if (zero) expect(zero.fatality.scoreHigh).toBe(0);
  });

  it('has probabilities with ordered intervals, rise never above continue, a confidence with a reason and an exactly-named breakdown', () => {
    let modelled = 0;
    for (const c of f.countries) {
      const r = c.risk;
      if (!r) continue;
      modelled++;
      for (const p of [r.continue, r.rise]) {
        expect(p.lo, c.id).toBeGreaterThanOrEqual(0);
        expect(p.hi, c.id).toBeLessThanOrEqual(1);
        expect(p.lo <= p.p + 1e-9 && p.p <= p.hi + 1e-9, `${c.id} ${JSON.stringify(p)}`).toBe(true);
      }
      expect(r.continue.p + 1e-9, c.id).toBeGreaterThanOrEqual(r.rise.p);
      expect(['rising', 'steady', 'falling', 'low data']).toContain(r.momentum.direction);
      expect(Number.isFinite(r.momentum.value)).toBe(true);
      expect(['high', 'medium', 'low']).toContain(r.confidence);
      expect(r.confidenceReason.length).toBeGreaterThan(10);
      expect(r.why.map((w) => w.label).sort()).toEqual([...FEATURES].sort());
      expect(r.why.every((w) => Number.isFinite(w.value))).toBe(true);
      const mags = r.why.map((w) => Math.abs(w.value));
      expect(mags).toEqual([...mags].sort((a, b) => b - a)); // biggest reason first
    }
    expect(modelled).toBeGreaterThan(100);
  });

  it('puts Ukraine where the data says: severe, the most deadly, very likely to continue', () => {
    const u = by.get('UKR')!;
    expect(u.fatality.band).toBe('severe');
    expect(u.fatality.rank).toBe(1);
    expect(u.fatality.score).toBeGreaterThan(95);
    expect(u.risk!.continue.p).toBeGreaterThan(0.9);
  });

  it('keeps the rise interval inside the continue interval for every country (a sharp rise implies continuing violence)', () => {
    for (const c of f.countries) if (c.risk) {
      expect(c.risk.rise.lo, c.id).toBeLessThanOrEqual(c.risk.continue.lo + 1e-9);
      expect(c.risk.rise.hi, c.id).toBeLessThanOrEqual(c.risk.continue.hi + 1e-9);
    }
  });
  it('reads the last 90 days of Ukraine from the days its month-long events cover, not from their start dates (finding)', () => {
    const u = by.get('UKR')!;
    const m = u.fatality.monthly; // the last three months of the series are the calendar months up to the data end
    const quarter = m[119]! + m[118]! + m[117]!;
    expect(Math.abs(u.fatality.deaths90.best - quarter) / quarter).toBeLessThan(0.08); // 90 days against three calendar months (about 92 days)
    expect(u.risk!.momentum.direction).not.toBe('low data');
  });

  it('does not model a country UCDP has never recorded: it is absent or has no risk numbers, never a fake "low"', () => {
    const iceland = by.get('ISL');
    expect(iceland === undefined || iceland.risk === null).toBe(true);
  });

  it('does not show an extreme risk the backtest cannot support: no probability of a rise above 75%', () => {
    for (const c of f.countries) if (c.risk) expect(c.risk.rise.p, c.id).toBeLessThanOrEqual(0.75);
  });

  it('guards the backtest: the model must keep beating persistence-level discrimination and stay calibrated', () => {
    const m = f.model;
    expect(m.rise.auc).toBeGreaterThanOrEqual(0.75);
    expect(m.continue.auc).toBeGreaterThanOrEqual(0.95);
    expect(m.rise.brierSkill).toBeGreaterThan(0);
    expect(m.continue.brierSkill).toBeGreaterThan(0);
    expect(m.rise.auc).toBeGreaterThan(m.rise.persistenceAuc);
    for (const t of [m.rise, m.continue]) {
      expect(t.testRows).toBeGreaterThan(5000);
      expect(t.bins).toHaveLength(5);
      expect(t.bins.reduce((s, b) => s + b.n, 0)).toBe(t.testRows);
      for (const b of t.bins) expect(Math.abs(b.predicted - b.observed), JSON.stringify(b)).toBeLessThanOrEqual(0.05);
      if (t.tail.n >= 30) expect(Math.abs(t.tail.predicted - t.tail.observed), 'predictions of 30% or more').toBeLessThanOrEqual(0.15); // the tail is where a score can mislead
    }
    // the published document carries the numbers of the data file (the document is generated, so a stale one means a forgotten rebuild)
    const doc = readFileSync('docs/INDEX-BACKTEST.md', 'utf8');
    for (const v of [m.rise.auc, m.continue.auc, m.rise.persistenceAuc]) expect(doc, String(v)).toContain(v.toFixed(4));
    // stability: the model is also tested year by year; the floors are set below what the data showed when they were written
    expect(m.rolling.length).toBeGreaterThanOrEqual(8);
    for (const y of m.rolling) {
      expect(y.riseAuc, `rise AUC ${y.year}`).toBeGreaterThanOrEqual(0.75);
      expect(y.riseAuc, `rise AUC against recent deaths alone ${y.year}`).toBeGreaterThan(y.risePersistenceAuc); // in every year, not only on average
      expect(y.continueAuc, `continue AUC ${y.year}`).toBeGreaterThanOrEqual(0.95);
    }
    expect(m.features).toEqual(FEATURES);
    expect(m.trainedThrough).toBe('2025-09');
    expect(m.bootstrapReps).toBeGreaterThanOrEqual(100);
  });
});
