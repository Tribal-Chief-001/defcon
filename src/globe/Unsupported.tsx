const COPY = {
  webgl2: {
    label: 'WebGL2 required',
    title: 'Globe offline.',
    body: 'This browser or graphics driver cannot run WebGL2, which the globe needs. Try a current Chrome, Edge, Firefox or Safari, and make sure hardware acceleration is on.',
  },
  failed: {
    label: 'Startup failed',
    title: 'Globe failed to start.',
    body: 'Something went wrong while starting the globe (the graphics driver or the map data download). Reload the page; if it keeps happening, try another browser.',
  },
} as const;

export function Unsupported({ reason = 'webgl2' }: { reason?: keyof typeof COPY }) {
  const c = COPY[reason];
  return (
    <div className="flex h-full w-full flex-col items-start justify-end gap-3 p-[4vw]">
      <p className="font-[var(--font-mono)] text-[11px] uppercase tracking-[0.18em] text-[var(--orange)]">{c.label}</p>
      <h1 className="font-[var(--font-display)] text-5xl font-extrabold leading-[0.9] tracking-tight">{c.title}</h1>
      <p className="max-w-[48ch] text-base text-[var(--text-muted)]">{c.body}</p>
    </div>
  );
}
