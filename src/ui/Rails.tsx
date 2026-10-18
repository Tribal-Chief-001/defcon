import { useEffect, useMemo, useState } from 'react';
import { loadIndex } from '../dossier/load';
import { hotspots, latestEvents, type LatestEvent } from '../events/rails';
import { useEvents } from '../events/store';
import type { Kind } from '../events/types';
import { ago } from '../lib/ago';
import { useNow } from '../lib/useNow';
import { useTime } from '../time/store';

const KIND_LABEL: Record<Kind, string> = { armed: 'Armed', civilian: 'Civilians', riot: 'Riot', protest: 'Protest', other: 'Event' };
const panel = 'pointer-events-auto hidden max-h-[calc(100vh-13rem)] w-[300px] flex-col overflow-y-auto rounded-[24px] border border-[var(--border)] bg-white/[0.04] p-5 backdrop-blur-md';
const label = 'font-[var(--font-mono)] text-[11.5px] uppercase tracking-[var(--track)] text-[var(--text-muted)]';
const row = 'group flex w-full items-center gap-3 rounded-[14px] border border-transparent px-2 py-2 text-left hover:border-[var(--border-strong)] focus-visible:border-[var(--lime)]';

// Two information rails for wide screens: where things are most active, and what just happened. Both read the live snapshot only;
// while time travel is on they say so instead of showing numbers that would not match the globe.
export function Rails({ dossierOpen, cardOpen, onDive, onOpenEvent }: { dossierOpen: boolean; cardOpen: boolean; onDive: (id: string) => void; onOpenEvent: (e: LatestEvent) => void }) {
  const snap = useEvents((s) => s.recent);
  const backS = useTime((s) => s.backS);
  const [names, setNames] = useState<Map<string, string>>(new Map());
  useEffect(() => {
    void loadIndex().then((ix) => setNames(new Map(ix.map((e) => [e.id, e.name]))));
  }, []);

  const nowS = useNow();
  const hot = useMemo(() => (snap ? hotspots(snap, nowS) : []), [snap, nowS]);
  const latest = useMemo(() => (snap ? latestEvents(snap, nowS) : []), [snap, nowS]);
  const name = (id: string) => names.get(id) ?? id;
  const live = backS === 0;

  return (
    <>
      {!dossierOpen ? (
        <aside aria-label="Hotspots, last 7 days" className={`${panel} min-[1100px]:flex absolute left-[max(4vw,var(--safe-left))] top-[8rem]`}>
          <h2 className={label}>Hotspots · 7 d</h2>
          {!live ? (
            <p className="mt-3 font-[var(--font-mono)] text-[12px] text-[var(--text-muted)]">Live view only. Press Live to see the current ranking.</p>
          ) : hot.length === 0 ? (
            <p className="mt-3 font-[var(--font-mono)] text-[12px] text-[var(--text-muted)]">{snap ? 'No events in the last 7 days.' : 'No event data loaded.'}</p>
          ) : (
            <ol className="mt-3 flex flex-col gap-0.5">
              {hot.map((h, i) => (
                <li key={h.country}>
                  <button type="button" onClick={() => onDive(h.country)} className={row} aria-label={`${name(h.country)}, ${h.events} events in 7 days. Open dossier.`}>
                    <span className="w-4 font-[var(--font-mono)] text-[12px] text-[var(--text-muted)]">{i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-semibold">{name(h.country)}</span>
                      <span className="mt-1.5 block h-px w-full bg-[var(--border-strong)]">
                        <span className="block h-px bg-[var(--orange)]" style={{ width: `${Math.max(4, Math.round(h.share * 100))}%` }} />
                      </span>
                    </span>
                    <span className="font-[var(--font-mono)] text-[13px] text-[var(--text)]">{h.events.toLocaleString('en-US')}</span>
                  </button>
                </li>
              ))}
            </ol>
          )}
          <p className="mt-3 font-[var(--font-mono)] text-[11px] text-[var(--text-muted)]">Order and bars use Defcon's own score (protests weigh less, auto-coded counts half); the number is the event count. News coverage is uneven (the US and UK are over-represented), so this ranks reporting, not danger.</p>
        </aside>
      ) : null}

      {/* with a dossier open the country sits right of centre, so the right rail only shows where there is room for both */}
      {!cardOpen ? (
        <aside aria-label="Latest events" className={`${panel} ${dossierOpen ? 'min-[1500px]:flex' : 'min-[1100px]:flex'} absolute right-[max(4vw,var(--safe-right))] top-[7rem]`}>
          <h2 className={label}>Latest</h2>
          {!live ? (
            <p className="mt-3 font-[var(--font-mono)] text-[12px] text-[var(--text-muted)]">Live view only.</p>
          ) : latest.length === 0 ? (
            <p className="mt-3 font-[var(--font-mono)] text-[12px] text-[var(--text-muted)]">{snap ? 'No events in the last 7 days.' : 'No event data loaded.'}</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-0.5">
              {latest.map((e) => (
                <li key={e.index}>
                  <button type="button" onClick={() => onOpenEvent(e)} className={row} aria-label={`${KIND_LABEL[e.kind]} in ${name(e.country)}, ${ago(nowS, e.timeS)}, severity ${e.severity} of 5, ${e.human ? 'human-coded' : 'auto-coded'}. Show on the globe.`}>
                    <span className={`h-2 w-2 shrink-0 rounded-full ${e.kind === 'protest' || e.kind === 'other' ? 'bg-[var(--text)]' : 'bg-[var(--orange)]'} ${e.human ? '' : 'bg-transparent ring-1 ring-inset ring-current'}`} aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-semibold">{name(e.country)}</span>
                      <span className="block font-[var(--font-mono)] text-[11.5px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
                        {KIND_LABEL[e.kind]} · {e.human ? 'human' : 'auto'} · {ago(nowS, e.timeS)}
                      </span>
                    </span>
                    <span className="flex gap-0.5" aria-hidden="true">
                      {[1, 2, 3, 4, 5].map((p) => (
                        <span key={p} className={`h-3 w-1 rounded-full ${p <= e.severity ? 'bg-[var(--text)]' : 'bg-[var(--border-strong)]'}`} />
                      ))}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
      ) : null}
    </>
  );
}
