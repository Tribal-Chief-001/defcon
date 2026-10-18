import { create } from 'zustand';

// One polite live region for the whole app: dives, time travel and data freshness are announced here (never per frame).
export const useStatus = create<{ message: string; announce(m: string): void }>((set) => ({ message: '', announce: (message) => set({ message }) }));
export const announce = (m: string) => useStatus.getState().announce(m);

export function StatusRegion() {
  const message = useStatus((s) => s.message);
  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
    </div>
  );
}
