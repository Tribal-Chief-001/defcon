import { useEffect } from 'react';
import { sonar } from '../sound/sonar';
import { saveSound, useSound } from '../sound/store';

// One toggle, off by default, never autoplays: the audio context is created inside this click. A remembered "on" shows a tap-to-enable
// hint instead of starting sound, because browsers block audio before a gesture.
export function SoundToggle() {
  const { enabled, remembered, setEnabled, hydrate } = useSound();
  useEffect(hydrate, [hydrate]);
  const label = enabled ? 'Sound on' : remembered ? 'Sound: tap to enable' : 'Sound off';
  return (
    <button
      type="button"
      aria-pressed={enabled}
      onClick={() => {
        const on = !enabled;
        if (on) sonar.unlock();
        setEnabled(on);
        saveSound(on);
      }}
      className={`pointer-events-auto rounded-full border px-3 py-1 font-[var(--font-mono)] text-[11.5px] uppercase tracking-[0.15em] ${enabled ? 'border-[var(--lime)] text-[var(--lime)]' : 'border-[var(--border-strong)] text-[var(--text-muted)] hover:text-[var(--lime)]'}`}
    >
      {label}
    </button>
  );
}
