const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// "2026-08-31" -> "31 Aug 2026"; anything else is returned unchanged
export const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return Number.isFinite(y) && m && d && m <= 12 ? `${d} ${MON[m - 1]} ${y}` : iso;
};
