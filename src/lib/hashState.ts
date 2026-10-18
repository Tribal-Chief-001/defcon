// Deep links: `#c=IND` opens the Country Dive for India, `#about` opens the About page, `#war` the War tracker (`#war=<conflict id>` one
// conflict). Only a plain 3-character country id (it ends up in a file name) and a lowercase conflict slug are accepted.
const RE = /^#c=([A-Za-z0-9]{3})$/;
const WAR = /^#war(?:=([a-z0-9-]{1,60}))?$/;
export const parseHash = (h: string): { country: string | null; about?: true; war?: string } => {
  if (h === '#about') return { country: null, about: true };
  const w = WAR.exec(h);
  if (w) return { country: null, war: w[1] ?? '' };
  return { country: RE.exec(h)?.[1]?.toUpperCase() ?? null };
};
// priority: about, then war (null = closed, '' = the list), then a country
export const formatHash = (id: string | null, about = false, war: string | null = null): string =>
  about ? '#about' : war !== null ? (/^[a-z0-9-]{1,60}$/.test(war) ? `#war=${war}` : '#war') : id && /^[A-Za-z0-9]{3}$/.test(id) ? `#c=${id.toUpperCase()}` : '';
