import { useEffect, useMemo, useRef, useState } from 'react';
import { loadDossier, loadIndex } from '../dossier/load';
import { countrySummary } from '../dossier/summary';
import type { Dossier } from '../dossier/types';
import { createLatest } from '../events/latest';
import { useEvents } from '../events/store';
import { KINDS } from '../events/types';
import { Field } from './Field';
import { RelationsBlock } from './RelationsBlock';
import { Sparkline } from './Sparkline';

const int = (n: number) => Math.round(n).toLocaleString('en-US');
const usd = (n: number) => (n >= 1e12 ? `$${(n / 1e12).toFixed(2)} trillion` : n >= 1e9 ? `$${(n / 1e9).toFixed(1)} billion` : n >= 1e6 ? `$${(n / 1e6).toFixed(1)} million` : `$${int(n)}`);
const KIND_LABEL: Record<string, string> = { armed: 'Armed', civilian: 'Civilians', riot: 'Riots', protest: 'Protests', other: 'Other' };

const latest = createLatest();
type Loaded = { id: string; dossier: Dossier | null };

export function DossierPanel({ countryId, onClose, nowS: fixedNowS }: { countryId: string; onClose: () => void; nowS?: number }) {
  // fixed per country: a clock read on every render would re-run the summary each second
  const nowS = useMemo(() => fixedNowS ?? Math.floor(Date.now() / 1000), [fixedNowS, countryId]);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const panel = useRef<HTMLElement>(null);
  // keyboard: focus moves into the panel when it opens and back to the opener (the clicked canvas, a palette button...) when it closes
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    return () => {
      // the opener may be a rail row that unmounted meanwhile: fall back to the globe rather than the page body
      if (opener && opener.isConnected && opener !== document.body) opener.focus?.();
      else document.getElementById('globe-canvas')?.focus({ preventScroll: true });
    };
  }, []);
  const [names, setNames] = useState<Map<string, string>>(new Map());
  const { recent, archive } = useEvents();

  useEffect(() => {
    const token = latest.next(); // a slow response for an earlier country must not overwrite the current one
    void loadDossier(countryId).then((dossier) => latest.isLatest(token) && setLoaded({ id: countryId, dossier }));
  }, [countryId]);
  useEffect(() => {
    void loadIndex().then((ix) => setNames(new Map(ix.map((e) => [e.id, e.name]))));
  }, []);

  const summary = useMemo(() => countrySummary([recent, archive], countryId, nowS), [recent, archive, countryId, nowS]);
  const d = loaded?.id === countryId ? loaded.dossier : undefined; // undefined = loading, null = failed

  const shell = (children: React.ReactNode) => (
    <aside
      ref={panel}
      tabIndex={-1}
      aria-label="Country dossier"
      className="pointer-events-auto absolute left-[4vw] top-[8rem] z-10 max-h-[calc(100vh-14rem)] w-[min(360px,calc(100vw-8vw))] overflow-y-auto rounded-[24px] border border-[var(--border)] bg-white/[0.06] p-6 backdrop-blur-xl max-sm:bottom-[calc(4.5rem+var(--safe-bottom))] max-sm:left-[4vw] max-sm:right-[4vw] max-sm:top-auto max-sm:max-h-[50vh] max-sm:w-auto"
    >
      {children}
    </aside>
  );
  const close = (
    <button type="button" onClick={onClose} aria-label="Close" className="rounded-full border border-[var(--border-strong)] px-2 py-0.5 font-[var(--font-mono)] text-[11.5px] uppercase tracking-[0.15em] text-[var(--text-muted)] hover:text-[var(--lime)]">
      close
    </button>
  );

  if (d === undefined) return shell(<p className="font-[var(--font-mono)] text-[12px] uppercase tracking-[0.15em] text-[var(--text-muted)]">loading dossier</p>);
  if (d === null)
    return shell(
      <div className="flex items-start justify-between gap-3">
        <p className="font-[var(--font-mono)] text-[12px] uppercase tracking-[0.15em] text-[var(--orange)]">dossier unavailable for {countryId}</p>
        {close}
      </div>,
    );

  const t = summary.tension;
  return shell(
    <>
      <div className="flex items-start justify-between gap-3 font-[var(--font-mono)] text-[11.5px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
        <span>[ Dossier // {d.iso3 ?? d.id} ]</span>
        {close}
      </div>
      <h2 className="mt-3 font-[var(--font-display)] text-3xl font-extrabold leading-[0.9] tracking-tight">{d.name}</h2>
      <div className="mt-3 flex flex-wrap gap-2 font-[var(--font-mono)] text-[11.5px] uppercase tracking-[0.15em]">
        <span className="rounded-full border border-[var(--border-strong)] px-2.5 py-1">{d.type}</span>
        {d.continent ? <span className="rounded-full border border-[var(--border-strong)] px-2.5 py-1">{d.continent}</span> : null}
      </div>

      <div className="mt-4 border-t border-[var(--border)]">
        <div className="grid grid-cols-[92px_1fr] gap-3 border-b border-[var(--border)] py-2 text-[13px]">
          <span className="font-[var(--font-mono)] text-[11px] uppercase tracking-[0.12em] text-[var(--text-faint)] pt-0.5">Capital</span>
          <span className="font-[var(--font-mono)] font-bold">
            {d.capitals.length ? (
              d.capitals.map((c, i) => (
                <span key={c.name} className={c.alt && i > 0 ? 'font-normal text-[var(--text-muted)]' : ''}>
                  {i > 0 ? ', ' : ''}
                  {c.name}
                  {c.alt && i > 0 ? ' (alt.)' : ''}
                </span>
              ))
            ) : (
              <span className="text-[var(--text-faint)]">none listed</span>
            )}
            {d.capitals.find((c) => c.note)?.note ? (
              <span className="mt-1 block text-[11.5px] font-normal normal-case tracking-normal text-[var(--text-muted)]">{d.capitals.find((c) => c.note)?.note}</span>
            ) : null}
          </span>
        </div>
        <div className="grid grid-cols-[92px_1fr] gap-3 border-b border-[var(--border)] py-2 text-[13px]">
          <span className="font-[var(--font-mono)] text-[11px] uppercase tracking-[0.12em] text-[var(--text-faint)] pt-0.5">Neighbours</span>
          <span className="font-[var(--font-mono)]">{d.neighbours.length ? d.neighbours.map((id) => names.get(id) ?? id).join(', ') : 'none (no land border)'}</span>
        </div>
        <Field label="Population" field={d.population} format={int} />
        <Field label="Area" field={d.areaKm2} format={(n) => `${int(n)} km²`} />
        <Field label="GDP" field={d.gdpUsd} format={usd} />
        <Field label="Military" field={d.milExpUsd} format={usd} />
        <Field label="% of GDP" field={d.milExpGdpPct} format={(n) => `${n.toFixed(1)}%`} />
        <Field label="Government" field={d.governmentType} />
        <Field label="Independence" field={d.independence} />
        <Field label="Languages" field={d.languages} />
        <Field label="UN" field={d.un} format={(v) => (v === 'member' ? 'Member' : v === 'observer' ? 'Observer state' : 'Not a member')} />
        <Field label="NATO" field={d.nato} format={(v) => (v ? 'Member' : 'Not a member')} />
        <Field label="Organisations" field={d.organisations} />
      </div>

      <div className="mt-5">
        <p className="font-[var(--font-mono)] text-[11.5px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Last 30 days</p>
        {summary.total === 0 && !recent && !archive ? (
          <p className="mt-2 font-[var(--font-mono)] text-[12px] text-[var(--text-faint)]">no event data loaded</p>
        ) : (
          <>
            <p className="mt-2 font-[var(--font-mono)] text-[22px] font-bold">{summary.total}</p>
            <p className="font-[var(--font-mono)] text-[11.5px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
              {KINDS.filter((k) => summary.byKind[k] > 0).map((k) => `${KIND_LABEL[k]} ${summary.byKind[k]}`).join(' · ') || 'no events'} · human-coded {summary.human} · auto-coded {summary.auto}
            </p>
            <div className="mt-2">
              <Sparkline data={summary.daily} />
              <p className="mt-1 font-[var(--font-mono)] text-[11px] uppercase tracking-[0.12em] text-[var(--text-faint)]">peak {summary.peakDay}/day</p>
            </div>
            {t && t.comparable ? (
              <p className="mt-2 font-[var(--font-mono)] text-[12px] uppercase tracking-[0.15em] text-[var(--lime)]">
                Tension {t.level}/5 <span className="text-[var(--text-muted)]">(DEFCON-style, not the official level)</span>
              </p>
            ) : summary.total > 0 ? (
              <p className="mt-2 font-[var(--font-mono)] text-[11.5px] uppercase tracking-[0.12em] text-[var(--orange)]">Auto-coded data only: no tension level</p>
            ) : null}
          </>
        )}
      </div>

      <RelationsBlock countryId={countryId} names={names} />

      <div className="mt-5 border-t border-[var(--border)] pt-3 font-[var(--font-mono)] text-[11px] uppercase leading-relaxed tracking-[0.1em] text-[var(--text-faint)]">
        <p className="text-[var(--text-muted)]">Sources</p>
        <p>Borders, names, capitals: Natural Earth (public domain), India official-map worldview.</p>
        <p>Numbers: World Bank WDI (CC BY 4.0); military: SIPRI via World Bank.</p>
        <p>Text fields: CIA World Factbook, archived (discontinued 2026-02-04).</p>
        <p>Membership: UN and NATO official lists. Events: UCDP (CC BY 4.0), GDELT.</p>
      </div>
    </>,
  );
}
