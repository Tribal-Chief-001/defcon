// "5 min ago", "3 h ago", "2 d ago" for a Unix-seconds time, never negative.
export const ago = (nowS: number, t: number) => {
  const m = Math.max(0, Math.round((nowS - t) / 60));
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 48 ? `${h} h ago` : `${Math.round(h / 24)} d ago`;
};
