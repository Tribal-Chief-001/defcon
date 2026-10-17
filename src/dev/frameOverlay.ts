import { createFrameStats } from './frameStats';

// Dev-only readout, hidden until the backtick key is pressed. Returns the per-frame tick function.
export function installFrameOverlay(): (nowMs: number) => void {
  const stats = createFrameStats(120);
  const el = document.createElement('div');
  el.setAttribute('data-frame-overlay', '');
  Object.assign(el.style, {
    display: 'none',
    position: 'fixed',
    right: '16px',
    bottom: '16px',
    padding: '6px 10px',
    border: '1px solid rgba(255,255,255,.15)',
    borderRadius: '100px',
    font: '10px "JetBrains Mono", monospace',
    letterSpacing: '.15em',
    textTransform: 'uppercase',
    color: '#D6FF57',
    background: 'rgba(0,0,0,.6)',
    pointerEvents: 'none',
    zIndex: '50',
  });
  document.body.appendChild(el);
  window.addEventListener('keydown', (e) => {
    if (e.key === '`') el.style.display = el.style.display === 'none' ? 'block' : 'none';
  });
  let lastPaint = -Infinity;
  return (now) => {
    stats.tick(now);
    if (el.style.display === 'none' || now - lastPaint < 500) return;
    lastPaint = now;
    el.textContent = `${stats.fps().toFixed(0)} fps // p95 ${stats.p95FrameMs().toFixed(1)} ms`;
  };
}
