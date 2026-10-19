import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { loadCountries } from './dossier/load';
import { diveTarget } from './globe/dive';
import { framingFor } from './globe/framing';
import { focusDistance, toWarConflicts, type WarState } from './globe/warGeometry';
import { warLabelBus } from './globe/warLabelBus';
import { entriesFor, toPins } from './ui/war/pins';
import { WarLabels } from './ui/war/WarLabels';
import { loadConflicts } from './conflicts/load';
import type { ConflictsFile } from './conflicts/types';
import { loadTimeline } from './timeline/load';
import type { TimelineFile } from './timeline/types';
import { formatHash, parseHash } from './lib/hashState';
import { backFromMoment, shareUrl } from './lib/shareUrl';
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
import { HudFrame } from './ui/HudFrame';
import type { Snapshot } from './events/snapshot';
import { Rails } from './ui/Rails';
import type { LatestEvent } from './events/rails';
import { NightWatch } from './ui/NightWatch';
import { Reticle } from './ui/Reticle';
import { useTime } from './time/store';
import { useSoundTriggers } from './sound/triggers';
import { useNightWatch } from './watch/useNightWatch';
import { Scrubber } from './ui/Scrubber';
import { lazy, Suspense } from 'react';
import { ErrorBoundary } from './ui/ErrorBoundary';
import { Unsupported } from './globe/Unsupported';
import { SkipLink } from './ui/SkipLink';
import { ShareButton } from './ui/ShareButton';
import { WatchAlerts } from './ui/WatchAlerts';
import { WatchPanel } from './ui/WatchPanel';
import { useWatchlist } from './watchlist/watchlist';
import { SoundToggle } from './ui/SoundToggle';
import { StatusRegion, announce } from './ui/status';

const BASE = eventsBase(import.meta.env.VITE_EVENTS_BASE);
const AboutPage = lazy(() => import('./ui/AboutPage').then((m) => ({ default: m.AboutPage })));
const WarRoom = lazy(() => import('./ui/WarRoom').then((m) => ({ default: m.WarRoom })));
const PICK_RADIUS_PX = 14;

type Readout = { id: string | null; lat: number; lon: number };
type Dive = { id: string; target: { lat: number; lon: number; distance: number } };
type Selected = { info: EventInfo; detail: Detail | null; lat: number; lon: number };

