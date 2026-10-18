// Decorative HUD furniture: four hairline corner ticks and a huge outline "DEFCON" word (the faint wordmark from the design brief) that
// sits at the bottom edge behind the interface. aria-hidden, no pointer events; hidden on phones, where the globe stays clean.
const tick = 'absolute h-[18px] w-[18px] border-[var(--border-strong)]';

export function HudFrame() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[1] hidden overflow-hidden sm:block">
      <span data-tick className={`${tick} left-2 top-[4.9rem] border-l border-t`} />
      <span data-tick className={`${tick} right-2 top-[4.9rem] border-r border-t`} />
      <span data-tick className={`${tick} bottom-2 left-2 border-b border-l`} />
      <span data-tick className={`${tick} bottom-2 right-2 border-b border-r`} />
      <span
        data-word
        className="absolute bottom-[-0.16em] left-1/2 -translate-x-1/2 select-none whitespace-nowrap font-[var(--font-display)] text-[21vw] font-extrabold leading-none tracking-tight text-transparent [-webkit-text-stroke:1px_rgba(237,237,233,0.07)]"
      >
        DEFCON
      </span>
    </div>
  );
}
