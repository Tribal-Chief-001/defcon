import { useEffect, useState, type ReactNode } from 'react';
import { pct } from '../indices/format';
import { loadIndices } from '../indices/load';
import type { Calibration, IndicesFile, TargetMetrics } from '../indices/types';

const h = 'font-[var(--font-mono)] text-[11.5px] uppercase tracking-[0.18em] text-[var(--text-muted)]';
const th = 'py-1 pr-3 text-left font-normal text-[var(--text-muted)]';
const int = (n: number) => n.toLocaleString('en-US');
const f3 = (v: number) => v.toFixed(3);

function A({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="underline decoration-[var(--border-strong)] underline-offset-2 hover:text-[var(--lime)]">
      {children}
    </a>
  );
}

// Predicted against observed share in five equal-count bins of the backtest: points on the diagonal are perfect calibration. The table
// next to it carries the same numbers as text.
function CalibrationChart({ name, bins }: { name: string; bins: Calibration[] }) {
  const max = Math.max(0.05, ...bins.flatMap((b) => [b.predicted, b.observed])) * 1.1;
  const S = 120;
  const xy = (v: number) => (v / max) * S;
  return (
    <svg role="img" aria-label={`Calibration chart, ${name}: predicted against observed share in five bins. ${bins.map((b) => `predicted ${pct(b.predicted)}, observed ${pct(b.observed)}`).join('; ')}`} viewBox={`-4 -4 ${S + 8} ${S + 8}`} className="block h-[120px] w-[120px] shrink-0">
      <rect x="0" y="0" width={S} height={S} fill="none" stroke="var(--border)" />
      <line x1="0" y1={S} x2={S} y2="0" stroke="var(--border-strong)" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
      {bins.map((b, i) => (
        <circle key={i} cx={xy(b.predicted)} cy={S - xy(b.observed)} r="3" fill="var(--lime)" />
      ))}
    </svg>
  );
}