export function App() {
  const [r, setR] = useState<Readout | null>(null);
  const [sel, setSel] = useState<Selected | null>(null);
  // initialised from the URL so the hash-mirroring effect below does not erase a shared #c=IND link before it is applied
  const [about, setAbout] = useState(() => parseHash(location.hash).about === true);
  const [aboutToMethod, setAboutToMethod] = useState(false); // opened from a "How computed" link: scroll to the indices method
  const openAbout = (toMethod: boolean) => {
    setAboutToMethod(toMethod);
    setAbout(true);
  };
  // null = closed, '' = the conflict list, otherwise one conflict id (`#war`, `#war=<id>`)
  const [war, setWar] = useState<string | null>(() => parseHash(location.hash).war ?? null);
  const [dossierId, setDossierId] = useState<string | null>(() => parseHash(location.hash).country);
  const [dive, setDive] = useState<Dive | null>(null);
  const diveIdRef = useRef<string | null>(null);
  diveIdRef.current = dive?.id ?? null;
  const dossierIdRef = useRef<string | null>(null);
  dossierIdRef.current = dossierId;
  const warOpenRef = useRef(false); // the War room is open: Night Watch must not take the globe away
  const diveToken = useRef(createLatest()); // only the newest dive request wins
  const [narrow, setNarrow] = useState(() => window.matchMedia('(max-width: 639px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const on = () => setNarrow(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  const warOpen = war !== null && !about;
  warOpenRef.current = warOpen;
  // the War room is a bottom sheet below 1100 px (not only below 640 px): the globe moves up there, left beside the docked panel above it
  const [sheet, setSheet] = useState(() => window.matchMedia('(max-width: 1099px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1099px)');
    const on = () => setSheet(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  const framing = useMemo(() => framingFor(dossierId !== null, warOpen ? sheet : narrow, warOpen), [dossierId, narrow, sheet, warOpen]);

  // The War room's presence on the globe: halos for the active conflicts, and for the selected one its zone, hotspots and timeline pins.
  // The data comes from the same cached loaders as the War room itself; a failed load leaves the globe without the layer.
  const [warData, setWarData] = useState<{ file: ConflictsFile | null; timeline: TimelineFile | null }>({ file: null, timeline: null });
  const [warHover, setWarHover] = useState<number | null>(null); // the pin of the timeline card under the pointer
  useEffect(() => {
    if (war === null) return;
    let live = true;
    void loadConflicts().then((file) => live && setWarData((d) => ({ ...d, file })), () => undefined);
    void loadTimeline().then((timeline) => live && setWarData((d) => ({ ...d, timeline })), () => undefined);
    return () => {
      live = false;
    };
  }, [war === null]); // eslint-disable-line react-hooks/exhaustive-deps
  const warConflicts = useMemo(() => (warData.file ? toWarConflicts(warData.file.conflicts) : []), [warData.file]);
  const warSelected = war && war !== 'world' && warConflicts.some((c) => c.id === war) ? war : null;
  const warPins = useMemo(() => (warSelected ? toPins(entriesFor(warData.timeline, warSelected)) : []), [warSelected, warData.timeline]);
  const warState = useMemo<WarState>(() => ({ active: warOpen, conflicts: warConflicts, selected: warSelected, pins: warPins, hoverPin: warHover }), [warOpen, warConflicts, warSelected, warPins, warHover]);
  // the camera flies to a conflict when it is selected and stays there until another is chosen or the War room closes
  const [warFocus, setWarFocus] = useState<{ lat: number; lon: number; distance: number } | null>(null);
  useEffect(() => {
    const c = warOpen && warSelected ? warConflicts.find((x) => x.id === warSelected) : undefined;
    if (!c) return setWarFocus(null);
    setWarFocus({ lat: c.lat, lon: c.lon, distance: focusDistance(c.spreadKm) }); // held while it is selected: the globe stays on it instead of spinning away
  }, [warOpen, warSelected, warConflicts]);
  // when the selection is cleared or the room closes the camera goes back to the world view instead of staying zoomed on the last conflict
  const [restoreKey, setRestoreKey] = useState(0);
  const hadSelection = useRef(false);
  useEffect(() => {
    const has = warOpen && warSelected !== null;
    if (hadSelection.current && !has) setRestoreKey((k) => k + 1);
    hadSelection.current = has;
  }, [warOpen, warSelected]);
  // a place chosen on a timeline card ("Show on the map") wins until another conflict is selected or the room closes
  const [placeFocus, setPlaceFocus] = useState<{ lat: number; lon: number; distance: number; seq: number } | null>(null);
  const placeSeq = useRef(0);
  useEffect(() => setPlaceFocus(null), [warOpen]);
  // choosing a conflict (from the room or by clicking its halo) clears the place; a place asked for in the same click (a timeline stem) is set after and wins
  const selectConflict = (id: string | null) => {
    setWar(id ?? '');
    setPlaceFocus(null);
  };
  useEffect(() => setWarHover(null), [warSelected, warOpen]);
  const latest = useRef(createLatest()); // only the newest selection may receive its detail

  useEffect(() => startEventService(BASE), []);
  useEffect(() => useWatchlist.getState().hydrate(), []); // the watchlist is kept in this browser only
  // time travel is announced once the slider settles, never per frame
  useEffect(() => {
    let timer: number | undefined;
    const off = useTime.subscribe((st, prev) => {
      if (st.backS === prev.backS) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => announce(st.backS === 0 ? 'Time travel: live' : `Time travel: ${Math.round(st.backS / 86400)} days before now`), 600);
    });
    return () => (off(), window.clearTimeout(timer));
  }, []);

  // Night Watch waits while anything else needs the screen: a dossier, an event card, time travel, an open dialog (the palette)
  const selRef = useRef<Selected | null>(null);
  selRef.current = sel;
  const watch = useNightWatch(BASE, () => {
    const t = useTime.getState();
    return warOpenRef.current || dossierIdRef.current !== null || selRef.current !== null || t.backS > 0 || t.playing || !!document.querySelector('[role="dialog"]');
  });

  // `key` is a map id or an ISO3 code (SSD for the map's SDS); an id with no country row opens nothing and flies nowhere
  useSoundTriggers(watch.target);

  const startDive = useCallback(async (key: string) => {
    const token = diveToken.current.next();
    latest.current.next(); // a new dive closes any open event card; a click's own event card is set after this
    setSel(null);
    setWar(null); // a country opened from anywhere (the globe, the palette, the room) replaces the War room
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
    announce(`Showing ${row.name}`);
    setDive({ id: row.id, target: diveTarget(row.bbox ?? null, { lat: row.lat, lon: row.lon }) });
  }, []);
  const exitDive = useCallback(() => {
    diveToken.current.next();
    setDive(null);
    setDossierId(null);
  }, []);

  // the room does not stack on a dossier or an event card: opening it closes them
  useEffect(() => {
    if (!warOpen) return;
    latest.current.next();
    setSel(null);
    if (dossierIdRef.current) exitDive();
  }, [warOpen, exitDive]);

  // Esc leaves the dive; the URL hash mirrors it (#c=IND) and is honoured on load and on hashchange
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || document.querySelector('[role="dialog"]')) return; // a dialog (the palette) handles its own Esc
      if (selRef.current) {
        latest.current.next();
        setSel(null); // the event card is the topmost layer
      } else if (dossierIdRef.current) exitDive();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [exitDive]);
  useEffect(() => {
    const want = formatHash(dossierId, about, war);
    if (location.hash !== want) history.replaceState(null, '', want || location.pathname + location.search);
  }, [dossierId, about, war]);
  const momentAtLoad = useRef(parseHash(location.hash).t); // read before the address is rewritten without it
  useEffect(() => {
    let first = true;
    const apply = () => {
      const { country, about: wantAbout, war: wantWar, t } = parseHash(location.hash);
      const moment = first ? momentAtLoad.current : t; // a shared moment puts the playhead there (the archive covers 365 days)
      first = false;
      if (moment !== undefined) useTime.getState().setBack(backFromMoment(moment, Date.now() / 1000));
      setAbout(wantAbout === true);
      setWar(wantWar ?? null);
      setPlaceFocus(null); // a hash navigation is a new selection: the place asked for before no longer applies
      if (wantAbout || wantWar !== undefined) return; // an overlay sits on top of whatever is open
      if (country && country !== diveIdRef.current) void startDive(country);
      else if (!country && dossierIdRef.current) exitDive();
    };
    apply();
    window.addEventListener('hashchange', apply);
    return () => window.removeEventListener('hashchange', apply);
  }, [startDive, exitDive]);

  // shows one specific event in the event card (its text loads from the per-day shard)
  const showEvent = useCallback((name: 'recent' | 'archive', s: Snapshot, i: number) => {
    const token = latest.current.next();
    const info: EventInfo = {
      kind: KINDS[s.kind[i]!] ?? 'other',
      severity: s.severity[i]!,
      human: s.human[i] === 1,
      timeS: s.timeS[i]!,
      precision: s.precision[i]!,
      country: s.countries[s.country[i]!] || null,
    };
    setSel({ info, detail: null, lat: s.lat[i]!, lon: s.lon[i]! });
    void fetchDetail(BASE, name, s, i).then((detail) => {
      if (latest.current.isLatest(token)) setSel((cur) => (cur ? { ...cur, detail } : cur));
    });
  }, []);
  // opens the event nearest to (lat, lon); used by clicks on the globe
  const openEvent = useCallback((lat: number, lon: number, kmPerPx: number) => {
    latest.current.next();
    const { recent, archive } = useEvents.getState();
    const hit = pickEvent(recent, archive, lat, lon, PICK_RADIUS_PX * kmPerPx, { nowS: Date.now() / 1000, backS: useTime.getState().backS });
    if (!hit) {
      setSel(null);
      return;
    }
    showEvent(hit.name, hit.snapshot, hit.index);
  }, [showEvent]);
  const onPick = useCallback((id: string | null, lat: number, lon: number, kmPerPx: number) => {
    setR({ id, lat, lon });
    if (id && id !== dossierIdRef.current) void startDive(id);
    if (!warOpenRef.current) openEvent(lat, lon, kmPerPx); // an event card would sit on top of the docked room
  }, [startDive, openEvent]);
  // the Latest rail: fly the camera to the event and open exactly that event (not whichever event is nearest to its coordinates: GDELT
  // events share places and times); the focus target is cleared once the flight is over
  const [railFocus, setRailFocus] = useState<{ lat: number; lon: number; distance: number } | null>(null);
  const railTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(railTimer.current), []);
  const onRailEvent = useCallback((e: LatestEvent) => {
    const s = useEvents.getState().recent;
    if (!s || e.index >= s.n || s.timeS[e.index] !== e.timeS) return; // the snapshot was replaced since the row was drawn
    setRailFocus({ lat: e.lat, lon: e.lon, distance: 1.9 });
    showEvent('recent', s, e.index);
    window.clearTimeout(railTimer.current);
    railTimer.current = window.setTimeout(() => setRailFocus(null), 1600);
  }, [showEvent]);

  return (
    <main className="relative h-full w-full bg-black">
      <SkipLink />
      <StatusRegion />
      <ErrorBoundary where="globe" fallback={<Unsupported reason="failed" />}>
        <GlobeCanvas onPick={onPick} marker={sel ? { lat: sel.lat, lon: sel.lon } : watch.marker} focus={watch.focus ?? placeFocus ?? warFocus ?? railFocus} dive={dive} framing={framing} onLabels={setLabels} war={warState} onWarLabels={warLabelBus.set} onWarPick={selectConflict} restoreKey={restoreKey} />
      </ErrorBoundary>
      <HudFrame />
      <LiveCapitalLabels />
      <Reticle />
      <NightWatch active={watch.active} caption={watch.caption} />
      <WatchAlerts />
      <TopBar>
        <CommandPalette onPick={(id) => void startDive(id)} />
        <SoundToggle />
        <WatchPanel onOpen={(id) => void startDive(id)} />
        <ShareButton url={() => shareUrl({ origin: location.origin, pathname: location.pathname, id: dossierId, about, war, backS: useTime.getState().backS, nowS: Math.floor(Date.now() / 1000) })} />
        <button type="button" aria-pressed={warOpen} onClick={() => setWar((w) => (w === null ? '' : null))} className="rounded-full border border-[var(--border-strong)] bg-black/40 px-3 py-1.5 font-[var(--font-mono)] text-[11.5px] uppercase tracking-[0.15em] text-[var(--text-muted)] backdrop-blur-md hover:text-[var(--lime)]">
          War room
        </button>
        <button type="button" onClick={() => openAbout(false)} className="rounded-full border border-[var(--border-strong)] bg-black/40 px-3 py-1.5 font-[var(--font-mono)] text-[11.5px] uppercase tracking-[0.15em] text-[var(--text-muted)] backdrop-blur-md hover:text-[var(--lime)]">
          About
        </button>
      </TopBar>
      {about ? (
        <Suspense fallback={null}>
          <ErrorBoundary where="about" onReset={() => setAbout(false)}>
            <AboutPage onClose={() => setAbout(false)} toMethod={aboutToMethod} />
          </ErrorBoundary>
        </Suspense>
      ) : null}
      {warOpen ? (
        <>
          <WarLabels />
          <Suspense fallback={null}>
            <ErrorBoundary where="war" onReset={() => setWar(null)}>
              <WarRoom
                selected={war || null}
                onSelect={selectConflict}
                onClose={() => setWar(null)}
                onDive={(id) => {
                  setWar(null);
                  void startDive(id);
                }}
                onFocusPlace={(at) => setPlaceFocus(at ? { lat: at.lat, lon: at.lon, distance: at.distance ?? 1.7, seq: ++placeSeq.current } : null)}
                onHoverPin={setWarHover}
                onMethod={() => openAbout(true)}
              />
            </ErrorBoundary>
          </Suspense>
        </>
      ) : null}
      <Rails suppressed={warOpen} dossierOpen={dossierId !== null} cardOpen={sel !== null} onDive={(id) => void startDive(id)} onOpenEvent={onRailEvent} />
      {warOpen ? null : (
        <>
          <Coverage />
          <ErrorBoundary where="scrubber" fallback={null}>
            <Scrubber />
          </ErrorBoundary>
        </>
      )}
      {dossierId ? (
        <ErrorBoundary key={dossierId} where="dossier" onReset={exitDive}>
          <DossierPanel countryId={dossierId} onClose={exitDive} onMethod={() => openAbout(true)} />
        </ErrorBoundary>
      ) : null}
      {sel ? (
        <ErrorBoundary key={`${sel.lat},${sel.lon}`} where="event-card" onReset={() => setSel(null)}>
          <EventCard
            detail={sel.detail}
            info={sel.info}
            at={{ lat: sel.lat, lon: sel.lon }}
            onClose={() => {
              latest.current.next();
              setSel(null);
            }}
          />
        </ErrorBoundary>
      ) : null}
      <p className="pointer-events-none absolute bottom-[calc(4.5rem+var(--safe-bottom))] left-[max(4vw,var(--safe-left))] font-[var(--font-mono)] text-[12px] uppercase tracking-[0.15em] text-[var(--cyan)]">
        {r ? `${r.lat.toFixed(2)}N ${r.lon.toFixed(2)}E // ${r.id ?? 'open water'}` : 'click the globe'}
      </p>
    </main>
  );
}
