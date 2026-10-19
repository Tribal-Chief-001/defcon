import { downloadText } from '../../exports/download';
import { announce } from '../status';

// "Download CSV": builds the file only when clicked (nothing is computed for people who never use it) and announces the result.
export function ExportButton({ label, filename, build }: { label: string; filename: string; build: () => string }) {
  return (
    <button
      type="button"
      aria-label={`Download CSV: ${label}`}
      onClick={() => {
        try {
          announce(downloadText(filename, build()) ? `Downloaded ${filename}` : 'Download is not available in this browser');
        } catch {
          announce('Could not build the file');
        }
      }}
      className="rounded-full border border-[var(--border-strong)] px-3 py-1 font-[var(--font-mono)] text-[11.5px] uppercase tracking-[0.12em] text-[var(--text-muted)] hover:text-[var(--lime)]"
    >
      Download CSV
    </button>
  );
}
