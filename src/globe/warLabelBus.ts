import type { WarLabelPos } from './warGeometry';

// The globe publishes the screen positions of the War room labels here; the labels subscribe on their own. Keeping them out of React
// state means a rotating globe re-renders only the labels, not the whole app and the dashboard.
let labels: WarLabelPos[] = [];
const subs = new Set<() => void>();
export const warLabelBus = {
  set(next: WarLabelPos[]) {
    labels = next;
    subs.forEach((f) => f());
  },
  get: () => labels,
  subscribe(f: () => void) {
    subs.add(f);
    return () => void subs.delete(f);
  },
};
