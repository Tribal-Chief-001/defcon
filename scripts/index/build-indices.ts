// Builds public/data/indices.json (the Defcon Fatality Index and the Instability Index / Violence Risk Index) and docs/INDEX-BACKTEST.md.
// Usage: npm run data:indices   (after npm run data:ucdp and npm run index:fetch). About 3 minutes (the bootstrap), about 500 MB.
// Definitions and limits: docs/superpowers/plans/2026-10-19-plan-11-indices.md and the method section of the app.
import { createReadStream, readFileSync, writeFileSync } from 'node:fs';
import { parse } from 'csv-parse';
import { activityTrend } from '../conflicts/trend';
import type { GedRow } from '../conflicts/conflicts';
import { resolveGw } from '../relations/gw-ids';
import type { CountryIndex, IndicesFile, Risk } from '../../src/indices/types';
import { bandOf, countryStats, dfiRange, momentumOf, per100k, type Stats } from './indices';
import { capDataEnd } from '../lib/dates';
import { backtest, bootstrapPair, rollingBacktest, confidenceOf, contributions, FEATURES, featureVector, fitTwo, predictOne, type TrainRow } from './model';
import { aggregate, buildPanel, type GedEv, ym } from './panel';
import { latestBefore, latestPublished, parseWbHist } from './structural';

const START = ym(1989, 1);
const REPS = 100;
const WGI = ['GE', 'RL', 'CC', 'VA', 'RQ'].map((k) => `GOV_WGI_${k}.EST`);
const FIELDS = ['id', 'country', 'country_id', 'date_start', 'date_end', 'best', 'low', 'high', 'where_prec', 'type_of_violence'];
const r1 = (v: number) => Math.round(v * 10) / 10;
const r3 = (v: number) => Math.round(v * 1000) / 1000;
const r4 = (v: number) => Math.round(v * 10000) / 10000;

