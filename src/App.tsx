import { useCallback, useState } from 'react';
import { GlobeCanvas } from './globe/GlobeCanvas';

type Readout = { id: string | null; lat: number; lon: number };

export function App() {
  const [r, setR] = useState<Readout | null>(null);
  const onPick = useCallback((id: string | null, lat: number, lon: number) => setR({ id, lat, lon }), []);
  return (
    <main className="relative h-full w-full bg-black">
      <GlobeCanvas onPick={onPick} />
      <p className="pointer-events-none absolute left-[4vw] top-6 font-[var(--font-mono)] text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
        <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[var(--lime)]" />
        Defcon // globe core
      </p>
      <p className="pointer-events-none absolute bottom-6 left-[4vw] font-[var(--font-mono)] text-[11px] uppercase tracking-[0.15em] text-[var(--cyan)]">
        {r ? `${r.lat.toFixed(2)}N ${r.lon.toFixed(2)}E // ${r.id ?? 'open water'}` : 'click the globe'}
      </p>
    </main>
  );
}
