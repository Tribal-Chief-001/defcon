import { useEffect, useRef, useState } from 'react';
import type { Topology } from 'topojson-specification';
import { prefersReducedMotion } from '../lib/motion';
import { hasWebGL2 } from './capabilities';
import { createGlobe, type GlobeHandle } from './engine';
import { Unsupported } from './Unsupported';

const getJson = async (url: string) => (await (await fetch(url)).json()) as Topology;

export function GlobeCanvas({ onPick }: { onPick?: (id: string | null, lat: number, lon: number) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [supported, setSupported] = useState(() => hasWebGL2());

  useEffect(() => {
    if (!supported || !ref.current) return;
    let cancelled = false;
    let handle: GlobeHandle | undefined;
    let off: (() => void) | undefined;
    (async () => {
      const low = await getJson('/data/borders.low.topo.json');
      if (cancelled || !ref.current) return;
      handle = createGlobe({
        canvas: ref.current,
        low,
        reducedMotion: prefersReducedMotion(),
        onContextLost: () => setSupported(false),
      });
      if (onPick) off = handle.onPick(onPick);
      const high = await getJson('/data/borders.high.topo.json');
      if (!cancelled) handle.setHighDetail(high);
    })().catch((e) => console.error('globe failed to start', e));
    return () => {
      cancelled = true;
      off?.();
      handle?.dispose();
    };
  }, [supported, onPick]);

  if (!supported) return <Unsupported />;
  return <canvas ref={ref} className="block h-full w-full" />;
}
