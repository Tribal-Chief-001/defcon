// A tiny in-memory error log for diagnostics. It never leaves the browser (no network), keeps the last 20 entries, truncates messages
// and strips query strings and fragments from URLs so it cannot carry tokens or event text. Shown in About, copyable by the user.
export type ErrorEntry = { at: number; where: string; message: string };

const MAX = 20;
let entries: ErrorEntry[] = [];

const clean = (e: unknown): string => {
  const raw = e instanceof Error ? e.message : typeof e === 'string' ? e : e === null || e === undefined ? String(e) : 'non-error value';
  return raw.replace(/(https?:\/\/[^\s?#]+)[?#]\S*/g, '$1').slice(0, 200);
};

export const errorLog = {
  record(e: unknown, where: string) {
    entries = [...entries, { at: Date.now(), where: String(where).slice(0, 40), message: clean(e) }].slice(-MAX);
  },
  entries: (): ErrorEntry[] => entries,
  clear() {
    entries = [];
  },
  format(): string {
    if (!entries.length) return 'no errors recorded in this session';
    return entries.map((x) => `${new Date(x.at).toISOString()} ${x.where}: ${x.message}`).join('\n');
  },
};

let installed = false;
export function installGlobalHandlers() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  window.addEventListener('error', (e) => errorLog.record(e.error ?? e.message, 'window'));
  window.addEventListener('unhandledrejection', (e) => errorLog.record((e as PromiseRejectionEvent).reason, 'promise'));
}
