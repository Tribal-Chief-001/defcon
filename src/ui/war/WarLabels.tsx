import { useSyncExternalStore } from 'react';
import { warLabelBus } from '../../globe/warLabelBus';

// The names of the most active conflicts, drawn next to their halos on the globe, with their deaths in the last 90 days. Decorative (the
// War room's own list is the accessible version); the labels never take the pointer, so the globe stays clickable underneath.
export function WarLabels() {
  const labels = useSyncExternalStore(warLabelBus.subscribe, warLabelBus.get);
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
      {labels.map((l) => (
        <div key={l.id} className="absolute whitespace-nowrap font-[var(--font-mono)] text-[11px] uppercase leading-tight tracking-[0.12em]" style={{ left: l.x + l.r * 0.75 + 6, top: l.y - 7, color: l.selected ? 'var(--lime)' : l.rising ? 'var(--orange)' : 'var(--text)' }}>
          {l.name}
          <span className="ml-2 text-[var(--text-muted)]">{`${l.deaths90.toLocaleString('en-US')} · 90 d`}</span>
        </div>
      ))}
    </div>
  );
}
