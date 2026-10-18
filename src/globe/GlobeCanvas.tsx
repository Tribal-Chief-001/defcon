import { useEffect, useRef, useState } from 'react';
import type { Topology } from 'topojson-specification';
import { installFrameOverlay } from '../dev/frameOverlay';
import { buildAttributes } from '../events/attributes';
import { useEvents } from '../events/store';
import { prefersReducedMotion } from '../lib/motion';
import { hasWebGL2 } from './capabilities';
import { createGlobe, type GlobeHandle } from './engine';
import { Unsupported } from './Unsupported';

const getJson = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return (await res.json()) as Topology;
};

export function GlobeCanvas({
  onPick,
  marker,
}: {
  onPick?: (id: string | null, lat: number, lon: number, kmPerPx: number) => void;
  marker?: { lat: number; lon: number } | null;
}) {
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
      if (onPick) off = handle.onPick(onPick);
      const push = () => {
        const { recent, archive } = useEvents.getState();
        const now = Math.floor(Date.now() / 1000);
        handle?.setEvents([archive, recent].filter((x) => !!x).map((x) => buildAttributes(x!, 1.004, now)));
      };
      push();
      unsubscribe = useEvents.subscribe((st, prev) => {
        if (st.recent !== prev.recent || st.archive !== prev.archive) push();
      });
      const high = await getJson('/data/borders.high.topo.json');
      if (!cancelled) handle.setHighDetail(high);
    })().catch((e) => {
      console.error('globe failed to start', e);
      if (!cancelled) setFailed(true);
    });
    return () => {
      cancelled = true;
      off?.();
      unsubscribe?.();
      handleRef.current = undefined;
      handle?.dispose();
    };
  }, [supported, onPick]);

  useEffect(() => {
    if (marker) handleRef.current?.setEventMarker(marker.lat, marker.lon);
    else handleRef.current?.setEventMarker(null);
  }, [marker]);

  if (!supported) return <Unsupported />;
  if (failed) return <Unsupported reason="failed" />;
  return <canvas ref={ref} className="block h-full w-full" />;
}
