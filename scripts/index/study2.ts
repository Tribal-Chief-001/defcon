// VRI study 2: how sensitive are the targets to threshold and horizon, and do structural features (World Bank WDI and WGI, neighbour
// violence) beat a history-only model? With cluster-bootstrap intervals over countries. Usage: npm run index:study2
// (needs npm run data:ucdp and npm run index:fetch). Deterministic (seeded).
import { readFileSync } from 'node:fs';
import { resolveGw } from '../relations/gw-ids';
import { loadGed } from './ged';
import { auc, averagePrecision, brier, clusterBootstrap, fitLogistic, percentile, predictLogistic } from './metrics';
import { aggregate, buildPanel, type PanelRow, ym } from './panel';
import { latestBefore, neighbourSignals, parseWbHist, type Series } from './structural';

const START = ym(1989, 1);
const END = ym(2025, 12);
const TRAIN_END = ym(2015, 12); // labels reach at most 12 months ahead: no overlap with the test years
const TEST_START = ym(2021, 1);
const REPS = 500;
const pct = (v: number) => (Number.isNaN(v) ? 'n/a' : (v * 100).toFixed(1) + '%');
const f3 = (v: number) => (Number.isNaN(v) ? 'n/a' : v.toFixed(3));
const sgn = (v: number) => (v >= 0 ? '+' : '') + v.toFixed(3);

type Row = PanelRow & { id: string; x: { hist: number[]; nb: number[]; wdi: number[] | null; wgi: number[] | null } };
const wb = (code: string) => parseWbHist(readFileSync(`data/raw/wb-hist/${code}.json`, 'utf8'));

