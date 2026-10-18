import { useEffect, useState } from 'react';
import { prefersReducedMotion } from '../lib/motion';

const CPS = 30; // typed characters per second

// Letterbox bars and a typewriter caption for Night Watch. Decorative layer: the whole caption is announced once from an sr-only live region and the typed copy is aria-hidden, the bars take
// no pointer events. Under reduced motion the bars appear without sliding and the whole caption shows at once.
export function NightWatch({ active, caption }: { active: boolean; caption: string }) {
  const reduced = prefersReducedMotion();
  const [typed, setTyped] = useState(reduced ? caption : '');

  useEffect(() => {
    if (reduced) return setTyped(caption);
    setTyped('');
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setTyped(caption.slice(0, i));
      if (i >= caption.length) window.clearInterval(id);
    }, 1000 / CPS);
    return () => window.clearInterval(id);
  }, [caption, reduced]);

  if (!active) return null;
  const slide = (name: string) => (reduced ? undefined : { animation: `${name} 800ms cubic-bezier(0.16, 1, 0.3, 1) both` });
  return (
    <>
      <div data-letterbox className="pointer-events-none fixed inset-x-0 top-0 z-30 h-[12vh] bg-black" style={slide('letterbox-top')} />
      <div data-letterbox className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex h-[12vh] items-center justify-center bg-black px-[4vw]" style={slide('letterbox-bottom')}>
        <span className="sr-only" aria-live="polite">
          {caption}
        </span>
        <p data-typed aria-hidden="true" className="font-[var(--font-mono)] text-[12px] uppercase tracking-[0.2em] text-[var(--cyan)]">
          {typed}
        </p>
      </div>
    </>
  );
}
