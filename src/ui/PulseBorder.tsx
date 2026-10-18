import { useEffect, useMemo, useRef } from 'react';
import { tension } from '../events/tension';
import { useEvents } from '../events/store';
import { prefersReducedMotion } from '../lib/motion';
import { pulseColor, pulsePeriodMs, spikesFor } from './pulse';

const H = 7; // css px

// The world's pulse: a 1 px baseline along the bottom of the top bar. A blip sweeps across at a rhythm set by the event rate, new
// events add taller spikes, and the colour moves lime to orange with the (comparable) tension index. Static under reduced motion.
export function PulseBorder() {
  const recent = useEvents((s) => s.recent);
  const canvas = useRef<HTMLCanvasElement>(null);
  const prev = useRef(recent);
  const spikes = useRef<{ at: number; x: number }[]>([]);
  const reduced = prefersReducedMotion();

  const { color, period } = useMemo(() => {
    if (!recent) return { color: pulseColor(1, false), period: 4000 };
    const nowS = Math.floor(Date.now() / 1000);
    const t = tension(recent, nowS);
    let last24 = 0;
    for (let i = 0; i < recent.n; i++) if (recent.timeS[i]! >= nowS - 86400) last24++;
    return { color: pulseColor(t.level, t.comparable), period: pulsePeriodMs(last24 / 24) };
  }, [recent]);

  useEffect(() => {
    if (recent) {
      const n = spikesFor(prev.current, recent);
      for (let i = 0; i < n; i++) spikes.current.push({ at: performance.now() + i * 120, x: Math.random() });
      prev.current = recent;
    }
  }, [recent]);

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext?.('2d');
    if (!el || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0;
    const draw = (now: number) => {
      const w = el.clientWidth || 1;
      if (el.width !== Math.round(w * dpr)) (el.width = Math.round(w * dpr)), (el.height = Math.round(H * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, H);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      const base = H - 0.5;
      ctx.moveTo(0, base);
      // the heartbeat blip travels left to right once per period; a spike is a short, taller blip at a random place that fades in 1.2 s
      const blips: { x: number; h: number }[] = [];
      if (!reduced) {
        blips.push({ x: ((now % period) / period) * w, h: 3 });
        spikes.current = spikes.current.filter((s) => now - s.at < 1200);
        for (const s of spikes.current) if (now >= s.at) blips.push({ x: s.x * w, h: H - 1 - ((now - s.at) / 1200) * 3 });
      }
      blips.sort((a, b) => a.x - b.x);
      for (const b of blips) {
        ctx.lineTo(b.x - 10, base);
        ctx.lineTo(b.x - 3, base - b.h * 0.4);
        ctx.lineTo(b.x, base - b.h);
        ctx.lineTo(b.x + 3, base + 0.5);
        ctx.lineTo(b.x + 10, base);
      }
      ctx.lineTo(w, base);
      ctx.stroke();
      if (!reduced && !document.hidden) raf = requestAnimationFrame(draw);
    };
    if (reduced) draw(0);
    else raf = requestAnimationFrame(draw);
    const onVis = () => !reduced && !document.hidden && (cancelAnimationFrame(raf), (raf = requestAnimationFrame(draw)));
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [color, period, reduced]);

  return <canvas ref={canvas} aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 block w-full" style={{ height: H }} />;
}
