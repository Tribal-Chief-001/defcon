import { useEffect, useRef, useState } from 'react';
import type { Topology } from 'topojson-specification';
import { installFrameOverlay } from '../dev/frameOverlay';
import { buildAttributes } from '../events/attributes';
import { useEvents } from '../events/store';
import { prefersReducedMotion } from '../lib/motion';
import { hasWebGL2 } from './capabilities';
import { createGlobe, type GlobeHandle } from './engine';
import type { CapitalLabel } from '../ui/CapitalLabels';
import type { Capital } from './labels';
import { loadCountries } from '../dossier/load';
import { playheadS, useTime } from '../time/store';
import { loadRelations } from '../relations/load';
import { makeRadarHandler } from './radarPipeline';
import { Unsupported } from './Unsupported';

const getJson = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return (await res.json()) as Topology;
};

export function GlobeCanvas({
  onPick,
  marker,
  dive,
  framing,
  onLabels,
}: {
  onPick?: (id: string | null, lat: number, lon: number, kmPerPx: number) => void;
  marker?: { lat: number; lon: number } | null;
  dive?: { id: string; target: { lat: number; lon: number; distance: number } } | null;
  framing?: { x: number; y: number };
  onLabels?: (labels: CapitalLabel[]) => void;
}) {
  const diveRef = useRef(dive);
  diveRef.current = dive;
  const framingRef = useRef(framing);
  framingRef.current = framing;
  const ref = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<GlobeHandle | undefined>(undefined);
  const [supported, setSupported] = useState(() => hasWebGL2());
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!supported || !ref.current) return;
    let cancelled = false;
    let handle: GlobeHandle | undefined;
    let off: (() => void) | undefined;
    let tick: ((nowMs: number) => void) | undefined;
    let unsubscribe: (() => void) | undefined;
    let offLabels: (() => void) | undefined;
    let offTime: (() => void) | undefined;
    let offCursor: (() => void) | undefined;
    (async () => {
      const low = await getJson('/data/borders.low.topo.json');
      if (cancelled || !ref.current) return;
      handle = createGlobe({
        canvas: ref.current,
        low,
        reducedMotion: prefersReducedMotion(),
        onContextLost: () => setSupported(false),
        onFrame: import.meta.env.DEV ? (tick ??= installFrameOverlay()) : undefined,
      });
      handleRef.current = handle;
      handle.setFraming(framingRef.current?.x ?? 0, framingRef.current?.y ?? 0);
      if (diveRef.current) handle.dive(diveRef.current.id, diveRef.current.target); // a deep link opened before the globe existed
      if (onPick) off = handle.onPick(onPick);
      if (onLabels) offLabels = handle.onLabels(onLabels);
      offCursor = handle.onCursor(makeRadarHandler((lat, lon) => handle!.project(lat, lon), () => useEvents.getState()));
      // capital markers are an extra: a failed fetch leaves the globe without them rather than failing it
      void fetch('/data/capitals.json')
        .then((r) => (r.ok ? (r.json() as Promise<Capital[]>) : []))
        .then((caps) => !cancelled && Array.isArray(caps) && handle?.setCapitals(caps))
        .catch(() => undefined);
      const push = () => {
        const { recent, archive } = useEvents.getState();
        const now = Math.floor(Date.now() / 1000);
        handle?.setEvents([archive, recent].filter((x) => !!x).map((x) => buildAttributes(x!, 1.004, now)));
      };
      push();
      // the terminator follows the playhead: refreshed once a minute while live and on every scrub change
      const sun = () => handle?.setSunTime(playheadS(Date.now() / 1000, useTime.getState().backS));
      handle.setTimeBack(useTime.getState().backS);
      sun();
      const sunTimer = window.setInterval(sun, 60_000);
      const offStore = useTime.subscribe((st, prev) => {
        if (st.backS === prev.backS) return;
        handle?.setTimeBack(st.backS);
        sun();
      });
      offTime = () => (offStore(), window.clearInterval(sunTimer));
      unsubscribe = useEvents.subscribe((st, prev) => {
        if (st.recent !== prev.recent || st.archive !== prev.archive) push();
      });
      // arcs are an extra: a failed load leaves the globe without them
      void Promise.all([loadRelations(), loadCountries()])
        .then(([rel, rows]) => !cancelled && rel && handle?.setRelations(rel, Object.fromEntries(rows.map((r) => [r.id, { lat: r.lat, lon: r.lon }]))))
        .catch(() => undefined);
      const high = await getJson('/data/borders.high.topo.json');
      if (!cancelled) handle.setHighDetail(high);
    })().catch((e) => {
      console.error('globe failed to start', e);
      if (!cancelled) setFailed(true);
    });
    return () => {
      cancelled = true;
      off?.();
      offLabels?.();
      offTime?.();
      offCursor?.();
      unsubscribe?.();
      handleRef.current = undefined;
      handle?.dispose();
    };
  }, [supported, onPick, onLabels]);

  useEffect(() => {
    if (marker) handleRef.current?.setEventMarker(marker.lat, marker.lon);
    else handleRef.current?.setEventMarker(null);
  }, [marker]);

  useEffect(() => {
    handleRef.current?.dive(dive ? dive.id : null, dive?.target);
  }, [dive]);
  useEffect(() => {
    handleRef.current?.setFraming(framing?.x ?? 0, framing?.y ?? 0);
  }, [framing?.x, framing?.y]);

  if (!supported) return <Unsupported />;
  if (failed) return <Unsupported reason="failed" />;
  return <canvas ref={ref} className="block h-full w-full" />;
}
