import { useEffect, useMemo, useState } from 'react';
import { loadIndex } from '../../dossier/load';
import { indicesCsv } from '../../exports/csv';
import { interval, pct } from '../../indices/format';
import { loadIndices } from '../../indices/load';
import type { CountryIndex, IndicesFile } from '../../indices/types';
import { RangeBar } from '../../viz/RangeBar';
import { Spark } from '../../viz/Spark';
import { ExportButton } from './ExportButton';
import { int, label, span } from './parts';

const TOP = 15;
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// 'YYYY-MM' of the series end, minus `back` months, as "Sep 2016"
const monthLabel = (ym: string, back: number) => {
  const [y, m] = ym.split('-').map(Number) as [number, number];
  const i = y * 12 + (m - 1) - back;
  return `${MON[((i % 12) + 12) % 12]} ${Math.floor(i / 12)}`;
};

const CONF: Record<string, string> = { high: 'text-[var(--text)]', medium: 'text-[var(--text-muted)]', low: 'text-[var(--orange)]' };

// The two rankings of the indices in the War room: the most deadly countries now (the Fatality Index, observed) and the countries with the
// highest chance of a sharp rise in the next 3 months (the Instability Index, a model estimate). Both lists are buttons that dive into the
// country; every number has its range or interval; a line says what the indices are not. Without the data file the board says so.
export function IndexBoard({ onDive, onMethod, ids }: { onDive: (countryId: string) => void; onMethod: () => void; ids?: readonly string[] }) {
  const [file, setFile] = useState<IndicesFile | null | undefined>(undefined);
  const [names, setNames] = useState<Map<string, string>>(new Map());
  useEffect(() => {
    let live = true;
    void loadIndices().then((f) => live && setFile(f));
    void loadIndex().then((ix) => live && setNames(new Map(ix.map((e) => [e.id, e.name]))));
    return () => {
      live = false;
    };
  }, []);
  const name = (id: string) => names.get(id) ?? id;

  const lists = useMemo(() => {
    if (!file) return null;
    const byName = (a: CountryIndex, b: CountryIndex) => name(a.id).localeCompare(name(b.id));
    const pool = ids ? file.countries.filter((c) => ids.includes(c.id)) : file.countries;
    const deadly = pool.filter((c) => c.fatality.rank !== null).sort((a, b) => a.fatality.rank! - b.fatality.rank! || byName(a, b)).slice(0, TOP);
    const rising = pool.filter((c) => c.risk !== null).sort((a, b) => b.risk!.rise.p - a.risk!.rise.p || byName(a, b)).slice(0, TOP);
    return { deadly, rising };
  }, [file, names, ids]); // eslint-disable-line react-hooks/exhaustive-deps

  if (file === undefined) return <p role="status" className="mt-8 text-[13px] text-[var(--text-muted)]">Loading the indices{'…'}</p>;
  if (!file || !lists) return <p className="mt-8 text-[13px] text-[var(--text-muted)]">The indices are unavailable right now. The rest of the room works without them.</p>;

  const deathMax = Math.max(1, ...lists.deadly.map((c) => c.fatality.deaths90.high));
  const world = file.world.monthly;
  const peak = Math.max(0, ...world);
  const peakAt = world.indexOf(peak);
  const first = monthLabel(file.seriesEnd, world.length - 1);
  const row = 'grid w-full gap-1 border-t border-[var(--border)] px-1 py-3 text-left hover:bg-white/5';

  return (
    <section aria-label="Index board" className="mt-10">
      <h4 className={`${label} mb-3 flex items-center gap-3`}>
        <span>Index board</span>
        <span aria-hidden="true" className="h-px flex-1 bg-[var(--border)]" />
      </h4>
      <p className="max-w-[62ch] text-[13px] text-[var(--text-muted)]">
        Two indices per country. The Fatality Index is what UCDP recorded (deaths, with ranges). The Instability Index is a risk estimate from the history of deaths and governance scores: the chance of continued or sharply rising violence in the next 3 months, with a 90% interval. Neither forecasts outbreaks in peaceful countries. Not the official US DEFCON level.
      </p>

      <h5 className={`${label} mt-6`}>Most deadly now (Fatality Index)</h5>
      <p className="mb-1 text-[12.5px] text-[var(--text-muted)]">Top {TOP} by deaths in the last 90 days to {file.dataEnd}; score 0 to 100 on a log scale; the bar is the range of deaths.</p>
      <ol aria-label="Most deadly now" className="flex flex-col">
        {lists.deadly.map((c, i) => (
          <li key={c.id}>
            <button type="button" onClick={() => onDive(c.id)} className={row}>
              <span className="flex items-baseline gap-3">
                <span className="w-[22px] font-[var(--font-mono)] text-[12px] text-[var(--text-faint)]">{i + 1}</span>
                <span className="flex-1 text-[15px]">{name(c.id)}</span>
                <span className="font-[var(--font-mono)] text-[11.5px] text-[var(--text-muted)]">score {Math.round(c.fatality.score)}</span>
                <span className="font-[var(--font-mono)] text-[13px]">{int(c.fatality.deaths90.best)}</span>
              </span>
              <span className="pl-[34px]">
                <RangeBar low={c.fatality.deaths90.low} best={c.fatality.deaths90.best} high={c.fatality.deaths90.high} max={deathMax} />
              </span>
              <span className="pl-[34px] font-[var(--font-mono)] text-[11.5px] text-[var(--text-muted)]">
                {span(c.fatality.deaths90)} deaths in 90 days · {c.fatality.band} · activity {c.fatality.trend}
              </span>
            </button>
          </li>
        ))}
      </ol>

      <h5 className={`${label} mt-8`}>Highest risk of a sharp rise (Instability Index)</h5>
      <p className="mb-1 text-[12.5px] text-[var(--text-muted)]">Top {TOP} by the chance of at least 25 deaths in the next 3 months and at least double the last 3. A risk estimate, not a prediction; confidence in words.</p>
      <ol aria-label="Highest risk of a sharp rise" className="flex flex-col">
        {lists.rising.map((c, i) => {
          const r = c.risk!;
          return (
            <li key={c.id}>
              <button type="button" onClick={() => onDive(c.id)} className={row}>
                <span className="flex items-baseline gap-3">
                  <span className="w-[22px] font-[var(--font-mono)] text-[12px] text-[var(--text-faint)]">{i + 1}</span>
                  <span className="flex-1 text-[15px]">{name(c.id)}</span>
                  <span className="font-[var(--font-mono)] text-[13px]">{pct(r.rise.p)}</span>
                </span>
                <span className="pl-[34px]">
                  <RangeBar low={r.rise.lo} best={r.rise.p} high={r.rise.hi} max={1} fmt={(n) => `${pct(n)}`} />
                </span>
                <span className="pl-[34px] font-[var(--font-mono)] text-[11.5px] text-[var(--text-muted)]">
                  Sharp rise: {pct(r.rise.p)}, {interval(r.rise)} · momentum {r.momentum.direction} · <span className={CONF[r.confidence]}>confidence {r.confidence}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {ids ? null : (
        <>
      <h5 className={`${label} mt-8`}>The world's deaths per month, ten years</h5>
          <div className="mt-2 [&>svg]:h-auto [&>svg]:w-full">
            <Spark data={world} width={600} height={90} what="World deaths per month, last 10 years" />
          </div>
          <p className="mt-1 font-[var(--font-mono)] text-[11.5px] text-[var(--text-muted)]">
            {first} to {monthLabel(file.seriesEnd, 0)} · peak {int(peak)} in {monthLabel(file.seriesEnd, world.length - 1 - peakAt)} · 2026 months are provisional
          </p>
        </>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <ExportButton label="indices of every country" filename={`defcon-indices-${file.dataEnd}.csv`} build={() => indicesCsv(file, names)} />
        <button type="button" onClick={onMethod} className="font-[var(--font-mono)] text-[11.5px] uppercase tracking-[0.15em] text-[var(--lime)] underline decoration-[var(--border-strong)] underline-offset-4 hover:decoration-[var(--lime)]">
        How computed
        </button>
      </div>
    </section>
  );
}
