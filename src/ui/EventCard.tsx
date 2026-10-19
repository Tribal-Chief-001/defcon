import { useEffect, useMemo, useRef, useState } from 'react';
import type { Detail, Kind } from '../events/types';
import { prefersReducedMotion } from '../lib/motion';
import { loadSignals } from '../signals/load';
import { nearbySignals, PRECISION_TEXT } from '../signals/nearby';
import type { SignalsFile } from '../signals/types';
import { useTime } from '../time/store';
import { redactionFor } from './redaction';

export type EventInfo = { kind: Kind; severity: number; human: boolean; timeS: number; precision: number; country: string | null };

const KIND_LABEL: Record<Kind, string> = { armed: 'Armed conflict', civilian: 'Violence against civilians', riot: 'Riot', protest: 'Protest', other: 'Other' };

const ago = (nowS: number, timeS: number) => {
  const m = Math.max(0, Math.round((nowS - timeS) / 60));
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 48 ? `${h} h ago` : `${Math.round(h / 24)} d ago`;
};
const utcDate = (timeS: number) => new Date(timeS * 1000).toISOString().slice(0, 10);
const isHttp = (u?: string) => !!u && /^https?:\/\//i.test(u);

// Cosmetic bar under a value: it shrinks as the file is "declassified". The value itself is always real, readable text.
const Bar = ({ progress }: { progress: number }) => (
  <span data-bar aria-hidden="true" className="mt-1 block h-[3px] bg-[var(--text-muted)]" style={{ width: `${Math.round((1 - progress) * 100)}%`, transition: prefersReducedMotion() ? 'none' : 'width 600ms cubic-bezier(0.16, 1, 0.3, 1)' }} />
);

// "Evidence trail": how the event was coded, how precise its place is, its sources, and what the Signals feed has near it. Signals are
// context only: they never confirm an event and an empty result proves nothing either way.
function EvidenceTrail({ detail, info, at }: { detail: Detail; info: EventInfo; at?: { lat: number; lon: number } }) {
  const [signals, setSignals] = useState<SignalsFile | null | undefined>(undefined);
  useEffect(() => {
    let live = true;
    void loadSignals().then((f) => live && setSignals(f));
    return () => {
      live = false;
    };
  }, []);
  const near = useMemo(() => (signals && at ? nearbySignals(signals, { lat: at.lat, lon: at.lon, timeS: info.timeS }) : null), [signals, at, info.timeS]);
  const n = detail.sources.length;
  return (
    <section aria-label="Evidence trail" className="mt-4 border-t border-[var(--border)] pt-3">
      <h3 className="font-[var(--font-mono)] text-[11.5px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Evidence trail</h3>
      <ul className="mt-2 space-y-1.5 text-[12.5px] leading-snug text-[var(--text-muted)]">
        <li>{info.human ? 'Human-coded by UCDP researchers from the sources listed above.' : 'Auto-coded from a news report (GDELT): not reviewed by a person, so the place and the counts can be wrong.'}</li>
        <li>Place given as {PRECISION_TEXT[info.precision as 1 | 2 | 3 | 4 | 5] ?? 'a place of unknown precision'}.</li>
        <li>
          {n === 0 ? 'No sources listed.' : `${n} ${n === 1 ? 'source' : 'sources'} listed.`}
          {detail.alsoIds.length > 0 ? ` Merged with ${detail.alsoIds.length} other ${detail.alsoIds.length === 1 ? 'report' : 'reports'} of the same event.` : ''}
        </li>
        {signals === undefined || !at ? null : signals === null ? (
          <li>The signals are unavailable right now.</li>
        ) : near!.state === 'older' ? (
          <li>This event is older than the {signals.windows.seismicDays} days the signals cover.</li>
        ) : near!.state === 'none' ? (
          <li>No signal near this event in the data. Signals are sparse: this proves nothing either way.</li>
        ) : (
          <>
            {near!.fires.slice(0, 2).map((x) => (
              <li key={`${x.cell.lat},${x.cell.lon}`}>
                Satellite fire detections ({x.cell.count}) in a cell about {Math.round(x.km)} km away, within 2 days. A fire has many causes.
              </li>
            ))}
            {near!.disasters.slice(0, 2).map((x) => (
              <li key={x.alert.id}>
                {x.alert.alert} disaster alert about {Math.round(x.km)} km away: {x.alert.title}
              </li>
            ))}
            {near!.seismic.slice(0, 2).map((x) => (
              <li key={x.event.id}>
                Seismic explosion {x.event.mag === null ? '' : `M ${x.event.mag.toFixed(1)} `}about {Math.round(x.km)} km away, {x.minutes} min apart.
              </li>
            ))}
            <li className="text-[var(--text-faint)]">Context from the Signals feed, not confirmation.</li>
          </>
        )}
      </ul>
    </section>
  );
}

