// Tells a click from a drag. A cancelled pointer (e.g. a touch the browser takes over) is never a click.
export function createClickClassifier(thresholdPx = 5) {
  let active = false;
  let moved = 0;
  return {
    down() {
      active = true;
      moved = 0;
    },
    move(dx: number, dy: number) {
      if (active) moved += Math.abs(dx) + Math.abs(dy);
    },
    up(): boolean {
      const click = active && moved < thresholdPx;
      active = false;
      return click;
    },
    cancel() {
      active = false;
    },
  };
}
