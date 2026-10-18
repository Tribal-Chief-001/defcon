// VRI first-step study (docs/INSTABILITY-INDEX.md section 9): build the country-month panel from UCDP GED 26.1 and see how hard a
// persistence baseline is to beat. Usage: npm run index:study   (needs data/raw/ucdp/ged/GEDEvent_v26_1.csv from npm run data:ucdp)
import { mkdirSync, writeFileSync } from 'node:fs';
import { loadGed } from './ged';
import { auc, averagePrecision, brier, fitLogistic, logLoss, predictLogistic } from './metrics';
import { aggregate, buildPanel, type PanelRow, ym } from './panel';

const CSV = 'data/raw/ucdp/ged/GEDEvent_v26_1.csv';
const START = ym(1989, 1);
const END = ym(2025, 12);

const feats = (r: PanelRow) => [Math.log1p(r.f3), Math.log1p(r.f12), Math.log1p(r.f36)];
const pct = (v: number) => (Number.isNaN(v) ? 'n/a' : (v * 100).toFixed(1) + '%');
const f3 = (v: number) => (Number.isNaN(v) ? 'n/a' : v.toFixed(3));

function report(name: string, rows: PanelRow[], label: 'label3' | 'labelRise', model: ReturnType<typeof fitLogistic>, prevalence: number) {
  const y = rows.map((r) => r[label] as number);
  const pLogit = predictLogistic(model, rows.map(feats));
  const pBase = rows.map(() => prevalence);
  const pos = y.reduce((s, v) => s + v, 0);
  const brierLogit = brier(pLogit, y);
  const brierBase = brier(pBase, y);
  console.log(`| ${name} | ${rows.length} | ${pos} (${pct(pos / rows.length)}) | ${f3(auc(rows.map((r) => r.f3), y))} | ${f3(auc(rows.map((r) => (r.f12 > 0 ? 1 : 0)), y))} | ${f3(auc(pLogit, y))} | ${f3(averagePrecision(rows.map((r) => r.f3), y))} | ${f3(averagePrecision(pLogit, y))} | ${f3(brierLogit)} | ${f3(brierBase)} | ${pct(1 - brierLogit / brierBase)} | ${f3(logLoss(pLogit, y))} |`);
  return { y, pLogit };
}

async function main() {
  const events = await loadGed(CSV, START, END);
  const agg = aggregate(events);
  const panel = buildPanel(agg, START, END, { minHistory: 36 });
  mkdirSync('data/index', { recursive: true });
  const cols = ['gw', 'name', 'ym', 'events', 'fat', 'state', 'nonstate', 'onesided', 'f3', 'f12', 'f36', 'label3', 'labelRise'] as const;
  writeFileSync('data/index/country-month.csv', [cols.join(','), ...panel.map((r) => cols.map((c) => (c === 'name' ? JSON.stringify(r.name) : r[c] ?? '')).join(','))].join('\n'));
  console.log(`events ${events.length}, countries ${agg.size}, panel rows ${panel.length} (1991-12 to 2025-12; labels need 3 future months)\n`);

  const lab = panel.filter((r) => r.label3 !== null);
  const train = lab.filter((r) => r.ym <= ym(2016, 9)); // labels end by 2016-12: no overlap with validation
  const val = lab.filter((r) => r.ym >= ym(2017, 1) && r.ym <= ym(2020, 9));
  const test = lab.filter((r) => r.ym >= ym(2021, 1));

  for (const label of ['label3', 'labelRise'] as const) {
    const model = fitLogistic(train.map(feats), train.map((r) => r[label] as number));
    const prevalence = train.reduce((s, r) => s + (r[label] as number), 0) / train.length;
    console.log(`### Target ${label === 'label3' ? '"escalation": next 3 months >= 25 deaths' : '"rise": next 3 months >= 25 deaths and >= 2x previous 3 months'}`);
    console.log(`Train rows ${train.length}, base rate ${pct(prevalence)}; logistic on log1p(deaths 3/12/36 months), weights ${model.w.map((w) => w.toFixed(2)).join(', ')}\n`);
    console.log('| split | rows | positives | AUC persistence(3m) | AUC any-violence(12m) | AUC logistic | AP persistence | AP logistic | Brier logistic | Brier base rate | Brier skill | Log loss |');
    console.log('|---|---|---|---|---|---|---|---|---|---|---|---|');
    report('train (<=2016-09)', train, label, model, prevalence);
    report('validation (2017-01..2020-09)', val, label, model, prevalence);
    const { y, pLogit } = report('test (2021-01..2025-09)', test, label, model, prevalence);
    // outbreaks in places with no deaths in the last 12 months: persistence cannot see them by construction
    const quiet = test.filter((r) => r.f12 === 0);
    const quietPos = quiet.reduce((s, r) => s + (r[label] as number), 0);
    const allPos = y.reduce((s, v) => s + v, 0);
    console.log(`\nTest: ${quiet.length} country-months had zero deaths in the previous 12 months; ${quietPos} of ${allPos} test positives (${pct(quietPos / allPos)}) happened there (the part persistence cannot catch).`);
    const order = pLogit.map((_, i) => i).sort((a, b) => pLogit[a]! - pLogit[b]!);
    console.log('\nReliability on test (logistic, 5 equal-count bins): predicted -> observed');
    for (let b = 0; b < 5; b++) {
      const part = order.slice(Math.floor((b * order.length) / 5), Math.floor(((b + 1) * order.length) / 5));
      const pm = part.reduce((s, i) => s + pLogit[i]!, 0) / part.length;
      const om = part.reduce((s, i) => s + y[i]!, 0) / part.length;
      console.log(`- bin ${b + 1}: ${pct(pm)} -> ${pct(om)} (n ${part.length})`);
    }
    console.log('');
  }
}

main().catch((e) => (console.error(e), process.exit(1)));
