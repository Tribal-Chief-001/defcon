export type FocusView = { lat: number; lon: number; distance: number };

// A flight asked for before the sonar boot is done waits (a #war deep link asks for it on load). The newest request replaces an older
// waiting one, and a withdrawn request (null: the room closed before the boot ended) drops it, so no stale flight happens later.
export function createFocusQueue() {
  let pending: FocusView | null = null;
  const ok = (t: FocusView | null): t is FocusView => !!t && Number.isFinite(t.lat) && Number.isFinite(t.lon) && Number.isFinite(t.distance);
  return {
    // the view to fly to now, or null (queued, withdrawn or invalid)
    request(t: FocusView | null, bootDone: boolean): FocusView | null {
      pending = null;
      if (!ok(t)) return null;
      if (bootDone) return t;
      pending = t;
      return null;
    },
    // called every frame: the queued view once the boot is done
    take(bootDone: boolean): FocusView | null {
      if (!bootDone || !pending) return null;
      const p = pending;
      pending = null;
      return p;
    },
  };
}
