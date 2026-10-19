// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { sonar } from '../../src/sound/sonar';
import { useSound } from '../../src/sound/store';
import { SoundToggle } from '../../src/ui/SoundToggle';

let ctor: ReturnType<typeof vi.fn>;
beforeEach(() => {
  sonar.dispose();
  localStorage.clear();
  useSound.setState({ enabled: false, remembered: false });
  ctor = vi.fn(function (this: Record<string, unknown>) {
    Object.assign(this, { state: 'running', currentTime: 0, destination: {}, resume: async () => {}, close: async () => {}, createGain: () => ({}), createOscillator: () => ({}) });
  });
  vi.stubGlobal('AudioContext', ctor);
  vi.spyOn(sonar, 'ping').mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('SoundToggle: a click must be audible (finding: no sound came out until an event arrived)', () => {
  it('plays one soft confirmation ping when it is switched on, and none when it is switched off', () => {
    render(<SoundToggle />);
    fireEvent.click(screen.getByRole('button', { name: /sound/i }));
    expect(sonar.ping).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: /sound/i }));
    expect(sonar.ping).toHaveBeenCalledTimes(1);
  });
  it('says what will make a sound, in its title', () => {
    render(<SoundToggle />);
    expect(screen.getByRole('button', { name: /sound/i }).getAttribute('title')).toMatch(/new events.*Play.*Night Watch/i);
  });
});

describe('SoundToggle', () => {
  it('is off by default and builds no audio context on mount', () => {
    render(<SoundToggle />);
    const b = screen.getByRole('button', { name: /sound/i });
    expect(b.getAttribute('aria-pressed')).toBe('false');
    expect(b.textContent).toMatch(/off/i);
    expect(ctor).not.toHaveBeenCalled();
  });
  it('creates the audio context only on click, flips to on, and remembers the choice', () => {
    render(<SoundToggle />);
    fireEvent.click(screen.getByRole('button', { name: /sound/i }));
    expect(ctor).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: /sound/i }).getAttribute('aria-pressed')).toBe('true');
    expect(localStorage.getItem('defcon.sound')).toBe('1');
    fireEvent.click(screen.getByRole('button', { name: /sound/i }));
    expect(screen.getByRole('button', { name: /sound/i }).getAttribute('aria-pressed')).toBe('false');
    expect(localStorage.getItem('defcon.sound')).toBe('0');
  });
  it('a remembered "on" starts off with a tap-to-enable hint and builds no audio on mount', () => {
    localStorage.setItem('defcon.sound', '1');
    render(<SoundToggle />);
    const b = screen.getByRole('button', { name: /sound/i });
    expect(b.getAttribute('aria-pressed')).toBe('false');
    expect(b.textContent).toMatch(/tap to enable/i);
    expect(ctor).not.toHaveBeenCalled();
  });
  it('still renders and toggles when localStorage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    render(<SoundToggle />);
    fireEvent.click(screen.getByRole('button', { name: /sound/i }));
    expect(screen.getByRole('button', { name: /sound/i }).getAttribute('aria-pressed')).toBe('true');
    vi.restoreAllMocks();
  });
});
