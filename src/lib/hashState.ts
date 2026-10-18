// Deep links: `#c=IND` opens the Country Dive for India. Only a plain 3-character id is accepted (it ends up in a file name).
const RE = /^#c=([A-Za-z0-9]{3})$/;
export const parseHash = (h: string): { country: string | null } => ({ country: RE.exec(h)?.[1]?.toUpperCase() ?? null });
export const formatHash = (id: string | null): string => (id && /^[A-Za-z0-9]{3}$/.test(id) ? `#c=${id.toUpperCase()}` : '');
