// World Sound: a soft sonar ping per event. Pitch rises with severity, stereo pan follows longitude. Everything here is quiet by design
// (gain below 0.15) and rate limited; the audio context is only created from a user gesture (see SoundToggle).
const A3 = 220;
const LADDER = [0, 4, 7, 12, 16]; // semitones above A3 for severity 1..5: an A major arpeggio, clearly rising

export function pingParams(severity: number, lon: number): { freq: number; pan: number; gain: number } {
  const sev = Number.isFinite(severity) ? Math.max(1, Math.min(5, Math.round(severity))) : 1;
  const pan = Number.isFinite(lon) ? Math.max(-1, Math.min(1, lon / 180)) : 0;
  return { freq: A3 * 2 ** (LADDER[sev - 1]! / 12), pan, gain: 0.04 + (sev - 1) * 0.02 };
}

// true when one more ping fits in the sliding one-second window
export function createPingLimiter(maxPerSecond = 6, now: () => number = () => performance.now()): () => boolean {
  let stamps: number[] = [];
  return () => {
    const t = now();
    stamps = stamps.filter((s) => t - s < 1000);
    if (stamps.length >= maxPerSecond) return false;
    stamps.push(t);
    return true;
  };
}

type Node = { connect(n: unknown): unknown; disconnect(): void };
export type AudioContextLike = {
  currentTime: number;
  state: string;
  destination: unknown;
  createOscillator(): Node & { type: string; frequency: { value: number }; start(t: number): void; stop(t: number): void; onended: (() => void) | null };
  createGain(): Node & { gain: { value: number; setValueAtTime(v: number, t: number): void; linearRampToValueAtTime(v: number, t: number): void; exponentialRampToValueAtTime(v: number, t: number): void } };
  createStereoPanner?: () => Node & { pan: { value: number } };
  resume?: () => Promise<void>;
  close?: () => Promise<void>;
};

export function createSonar(ctxFactory: () => AudioContextLike) {
  let ctx: AudioContextLike | null = null;
  const context = () => {
    if (ctx) return ctx;
    try {
      ctx = ctxFactory();
    } catch {
      ctx = null; // no Web Audio: stay silent
    }
    return ctx;
  };
  const wake = (c: AudioContextLike) => {
    if (c.state === 'suspended') void c.resume?.().catch?.(() => undefined);
  };
  return {
    // call from a user gesture: creates (and resumes) the context so later pings are allowed to sound
    unlock() {
      const c = context();
      if (c) wake(c);
    },
    ping(severity: number, lon: number) {
      const c = context();
      if (!c) return;
      wake(c);
      const { freq, pan, gain } = pingParams(severity, lon);
      const t = c.currentTime;
      const osc = c.createOscillator();
      const amp = c.createGain();
      const panner = c.createStereoPanner?.();
      osc.type = 'sine';
      osc.frequency.value = freq;
      amp.gain.setValueAtTime(0.0001, t);
      amp.gain.linearRampToValueAtTime(gain, t + 0.01);
      amp.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
      osc.connect(amp);
      if (panner) {
        panner.pan.value = pan;
        amp.connect(panner);
        panner.connect(c.destination);
      } else amp.connect(c.destination);
      osc.onended = () => [osc, amp, panner].forEach((n) => n?.disconnect());
      osc.start(t);
      osc.stop(t + 0.5);
    },
    suspend() {
      void (ctx as (AudioContextLike & { suspend?: () => Promise<void> }) | null)?.suspend?.();
    },
    dispose() {
      void ctx?.close?.();
      ctx = null;
    },
  };
}

export const sonar = createSonar(() => new (window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)() as unknown as AudioContextLike);
export const allowPing = createPingLimiter(6);
