import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { loadCountries } from './dossier/load';
import { diveTarget } from './globe/dive';
import { framingFor } from './globe/framing';
import { formatHash, parseHash } from './lib/hashState';
import { eventsBase } from './events/config';
import { fetchDetail } from './events/detail';
import { createLatest } from './events/latest';
import { pickEvent } from './events/pickEvent';
import { startEventService } from './events/service';
import { useEvents } from './events/store';
import type { Detail } from './events/types';
import { KINDS } from './events/types';
import { GlobeCanvas } from './globe/GlobeCanvas';
import { TopBar } from './ui/TopBar';
import { CommandPalette } from './ui/CommandPalette';
import { DossierPanel } from './ui/DossierPanel';
import { LiveCapitalLabels, setLabels } from './ui/CapitalLabels';
import { Coverage } from './ui/Coverage';
import { EventCard, type EventInfo } from './ui/EventCard';
import { NightWatch } from './ui/NightWatch';
import { Reticle } from './ui/Reticle';
import { useTime } from './time/store';
import { useSoundTriggers } from './sound/triggers';
import { useNightWatch } from './watch/useNightWatch';
import { Scrubber } from './ui/Scrubber';
import { SoundToggle } from './ui/SoundToggle';

const BASE = eventsBase(import.meta.env.VITE_EVENTS_BASE);
const PICK_RADIUS_PX = 14;

type Readout = { id: string | null; lat: number; lon: number };
type Dive = { id: string; target: { lat: number; lon: number; distance: number } };
type Selected = { info: EventInfo; detail: Detail | null; lat: number; lon: number };

export function App() {
  const [r, setR] = useState<Readout | null>(null);
  const [sel, setSel] = useState<Selected | null>(null);
  // initialised from the URL so the hash-mirroring effect below does not erase a shared #c=IND link before it is applied
  const [dossierId, setDossierId] = useState<string | null>(() => parseHash(location.hash).country);
  const [dive, setDive] = useState<Dive | null>(null);
  const diveIdRef = useRef<string | null>(null);
  diveIdRef.current = dive?.id ?? null;
  const dossierIdRef = useRef<string | null>(null);
  dossierIdRef.current = dossierId;
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

  // Night Watch waits while anything else needs the screen: a dossier, an event card, time travel, an open dialog (the palette)
  const selRef = useRef<Selected | null>(null);
  selRef.current = sel;
  const watch = useNightWatch(BASE, () => {
    const t = useTime.getState();
    return dossierIdRef.current !== null || selRef.current !== null || t.backS > 0 || t.playing || !!document.querySelector('[role="dialog"]');
  });

  // `key` is a map id or an ISO3 code (SSD for the map's SDS); an id with no country row opens nothing and flies nowhere
  useSoundTriggers(watch.target);

  const startDive = useCallback(async (key: string) => {
    const token = diveToken.current.next();
    latest.current.next(); // a new dive closes any open event card; a click's own event card is set after this
    setSel(null);
    setDossierId(key);
    const rows = await loadCountries();
    const row = rows.find((r) => r.id === key) ?? rows.find((r) => r.iso3 === key); // an exact map id wins over a territory sharing the ISO3 (Clipperton has FRA)
    if (!diveToken.current.isLatest(token)) return;
    if (!row) {
      setDossierId(null);
      setDive(null);
      return;
    }
    setDossierId(row.id);
    setDive({ id: row.id, target: diveTarget(row.bbox ?? null, { lat: row.lat, lon: row.lon }) });
  }, []);
  const exitDive = useCallback(() => {
    diveToken.current.next();
    setDive(null);
    setDossierId(null);
  }, []);

  // Esc leaves the dive; the URL hash mirrors it (#c=IND) and is honoured on load and on hashchange
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && dossierIdRef.current && exitDive();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [exitDive]);
  useEffect(() => {
    const want = formatHash(dossierId);
    if (location.hash !== want) history.replaceState(null, '', want || location.pathname + location.search);
  }, [dossierId]);
  useEffect(() => {
    const apply = () => {
      const { country } = parseHash(location.hash);
      if (country && country !== diveIdRef.current) void startDive(country);
      else if (!country && dossierIdRef.current) exitDive();
    };
    apply();
    window.addEventListener('hashchange', apply);
    return () => window.removeEventListener('hashchange', apply);
  }, [startDive, exitDive]);

  const onPick = useCallback((id: string | null, lat: number, lon: number, kmPerPx: number) => {
    setR({ id, lat, lon });
    if (id && id !== dossierIdRef.current) void startDive(id);
    const token = latest.current.next();
    const { recent, archive } = useEvents.getState();
    const hit = pickEvent(recent, archive, lat, lon, PICK_RADIUS_PX * kmPerPx, { nowS: Date.now() / 1000, backS: useTime.getState().backS });
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
      <GlobeCanvas onPick={onPick} marker={sel ? { lat: sel.lat, lon: sel.lon } : watch.marker} focus={watch.focus} dive={dive} framing={framing} onLabels={setLabels} />
      <LiveCapitalLabels />
      <Reticle />
      <NightWatch active={watch.active} caption={watch.caption} />
      <TopBar>
        <CommandPalette onPick={(id) => void startDive(id)} />
        <SoundToggle />
      </TopBar>
      <Coverage />
      <Scrubber />
      {dossierId ? <DossierPanel countryId={dossierId} onClose={exitDive} /> : null}
      {sel ? <EventCard detail={sel.detail} info={sel.info} onClose={() => {
          latest.current.next();
          setSel(null);
        }} /> : null}
      <p className="pointer-events-none absolute bottom-[4.5rem] left-[4vw] font-[var(--font-mono)] text-[11px] uppercase tracking-[0.15em] text-[var(--cyan)]">
        {r ? `${r.lat.toFixed(2)}N ${r.lon.toFixed(2)}E // ${r.id ?? 'open water'}` : 'click the globe'}
      </p>
    </main>
  );
}
