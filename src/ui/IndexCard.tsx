import { interval, pct } from '../indices/format';
import { fmtDate } from '../lib/fmtDate';
import type { Band, CountryIndex, ModelMeta, Prob } from '../indices/types';
import { Gauge } from '../viz/Gauge';
import { Spark } from '../viz/Spark';

const int = (n: number) => Math.round(n).toLocaleString('en-US');
const span = (r: { low: number; high: number }) => `${int(r.low)}–${int(r.high)}`;
const label = 'font-[var(--font-mono)] text-[11.5px] uppercase tracking-[0.18em] text-[var(--text-muted)]';
const BAND: Record<Band, string> = {
  none: 'None recorded: no deaths in 365 days',
  minor: 'Minor: under 25 deaths in 365 days',
  active: 'Active: 25 to 999 deaths in 365 days',
  severe: 'Severe: 1,000 or more deaths in 365 days',
};
const BAND_WORD: Record<Band, string> = { none: 'None', minor: 'Minor', active: 'Active', severe: 'Severe' };

function ProbBar({ name, short, p }: { name: string; short: string; p: Prob }) {
  const x = (v: number) => Math.min(100, Math.max(0, v * 100));
  return (
    <div className="mt-3">
      <div className="flex items-baseline justify-between gap-3 text-[13px]">
        <span>{name}</span>
        <span className="font-[var(--font-mono)] text-[15px] font-bold">{pct(p.p)}</span>
      </div>
      <svg role="img" aria-label={`${short}: ${pct(p.p)}, ${interval(p)}`} viewBox="0 0 100 8" preserveAspectRatio="none" className="mt-1 block h-[8px] w-full">
        <line x1="0" y1="4" x2="100" y2="4" stroke="var(--border-strong)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        <line x1={x(p.lo)} y1="4" x2={x(p.hi)} y2="4" stroke="var(--lime)" strokeWidth="3" vectorEffect="non-scaling-stroke" />
        <rect x={Math.max(0, x(p.p) - 0.6)} y="0.5" width="1.2" height="7" fill="var(--text)" />
      </svg>
      <p className="mt-0.5 font-[var(--font-mono)] text-[11.5px] text-[var(--text-muted)]">{interval(p)}</p>
    </div>
  );
}

