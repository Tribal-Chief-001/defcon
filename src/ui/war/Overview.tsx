import { useEffect, useMemo, useRef, useState } from 'react';
import type { ConflictsFile, Kind } from '../../conflicts/types';
import type { TimelineFile } from '../../timeline/types';
import { Bubbles } from '../../viz/Bubbles';
import { RangeBar } from '../../viz/RangeBar';
import { Ring } from '../../viz/Ring';
import { Spark } from '../../viz/Spark';
import { kindLayers, StreamChart } from '../../viz/StreamChart';
import { useCountUp } from '../../viz/useCountUp';
import { TimelineBlock, type TimelineRow } from '../TimelineBlock';
import { conflictsCsv } from '../../exports/csv';
import { EventList } from './EventList';
import { ExportButton } from './ExportButton';
import { IndexBoard } from './IndexBoard';
import { SignalsBlock } from './SignalsBlock';
import { NewsReports } from './NewsReports';
import { date, int, Section, span, TREND, trendWord } from './parts';

const KIND_BAR: { k: Kind; name: string; note: string; fill: string }[] = [
  { k: 'state', name: 'State-based', note: 'a government is one side', fill: 'var(--lime)' },
  { k: 'non-state', name: 'Non-state', note: 'armed groups fighting each other', fill: 'var(--text-muted)' },
  { k: 'one-sided', name: 'One-sided', note: 'attacks on civilians', fill: 'var(--orange)' },
];

// the headline numeral counts up on its own, so the animation re-renders only this component
function Hero({ value }: { value: number }) {
  return <p className="font-[var(--font-body)] text-[clamp(52px,9vw,84px)] font-semibold leading-none tracking-tight">{int(useCountUp(value))}</p>;
}

export type PlaceHandler = (at: { lat: number; lon: number; place: string; distance?: number } | null) => void;

