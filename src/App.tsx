import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { loadCountries } from './dossier/load';
import { diveTarget } from './globe/dive';
import { framingFor } from './globe/framing';
import { formatHash, parseHash } from './lib/hashState';
import { fetchDetail } from './events/detail';
import { createLatest } from './events/latest';
import { pickEvent } from './events/pickEvent';
import { startEventService } from './events/service';
import { useEvents } from './events/store';
import type { Detail } from './events/types';
import { KINDS } from './events/types';
import { GlobeCanvas } from './globe/GlobeCanvas';
import { AsOf } from './ui/AsOf';
import { CommandPalette } from './ui/CommandPalette';
import { DossierPanel } from './ui/DossierPanel';
import { Coverage } from './ui/Coverage';
import { EventCard, type EventInfo } from './ui/EventCard';

const BASE = '/data/events';
const PICK_RADIUS_PX = 14;

type Readout = { id: string | null; lat: number; lon: number };
type Dive = { id: string; target: { lat: number; lon: number; distance: number } };
type Selected = { info: EventInfo; detail: Detail | null; lat: number; lon: number };

export function App() {
  const [r, setR] = useState<Readout | null>(null);
  const [sel, setSel] = useState<Selected | null>(null);
  const [dossierId, setDossierId] = useState<string | null>(null);
  const [dive, setDive] = useState<Dive | null>(null);
  const diveIdRef = useRef<string | null>(null);
  diveIdRef.current = dive?.id ?? null;
  const diveToken = useRef(createLatest()); // only the newest dive request wins
  const [narrow, setNarrow] = useState(() => window.matchMedia('(max-width: 639px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const on = () => setNarrow(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  const framing = useMemo(() => framingFor(dossierId !== null, narrow), [dossierId, narrow]);
  const latest = useRef(createLatest()); // only the newest selection may receive its detail

  useEffect(() => startEventService(BASE), []);

  const startDive = useCallback(async (id: string) => {
    const token = diveToken.current.next();
    setDossierId(id);
    const row = (await loadCountries()).find((r) => r.id === id);
    if (!diveToken.current.isLatest(token)) return;
    setDive({ id, target: diveTarget(row?.bbox ?? null, row ? { lat: row.lat, lon: row.lon } : null) });
  }, []);
  const exitDive = useCallback(() => {
    diveToken.current.next();
    setDive(null);
    setDossierId(null);
  }, []);

  // Esc leaves the dive; the URL hash mirrors it (#c=IND) and is honoured on load and on back/forward
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && diveIdRef.current && exitDive();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [exitDive]);
  useEffect(() => {
    const want = formatHash(dive?.id ?? null);
    if (location.hash !== want) history.replaceState(null, '', want || location.pathname + location.search);
  }, [dive]);
  useEffect(() => {
    const apply = () => {
      const { country } = parseHash(location.hash);
      if (country && country !== diveIdRef.current) void startDive(country);
      else if (!country && diveIdRef.current) exitDive();
    };
    apply();
    window.addEventListener('hashchange', apply);
    return () => window.removeEventListener('hashchange', apply);
  }, [startDive, exitDive]);

  const onPick = useCallback((id: string | null, lat: number, lon: number, kmPerPx: number) => {
    setR({ id, lat, lon });
    if (id && id !== diveIdRef.current) void startDive(id);
    const token = latest.current.next();
    const { recent, archive } = useEvents.getState();
    const hit = pickEvent(recent, archive, lat, lon, PICK_RADIUS_PX * kmPerPx);
    if (!hit) {
      setSel(null);
      return;
    }
    const { snapshot: s, index: i, name } = hit;
    const info: EventInfo = {
      kind: KINDS[s.kind[i]!] ?? 'other',
      severity: s.severity[i]!,
      human: s.human[i] === 1,
      timeS: s.timeS[i]!,
      precision: s.precision[i]!,
      country: s.countries[s.country[i]!] || null,
    };
    const at = { lat: s.lat[i]!, lon: s.lon[i]! };
    setSel({ info, detail: null, ...at });
    void fetchDetail(BASE, name, s, i).then((detail) => {
      if (latest.current.isLatest(token)) setSel((cur) => (cur ? { ...cur, detail } : cur));
    });
  }, [startDive]);

  return (
    <main className="relative h-full w-full bg-black">
      <GlobeCanvas onPick={onPick} marker={sel ? { lat: sel.lat, lon: sel.lon } : null} dive={dive} framing={framing} />
      <p className="pointer-events-none absolute left-[4vw] top-6 font-[var(--font-mono)] text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
        <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[var(--lime)]" />
        Defcon // globe core
      </p>
      <div className="absolute right-[4vw] top-6">
        <AsOf />
      </div>
      <CommandPalette onPick={(id) => void startDive(id)} />
      <Coverage />
      {dossierId ? <DossierPanel countryId={dossierId} onClose={exitDive} /> : null}
      {sel ? <EventCard detail={sel.detail} info={sel.info} onClose={() => {
          latest.current.next();
          setSel(null);
        }} /> : null}
      <p className="pointer-events-none absolute bottom-6 left-[4vw] font-[var(--font-mono)] text-[11px] uppercase tracking-[0.15em] text-[var(--cyan)]">
        {r ? `${r.lat.toFixed(2)}N ${r.lon.toFixed(2)}E // ${r.id ?? 'open water'}` : 'click the globe'}
      </p>
    </main>
  );
}
