import { create } from 'zustand';
import type { Snapshot } from './snapshot';

type State = {
  recent?: Snapshot;
  archive?: Snapshot;
  status: 'idle' | 'loading' | 'ready' | 'error';
  error?: string;
  archiveError?: string;
  setRecent(s: Snapshot): void;
  setArchive(s: Snapshot): void;
  fail(reason: string): void;
  failArchive(reason: string): void;
  clearError(): void;
};

// Snapshots are replaced as whole objects; a failure never discards the last good data.
export const useEvents = create<State>((set) => ({
  status: 'idle',
  setRecent: (recent) => set({ recent, status: 'ready', error: undefined }),
  setArchive: (archive) => set((s) => ({ archive, archiveError: undefined, status: s.status === 'idle' ? 'ready' : s.status })),
  fail: (error) => set({ error, status: 'error' }),
  failArchive: (archiveError) => set({ archiveError }),
  clearError: () => set((s) => ({ error: undefined, status: s.recent || s.archive ? 'ready' : s.status })),
}));