// The world at a glance: a hero numeral, the stream of weekly deaths with the key events on it, bubbles and a league of the conflicts, the
// countries, the newest key events and reports. The League is the text equivalent of the bubbles.
export function Overview({ f, tl, onSelect, onDive, onFocusPlace, onHoverPin, onMethod, returnFocus }: { f: ConflictsFile; tl: TimelineFile | null | undefined; onSelect: (id: string) => void; onDive: (id: string) => void; onFocusPlace: PlaceHandler; onHoverPin: (i: number | null) => void; onMethod?: () => void; returnFocus?: string | null }) {
  const w = f.world;
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (returnFocus) root.current?.querySelector<HTMLElement>(`[data-conflict-row="${CSS.escape(returnFocus)}"]`)?.focus({ preventScroll: false }); // Back returns to the row it left
  }, [returnFocus]);
  const [q, setQ] = useState('');
  const [highlight, setHighlight] = useState<string | undefined>();
  const rows = useMemo<(TimelineRow & { conflictId: string | undefined })[]>(
    () => (tl?.theatres ?? []).flatMap((t) => t.entries.map((entry) => ({ entry, theatre: t.title, conflictId: t.conflicts.find((id) => f.conflicts.some((c) => c.id === id)) }))).sort((a, b) => a.entry.date.localeCompare(b.entry.date)),
    [tl, f.conflicts],
  );
  const league = f.conflicts.slice(0, 12);
  const ranked365 = useMemo(() => f.conflicts.filter((c) => c.deaths.d365.best > 0).sort((a, b) => b.deaths.d365.best - a.deaths.d365.best || a.name.localeCompare(b.name)), [f.conflicts]);
  const bubbles = useMemo(() => ranked365.slice(0, 30).map((c) => ({ id: c.id, name: c.name, value: c.deaths.d365.best, trend: c.trend })), [ranked365]);
  const needle = q.trim().toLowerCase();
  const matches = useMemo(() => (needle ? f.conflicts.filter((c) => c.name.toLowerCase().includes(needle) || c.countries.some((k) => k.name.toLowerCase().includes(needle))) : f.conflicts), [f.conflicts, needle]);
  const sparkMax = Math.max(1, ...league.flatMap((c) => c.weekly));
  const leagueMax = Math.max(1, ...league.map((c) => c.deaths.d90.high));
  const total365 = Math.max(1, KIND_BAR.reduce((s, k) => s + w.byKind[k.k].d365.best, 0));

  return (
    <div ref={root}>
      <h3 className="sr-only">World overview</h3>
      <p className="mt-6 font-[var(--font-mono)] text-[11.5px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Organised violence · last 365 days to {date(f.dataEnd)}</p>
      <div className="mt-2 flex flex-wrap items-center gap-x-8 gap-y-4">
        <div>
          <Hero value={w.deaths.d365.best} />
          <p className="mt-2 text-[14px] text-[var(--text-muted)]">
            deaths, best estimate; range {span(w.deaths.d365)} <span className="text-[var(--text-faint)]">· {w.conflictsListed} conflicts listed</span>
          </p>
        </div>
        <Ring d30={w.deaths.d30.best} d90={w.deaths.d90.best} d365={w.deaths.d365.best} />
        <dl className="grid gap-2 font-[var(--font-mono)] text-[12.5px]">
          {(['d30', 'd90', 'd365'] as const).map((k) => (
            <div key={k} className="flex gap-3">
              <dt className="w-[110px] text-[var(--text-muted)]">{k === 'd30' ? 'Last 30 days' : k === 'd90' ? 'Last 90 days' : 'Last 365 days'}</dt>
              <dd>
                {int(w.deaths[k].best)} <span className="text-[var(--text-muted)]">({span(w.deaths[k])})</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <IndexBoard onDive={onDive} onMethod={onMethod ?? (() => {})} />

      <SignalsBlock onFocusPlace={onFocusPlace} />

      <Section title="By kind of violence, last 365 days">
        <div className="flex h-[10px] w-full overflow-hidden rounded-full border border-[var(--border)]" role="img" aria-label={KIND_BAR.map((k) => `${k.name} ${int(w.byKind[k.k].d365.best)}`).join(', ')}>
          {KIND_BAR.map((k) => (
            <span key={k.k} style={{ width: `${(w.byKind[k.k].d365.best / total365) * 100}%`, background: k.fill }} />
          ))}
        </div>
        <ul className="mt-3 grid gap-3 @[460px]:grid-cols-3">
          {KIND_BAR.map((k) => (
            <li key={k.k} className="text-[13px]">
              <span className="flex items-center gap-2">
                <span className="inline-block h-[8px] w-[8px]" style={{ background: k.fill }} />
                {k.name}
              </span>
              <span className="mt-0.5 block font-[var(--font-mono)] text-[12px]">
                {int(w.byKind[k.k].d365.best)} <span className="text-[var(--text-muted)]">({span(w.byKind[k.k].d365)})</span>
              </span>
              <span className="block font-[var(--font-mono)] text-[11.5px] text-[var(--text-muted)]">{k.note} · 90 days {int(w.byKind[k.k].d90.best)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 max-w-[62ch] text-[13px] text-[var(--text-muted)]">Deaths in protests and riots themselves are not counted: UCDP covers organised violence. Killings of protesters by armed actors do appear, as one-sided violence. Protest datasets such as ACLED are not available to this project.</p>
      </Section>

      <Section title="Deaths per week, with the key events" note="Weekly deaths from a zero baseline, stacked by kind; the dots are key events of the timeline (click one to select its conflict and show it on the globe).">
        <StreamChart
          layers={kindLayers(w.weeklyByKind)}
          dataEnd={f.dataEnd}
          events={rows.map((r) => ({ date: r.entry.date, title: r.entry.title, status: r.entry.status, theatre: r.theatre }))}
          onEventClick={(i) => {
            const r = rows[i];
            if (!r) return;
            if (r.conflictId) onSelect(r.conflictId);
            if (r.entry.at) onFocusPlace(r.entry.at);
            setHighlight(`${r.entry.date}|${r.entry.title}`);
          }}
        />
      </Section>

      <Section title="Where the deaths are" note={`Top ${bubbles.length} of ${f.conflicts.length} conflicts by deaths in the last 365 days; each bubble's area is its deaths. Orange outline: activity rising. The list below has every conflict.`}>
        <Bubbles items={bubbles} selected={null} onSelect={onSelect} />
      </Section>

      <Section title="Conflicts league, last 90 days" note="The twelve most deadly in the last 90 days. The sparklines share one scale, so a small conflict looks small.">
        <ul aria-label="Conflicts league" className="flex flex-col">
          {league.map((c, i) => (
            <li key={c.id}>
              <button type="button" data-conflict-row={c.id} onClick={() => onSelect(c.id)} className="grid w-full gap-1 border-t border-[var(--border)] px-1 py-3 text-left hover:bg-white/5">
                <span className="flex items-baseline gap-3">
                  <span className="w-[22px] font-[var(--font-mono)] text-[12px] text-[var(--text-faint)]">{i + 1}</span>
                  <span className="flex-1 text-[15px]">{c.name}</span>
                  <span className={`font-[var(--font-mono)] text-[11.5px] uppercase tracking-[0.12em] ${TREND[c.trend]}`}>{c.deaths.d90.best <= 0 ? 'no deaths in 90 d' : trendWord(c)}</span>
                  <span className="font-[var(--font-mono)] text-[13px]">{int(c.deaths.d90.best)}</span>
                </span>
                <span className="flex items-center gap-3 pl-[34px]">
                  <span className="flex-1">
                    <RangeBar low={c.deaths.d90.low} best={c.deaths.d90.best} high={c.deaths.d90.high} max={leagueMax} />
                  </span>
                  <Spark data={c.weekly} width={96} height={22} max={sparkMax} />
                </span>
                <span className="pl-[34px] font-[var(--font-mono)] text-[11.5px] text-[var(--text-muted)]">
                  range {span(c.deaths.d90)} · {int(c.events.d90)} events · last {date(c.lastDate)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Section>

      <Section title={`All ${f.conflicts.length} conflicts`}>
        <div className="mb-2">
          <ExportButton label="conflicts" filename={`defcon-conflicts-${f.dataEnd}.csv`} build={() => conflictsCsv(f)} />
        </div>
        <input type="search" aria-label="Filter conflicts" placeholder="Filter by name or country" value={q} onChange={(e) => setQ(e.target.value)} className="mb-2 w-full rounded-[12px] border border-[var(--border)] bg-transparent px-3 py-2 text-[14px] outline-none placeholder:text-[var(--text-faint)] focus:border-[var(--lime)]" />
        {matches.length === 0 ? (
          <p className="text-[14px] text-[var(--text-muted)]">No conflicts match.</p>
        ) : (
          <ul aria-label="All conflicts" tabIndex={0} className="max-h-[340px] overflow-y-auto rounded-[12px] outline-none focus-visible:ring-1 focus-visible:ring-[var(--lime)]">
            {matches.map((c) => (
              <li key={c.id}>
                <button type="button" data-conflict-row={c.id} onClick={() => onSelect(c.id)} className="flex w-full items-baseline gap-3 border-t border-[var(--border)] px-1 py-2 text-left text-[14px] hover:bg-white/5">
                  <span className="flex-1">{c.name}</span>
                  <span className={`font-[var(--font-mono)] text-[11px] uppercase tracking-[0.12em] ${TREND[c.trend]}`}>{c.deaths.d90.best <= 0 ? 'no deaths in 90 d' : c.trend}</span>
                  <span className="w-[64px] text-right font-[var(--font-mono)] text-[12.5px]">{int(c.deaths.d365.best)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Most deaths in the last 90 days, by country">
        <ul aria-label="Most deaths in the last 90 days" className="flex flex-wrap gap-2">
          {w.countries.map((k) => (
            <li key={`${k.id}-${k.name}`}>
              {k.id ? (
                <button type="button" onClick={() => onDive(k.id!)} className="rounded-full border border-[var(--border-strong)] px-3 py-1 font-[var(--font-mono)] text-[12px] hover:text-[var(--lime)]">
                  {k.name} <span className="text-[var(--text-muted)]">{int(k.deaths90)}</span>
                </button>
              ) : (
                <span className="rounded-full border border-[var(--border)] px-3 py-1 font-[var(--font-mono)] text-[12px] text-[var(--text-muted)]">
                  {k.name} {int(k.deaths90)}
                </span>
              )}
            </li>
          ))}
        </ul>
      </Section>

      <div className="mt-10">
        {tl === null ? (
          <p className="text-[14px] text-[var(--text-muted)]">Timeline unavailable.</p>
        ) : tl ? (
          <TimelineBlock
            rows={[...rows].reverse()}
            checkedAt={tl.checkedAt}
            showTheatre
            limit={8}
            limits={tl.limits}
            notes={tl.theatres.flatMap((t) => (t.note ? [`${t.title}: ${t.note}`] : []))}
            highlight={highlight}
            onShowOnMap={(at) => onFocusPlace(at)}
            onHoverPin={onHoverPin}
          />
        ) : (
          <p className="text-[14px] text-[var(--text-muted)]">
            Loading the timeline{'…'}
          </p>
        )}
      </div>

      <Section title="Newest reports from the news, last 7 days (auto-coded)">
        <NewsReports onDive={onDive} />
      </Section>

      <Section title={`Latest human-coded events anywhere, to ${date(f.dataEnd)}`}>
        <details>
          <summary className="cursor-pointer text-[14px] text-[var(--text-muted)] hover:text-[var(--lime)]">Show the {w.latest.length} newest events</summary>
          <div className="mt-2">
            <EventList events={w.latest} />
          </div>
        </details>
      </Section>
    </div>
  );
}
