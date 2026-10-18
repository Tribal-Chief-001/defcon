import { create } from 'zustand';

export const MAX_BACK_S = 365 * 86400; // the archive covers 365 days

// Time travel: `backS` is how far before "now" the playhead sits (0 = live). The event layer, grain, terminator, scrubber and sound read it.
type State = { backS: number; playing: boolean; setBack(s: number): void; setPlaying(p: boolean): void; goLive(): void };

export const useTime = create<State>((set) => ({
  backS: 0,
  playing: false,
  setBack: (s) => Number.isFinite(s) && set({ backS: Math.max(0, Math.min(MAX_BACK_S, s)) }),
  setPlaying: (playing) => set({ playing }),
  goLive: () => set({ backS: 0, playing: false }),
}));

export const playheadS = (nowS: number, backS: number): number => nowS - backS;

// `ageS` is the event's age now; it is visible when the playhead is not before it.
export const visibleAt = (ageS: number, backS: number): boolean => Number.isFinite(ageS) && ageS - backS >= 0;
