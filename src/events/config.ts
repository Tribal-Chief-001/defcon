const DEFAULT = '/data/events';

// Where the event snapshot is served from (VITE_EVENTS_BASE at build time). Only a same-origin absolute path or an https URL is
// accepted; anything else (http, javascript:, protocol-relative, relative, whitespace, "..") falls back to the default and never throws.
export function eventsBase(raw: string | undefined): string {
  if (!raw) return DEFAULT;
  // whitespace, control characters, ".." and backslashes (browsers read "/\\host" as "//host") are never valid
  if (/[\s\u0000-\u001f\\]/.test(raw) || raw.includes('..') || /[?#]/.test(raw)) return DEFAULT;
  const trimmed = raw.replace(/\/+$/, '');
  if (/^\/(?!\/)[^?#]*$/.test(trimmed) && trimmed.length > 1) return trimmed;
  try {
    const u = new URL(trimmed);
    if (u.protocol === 'https:' && u.hostname.length > 0 && !u.username && !u.password && !u.search && !u.hash && /^https:\/\/[^/]+/.test(trimmed)) return trimmed;
  } catch {
    /* not a URL */
  }
  return DEFAULT;
}
