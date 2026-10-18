import { useEffect, useMemo, useRef, useState } from 'react';
import { loadConflicts } from '../conflicts/load';
import type { Conflict, ConflictEvent, ConflictsFile, Kind, Range } from '../conflicts/types';
import { loadIndex } from '../dossier/load';
import { latestEvents } from '../events/rails';
import { useEvents } from '../events/store';
import { ago } from '../lib/ago';
import { fmtDate } from '../lib/fmtDate';
import { loadTimeline } from '../timeline/load';
import type { TimelineFile } from '../timeline/types';
import { TimelineBlock, type TimelineRow } from './TimelineBlock';
import { useNow } from '../lib/useNow';
import { useDialog } from './useDialog';

const int = (n: number) => n.toLocaleString('en-US');
const date = fmtDate;
const addDays = (iso: string, n: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
const span = (r: Range) => `${int(r.low)}–${int(r.high)}`;
const label = 'font-[var(--font-mono)] text-[11.5px] uppercase tracking-[0.18em] text-[var(--text-muted)]';
const TREND: Record<Conflict['trend'], string> = { rising: 'text-[var(--orange)]', falling: 'text-[var(--text)]', steady: 'text-[var(--text-muted)]', 'low data': 'text-[var(--text-faint)]' };

function Weekly({ weekly, dataEnd }: { weekly: number[]; dataEnd: string }) {
  const peak = Math.max(0, ...weekly);
  const at = weekly.indexOf(peak);
  const summary = peak > 0 ? `Weekly deaths, last 52 weeks to ${date(dataEnd)}, peak ${int(peak)} in the week ending ${date(addDays(dataEnd, -(51 - at) * 7))}` : `Weekly deaths, last 52 weeks to ${date(dataEnd)}: none`;
  const W = 520;
  const H = 64;
  return (
    <svg role="img" aria-label={summary} viewBox={`0 0 ${W} ${H}`} className="block w-full max-w-full" preserveAspectRatio="none" height={H}>
      <line x1="0" y1={H - 0.5} x2={W} y2={H - 0.5} stroke="var(--border-strong)" strokeWidth="1" />
      {weekly.map((v, i) => {
        const h = peak > 0 ? Math.max(v > 0 ? 1 : 0, (v / peak) * (H - 4)) : 0;
        return <rect key={i} x={i * (W / 52) + 1} y={H - 1 - h} width={W / 52 - 2.5} height={h} fill={i === 51 ? 'var(--lime)' : 'var(--text-muted)'} />;
      })}
    </svg>
  );
}

function Card({ title, r, events, to }: { title: string; r: Range; events: number | null; to: string }) {
  return (
    <div className="flex flex-col gap-1 border-t border-[var(--border)] pt-3">
      <span className={label}>{title}</span>
      <span className="font-[var(--font-body)] text-[26px] font-semibold leading-none tracking-tight">{int(r.best)}</span>
      <span className="font-[var(--font-mono)] text-[11.5px] text-[var(--text-muted)]">range {span(r)}</span>
      <span className="font-[var(--font-mono)] text-[11.5px] text-[var(--text-muted)]">
        {events === null ? '' : `${int(events)} events, `}to {date(to)}
      </span>
    </div>
  );
}

// undefined = still loading (nothing shown), null = could not be loaded
function Timeline({ tl, rows, showTheatre, limit, notes }: { tl: TimelineFile | null | undefined; rows: TimelineRow[]; showTheatre?: boolean; limit?: number; notes?: string[] }) {
  if (tl === undefined) return null;
  if (tl === null) return <p className="text-[14px] text-[var(--text-muted)]">Timeline unavailable.</p>;
  return <TimelineBlock rows={rows} checkedAt={tl.checkedAt} showTheatre={showTheatre} limit={limit} limits={tl.limits} notes={notes} />;
}

function EventList({ events }: { events: ConflictEvent[] }) {
  if (events.length === 0) return <p className="text-[14px] text-[var(--text-muted)]">No events with a usable location.</p>;
  return (
    <ul className="flex flex-col">
      {events.map((e) => (
        <li key={e.id} className="grid gap-1 border-t border-[var(--border)] py-3 text-[14px]">
          <span className="font-[var(--font-mono)] text-[12px] text-[var(--text-muted)]">
            {date(e.date)} · {e.place || e.country} · deaths {int(e.deaths.best)} ({span(e.deaths)})
            {e.provisional ? <span className="ml-2 uppercase tracking-[0.12em] text-[var(--orange)]">provisional</span> : null}
          </span>
          {e.headline ? <span>{e.headline}</span> : null}
          {e.sources.length ? <span className="font-[var(--font-mono)] text-[11.5px] text-[var(--text-muted)]">Sources: {e.sources.join(', ')}</span> : null}
        </li>
      ))}
    </ul>
  );
}

const KIND_ROW: Record<Kind, { name: string; note: string }> = {
  state: { name: 'State-based', note: 'a government is one side' },
  'non-state': { name: 'Non-state', note: 'armed groups fighting each other' },
  'one-sided': { name: 'One-sided', note: 'attacks on civilians' },
};
const REPORT_KIND: Record<string, string> = { armed: 'Armed', civilian: 'Civilians' };

function World({ f, tl, onDive, onBack }: { f: ConflictsFile; tl: TimelineFile | null | undefined; onDive: (id: string) => void; onBack: () => void }) {
  const w = f.world;
  const rows: TimelineRow[] = (tl?.theatres ?? []).flatMap((t) => t.entries.map((entry) => ({ entry, theatre: t.title })));
  const snap = useEvents((s) => s.recent);
  const nowS = useNow();
  const [names, setNames] = useState<Map<string, string>>(new Map());
  useEffect(() => {
    loadIndex().then((ix) => setNames(new Map(ix.map((e) => [e.id, e.name]))), () => {});
  }, []);
  // an old snapshot (the pipeline is down) must not read as "nothing happened": rank relative to its own time and say so
  const stale = !!snap && nowS - snap.meta.asOfS > 6 * 3600;
  const reports = useMemo(() => (snap ? latestEvents(snap, stale ? snap.meta.asOfS : nowS, 8, { kinds: ['armed', 'civilian'], human: false }) : null), [snap, nowS, stale]);
  return (
    <section role="region" aria-label="World overview" className="flex min-h-0 flex-col gap-5 overflow-y-auto p-5">
      <button type="button" onClick={onBack} className="self-start font-[var(--font-mono)] text-[11.5px] uppercase tracking-[0.15em] text-[var(--text-muted)] hover:text-[var(--lime)] md:hidden">
        Back to list
      </button>
      <div>
        <h3 className="font-[var(--font-display)] text-[30px] font-extrabold leading-tight tracking-tight">Fatalities monitor</h3>
        <p className={`${label} mt-2`}>
          All organised violence in the UCDP data · {w.conflictsListed} conflicts listed · to {date(f.dataEnd)}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card title="Last 30 days" r={w.deaths.d30} events={null} to={f.dataEnd} />
        <Card title="Last 90 days" r={w.deaths.d90} events={null} to={f.dataEnd} />
        <Card title="Last 365 days" r={w.deaths.d365} events={null} to={f.dataEnd} />
      </div>
      <div>
        <h4 className={`${label} mb-2`}>By kind of violence</h4>
        <table className="w-full text-left text-[14px]">
          <caption className="sr-only">Deaths by kind of violence, best estimate with range</caption>
          <thead>
            <tr className={label}>
              <th scope="col" className="py-1 pr-3 font-normal">Kind</th>
              <th scope="col" className="py-1 pr-3 font-normal">90 days</th>
              <th scope="col" className="py-1 font-normal">365 days</th>
            </tr>
          </thead>
          <tbody>
            {(Object.keys(KIND_ROW) as Kind[]).map((k) => (
              <tr key={k} className="border-t border-[var(--border)] align-top">
                <th scope="row" className="py-2 pr-3 font-normal">
                  {KIND_ROW[k].name}
                  <span className="block font-[var(--font-mono)] text-[11.5px] text-[var(--text-muted)]">{KIND_ROW[k].note}</span>
                </th>
                <td className="py-2 pr-3 font-[var(--font-mono)] text-[13px]">
                  {int(w.byKind[k].d90.best)} <span className="text-[var(--text-muted)]">({span(w.byKind[k].d90)})</span>
                </td>
                <td className="py-2 font-[var(--font-mono)] text-[13px]">
                  {int(w.byKind[k].d365.best)} <span className="text-[var(--text-muted)]">({span(w.byKind[k].d365)})</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-[13px] text-[var(--text-muted)]">Deaths in protests and riots themselves are not counted: UCDP covers organised violence. Killings of protesters by armed actors do appear, as one-sided violence. Protest datasets such as ACLED are not available to this project.</p>
      </div>
      <div>
        <h4 className={`${label} mb-2`}>Deaths per week, all conflicts</h4>
        <Weekly weekly={w.weekly} dataEnd={f.dataEnd} />
      </div>
      <div>
        <h4 className={`${label} mb-2`}>Most deaths in the last 90 days</h4>
        <ul className="flex flex-wrap gap-2">
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
      </div>
      <Timeline tl={tl} rows={rows} showTheatre limit={8} notes={(tl?.theatres ?? []).flatMap((t) => (t.note ? [`${t.title}: ${t.note}`] : []))} />
      <div>
        <h4 className={`${label} mb-2`}>Newest reports from the news, last 7 days (auto-coded)</h4>
        {stale && snap ? <p className="mb-2 text-[13px] text-[var(--orange)]">The news data is from {new Date(snap.meta.asOfS * 1000).toISOString().slice(0, 16).replace('T', ' ')} UTC, not live.</p> : null}
        {reports === null ? (
          <p className="text-[14px] text-[var(--text-muted)]">No recent reports loaded.</p>
        ) : reports.length === 0 ? (
          <p className="text-[14px] text-[var(--text-muted)]">No armed or civilian reports in the last 7 days.</p>
        ) : (
          <ul aria-label="Newest reports" className="flex flex-col">
            {reports.map((e) => (
              <li key={e.index} className="flex flex-wrap items-baseline gap-x-3 border-t border-[var(--border)] py-2 text-[14px]">
                <span className="font-[var(--font-mono)] text-[12px] uppercase tracking-[0.12em] text-[var(--text-muted)]">{REPORT_KIND[e.kind] ?? e.kind}</span>
                <button type="button" onClick={() => onDive(e.country)} className="hover:text-[var(--lime)]">
                  {names.get(e.country) ?? e.country}
                </button>
                <span className="font-[var(--font-mono)] text-[12px] text-[var(--text-muted)]">{ago(nowS, e.timeS)} · auto-coded, not verified</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <h4 className={`${label} mb-2`}>Latest human-coded events anywhere, to {date(f.dataEnd)}</h4>
        <EventList events={w.latest} />
      </div>
    </section>
  );
}

function Detail({ c, f, tl, onDive, onBack }: { c: Conflict; f: ConflictsFile; tl: TimelineFile | null | undefined; onDive: (id: string) => void; onBack: () => void }) {
  const mine = (tl?.theatres ?? []).filter((t) => t.conflicts.includes(c.id));
  const rows: TimelineRow[] = mine.flatMap((t) => t.entries.map((entry) => ({ entry, theatre: t.title })));
  return (
    <section role="region" aria-label={c.name} className="flex min-h-0 flex-col gap-5 overflow-y-auto p-5">
      <button type="button" onClick={onBack} className="self-start font-[var(--font-mono)] text-[11.5px] uppercase tracking-[0.15em] text-[var(--text-muted)] hover:text-[var(--lime)] md:hidden">
        Back to list
      </button>
      <div>
        <h3 className="font-[var(--font-display)] text-[30px] font-extrabold leading-tight tracking-tight">{c.name}</h3>
        <p className={`${label} mt-2`}>
          {c.kinds.map((k) => (k === 'state' ? 'State-based' : k === 'non-state' ? 'Non-state' : 'One-sided')).join(' · ')} · activity trend <span className={TREND[c.trend]}>{c.trend}</span> · last event {date(c.lastDate)}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card title="Last 30 days" r={c.deaths.d30} events={c.events.d30} to={f.dataEnd} />
        <Card title="Last 90 days" r={c.deaths.d90} events={c.events.d90} to={f.dataEnd} />
        <Card title="Last 365 days" r={c.deaths.d365} events={c.events.d365} to={f.dataEnd} />
      </div>
      <div>
        <h4 className={`${label} mb-2`}>Deaths per week</h4>
        <Weekly weekly={c.weekly} dataEnd={f.dataEnd} />
      </div>
      {tl === null || rows.length > 0 ? <Timeline tl={tl} rows={rows} notes={mine.flatMap((t) => (t.note ? [t.note] : []))} /> : null}
      <div>
        <h4 className={`${label} mb-2`}>Countries in the data</h4>
        <ul className="flex flex-wrap gap-2">
          {c.countries.slice(0, 12).map((k) => (
            <li key={`${k.id}-${k.name}`}>
              {k.id ? (
                <button type="button" onClick={() => onDive(k.id!)} className="rounded-full border border-[var(--border-strong)] px-3 py-1 font-[var(--font-mono)] text-[12px] hover:text-[var(--lime)]">
                  {k.name} <span className="text-[var(--text-muted)]">{int(k.deaths365)}</span>
                </button>
              ) : (
                <span className="rounded-full border border-[var(--border)] px-3 py-1 font-[var(--font-mono)] text-[12px] text-[var(--text-muted)]">
                  {k.name} {int(k.deaths365)}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h4 className={`${label} mb-2`}>Latest events in the data, to {date(f.dataEnd)}</h4>
        <EventList events={c.latest} />
      </div>
    </section>
  );
}

// The War tracker: every current conflict in the UCDP data with deaths (best estimate and range), trend, a weekly timeline and the latest
// events. Human-coded data only, windows end at the data end date, 2026 rows are provisional. A modal dialog like About.
export function ConflictsPage({ selected, onSelect, onClose, onDive, load = loadConflicts, loadTimeline: loadTl = loadTimeline }: { selected: string | null; onSelect: (id: string | null) => void; onClose: () => void; onDive: (countryId: string) => void; load?: () => Promise<ConflictsFile>; loadTimeline?: () => Promise<TimelineFile | null> }) {
  const [file, setFile] = useState<ConflictsFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tl, setTl] = useState<TimelineFile | null | undefined>(undefined);
  const [q, setQ] = useState('');
  const box = useRef<HTMLDivElement>(null);
  useDialog(box, onClose);
  useEffect(() => {
    let live = true;
    load().then(
      (f) => live && setFile(f),
      (e: unknown) => live && setError(e instanceof Error ? e.message : 'Could not load the conflicts data'),
    );
    return () => {
      live = false;
    };
  }, [load]);

  useEffect(() => {
    let live = true;
    loadTl().then(
      (t) => live && setTl(t),
      () => live && setTl(null),
    );
    return () => {
      live = false;
    };
  }, [loadTl]);

  const shown = useMemo(() => {
    const n = q.trim().toLowerCase();
    return (file?.conflicts ?? []).filter((c) => !n || c.name.toLowerCase().includes(n) || c.countries.some((k) => k.name.toLowerCase().includes(n)));
  }, [file, q]);
  const current = file?.conflicts.find((c) => c.id === selected) ?? null;
  const world = selected === 'world';

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/80 p-[3vw] pt-[6vh] backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={box} role="dialog" aria-modal="true" aria-labelledby="war-title" tabIndex={-1} className="flex max-h-[88vh] w-[min(1120px,100%)] flex-col overflow-hidden rounded-[24px] border border-[var(--border)] bg-black/70 backdrop-blur-xl">
        <header className="flex items-start justify-between gap-4 border-b border-[var(--border)] p-5">
          <div>
            <h2 id="war-title" className="font-[var(--font-display)] text-[30px] font-extrabold leading-none tracking-tight">
              War tracker
            </h2>
            <p className="mt-2 hidden max-w-[70ch] text-[14px] text-[var(--text-muted)] md:block">
              Human-coded UCDP data{file ? ` through ${date(file.dataEnd)}` : ''}; 2026 rows are provisional and get revised. Deaths are estimates: the best figure with a low–high range. Newer events are on the globe and are auto-coded.
            </p>
            <p className="mt-2 max-w-[70ch] text-[13px] text-[var(--text-muted)] md:hidden">Human-coded UCDP data{file ? ` to ${date(file.dataEnd)}` : ''}. Estimates; 2026 provisional.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close War tracker" className="rounded-full border border-[var(--border-strong)] px-3 py-1.5 font-[var(--font-mono)] text-[11.5px] uppercase tracking-[0.15em] text-[var(--text-muted)] hover:text-[var(--lime)]">
            Close
          </button>
        </header>
        {error ? (
          <p role="alert" className="p-5 text-[14px]">
            {error}. The globe still works; try again later.
          </p>
        ) : !file ? (
          <p role="status" className="p-5 text-[14px] text-[var(--text-muted)]">
            Loading conflicts…
          </p>
        ) : file.conflicts.length === 0 ? (
          <p className="p-5 text-[14px] text-[var(--text-muted)]">No conflicts in this data.</p>
        ) : (
          <div className="grid min-h-0 flex-1 md:grid-cols-[340px_1fr]">
            <nav aria-label="Conflicts" className={`min-h-0 flex-col overflow-y-auto border-[var(--border)] md:flex md:border-r ${current || world ? 'hidden' : 'flex'}`}>
              <div className="p-4">
                <input type="search" aria-label="Filter conflicts" placeholder="Filter by name or country" value={q} onChange={(e) => setQ(e.target.value)} className="w-full rounded-[12px] border border-[var(--border)] bg-transparent px-3 py-2 text-[14px] outline-none placeholder:text-[var(--text-faint)] focus:border-[var(--lime)]" />
              </div>
              {shown.length === 0 ? (
                <p className="px-4 pb-4 text-[14px] text-[var(--text-muted)]">No conflicts match.</p>
              ) : (
                <ul>
                  {!q.trim() ? (
                    <li>
                      <button type="button" aria-pressed={world || (!current && selected === null)} onClick={() => onSelect('world')} className={`flex w-full flex-col gap-1 border-t border-[var(--border)] px-4 py-3 text-left hover:bg-white/5 ${world ? 'bg-white/10' : ''}`}>
                        <span className="text-[14px]">World overview</span>
                        <span className="font-[var(--font-mono)] text-[12px] text-[var(--text-muted)]">
                          {int(file.world.deaths.d90.best)} deaths, 90 d ({span(file.world.deaths.d90)}) · all conflicts
                        </span>
                      </button>
                    </li>
                  ) : null}
                  {shown.map((c) => (
                    <li key={c.id}>
                      <button type="button" aria-pressed={c.id === selected} onClick={() => onSelect(c.id)} className={`flex w-full flex-col gap-1 border-t border-[var(--border)] px-4 py-3 text-left hover:bg-white/5 ${c.id === selected ? 'bg-white/10' : ''}`}>
                        <span className="text-[14px]">{c.name}</span>
                        <span className="font-[var(--font-mono)] text-[12px] text-[var(--text-muted)]">
                          {int(c.deaths.d90.best)} deaths, 90 d ({span(c.deaths.d90)}) · <span className={TREND[c.trend]}>{c.trend}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </nav>
            <div className={`min-h-0 flex-col md:flex ${current || world ? 'flex' : 'hidden'}`}>
              {current ? <Detail c={current} f={file} tl={tl} onDive={onDive} onBack={() => onSelect(null)} /> : <World f={file} tl={tl} onDive={onDive} onBack={() => onSelect(null)} />}
            </div>
          </div>
        )}
        <footer className="border-t border-[var(--border)] p-4 font-[var(--font-mono)] text-[11.5px] leading-relaxed text-[var(--text-muted)]">
          Source: UCDP Georeferenced Event Dataset (GED) 26.1 and UCDP Candidate Events, CC BY 4.0, <a href="https://ucdp.uu.se/" target="_blank" rel="noopener noreferrer" className="underline decoration-[var(--border-strong)] underline-offset-2 hover:text-[var(--lime)]">ucdp.uu.se</a>. Cite: Davies, Pettersson and Öberg (2026), Organized violence 1989–2025, and violent political protests, Journal of Peace Research, doi 10.1093/jopres/xjag046; Sundberg and Melander (2013), Introducing the UCDP Georeferenced Event Dataset, Journal of Peace Research 50(4); Candidate events: Hegre, Croicu, Eck and Högbladh (2020), Research &amp; Politics. Windows end at the data end date, not today.<span className="hidden md:inline"> A conflict is listed with at least 100 deaths in 365 days or 25 in 90 days. The activity trend compares the events of the last 30 days with the average 30 days before.</span>
        </footer>
      </div>
    </div>
  );
}
