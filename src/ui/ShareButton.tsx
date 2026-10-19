import { announce } from './status';

// Copies a link to what is on screen (the link is built when clicked, so it carries the current country, conflict and playhead).
// Falls back to the system share sheet, then to asking the person to copy the address bar.
export function ShareButton({ url }: { url: () => string }) {
  return (
    <button
      type="button"
      aria-label="Share this view"
      onClick={() => {
        const link = url();
        void (async () => {
          try {
            await navigator.clipboard.writeText(link);
            announce('Link copied');
          } catch {
            try {
              if (typeof navigator.share !== 'function') throw new Error('no share');
              await navigator.share({ url: link });
            } catch {
              announce('Could not copy: copy the address from the address bar');
            }
          }
        })();
      }}
      className="rounded-full border border-[var(--border-strong)] bg-black/40 px-3 py-1.5 font-[var(--font-mono)] text-[11.5px] uppercase tracking-[0.15em] text-[var(--text-muted)] backdrop-blur-md hover:text-[var(--lime)]"
    >
      Share
    </button>
  );
}
