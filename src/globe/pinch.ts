// Two-finger pinch zoom: tracks the pointers that are down and reports the ratio of the finger distance to the previous event.
export function createPinch() {
  const pts = new Map<number, { x: number; y: number }>();
  const dist = () => {
    const [a, b] = [...pts.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  };
  return {
    down(id: number, x: number, y: number) {
      pts.set(id, { x, y });
    },
    up(id: number) {
      pts.delete(id);
    },
    active: () => pts.size >= 2,
    // the scale since the last call, clamped to 0.5..2, or null when fewer than two fingers are down or the distance is zero
    move(id: number, x: number, y: number): { scale: number } | null {
      const p = pts.get(id);
      if (!p) return null;
      const before = dist();
      p.x = x;
      p.y = y;
      if (pts.size < 2) return null;
      const after = dist();
      if (!(before > 0) || !(after > 0)) return null;
      return { scale: Math.max(0.5, Math.min(2, after / before)) };
    },
  };
}