function CalibrationBlock({ name, m }: { name: string; m: TargetMetrics }) {
  return (
    <div className="mt-4">
      <p className="text-[13px]">Calibration: {name}</p>
      <div className="mt-1 flex flex-wrap items-start gap-4">
        <CalibrationChart name={name} bins={m.bins} />
        <table aria-label={`Calibration of the ${name} estimate`} className="font-[var(--font-mono)] text-[12px]">
          <thead>
            <tr>
              <th className={th}>predicted</th>
              <th className={th}>observed</th>
              <th className={th}>country-months</th>
            </tr>
          </thead>
          <tbody>
            {m.bins.map((b, i) => (
              <tr key={i}>
                <td className="pr-3">{pct(b.predicted)}</td>
                <td className="pr-3">{pct(b.observed)}</td>
                <td>{int(b.n)}</td>
              </tr>
            ))}
            <tr>
              <td className="pr-3">{pct(m.tail.predicted)}</td>
              <td className="pr-3">{pct(m.tail.observed)}</td>
              <td>{int(m.tail.n)} (predictions of 30% or more)</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Body({ f }: { f: IndicesFile }) {
  const m = f.model;
  const rows: { name: string; t: TargetMetrics }[] = [
    { name: 'Sharp rise', t: m.rise },
    { name: 'Violence continues', t: m.continue },
  ];
  return (
    <>
      <section className="mt-5 space-y-2 text-sm leading-relaxed">
        <p className={h}>The Fatality Index (observed)</p>
        <p>
          100 × log10(1 + deaths in 90 days) ÷ log10(10,001), from 0 to 100. A log scale, because deaths span five orders of magnitude; it is a presentation scale, not a weighted composite, and has no editorial weights. 10,000 deaths in 90 days
          (about the heaviest country-quarter on record) scores 100; 24 deaths score about 35. The range uses the low and high death estimates. Deaths are UCDP's best estimates of organised violence (state-based, non-state and one-sided) up to {f.dataEnd}.
        </p>
        <p>Bands by deaths in the last 365 days: none (0 recorded), minor (under 25), active (25 to 999), severe (1,000 or more). The trend compares the last 30 days with the average 30 days of the 60 before.</p>
      </section>

      <section className="mt-5 space-y-2 text-sm leading-relaxed">
        <p className={h}>The Instability Index (a model estimate)</p>
        <p>
          Two ridge logistic regressions give the chance, over the next 3 months, that violence continues (at least 25 deaths) and that it rises sharply (at least 25 deaths and at least double the previous 3 months). Features are standardised. Trained on final UCDP data only, country-months up to {m.trainedThrough}; the
          estimate is made at {f.dataEnd}. The 90% interval is the 5th to 95th percentile of {m.bootstrapReps} cluster-bootstrap refits, resampling countries. Confidence is a plain heuristic: the lowest of the share of deaths located to a province or better, the width of the interval and the provisional share of recent events. "Why this score" splits the log-odds exactly into the features.
        </p>
        <p className="text-[var(--text-muted)]">Features:</p>
        <ul aria-label="Model features" className="list-disc space-y-0.5 pl-5">
          {m.features.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </section>

      <section className="mt-5 space-y-2 text-sm leading-relaxed">
        <p className={h}>Backtest</p>
        <p>
          Fitted on country-months up to 2015-12, evaluated on {m.testPeriod}, so no label window crosses the split. AUC is the chance that a country-month with the outcome scores higher than one without (0.5 is chance). The baseline is recent deaths alone.
        </p>
        <div className="overflow-x-auto">
          <table aria-label="Backtest results" className="font-[var(--font-mono)] text-[12px]">
            <thead>
              <tr>
                <th className={th}>target</th>
                <th className={th}>AUC</th>
                <th className={th}>recent deaths alone</th>
                <th className={th}>Brier skill</th>
                <th className={th}>base rate</th>
                <th className={th}>test country-months</th>
                <th className={th}>positives</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ name, t }) => (
                <tr key={name} className="border-t border-[var(--border)]">
                  <td className="py-1 pr-3">{name}</td>
                  <td className="pr-3">{f3(t.auc)}</td>
                  <td className="pr-3">{f3(t.persistenceAuc)}</td>
                  <td className="pr-3">{(t.brierSkill * 100).toFixed(1)}%</td>
                  <td className="pr-3">{(t.baseRate * 100).toFixed(1)}%</td>
                  <td className="pr-3">{int(t.testRows)}</td>
                  <td>{int(t.positives)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>Year by year: for each year the models are fitted on everything up to September of the year before and tested on that year.</p>
        <div className="overflow-x-auto">
          <table aria-label="Backtest by year" className="font-[var(--font-mono)] text-[12px]">
            <thead>
              <tr>
                <th className={th}>year</th>
                <th className={th}>sharp rise AUC</th>
                <th className={th}>recent deaths alone</th>
                <th className={th}>continues AUC</th>
                <th className={th}>recent deaths alone</th>
              </tr>
            </thead>
            <tbody>
              {m.rolling.map((y) => (
                <tr key={y.year} className="border-t border-[var(--border)]">
                  <td className="py-1 pr-3">{y.year}</td>
                  <td className="pr-3">{f3(y.riseAuc)}</td>
                  <td className="pr-3">{f3(y.risePersistenceAuc)}</td>
                  <td className="pr-3">{f3(y.continueAuc)}</td>
                  <td>{f3(y.continuePersistenceAuc)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[var(--text-muted)]">"Violence continues" is mostly persistence, which the baseline already captures. A sharp rise is where history alone is weak and governance adds a small gain.</p>
        {rows.map(({ name, t }) => (
          <CalibrationBlock key={name} name={name.toLowerCase()} m={t} />
        ))}
      </section>

      <section className="mt-5 space-y-2 text-sm leading-relaxed">
        <p className={h}>Limits</p>
        <ul aria-label="Limits" className="list-disc space-y-1 pl-5">
          <li>The indices cover the {f.countries.length} countries with a UCDP GED record. Any other country is "not modelled", which is not a low-risk rating.</li>
          <li>Deaths are estimates with ranges, from reports; where UCDP could not locate deaths precisely, the confidence is lower.</li>
          <li>Governance scores are perceptions of experts and surveys, published once a year about a year after the period they describe; only values that were already published at the time of an estimate are used.</li>
          <li>The recent-deaths terms can extrapolate: a country with a very deadly last year but a quiet last 90 days can still show a high sharp-rise estimate. Read it together with the momentum, the confidence and the "why this score" list.</li>
          <li>The backtest uses one fixed split and each year from 2016 on; the features were chosen after seeing 2021 to 2025, so the earlier years are not a clean out-of-sample test. The intervals cover training uncertainty only, not model error or a change in the world.</li>
          <li>The model does not forecast the onset of violence in peaceful places (tested: it is not forecastable from these inputs).</li>
          <li>UCDP files the events of Gaza and the West Bank under Israel, so Palestine has no separate figure and Israel's indices include them.</li>
          <li>An event that covers several days (UCDP candidate rows often cover a month) has its deaths spread evenly over those days, so the 30, 90 and 365-day windows and the monthly series follow the calendar. Event counts, places and the model's training months use the start date.</li>
          <li>Rows of 2026 are provisional (candidate events) and can be revised. The estimate is not a forecast, not advice for travel and not the official US DEFCON level.</li>
        </ul>
      </section>

      <section className="mt-5 space-y-2 text-sm leading-relaxed">
        <p className={h}>Data and citations</p>
        <ul className="space-y-2 font-[var(--font-mono)] text-[13px]">
          <li className="border-t border-[var(--border)] pt-2">
            UCDP Georeferenced Event Dataset and Candidate Events, CC BY 4.0, <A href="https://ucdp.uu.se/">ucdp.uu.se</A>. Davies, Pettersson and Öberg (2026), Organized violence 1989–2025, and violent political protests, Journal of Peace Research, doi 10.1093/jopres/xjag046; Sundberg and Melander (2013), Journal of Peace Research 50(4).
          </li>
          <li className="border-t border-[var(--border)] pt-2">
            World Bank Worldwide Governance Indicators (aggregate estimates), CC BY 4.0, <A href="https://info.worldbank.org/governance/wgi/">info.worldbank.org/governance/wgi</A>. Kaufmann, Kraay and Mastruzzi (2010), The Worldwide Governance Indicators: Methodology and Analytical Issues, World Bank Policy Research Working Paper 5430.
          </li>
          <li className="border-t border-[var(--border)] pt-2">
            World Bank World Development Indicators (population, for deaths per 100,000), CC BY 4.0, <A href="https://datatopics.worldbank.org/world-development-indicators/">datatopics.worldbank.org</A>.
          </li>
        </ul>
      </section>
    </>
  );
}

// "How the indices are computed", on the About page: definitions, features, the published backtest and calibration (from the data file, so
// they cannot drift from the numbers on screen), the limits and the citations.
export function MethodSection() {
  const [file, setFile] = useState<IndicesFile | null | undefined>(undefined);
  useEffect(() => {
    let live = true;
    void loadIndices().then((f) => live && setFile(f));
    return () => {
      live = false;
    };
  }, []);
  return (
    <div data-method>
      <hr className="mt-5 border-[var(--border)]" />
      <h3 className="mt-5 font-[var(--font-display)] text-lg font-extrabold leading-none tracking-tight">Fatality and Instability indices</h3>
      {file === undefined ? (
        <p role="status" className="mt-3 text-sm text-[var(--text-muted)]">
          Loading the method{'…'}
        </p>
      ) : file === null ? (
        <p className="mt-3 text-sm text-[var(--text-muted)]">The method is unavailable right now (the indices data could not be loaded).</p>
      ) : (
        <Body f={file} />
      )}
    </div>
  );
}