// The two indices of a country. The Fatality Index is observed (deaths); the Instability Index is a model estimate (the chance that
// violence continues or rises in the next 3 months). Every score has its range or interval and a confidence, and says what it is not.
export function IndexCard({ index, model, dataEnd, rankedTotal, onMethod }: { index: CountryIndex | undefined; model: ModelMeta; dataEnd: string; rankedTotal: number; onMethod: () => void }) {
  const f = index?.fatality;
  const r = index?.risk ?? null;
  return (
    <section role="region" aria-label="Indices" className="mt-5 border-t border-[var(--border)] pt-4">
      <h3 className={label}>Fatality Index</h3>
      {!f ? (
        <p className="mt-2 text-[13px] text-[var(--text-muted)]">UCDP has recorded no organised violence here: Fatality Index 0.</p>
      ) : (
        <>
          <div className="mt-2 flex items-center gap-4">
            <Gauge value={f.score} low={f.scoreLow} high={f.scoreHigh} label="Fatality Index" size={108} />
            <div className="grid gap-1 text-[13px]">
              <span className="font-[var(--font-mono)] text-[12px] uppercase tracking-[0.12em]" title={BAND[f.band]}>
                {BAND_WORD[f.band]}
              </span>
              <span className="text-[var(--text-muted)]">{BAND[f.band]}</span>
              {f.rank !== null ? <span className="font-[var(--font-mono)] text-[12px]">Rank {f.rank} of {rankedTotal} with deaths in the last 90 days</span> : null}
              <span className="font-[var(--font-mono)] text-[12px] text-[var(--text-muted)]">activity {f.trend}</span>
            </div>
          </div>
          {f.deaths365.best <= 0 ? (
            <p className="mt-2 text-[13px] text-[var(--text-muted)]">No organised violence recorded by UCDP in the last 365 days (to {fmtDate(dataEnd)}).</p>
          ) : (
            <dl className="mt-2 grid gap-1 font-[var(--font-mono)] text-[12.5px]">
              <div className="flex gap-3">
                <dt className="w-[110px] text-[var(--text-muted)]">Last 90 days</dt>
                <dd>
                  {int(f.deaths90.best)} <span className="text-[var(--text-muted)]">({span(f.deaths90)})</span>
                </dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-[110px] text-[var(--text-muted)]">Last 365 days</dt>
                <dd>
                  {int(f.deaths365.best)} <span className="text-[var(--text-muted)]">({span(f.deaths365)})</span>
                </dd>
              </div>
              {f.per100k !== null ? (
                <div className="flex gap-3">
                  <dt className="w-[110px] text-[var(--text-muted)]">Per capita</dt>
                  <dd>{f.per100k.toFixed(f.per100k < 10 ? 2 : 1)} per 100,000 people (365 days)</dd>
                </div>
              ) : null}
            </dl>
          )}
          <div className="mt-2">
            <Spark data={f.monthly} width={300} height={34} what="Deaths per month, last 10 years" />
            <p className="mt-0.5 font-[var(--font-mono)] text-[11px] uppercase tracking-[0.12em] text-[var(--text-faint)]">deaths per month, 10 years to {fmtDate(dataEnd).split(' ').slice(1).join(' ')}</p>
          </div>
        </>
      )}

      <h3 className={`${label} mt-6`}>Instability Index</h3>
      {r === null ? (
        <p className="mt-2 text-[13px] text-[var(--text-muted)]">Not modelled: this country is outside the model's data (UCDP has not recorded organised violence here, or governance data are missing). This is not a low-risk rating.</p>
      ) : (
        <>
          <p className="mt-1 text-[12.5px] text-[var(--text-muted)]">Chance in the next 3 months</p>
          <ProbBar name="Violence continues (25 or more deaths)" short="Violence continues" p={r.continue} />
          <ProbBar name="Sharp rise (25 or more deaths and at least double the last 3 months)" short="Sharp rise" p={r.rise} />
          <p className="mt-3 font-[var(--font-mono)] text-[12px]">
            Momentum <span className={r.momentum.direction === 'rising' ? 'text-[var(--orange)]' : ''}>{r.momentum.direction}</span> <span className="text-[var(--text-muted)]">(last 30 days against the 60 before)</span>
          </p>
          <p className="mt-1 text-[13px]">
            <span className="font-[var(--font-mono)] text-[12px]">Confidence {r.confidence}</span> <span className="text-[var(--text-muted)]">because {r.confidenceReason}</span>
          </p>
          <h4 className={`${label} mt-4`}>Why this score (a sharp rise)</h4>
          <ol aria-label="Why this score" className="mt-1 grid gap-0.5 text-[13px]">
            {r.why.slice(0, 5).map((w) => (
              <li key={w.label} className="flex justify-between gap-3">
                <span>{w.label}</span>
                <span className="font-[var(--font-mono)] text-[12px] text-[var(--text-muted)]">
                  {w.value >= 0 ? 'raises' : 'lowers'} the risk ({w.value >= 0 ? '+' : '−'}
                  {Math.abs(w.value).toFixed(1)})
                </span>
              </li>
            ))}
          </ol>
        </>
      )}

      <p className="mt-4 text-[12px] leading-relaxed text-[var(--text-muted)]">
        A risk estimate from the history of deaths and governance, to {fmtDate(dataEnd)}; 2026 rows are provisional. Backtest 2021{'–'}2025: AUC {model.rise.auc.toFixed(2)} for a sharp rise (0.{Math.round(model.rise.persistenceAuc * 100)} for recent deaths alone), {model.continue.auc.toFixed(2)} for continuing; it does not forecast outbreaks in peaceful countries. Not the official US DEFCON level.
      </p>
      <button type="button" onClick={onMethod} className="mt-1 font-[var(--font-mono)] text-[11.5px] uppercase tracking-[0.15em] text-[var(--lime)] underline decoration-[var(--border-strong)] underline-offset-4 hover:decoration-[var(--lime)]">
        How computed
      </button>
    </section>
  );
}
