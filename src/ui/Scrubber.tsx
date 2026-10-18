import { useEffect } from 'react';
import { useEvents } from '../events/store';
import { prefersReducedMotion } from '../lib/motion';
import { MAX_BACK_S, useTime } from '../time/store';

const DAY = 86400;
const PLAY_RATE = 43_200; // seconds of data per real second: a week in 14 s

const utcDate = (s: number) => new Date(s * 1000).toISOString().slice(0, 10);

// Time travel: drag back to see the world as of an earlier day, Play to replay forward, LIVE to return. Native range input, so it
// works by keyboard and screen reader. Real data only: it filters what exists at the playhead, nothing is invented.
export function Scrubber() {
  const { recent, archive } = useEvents();
  const { backS, playing, setBack, setPlaying, goLive } = useTime();
  const oldest = archive?.meta.windowFromS ?? recent?.meta.windowFromS;
  const reduced = prefersReducedMotion();

  useEffect(() => {
    if (!playing) return;
    if (reduced) return setPlaying(false);
    let raf = 0;
    let prev = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - prev) / 1000);
      prev = now;
      const next = useTime.getState().backS - dt * PLAY_RATE;
      if (next <= 0) return goLive();
      setBack(next);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPlaying(false);
    window.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
    };
  }, [playing, reduced, setBack, setPlaying, goLive]);

  if (oldest === undefined || !Number.isFinite(oldest)) return null;
  const nowS = Math.floor(Date.now() / 1000);
  const days = Math.max(1, Math.min(MAX_BACK_S / DAY, Math.floor((nowS - oldest) / DAY)));
  const back = Math.min(days, Math.round(backS / DAY));
  const live = backS === 0;
  const text = live ? 'LIVE' : `${back} ${back === 1 ? 'day' : 'days'} before now, ${utcDate(nowS - backS)} UTC`;
  const btn = 'rounded-full border border-[var(--border-strong)] px-3 py-1 hover:text-[var(--lime)] disabled:opacity-40 disabled:hover:text-inherit';

  return (
    <div
      role="group"
      aria-label="Time travel controls"
      className="pointer-events-auto absolute bottom-[calc(1rem+var(--safe-bottom))] left-1/2 z-20 flex w-[min(560px,92vw)] -translate-x-1/2 items-center gap-3 rounded-full border border-[var(--border)] bg-black/50 px-4 py-2 font-[var(--font-mono)] text-[10px] uppercase tracking-[0.15em] text-[var(--text-muted)] backdrop-blur-md"
    >
      <button type="button" className={btn} disabled={reduced} title={reduced ? 'Playback is off under reduced motion' : undefined} onClick={() => (playing ? setPlaying(false) : (backS === 0 && setBack(7 * DAY), setPlaying(true)))}>
        {playing ? 'Pause' : 'Play'}
      </button>
      <input
        type="range"
        aria-label="Time travel"
        aria-valuetext={text}
        min={0}
        max={days}
        step={1}
        value={days - back}
        onChange={(e) => {
          setPlaying(false);
          setBack((days - Number(e.target.value)) * DAY);
        }}
        className="h-1 min-w-0 flex-1 accent-[var(--lime)]"
      />
      <span className={`w-24 text-right ${live ? 'text-[var(--lime)]' : ''}`}>{live ? 'LIVE' : `T-${back} d`}</span>
      <button type="button" className={btn} onClick={goLive} disabled={live}>
        Live
      </button>
    </div>
  );
}
