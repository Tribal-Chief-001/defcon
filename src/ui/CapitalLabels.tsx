import { create } from 'zustand';

export type CapitalLabel = { id: string; name: string; x: number; y: number };

const MAX_LABELS = 40;

// Decorative capital names laid over the globe at projected screen positions; the palette and the dossier are the accessible route.
export function CapitalLabels({ labels }: { labels: CapitalLabel[] }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {labels.slice(0, MAX_LABELS).map((l) => (
        <span
          key={l.id}
          className="absolute left-0 top-0 whitespace-nowrap font-[var(--font-mono)] text-[10px] uppercase tracking-[0.12em] text-[var(--cyan)]"
          style={{ transform: `translate(${Math.round(l.x + 9)}px, ${Math.round(l.y - 6)}px)` }}
        >
          {l.name}
        </span>
      ))}
    </div>
  );
}

// The globe pushes label positions up to 15 times a second; they live in their own store so only this layer re-renders, not the whole App.
export const useLabels = create<{ labels: CapitalLabel[]; setLabels(l: CapitalLabel[]): void }>((set) => ({ labels: [], setLabels: (labels) => set({ labels }) }));
export const setLabels = (l: CapitalLabel[]) => useLabels.getState().setLabels(l);

export function LiveCapitalLabels() {
  return <CapitalLabels labels={useLabels((s) => s.labels)} />;
}
