import type { Detail, Kind } from '../events/types';
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
  <span data-bar aria-hidden="true" className="mt-1 block h-[3px] bg-[var(--text-muted)]" style={{ width: `${Math.round((1 - progress) * 100)}%`, transition: 'width 600ms cubic-bezier(0.16, 1, 0.3, 1)' }} />
);

export function EventCard({ detail, info, nowS = Math.floor(Date.now() / 1000), onClose }: { detail: Detail | null; info: EventInfo; nowS?: number; onClose: () => void }) {
  const backS = useTime((s) => s.backS);
  // rewinding the scrubber declassifies: the effective age grows with how far back the playhead is
  const progress = redactionFor(nowS - info.timeS + backS);
  return (
    <aside className="pointer-events-auto absolute right-[4vw] top-[4.5rem] z-20 w-[min(340px,calc(100vw-8vw))] rounded-[24px] border border-[var(--border)] bg-white/[0.06] p-6 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3 font-[var(--font-mono)] text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
        <span>{KIND_LABEL[info.kind]}</span>
        <button type="button" onClick={onClose} aria-label="Close" className="rounded-full border border-[var(--border-strong)] px-2 py-0.5 hover:text-[var(--lime)]">
          close
        </button>
      </div>
      {detail ? (
        <>
          <h2 className="mt-3 font-[var(--font-body)] text-xl font-semibold leading-tight">{detail.place}</h2>
          {detail.headline ? <p className="mt-2 text-sm text-[var(--text-muted)]">{detail.headline}</p> : null}
          <div className="mt-4 flex flex-wrap gap-2 font-[var(--font-mono)] text-[10px] uppercase tracking-[0.15em]">
            <span className="rounded-full border border-[var(--border-strong)] px-2.5 py-1">SEV {info.severity}/5</span>
            <span className={`rounded-full border px-2.5 py-1 ${info.human ? 'border-[var(--lime)] text-[var(--lime)]' : 'border-[var(--border-strong)]'}`}>{info.human ? 'HUMAN-CODED' : 'AUTO-CODED'}</span>
            <span className="rounded-full border border-[var(--border-strong)] px-2.5 py-1">{info.human ? utcDate(info.timeS) : `reported ${ago(nowS, info.timeS)}`}</span>
          </div>
          <dl className="mt-4 grid grid-cols-[88px_1fr] gap-y-2 border-t border-[var(--border)] pt-3 font-[var(--font-mono)] text-[11px]">
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
          <p className="mt-3 font-[var(--font-mono)] text-[9.5px] uppercase tracking-[0.12em] text-[var(--text-faint)]">
            File: {progress >= 1 ? 'declassified' : progress <= 0 ? 'classified' : 'declassifying'} (cosmetic: every detail is shown)
          </p>
        </>
      ) : (
        <p className="mt-4 font-[var(--font-mono)] text-[11px] uppercase tracking-[0.15em] text-[var(--text-muted)]">loading detail</p>
      )}
    </aside>
  );
}
