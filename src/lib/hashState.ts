// Deep links: `#c=IND` opens the Country Dive for India, `#about` opens the About page, `#war` the War tracker (`#war=<conflict id>` one
// conflict). `&t=<unix seconds>` after any of them (or alone: `#t=...`) puts the time-travel playhead at that moment, so a link shows what
// the sender saw. Only a plain 3-character country id (it ends up in a file name), a lowercase conflict slug and 9 to 11 digits for the
// moment are accepted; anything else makes the whole link invalid.
const RE = /^#c=([A-Za-z0-9]{3})$/;
const WAR = /^#war(?:=([a-z0-9-]{1,60}))?$/;
const MOMENT = /^([\s\S]*?)(?:&t=(\d{9,11}))?$/; // [\s\S], not `.`: a line break must not make the match fail
const MAX_T = 4_102_444_800; // 2100-01-01
export type Hash = { country: string | null; about?: true; war?: string; t?: number };

const parseMain = (h: string): Omit<Hash, 't'> | null => {
  if (h === '#about') return { country: null, about: true };
  const w = WAR.exec(h);
  if (w) return { country: null, war: w[1] ?? '' };
  const c = RE.exec(h)?.[1];
  return c ? { country: c.toUpperCase() } : null;
};

export const parseHash = (h: string): Hash => {
  const alone = /^#t=(\d{9,11})$/.exec(h); // a moment on its own
  if (alone) return Number(alone[1]) > MAX_T ? { country: null } : { country: null, t: Number(alone[1]) };
  const m = MOMENT.exec(h)!;
  const t = m[2] !== undefined ? Number(m[2]) : undefined;
  const main = t !== undefined && t > MAX_T ? null : parseMain(m[1]!);
  if (!main) return { country: null };
  return t === undefined ? main : { ...main, t };
};

// priority: about, then war (null = closed, '' = the list), then a country; an optional moment is appended
export const formatHash = (id: string | null, about = false, war: string | null = null, t?: number): string => {
  const main = about ? '#about' : war !== null ? (/^[a-z0-9-]{1,60}$/.test(war) ? `#war=${war}` : '#war') : id && /^[A-Za-z0-9]{3}$/.test(id) ? `#c=${id.toUpperCase()}` : '';
  const moment = t !== undefined && Number.isFinite(t) && t >= 100_000_000 && t <= MAX_T ? Math.floor(t) : null;
  return moment === null ? main : main ? `${main}&t=${moment}` : `#t=${moment}`;
};
