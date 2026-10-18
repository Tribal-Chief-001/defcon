import { create } from 'zustand';

const KEY = 'defcon.sound';
const read = (): boolean => {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
};
export const saveSound = (on: boolean) => {
  try {
    localStorage.setItem(KEY, on ? '1' : '0');
  } catch {
    /* storage blocked: the choice just is not remembered */
  }
};

// `enabled` is only ever true after a click this session; `remembered` is the stored preference, which cannot switch audio on by itself
// because browsers block audio before a gesture.
export const useSound = create<{ enabled: boolean; remembered: boolean; setEnabled(on: boolean): void; hydrate(): void }>((set) => ({
  enabled: false,
  remembered: false,
  hydrate: () => set({ remembered: read() }),
  setEnabled: (enabled) => set({ enabled, remembered: enabled }),
}));
