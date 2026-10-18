// First in the tab order: jumps past the top bar to the globe. A button (not a #hash link, which the deep-link code would read).
export function SkipLink() {
  return (
    <button
      type="button"
      onClick={() => document.getElementById('globe-canvas')?.focus()}
      className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-full focus:border focus:border-[var(--lime)] focus:bg-black focus:px-4 focus:py-2 focus:font-[var(--font-mono)] focus:text-[12px] focus:uppercase focus:tracking-[0.15em] focus:text-[var(--lime)]"
    >
      Skip to the globe
    </button>
  );
}
