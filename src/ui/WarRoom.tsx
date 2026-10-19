import { useEffect, useRef, useState } from 'react';
import { useTime } from '../time/store';
import { loadConflicts } from '../conflicts/load';
import type { ConflictsFile } from '../conflicts/types';
import { loadTimeline } from '../timeline/load';
import type { TimelineFile } from '../timeline/types';
import { ConflictView } from './war/ConflictView';
import { Overview, type PlaceHandler } from './war/Overview';
import { date } from './war/parts';

// The War room: a dashboard docked beside the globe (a bottom sheet on a narrow screen), not a modal. It shows the world overview or one
// conflict; the globe keeps working next to it and shows the same selection (halos, zone, hotspots, pins). Esc closes it.
export function WarRoom({
  selected,
  onSelect,
  onClose,
  onDive,
  onFocusPlace,
  onHoverPin,
  onMethod,
  load = loadConflicts,
  loadTimeline: loadTl = loadTimeline,
}: {
  selected: string | null;
  onSelect: (id: string | null) => void;
  onClose: () => void;
  onDive: (countryId: string) => void;
  onFocusPlace: PlaceHandler;
  onHoverPin: (pinIndex: number | null) => void;
  onMethod?: () => void;
  load?: () => Promise<ConflictsFile>;
  loadTimeline?: () => Promise<TimelineFile | null>;
}) {
  const [file, setFile] = useState<ConflictsFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tl, setTl] = useState<TimelineFile | null | undefined>(undefined);
  const head = useRef<HTMLHeadingElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

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

  // focus moves to the heading when it opens and back to the opener when it closes; Esc closes unless a dialog (the palette) is open
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    head.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.querySelector('[role="dialog"]')) onCloseRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      opener?.focus?.();
    };
  }, []);

  const current = file?.conflicts.find((c) => c.id === selected) ?? null;
  const [returnTo, setReturnTo] = useState<string | null>(null); // the conflict Back came from: its row gets the focus again
  const back = () => {
    setReturnTo(selected);
    onSelect(null);
  };
  // an id that is not in the data (an old link) is no selection: clear it so the address and the room agree
  useEffect(() => {
    if (file && selected && !current) onSelect(null);
  }, [file, selected, current, onSelect]);
  const backS = useTime((s) => s.backS);
  const goLive = useTime((s) => s.goLive);
  return (
    <section
      role="region"
      aria-label="War room"
      className="fixed z-20 flex flex-col overflow-hidden border-[var(--border)] bg-black/75 backdrop-blur-xl max-[1099px]:inset-x-0 max-[1099px]:bottom-0 max-[1099px]:h-[62vh] max-[1099px]:rounded-t-[24px] max-[1099px]:border-t min-[1100px]:bottom-0 min-[1100px]:right-0 min-[1100px]:top-[calc(4.25rem+var(--safe-top))] min-[1100px]:w-[min(46vw,720px)] min-[1100px]:border-l max-[1099px]:pb-[var(--safe-bottom)]"
    >
      <header className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-5 pb-4 pt-5">
        <div>
          <h2 ref={head} tabIndex={-1} className="font-[var(--font-display)] text-[28px] font-extrabold leading-none tracking-tight outline-none">
            War room
          </h2>
          <p className="mt-2 hidden max-w-[56ch] text-[13px] text-[var(--text-muted)] min-[600px]:block">
            Human-coded UCDP data{file ? ` through ${date(file.dataEnd)}` : ''}; 2026 rows are provisional and get revised. Deaths are estimates: the best figure with a low{'–'}high range. Newer events are on the globe and are auto-coded.
          </p>
          <p className="mt-2 hidden max-w-[56ch] text-[12.5px] text-[var(--text-muted)] min-[600px]:block">The pulsing rings on the globe mark conflicts with deaths in the last 90 days of this data; they are not live activity.</p>
          <p className="mt-2 max-w-[56ch] text-[12.5px] text-[var(--text-muted)] min-[600px]:hidden">Human-coded UCDP data{file ? ` to ${date(file.dataEnd)}` : ''}. Estimates; 2026 provisional.</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close War room" className="shrink-0 rounded-full border border-[var(--border-strong)] px-3 py-1.5 font-[var(--font-mono)] text-[11.5px] uppercase tracking-[0.15em] text-[var(--text-muted)] hover:text-[var(--lime)]">
          Close
        </button>
      </header>
      {backS > 0 ? (
        <p className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-2 font-[var(--font-mono)] text-[11.5px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
          <span>Time travel is on: the globe shows {backS >= 86400 ? `${Math.round(backS / 86400)} d` : `${Math.max(1, Math.round(backS / 3600))} h`} ago.</span>
          <button type="button" onClick={goLive} className="rounded-full border border-[var(--border-strong)] px-3 py-1 text-[var(--lime)]">
            Back to live
          </button>
        </p>
      ) : null}
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6">
        <div role="status" aria-live="polite" data-war-status className={!file && !error ? 'pt-5 text-[14px] text-[var(--text-muted)]' : 'sr-only'}>
          {!file && !error ? <>Loading conflicts{'…'}</> : null}
        </div>
        {error ? (
          <p role="alert" className="pt-5 text-[14px]">
            {error}. The globe still works; try again later.
          </p>
        ) : !file ? null : file.conflicts.length === 0 ? (
          <p className="pt-5 text-[14px] text-[var(--text-muted)]">No conflicts in this data.</p>
        ) : current ? (
          <ConflictView c={current} f={file} tl={tl} onBack={back} onDive={onDive} onFocusPlace={onFocusPlace} onHoverPin={onHoverPin} />
        ) : (
          <Overview f={file} tl={tl} onSelect={(id) => onSelect(id)} onDive={onDive} onFocusPlace={onFocusPlace} onHoverPin={onHoverPin} onMethod={onMethod} returnFocus={returnTo} />
        )}
        <footer className="mt-12 border-t border-[var(--border)] pt-4 font-[var(--font-mono)] text-[11.5px] leading-relaxed text-[var(--text-muted)]">
        Source: UCDP Georeferenced Event Dataset (GED) 26.1 and UCDP Candidate Events, CC BY 4.0,{' '}
        <a href="https://ucdp.uu.se/" target="_blank" rel="noopener noreferrer" className="underline decoration-[var(--border-strong)] underline-offset-2 hover:text-[var(--lime)]">
          ucdp.uu.se
        </a>
        . Cite: Davies, Pettersson and Öberg (2026), Organized violence 1989{'–'}2025, and violent political protests, Journal of Peace Research, doi 10.1093/jopres/xjag046; Sundberg and Melander (2013), Introducing the UCDP Georeferenced Event Dataset, Journal of Peace Research 50(4); Candidate events: Hegre, Croicu, Eck and Högbladh (2020), Research &amp; Politics. Windows end at the data end date, not today.
        <span className="hidden md:inline"> A conflict is listed with at least 100 deaths in 365 days or 25 in 90 days. The activity trend compares the events of the last 30 days with the average 30 days before.</span>
        </footer>
      </div>
    </section>
  );
}