async function main() {
  const manifest = JSON.parse(readFileSync('data/events/sources.json', 'utf8')) as { ucdp: { name: string; csv: string }[] };
  const countries = JSON.parse(readFileSync('public/data/countries.json', 'utf8')) as { id: string; name: string; iso3: string }[];
  const events: GedEv[] = [];
  const rows: { row: GedRow; provisional: boolean }[] = [];
  const gwNames = new Map<string, string>();
  const seen = new Set<string>();
  let maxDate = '';
  for (const s of manifest.ucdp) {
    const provisional = s.name.startsWith('candidate');
    for await (const r of createReadStream(`data/raw/ucdp/${s.csv}`).pipe(parse({ columns: true, relax_column_count: true, bom: true })) as AsyncIterable<GedRow>) {
      const d = (r.date_start ?? '').slice(0, 10);
      const best = Number(r.best);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || !r.id || !r.country_id || !Number.isFinite(best) || seen.has(r.id)) continue;
      seen.add(r.id);
      if (d > maxDate) maxDate = d;
      gwNames.set(r.country_id, r.country ?? r.country_id);
      events.push({ gw: r.country_id, name: r.country ?? r.country_id, ym: ym(+d.slice(0, 4), +d.slice(5, 7)), best, type: Number(r.type_of_violence) });
      if (d >= '2016-01-01') rows.push({ row: Object.fromEntries(FIELDS.map((f) => [f, r[f]])), provisional });
    }
  }
  maxDate = capDataEnd(maxDate, new Date().toISOString().slice(0, 10)); // one bad future date must not move the data end
  if (!maxDate) throw new Error('no UCDP rows found: run npm run data:ucdp first');
  const END = ym(+maxDate.slice(0, 4), +maxDate.slice(5, 7));
  const dataEndS = Date.UTC(+maxDate.slice(0, 4), +maxDate.slice(5, 7) - 1, +maxDate.slice(8, 10)) / 1000;
  const { gwToId, unmapped } = resolveGw(gwNames, countries);
  if (unmapped.length) console.warn(`unmapped countries: ${unmapped.map((u) => `${u.gw} ${u.name}`).join(', ')}`);

  const iso3 = new Map(countries.map((c) => [c.id, c.iso3]));
  const series = (code: string) => parseWbHist(readFileSync(`data/raw/wb-hist/${code}.json`, 'utf8'));
  const wgiSeries = WGI.map(series);
  const pop = series('SP.POP.TOTL');
  const wgiAt = (id: string, year: number) => {
    const vals = wgiSeries.map((m) => latestPublished(m.get(iso3.get(id) ?? ''), year, 3));
    return vals.every((v) => v !== null) ? (vals as number[]) : null;
  };

  // ---- the panel and the training rows (final data only: a label window must be fully observed, so country-months up to 2025-09)
  const panel = buildPanel(aggregate(events), START, END, { minHistory: 36 });
  const TRAIN_END = ym(2025, 9);
  const train: TrainRow[] = [];
  const now = new Map<string, { f3: number; f12: number; f36: number }>();
  const dup = new Set<string>();
  for (const r of panel) {
    const id = gwToId[r.gw];
    if (!id) continue;
    if (r.ym === END) now.set(id, { f3: r.f3, f12: r.f12, f36: r.f36 });
    if (r.ym < ym(1998, 1) || r.ym > TRAIN_END || r.next3 === null || dup.has(`${id}|${r.ym}`)) continue;
    dup.add(`${id}|${r.ym}`);
    const w = wgiAt(id, Math.floor(r.ym / 12));
    if (!w) continue;
    train.push({ id, ym: r.ym, f3: r.f3, x: featureVector(r.f3, r.f12, r.f36, w), yContinue: r.next3 >= 25 ? 1 : 0, yRise: r.labelRise ?? 0 });
  }
  console.log(`data end ${maxDate}; training country-months ${train.length}; countries ${now.size}`);

  const bt = backtest(train, { trainEnd: ym(2015, 12), testStart: ym(2021, 1), testEnd: TRAIN_END });
  const model = fitTwo(train);

  // ---- observed statistics and predictions at the data end
  const stats = countryStats(rows, { dataEndS, gwToId });
  const empty = (): Stats => ({ deaths30: { best: 0, low: 0, high: 0 }, deaths90: { best: 0, low: 0, high: 0 }, deaths365: { best: 0, low: 0, high: 0 }, events30: 0, events90: 0, events365: 0, monthly: new Array<number>(120).fill(0), locatedShare365: 1, provisionalShare90: 0 });
  const ids = [...new Set([...now.keys(), ...stats.countries.keys()])].sort();
  const modelled = ids.filter((id) => now.has(id) && wgiAt(id, Math.floor(END / 12)));
  const xs = modelled.map((id) => {
    const n = now.get(id)!;
    return featureVector(n.f3, n.f12, n.f36, wgiAt(id, Math.floor(END / 12))!);
  });
  console.log(`bootstrap: ${REPS} refits x 2 for ${modelled.length} countries ...`);
  const ci = bootstrapPair(train, xs, REPS, 101);

  const list: CountryIndex[] = ids.map((id) => {
    const s = stats.countries.get(id) ?? empty();
    const fr = dfiRange(s.deaths90);
    const population = latestBefore(pop.get(iso3.get(id) ?? ''), Math.floor(END / 12), 3);
    const c: CountryIndex = {
      id,
      fatality: {
        score: r1(fr.score),
        scoreLow: r1(fr.low),
        scoreHigh: r1(Math.min(100, fr.high)),
        deaths90: { best: s.deaths90.best, low: s.deaths90.low, high: s.deaths90.high },
        deaths365: { best: s.deaths365.best, low: s.deaths365.low, high: s.deaths365.high },
        per100k: ((v) => (v === null ? null : v >= 0.01 ? Math.round(v * 100) / 100 : Number(v.toPrecision(2))))(per100k(s.deaths365.best, population)), // tiny rates keep two significant digits instead of rounding to 0
        band: bandOf(s.deaths365.best),
        trend: activityTrend(s.events30, s.events90),
        rank: null,
        monthly: s.monthly.map(Math.round),
      },
      risk: null,
    };
    // keep scoreLow <= score <= scoreHigh after rounding
    c.fatality.scoreLow = Math.min(c.fatality.scoreLow, c.fatality.score);
    c.fatality.scoreHigh = Math.max(c.fatality.scoreHigh, c.fatality.score);
    const k = modelled.indexOf(id);
    if (k >= 0) {
      const x = xs[k]!;
      const pc = predictOne(model.continue, x);
      const pr = Math.min(predictOne(model.rise, x), pc); // a sharp rise implies continuing violence
      const cont = { p: pc, lo: Math.min(ci.continue[k]!.lo, pc), hi: Math.max(ci.continue[k]!.hi, pc) };
      const rise = { p: pr, lo: Math.min(ci.rise[k]!.lo, pr), hi: Math.max(ci.rise[k]!.hi, pr) };
      const why = contributions(model.rise, x).contributions.map((value, j) => ({ label: FEATURES[j]!, value: r3(value) })).sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
      const conf = confidenceOf({ locatedShare365: s.locatedShare365, intervalWidth: rise.hi - rise.lo, provisionalShare90: s.provisionalShare90, deaths365: s.deaths365.best });
      const risk: Risk = {
        continue: { p: r4(cont.p), lo: r4(cont.lo), hi: r4(cont.hi) },
        rise: { p: r4(rise.p), lo: r4(rise.lo), hi: r4(rise.hi) },
        momentum: ((m) => ({ value: r3(m.value), direction: m.direction }))(momentumOf(s.deaths30.best, s.deaths90.best)),
        confidence: conf.level,
        confidenceReason: conf.reason,
        why,
      };
      // rounding must not break lo <= p <= hi
      for (const p of [risk.continue, risk.rise]) (p.lo = Math.min(p.lo, p.p), (p.hi = Math.max(p.hi, p.p)));
      c.risk = risk;
    }
    return c;
  });
  const ranked = list.filter((c) => c.fatality.deaths90.best > 0).sort((a, b) => b.fatality.deaths90.best - a.fatality.deaths90.best || a.id.localeCompare(b.id));
  // competition ranking (1, 2, 2, 4): countries with equal deaths share a rank instead of an arbitrary order by id
  ranked.forEach((c) => (c.fatality.rank = 1 + ranked.filter((o) => o.fatality.deaths90.best > c.fatality.deaths90.best).length));

  const rolling = rollingBacktest(train, Array.from({ length: 10 }, (_, i) => 2016 + i));
  const m4 = (t: typeof bt.rise) => ({ ...t, auc: r4(t.auc), ap: r4(t.ap), brierSkill: r4(t.brierSkill), baseRate: r4(t.baseRate), persistenceAuc: r4(t.persistenceAuc), bins: t.bins.map((b) => ({ predicted: r4(b.predicted), observed: r4(b.observed), n: b.n })), tail: { predicted: r4(t.tail.predicted), observed: r4(t.tail.observed), n: t.tail.n } });
  const out: IndicesFile = {
    generated: new Date().toISOString().slice(0, 10),
    dataEnd: maxDate,
    seriesEnd: maxDate.slice(0, 7),
    model: { trainedThrough: '2025-09', testPeriod: '2021-01 to 2025-09', features: FEATURES, bootstrapReps: REPS, rise: m4(bt.rise), continue: m4(bt.continue), rolling: rolling.map((y) => ({ year: y.year, testRows: y.testRows, positives: y.positives, riseAuc: r4(y.rise.auc), risePersistenceAuc: r4(y.rise.persistenceAuc), continueAuc: r4(y.continue.auc), continuePersistenceAuc: r4(y.continue.persistenceAuc) })) },
    world: { monthly: stats.world.map(Math.round) },
    countries: list,
  };
  writeFileSync('public/data/indices.json', JSON.stringify(out));
  writeFileSync('docs/INDEX-BACKTEST.md', backtestDoc(out, train.length));
  console.log(`wrote ${list.length} countries; ranked ${ranked.length}`);
  console.log('top Fatality Index:', ranked.slice(0, 8).map((c) => `${c.id} ${c.fatality.score}`).join(', '));
  console.log('top rise risk:', list.filter((c) => c.risk).sort((a, b) => b.risk!.rise.p - a.risk!.rise.p).slice(0, 8).map((c) => `${c.id} ${(c.risk!.rise.p * 100).toFixed(1)}%`).join(', '));
  console.log(`backtest rise AUC ${out.model.rise.auc} (persistence ${out.model.rise.persistenceAuc}), continue AUC ${out.model.continue.auc} (persistence ${out.model.continue.persistenceAuc})`);
}

