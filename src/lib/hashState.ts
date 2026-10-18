// Deep links: `#c=IND` opens the Country Dive for India, `#about` opens the About page. Only a plain 3-character id is accepted (it ends
// up in a file name).
const RE = /^#c=([A-Za-z0-9]{3})$/;
export const parseHash = (h: string): { country: string | null; about?: true } =>
  h === '#about' ? { country: null, about: true } : { country: RE.exec(h)?.[1]?.toUpperCase() ?? null };
export const formatHash = (id: string | null, about = false): string =>
  about ? '#about' : id && /^[A-Za-z0-9]{3}$/.test(id) ? `#c=${id.toUpperCase()}` : '';
