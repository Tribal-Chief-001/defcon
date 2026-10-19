import { useEffect, useMemo, useState } from 'react';
import { loadSignals } from '../../signals/load';
import type { SignalsFile } from '../../signals/types';
import { int, label } from './parts';
import type { PlaceHandler } from './Overview';

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const when = (s: number) => {
  const d = new Date(s * 1000);
  return `${d.getUTCDate()} ${MON[d.getUTCMonth()]} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')} UTC`;
};
const KIND: Record<string, string> = { EQ: 'earthquake', TC: 'tropical cyclone', FL: 'flood', WF: 'wildfire', DR: 'drought', VO: 'volcano' };
const link = 'underline decoration-[var(--border-strong)] underline-offset-2 hover:text-[var(--lime)]';

// Context signals beside the conflict data: fires seen by satellites near conflict areas, humanitarian disaster alerts and explosion-type
// seismic events. They are context, never evidence of an attack, and they change no number or index. Without the file the block says so.
export function SignalsBlock({ onFocusPlace, nowS }: { onFocusPlace: PlaceHandler; nowS?: number }) {
  const [file, setFile] = useState<SignalsFile | null | undefined>(undefined);
  useEffect(() => {
    let live = true;
    void loadSignals().then((f) => live && setFile(f));
    return () => {
      live = false;
    };
  }, []);

  // the true totals per conflict (the file computes them before it caps its cell list)
  const byConflict = useMemo(() => [...(file?.fireTotals ?? [])].sort((a, b) => b.detections - a.detections || a.conflict.localeCompare(b.conflict)).slice(0, 10), [file]);

  if (file === undefined) return <p className="mt-8 text-[13px] text-[var(--text-muted)]">Loading the signals{'…'}</p>;
  if (file === null) return <p className="mt-8 text-[13px] text-[var(--text-muted)]">The signals are unavailable right now. The rest of the room works without them.</p>;
  const src = (id: string) => file.sources.find((s) => s.id === id);
  const down = file.sources.filter((s) => !s.ok);
  const built = Date.parse(file.generated) / 1000;
  const ageH = Math.max(0, Math.round(((nowS ?? Date.now() / 1000) - built) / 3600));

  return (
    <section aria-label="Signals" className="mt-10">
      <h4 className={`${label} mb-3 flex items-center gap-3`}>
        <span>Signals</span>
        <span aria-hidden="true" className="h-px flex-1 bg-[var(--border)]" />
      </h4>
      <p className="max-w-[62ch] text-[13px] text-[var(--text-muted)]">
        Context, not conflict events: what satellites and sensors saw near the conflict areas and elsewhere. A fire has many causes (burning fields and bush, gas flares, burning buildings) and most detections are vegetation fires, so a count says little on its own; a seismic explosion is not a strike. Signals never change a conflict number or an index. Updated {when(built)}, built {ageH} h ago{ageH > 12 ? ': this update is out of date, newer data may exist' : ''}.
      </p>
      {down.length > 0 ? (
        <p className="mt-2 font-[var(--font-mono)] text-[12px] text-[var(--orange)]">
          {down.map((s) => `${s.id === 'usgs' ? 'USGS' : s.id === 'gdacs' ? 'GDACS' : 'FIRMS'} unavailable at the last update`).join(' · ')}
        </p>
      ) : null}

      <h5 className={`${label} mt-6`}>Fires in conflict areas, last 24 hours</h5>
      {src('firms')?.ok === false ? null : byConflict.length === 0 ? (
        <p className="mt-2 text-[13px] text-[var(--text-muted)]">No fire detections in the conflict areas in this update.</p>
      ) : (
        <ul aria-label="Fires in conflict areas" className="mt-1 flex flex-col">
          {byConflict.map((g) => (
            <li key={g.conflictId} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-[var(--border)] py-2 text-[13px]">
              <span className="min-w-0 flex-1">{g.conflict}</span>
              <span className="font-[var(--font-mono)] text-[12px] text-[var(--text-muted)]">
                {int(g.detections)} detections · {g.cells} {g.cells === 1 ? 'cell' : 'cells'} · strongest {int(Math.round(g.frp))} MW
              </span>
              <button type="button" onClick={() => onFocusPlace({ lat: g.lat, lon: g.lon, place: `${g.conflict} (most fire detections)` })} className="font-[var(--font-mono)] text-[11.5px] uppercase tracking-[0.12em] text-[var(--lime)] hover:underline" aria-label={`Show on the map: ${g.conflict}`}>
                Show on the map
              </button>
            </li>
          ))}
        </ul>
      )}

      <h5 className={`${label} mt-6`}>Disaster alerts (Orange and Red), last 7 days</h5>
      {src('gdacs')?.ok === false ? null : file.disasters.length === 0 ? (
        <p className="mt-2 text-[13px] text-[var(--text-muted)]">No Orange or Red disaster alerts in this update.</p>
      ) : (
        <ul aria-label="Disaster alerts" className="mt-1 flex flex-col">
          {file.disasters.slice(0, 8).map((d) => (
            <li key={d.id} className="border-t border-[var(--border)] py-2 text-[13px]">
              <span className={`font-[var(--font-mono)] text-[11.5px] uppercase tracking-[0.12em] ${d.alert === 'Red' ? 'text-[var(--orange)]' : 'text-[var(--text-muted)]'}`}>
                {d.alert} · {KIND[d.kind] ?? d.kind}
              </span>{' '}
              <a href={d.url} target="_blank" rel="noopener noreferrer" className={link}>
                {d.title}
              </a>
              <span className="block font-[var(--font-mono)] text-[11.5px] text-[var(--text-muted)]">
                {d.country ? `${d.country} · ` : ''}
                {when(d.time)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <h5 className={`${label} mt-6`}>Seismic explosions, last 7 days</h5>
      {src('usgs')?.ok === false ? null : file.seismic.length === 0 ? (
        <p className="mt-2 text-[13px] text-[var(--text-muted)]">No explosion-type seismic events of magnitude 2 or more in this update.</p>
      ) : (
        <ul aria-label="Seismic explosions" className="mt-1 flex flex-col">
          {file.seismic.slice(0, 8).map((s) => (
            <li key={s.id} className="flex flex-wrap items-baseline gap-x-3 border-t border-[var(--border)] py-2 text-[13px]">
              <span className="font-[var(--font-mono)] text-[12px]">{s.mag === null ? 'M n/a' : `M ${s.mag.toFixed(1)}`}</span>
              <a href={s.url} target="_blank" rel="noopener noreferrer" className={`${link} min-w-0 flex-1`}>
                {s.place || 'explosion'}
              </a>
              <button type="button" onClick={() => onFocusPlace({ lat: s.lat, lon: s.lon, place: s.place || 'seismic explosion' })} className="font-[var(--font-mono)] text-[11.5px] uppercase tracking-[0.12em] text-[var(--lime)] hover:underline" aria-label={`Show on the map: ${s.place || 'seismic explosion'}`}>
                Show on the map
              </button>
              <span className="w-full font-[var(--font-mono)] text-[11.5px] text-[var(--text-muted)]">{when(s.time)}</span>
            </li>
          ))}
        </ul>
      )}

      <ul className="mt-5 space-y-1 font-[var(--font-mono)] text-[11.5px] leading-relaxed text-[var(--text-muted)]">
        {file.sources.map((s) => (
          <li key={s.id}>
            {s.attribution} · {s.licence} ·{' '}
            <a href={s.url} target="_blank" rel="noopener noreferrer" className={link}>
              source
            </a>
            {s.licenceUrl ? (
              <>
                {' · '}
                <a href={s.licenceUrl} target="_blank" rel="noopener noreferrer" className={link}>
                  licence
                </a>
              </>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
