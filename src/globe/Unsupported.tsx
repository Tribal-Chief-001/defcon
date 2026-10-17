export function Unsupported() {
  return (
    <div className="flex h-full w-full flex-col items-start justify-end gap-3 p-[4vw]">
      <p className="font-[var(--font-mono)] text-[11px] uppercase tracking-[0.18em] text-[var(--orange)]">WebGL2 required</p>
      <h1 className="font-[var(--font-display)] text-5xl font-extrabold leading-[0.9] tracking-tight">Globe offline.</h1>
      <p className="max-w-[48ch] text-base text-[var(--text-muted)]">
        This browser or graphics driver cannot run WebGL2, which the globe needs. Try a current Chrome, Edge, Firefox or Safari, and make sure hardware acceleration is on.
      </p>
    </div>
  );
}