export function EventCard({ detail, info, at, nowS = Math.floor(Date.now() / 1000), onClose }: { detail: Detail | null; info: EventInfo; at?: { lat: number; lon: number }; nowS?: number; onClose: () => void }) {
  const backS = useTime((s) => s.backS);
  const card = useRef<HTMLElement>(null);
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    card.current?.focus({ preventScroll: true });
    return () => {
      // the opener may be a rail row that unmounted meanwhile: fall back to the globe rather than the page body
      if (opener && opener.isConnected && opener !== document.body) opener.focus?.();
      else document.getElementById('globe-canvas')?.focus({ preventScroll: true });
    };
  }, []);
  // rewinding the scrubber declassifies: the effective age grows with how far back the playhead is
  const progress = redactionFor(nowS - info.timeS + backS);
  return (
    <aside ref={card} tabIndex={-1} aria-label="Event details" className="pointer-events-auto absolute right-[4vw] top-[5.25rem] z-20 w-[min(340px,calc(100vw-8vw))] rounded-[24px] border border-[var(--border)] bg-white/[0.06] p-6 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3 font-[var(--font-mono)] text-[11.5px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
        <span>{KIND_LABEL[info.kind]}</span>
        <button type="button" onClick={onClose} aria-label="Close" className="rounded-full border border-[var(--border-strong)] px-2 py-0.5 hover:text-[var(--lime)]">
          close
        </button>
      </div>
      {detail ? (
        <>
          <h2 className="mt-3 font-[var(--font-body)] text-xl font-semibold leading-tight">{detail.place}</h2>
          {detail.headline ? <p className="mt-2 text-sm text-[var(--text-muted)]">{detail.headline}</p> : null}
          <div className="mt-4 flex flex-wrap gap-2 font-[var(--font-mono)] text-[11.5px] uppercase tracking-[0.15em]">
            <span className="rounded-full border border-[var(--border-strong)] px-2.5 py-1">SEV {info.severity}/5</span>
            <span className={`rounded-full border px-2.5 py-1 ${info.human ? 'border-[var(--lime)] text-[var(--lime)]' : 'border-[var(--border-strong)]'}`}>{info.human ? 'HUMAN-CODED' : 'AUTO-CODED'}</span>
            <span className="rounded-full border border-[var(--border-strong)] px-2.5 py-1">{info.human ? utcDate(info.timeS) : `reported ${ago(nowS, info.timeS)}`}</span>
          </div>
          <dl className="mt-4 grid grid-cols-[88px_1fr] gap-y-2 border-t border-[var(--border)] pt-3 font-[var(--font-mono)] text-[12px]">
            <dt className="text-[var(--text-faint)]">DEATHS</dt>
            <dd className="font-bold">
              {detail.deaths === null ? 'unavailable' : String(detail.deaths)}
              <Bar progress={progress} />
            </dd>
            <dt className="text-[var(--text-faint)]">ACTORS</dt>
            <dd>
              {detail.actors || 'unavailable'}
              <Bar progress={progress} />
            </dd>
            <dt className="text-[var(--text-faint)]">PRECISION</dt>
            <dd>{info.precision}/5</dd>
            <dt className="text-[var(--text-faint)]">SOURCES</dt>
            <dd className="flex flex-col gap-1">
              {detail.sources.length === 0 ? 'unavailable' : null}
              {detail.sources.map((s, i) =>
                isHttp(s.url) ? (
                  <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="underline decoration-[var(--border-strong)] underline-offset-2 hover:text-[var(--lime)]">
                    {s.name}
                  </a>
                ) : (
                  <span key={i}>{s.name}</span>
                ),
              )}
              <Bar progress={progress} />
            </dd>
          </dl>
          <EvidenceTrail detail={detail} info={info} at={at} />
          <p className="mt-3 font-[var(--font-mono)] text-[11px] uppercase tracking-[0.12em] text-[var(--text-faint)]">
            File: {progress >= 1 ? 'declassified' : progress <= 0 ? 'classified' : 'declassifying'} (cosmetic: every detail is shown)
          </p>
        </>
      ) : (
        <p className="mt-4 font-[var(--font-mono)] text-[12px] uppercase tracking-[0.15em] text-[var(--text-muted)]">loading detail</p>
      )}
    </aside>
  );
}