function backtestDoc(f: IndicesFile, nTrain: number): string {
  const t = (name: string, m: IndicesFile['model']['rise']) => `### ${name}

- test country-months ${m.testRows}, positives ${m.positives} (${(m.positives / m.testRows * 100).toFixed(1)}%), training base rate ${(m.baseRate * 100).toFixed(1)}%
- AUC **${m.auc}** (persistence baseline: deaths in the last 3 months, AUC ${m.persistenceAuc}); average precision ${m.ap}; Brier skill ${(m.brierSkill * 100).toFixed(1)}% over the base rate

| predicted (bin mean) | observed | country-months |
|---|---|---|
${m.bins.map((b) => `| ${(b.predicted * 100).toFixed(1)}% | ${(b.observed * 100).toFixed(1)}% | ${b.n} |`).join('\n')}

Predictions of 30% or more (the tail, where a score can mislead): predicted ${(m.tail.predicted * 100).toFixed(1)}%, observed ${(m.tail.observed * 100).toFixed(1)}% over ${m.tail.n} country-months.
`;
  return `# Index backtest (generated)

Generated by \`npm run data:indices\` on ${f.generated}. Do not edit by hand. Data end ${f.dataEnd}; model trained on ${nTrain} country-months up to ${f.model.trainedThrough} (final UCDP GED data only, from 1998 when the governance scores start); this table is a **time-split** check: fit up to 2015-12, evaluate on ${f.model.testPeriod}, so label windows never cross the split. Features: ${f.model.features.join(', ')}. Intervals in the product are the 5th to 95th percentile of ${f.model.bootstrapReps} cluster-bootstrap refits (countries resampled) and cover training-sample uncertainty only.

${t('"Continue": at least 25 deaths in the next 3 months', f.model.continue)}
${t('"Rise": at least 25 deaths and at least double the previous 3 months', f.model.rise)}
## Year by year (rolling origin)

For each year the models are fitted on everything up to September of the year before and tested on that year, so a lucky split cannot hide a bad year. AUC of the model against the persistence baseline (deaths in the last 3 months).

| test year | country-months | "rise" positives | "rise" AUC | baseline | "continue" AUC | baseline |
|---|---|---|---|---|---|---|
${f.model.rolling.map((y) => `| ${y.year} | ${y.testRows} | ${y.positives} | ${y.riseAuc} | ${y.risePersistenceAuc} | ${y.continueAuc} | ${y.continuePersistenceAuc} |`).join('\n')}

## Reading it

"Continue" is mostly persistence (the baseline is already close); the model adds a little. "Rise" is where history alone is weak and governance adds a small gain. Neither is a forecast of an outbreak in a peaceful country (see docs/VRI-STUDY-2.md: onset is not forecastable from these inputs). Calibration bins that stay close to the diagonal are what the guard test in tests/index/indices-data.test.ts enforces.
`;
}

main().catch((e) => (console.error(e), process.exit(1)));
