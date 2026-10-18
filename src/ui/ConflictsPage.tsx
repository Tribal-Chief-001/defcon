import { useEffect, useMemo, useRef, useState } from 'react';
import { loadConflicts } from '../conflicts/load';
import type { Conflict, ConflictsFile, Range } from '../conflicts/types';
import { useDialog } from './useDialog';

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const int = (n: number) => n.toLocaleString('en-US');
const date = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return Number.isFinite(y) && m && d ? `${d} ${MON[m - 1]} ${y}` : iso;
};
const addDays = (iso: string, n: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
const span = (r: Range) => `${int(r.low)}–${int(r.high)}`;
const label = 'font-[var(--font-mono)] text-[11.5px] uppercase tracking-[0.18em] text-[var(--text-muted)]';
const TREND: Record<Conflict['trend'], string> = { rising: 'text-[var(--orange)]', falling: 'text-[var(--text)]', steady: 'text-[var(--text-muted)]', 'low data': 'text-[var(--text-faint)]' };

function Weekly({ c, dataEnd }: { c: Conflict; dataEnd: string }) {
  const peak = Math.max(0, ...c.weekly);
  const at = c.weekly.indexOf(peak);
  const summary = peak > 0 ? `Weekly deaths, last 52 weeks to ${date(dataEnd)}, peak ${int(peak)} in the week ending ${date(addDays(dataEnd, -(51 - at) * 7))}` : `Weekly deaths, last 52 weeks to ${date(dataEnd)}: none`;
  const W = 520;
  const H = 64;
  return (
    <svg role="img" aria-label={summary} viewBox={`0 0 ${W} ${H}`} className="block w-full max-w-full" preserveAspectRatio="none" height={H}>
      <line x1="0" y1={H - 0.5} x2={W} y2={H - 0.5} stroke="var(--border-strong)" strokeWidth="1" />
      {c.weekly.map((v, i) => {
        const h = peak > 0 ? Math.max(v > 0 ? 1 : 0, (v / peak) * (H - 4)) : 0;
        return <rect key={i} x={i * (W / 52) + 1} y={H - 1 - h} width={W / 52 - 2.5} height={h} fill={i === 51 ? 'var(--lime)' : 'var(--text-muted)'} />;
      })}
    </svg>
  );
}

function Card({ title, r, events, to }: { title: string; r: Range; events: number; to: string }) {
  return (
    <div className="flex flex-col gap-1 border-t border-[var(--border)] pt-3">
      <span className={label}>{title}</span>
      <span className="font-[var(--font-body)] text-[26px] font-semibold leading-none tracking-tight">{int(r.best)}</span>
      <span className="font-[var(--font-mono)] text-[11.5px] text-[var(--text-muted)]">range {span(r)}</span>
      <span className="font-[var(--font-mono)] text-[11.5px] text-[var(--text-muted)]">
        {int(events)} events, to {date(to)}
      </span>
    </div>
  );
}

function Detail({ c, f, onDive, onBack }: { c: Conflict; f: ConflictsFile; onDive: (id: string) => void; onBack: () => void }) {
  return (
    <section role="region" aria-label={c.name} className="flex min-h-0 flex-col gap-5 overflow-y-auto p-5">
      <button type="button" onClick={onBack} className="self-start font-[var(--font-mono)] text-[11.5px] uppercase tracking-[0.15em] text-[var(--text-muted)] hover:text-[var(--lime)] md:hidden">
        Back to list
      </button>
      <div>
        <h3 className="font-[var(--font-display)] text-[30px] font-extrabold leading-tight tracking-tight">{c.name}</h3>
        <p className={`${label} mt-2`}>
          {c.kinds.map((k) => (k === 'state' ? 'State-based' : k === 'non-state' ? 'Non-state' : 'One-sided')).join(' · ')} · trend <span className={TREND[c.trend]}>{c.trend}</span> · last event {date(c.lastDate)}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card title="Last 30 days" r={c.deaths.d30} events={c.events.d30} to={f.dataEnd} />
        <Card title="Last 90 days" r={c.deaths.d90} events={c.events.d90} to={f.dataEnd} />
        <Card title="Last 365 days" r={c.deaths.d365} events={c.events.d365} to={f.dataEnd} />
      </div>
      <div>
        <h4 className={`${label} mb-2`}>Deaths per week</h4>
        <Weekly c={c} dataEnd={f.dataEnd} />
      </div>
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
        {c.latest.length === 0 ? (
          <p className="text-[14px] text-[var(--text-muted)]">No events with a usable location.</p>
        ) : (
          <ul className="flex flex-col">
            {c.latest.map((e) => (
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
        )}
      </div>
    </section>
  );
}

// The War tracker: every current conflict in the UCDP data with deaths (best estimate and range), trend, a weekly timeline and the latest
// events. Human-coded data only, windows end at the data end date, 2026 rows are provisional. A modal dialog like About.
export function ConflictsPage({ selected, onSelect, onClose, onDive, load = loadConflicts }: { selected: string | null; onSelect: (id: string | null) => void; onClose: () => void; onDive: (countryId: string) => void; load?: () => Promise<ConflictsFile> }) {
  const [file, setFile] = useState<ConflictsFile | null>(null);
  const [error, setError] = useState<string | null>(null);
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

  const shown = useMemo(() => {
    const n = q.trim().toLowerCase();
    return (file?.conflicts ?? []).filter((c) => !n || c.name.toLowerCase().includes(n) || c.countries.some((k) => k.name.toLowerCase().includes(n)));
  }, [file, q]);
  const current = file?.conflicts.find((c) => c.id === selected) ?? null;

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/80 p-[3vw] pt-[6vh] backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={box} role="dialog" aria-modal="true" aria-labelledby="war-title" tabIndex={-1} className="flex max-h-[88vh] w-[min(1120px,100%)] flex-col overflow-hidden rounded-[24px] border border-[var(--border)] bg-black/70 backdrop-blur-xl">
        <header className="flex items-start justify-between gap-4 border-b border-[var(--border)] p-5">
          <div>
            <h2 id="war-title" className="font-[var(--font-display)] text-[30px] font-extrabold leading-none tracking-tight">
              War tracker
            </h2>
            <p className="mt-2 max-w-[70ch] text-[14px] text-[var(--text-muted)]">
              Human-coded UCDP data{file ? ` through ${date(file.dataEnd)}` : ''}; 2026 rows are provisional and get revised. Deaths are estimates: the best figure with a low–high range. Newer events are on the globe and are auto-coded.
            </p>
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
            <nav aria-label="Conflicts" className={`min-h-0 flex-col overflow-y-auto border-[var(--border)] md:flex md:border-r ${current ? 'hidden' : 'flex'}`}>
              <div className="p-4">
                <input type="search" aria-label="Filter conflicts" placeholder="Filter by name or country" value={q} onChange={(e) => setQ(e.target.value)} className="w-full rounded-[12px] border border-[var(--border)] bg-transparent px-3 py-2 text-[14px] outline-none placeholder:text-[var(--text-faint)] focus:border-[var(--lime)]" />
              </div>
              {shown.length === 0 ? (
                <p className="px-4 pb-4 text-[14px] text-[var(--text-muted)]">No conflicts match.</p>
              ) : (
                <ul>
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
            <div className={`min-h-0 flex-col md:flex ${current ? 'flex' : 'hidden'}`}>
              {current ? <Detail c={current} f={file} onDive={onDive} onBack={() => onSelect(null)} /> : <p className="p-5 text-[14px] text-[var(--text-muted)]">Choose a conflict to see its deaths, weekly timeline and latest events.</p>}
            </div>
          </div>
        )}
        <footer className="border-t border-[var(--border)] p-4 font-[var(--font-mono)] text-[11.5px] leading-relaxed text-[var(--text-muted)]">
          Source: UCDP Georeferenced Event Dataset 26.1 and Candidate Events, CC BY 4.0, <a href="https://ucdp.uu.se/" target="_blank" rel="noopener noreferrer" className="underline decoration-[var(--border-strong)] underline-offset-2 hover:text-[var(--lime)]">ucdp.uu.se</a>. Davies, Pettersson and Öberg (2026), Journal of Peace Research. Windows end at the data end date, not today. A conflict is listed with at least 100 deaths in 365 days or 25 in 90 days.
        </footer>
      </div>
    </div>
  );
}
