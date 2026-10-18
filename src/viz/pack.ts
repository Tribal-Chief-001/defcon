export type Bubble = { id: string; x: number; y: number; r: number };

// Packs circles whose AREA is proportional to the value (radius to the square root) into a w x h box without overlap: the biggest in the
// middle, the others spiralling outwards. Deterministic; shrinks everything until it fits. Items without a positive value are not drawn.
export function packCircles(items: { id: string; value: number }[], w: number, h: number): Bubble[] {
  const live = items.filter((i) => Number.isFinite(i.value) && i.value > 0).sort((a, b) => b.value - a.value || a.id.localeCompare(b.id));
  if (live.length === 0 || !(w > 0) || !(h > 0)) return [];
  const sum = live.reduce((s, i) => s + i.value, 0);
  let k = Math.sqrt((w * h * 0.5) / (Math.PI * sum));
  k = Math.min(k, (Math.min(w, h) / 2 - 1) / Math.sqrt(live[0]!.value));
  const GAP = 2;
  const place = (kk: number): Bubble[] | null => {
    const out: Bubble[] = [];
    for (const it of live) {
      const r = kk * Math.sqrt(it.value);
      let spot: Bubble | null = null;
      for (let t = 0; t < 400 && !spot; t += 0.08) {
        const x = w / 2 + 1.6 * t * Math.cos(t);
        const y = h / 2 + 1.6 * t * Math.sin(t);
        if (x - r < 0 || x + r > w || y - r < 0 || y + r > h) continue;
        if (out.every((o) => Math.hypot(o.x - x, o.y - y) >= o.r + r + GAP)) spot = { id: it.id, x, y, r };
      }
      if (!spot) return null;
      out.push(spot);
    }
    return out;
  };
  for (let attempt = 0; attempt < 60; attempt++) {
    const placed = place(k);
    if (placed) return placed;
    k *= 0.93;
  }
  return [];
}
