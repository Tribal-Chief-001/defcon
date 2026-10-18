import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchDetail } from './events/detail';
import { createLatest } from './events/latest';
import { pickEvent } from './events/pickEvent';
import { startEventService } from './events/service';
import { useEvents } from './events/store';
import type { Detail } from './events/types';
import { KINDS } from './events/types';
import { GlobeCanvas } from './globe/GlobeCanvas';
import { AsOf } from './ui/AsOf';
import { DossierPanel } from './ui/DossierPanel';
import { Coverage } from './ui/Coverage';
import { EventCard, type EventInfo } from './ui/EventCard';

const BASE = '/data/events';
const PICK_RADIUS_PX = 14;

type Readout = { id: string | null; lat: number; lon: number };
type Selected = { info: EventInfo; detail: Detail | null; lat: number; lon: number };

export function App() {
  const [r, setR] = useState<Readout | null>(null);
  const [sel, setSel] = useState<Selected | null>(null);
  const [dossierId, setDossierId] = useState<string | null>(null);
  const latest = useRef(createLatest()); // only the newest selection may receive its detail

  useEffect(() => startEventService(BASE), []);

  const onPick = useCallback((id: string | null, lat: number, lon: number, kmPerPx: number) => {
    setR({ id, lat, lon });
    if (id) setDossierId(id);
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
  }, []);

  return (
    <main className="relative h-full w-full bg-black">
      <GlobeCanvas onPick={onPick} marker={sel ? { lat: sel.lat, lon: sel.lon } : null} />
      <p className="pointer-events-none absolute left-[4vw] top-6 font-[var(--font-mono)] text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
        <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[var(--lime)]" />
        Defcon // globe core
      </p>
      <div className="absolute right-[4vw] top-6">
        <AsOf />
      </div>
      <Coverage />
      {dossierId ? <DossierPanel countryId={dossierId} onClose={() => setDossierId(null)} /> : null}
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