async function main() {
  const countries = JSON.parse(readFileSync('public/data/countries.json', 'utf8')) as { id: string; name: string; iso3: string; neighbours: string[] }[];
  const events = await loadGed('data/raw/ucdp/ged/GEDEvent_v26_1.csv', START, END);
  const gwNames = new Map(events.map((e) => [e.gw, e.name]));
  const { gwToId, unmapped } = resolveGw(gwNames, countries);
  const panel = buildPanel(aggregate(events), START, END, { minHistory: 36 });

  const iso3 = new Map(countries.map((c) => [c.id, c.iso3]));
  const nb = Object.fromEntries(countries.map((c) => [c.id, c.neighbours]));
  const seen = new Set<string>();
  const mapped: (PanelRow & { id: string })[] = [];
  let dup = 0;
  for (const r of panel) {
    const id = gwToId[r.gw];
    if (!id) continue;
    if (seen.has(`${id}|${r.ym}`)) {
      dup++;
      continue;
    }
    seen.add(`${id}|${r.ym}`);
    mapped.push({ ...r, id });
  }
  const f12 = new Map(mapped.map((r) => [`${r.id}|${r.ym}`, r.f12]));
  const S: Record<string, Map<string, Series>> = Object.fromEntries(['NY.GDP.PCAP.KD', 'SP.POP.TOTL', 'SP.DYN.IMRT.IN', 'GOV_WGI_GE.EST', 'GOV_WGI_RL.EST', 'GOV_WGI_CC.EST', 'GOV_WGI_VA.EST', 'GOV_WGI_RQ.EST'].map((c) => [c, wb(c)]));
  const val = (code: string, id: string, year: number) => latestBefore(S[code]!.get(iso3.get(id) ?? ''), year);

  const rows: Row[] = mapped.map((r) => {
    const year = Math.floor(r.ym / 12);
    const n = neighbourSignals(r.id, r.ym, nb, f12);
    const gdp = val('NY.GDP.PCAP.KD', r.id, year);
    const pop = val('SP.POP.TOTL', r.id, year);
    const imr = val('SP.DYN.IMRT.IN', r.id, year);
    const wg = ['GE', 'RL', 'CC', 'VA', 'RQ'].map((k) => val(`GOV_WGI_${k}.EST`, r.id, year));
    return {
      ...r,
      x: {
        hist: [Math.log1p(r.f3), Math.log1p(r.f12), Math.log1p(r.f36)],
        nb: [Math.log1p(n.nbDeaths), n.nbInConflict, n.nbCount],
        wdi: gdp !== null && pop !== null && imr !== null && gdp > 0 && pop > 0 ? [Math.log(gdp), Math.log(pop), imr] : null,
        wgi: wg.every((v) => v !== null) ? (wg as number[]) : null,
      },
    };
  });
  const complete = rows.filter((r) => r.x.wdi && r.x.wgi && Math.floor(r.ym / 12) >= 1998);

  console.log('## Coverage\n');
  console.log(`- GED events ${events.length}; panel rows ${panel.length}; countries mapped to Natural Earth ids ${new Set(mapped.map((r) => r.id)).size}; dropped as unmapped: ${unmapped.map((u) => `${u.gw} ${u.name}`).join(', ') || 'none'}; duplicate country-months skipped: ${dup}`);
  console.log(`- rows with every structural input (from 1998): ${complete.length} of ${rows.length}; train <= 2015-12, test 2021-01 and later`);

  // ---- A. threshold and horizon grid, history-only, all mapped rows
  const train = (rs: Row[], h: 3 | 6 | 12) => rs.filter((r) => r.ym <= TRAIN_END && r[`next${h}` as 'next3'] !== null);
  const test = (rs: Row[], h: 3 | 6 | 12) => rs.filter((r) => r.ym >= TEST_START && r[`next${h}` as 'next3'] !== null);
  console.log('\n## A. Escalation target: threshold and horizon (history-only; all mapped rows)\n');
  console.log('| deaths in the next | at least | test rows | prevalence | positives in quiet places | AUC persistence (3 m) | AUC logistic | AP logistic | Brier skill |');
  console.log('|---|---|---|---|---|---|---|---|---|');
  for (const h of [3, 6, 12] as const) {
    for (const thr of [10, 25, 100]) {
      const lab = (r: Row): number => ((r[`next${h}` as "next3"] as number) >= thr ? 1 : 0);
      const tr = train(rows, h);
      const te = test(rows, h);
      const m = fitLogistic(tr.map((r) => r.x.hist), tr.map(lab));
      const p = predictLogistic(m, te.map((r) => r.x.hist));
      const y = te.map(lab);
      const base = tr.reduce((s, r) => s + lab(r), 0) / tr.length;
      const pos = y.reduce((s, v) => s + v, 0);
      const quietPos = te.filter((r) => r.f12 === 0).reduce((s, r) => s + lab(r), 0);
      console.log(`| ${h} months | ${thr} | ${te.length} | ${pct(pos / te.length)} | ${quietPos} of ${pos} (${pct(quietPos / pos)}) | ${f3(auc(te.map((r) => r.f3), y))} | ${f3(auc(p, y))} | ${f3(averagePrecision(p, y))} | ${pct(1 - brier(p, y) / brier(te.map(() => base), y))} |`);
    }
  }

  // ---- B. models on complete rows
  type Spec = { name: string; pick: (r: Row) => number[] };
  const specs: Spec[] = [
    { name: 'M0 history', pick: (r) => r.x.hist },
    { name: 'M1 + neighbours', pick: (r) => [...r.x.hist, ...r.x.nb] },
    { name: 'M2 + WDI', pick: (r) => [...r.x.hist, ...r.x.wdi!] },
    { name: 'M3 + WGI', pick: (r) => [...r.x.hist, ...r.x.wgi!] },
    { name: 'M4 all', pick: (r) => [...r.x.hist, ...r.x.nb, ...r.x.wdi!, ...r.x.wgi!] },
  ];
  type Target = { name: string; h: 3 | 12; keep: (r: Row) => boolean; label: (r: Row) => number };
  const targets: Target[] = [
    { name: 'escalation: next 3 months >= 25 deaths (control)', h: 3, keep: () => true, label: (r) => ((r.next3 as number) >= 25 ? 1 : 0) },
    { name: 'rise: next 3 months >= 25 and >= 2x the previous 3', h: 3, keep: () => true, label: (r) => ((r.next3 as number) >= 25 && (r.next3 as number) >= 2 * r.f3 ? 1 : 0) },
    { name: 'onset: no deaths in the last 12 months, next 12 months >= 25', h: 12, keep: (r) => r.f12 === 0, label: (r) => ((r.next12 as number) >= 25 ? 1 : 0) },
  ];
  const cid = new Map<string, number>();
  const cluster = (r: Row) => cid.get(r.id) ?? (cid.set(r.id, cid.size), cid.size - 1);

  for (const t of targets) {
    const tr = train(complete, t.h).filter(t.keep);
    const te = test(complete, t.h).filter(t.keep);
    const y = te.map(t.label);
    const pos = y.reduce((s, v) => s + v, 0);
    console.log(`\n## B. ${t.name}\n`);
    console.log(`Train rows ${tr.length} (${tr.reduce((s, r) => s + t.label(r), 0)} positives); test rows ${te.length}, positives ${pos} (${pct(pos / te.length)}), countries ${new Set(te.map((r) => r.id)).size}.\n`);
    if (pos < 5) {
      console.log('Too few positives to evaluate.');
      continue;
    }
    const base = tr.reduce((s, r) => s + t.label(r), 0) / tr.length;
    const preds = specs.map((s) => {
      const m = fitLogistic(tr.map(s.pick), tr.map(t.label));
      return predictLogistic(m, te.map(s.pick));
    });
    const groups = te.map(cluster);
    const boot = clusterBootstrap(groups, REPS, 11, (idx) => {
      const yy = idx.map((i) => y[i]!);
      return preds.flatMap((p) => {
        const pp = idx.map((i) => p[i]!);
        return [auc(pp, yy), averagePrecision(pp, yy)];
      });
    });
    // k: index in the stat vector (2*model for AUC, 2*model+1 for AP); the reference is the same metric of M0 (index k % 2)
    const ci = (k: number, vsM0: boolean) => {
      const xs = boot.map((b) => (vsM0 ? b[k]! - b[k % 2]! : b[k]!)).filter((v) => !Number.isNaN(v));
      return [percentile(xs, 0.025), percentile(xs, 0.975)] as const;
    };
    console.log('| model | AUC | AUC 95% CI | AP | Brier skill | delta AUC vs M0 (95% CI) | delta AP vs M0 (95% CI) |');
    console.log('|---|---|---|---|---|---|---|');
    specs.forEach((s, i) => {
      const p = preds[i]!;
      const a = auc(p, y);
      const ap = averagePrecision(p, y);
      const [alo, ahi] = ci(2 * i, false);
      const dA = i === 0 ? '' : `${sgn(a - auc(preds[0]!, y))} (${sgn(ci(2 * i, true)[0])} to ${sgn(ci(2 * i, true)[1])})`;
      const dP = i === 0 ? '' : `${sgn(ap - averagePrecision(preds[0]!, y))} (${sgn(ci(2 * i + 1, true)[0])} to ${sgn(ci(2 * i + 1, true)[1])})`;
      console.log(`| ${s.name} | ${f3(a)} | ${f3(alo)}-${f3(ahi)} | ${f3(ap)} | ${pct(1 - brier(p, y) / brier(te.map(() => base), y))} | ${dA} | ${dP} |`);
    });
    console.log(`\nBaseline: persistence (3 m deaths) AUC ${f3(auc(te.map((r) => r.f3), y))}; ${REPS} cluster-bootstrap resamples over countries of the test rows (the fitted models are fixed: uncertainty from training is not included).`);
  }
}

main().catch((e) => (console.error(e), process.exit(1)));
