import { useEvents } from '../events/store';

const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const utcDate = (s: number) => {
  const d = new Date(s * 1000);
  return `${d.getUTCDate()} ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};

// What the dots mean and what the data does not cover: the viewer must never mistake a gap for calm.
export function Coverage() {
  const { recent, archive } = useEvents();
  const sources = (recent ?? archive)?.meta.sources;
  if (!sources) return null;
  const ucdp = sources.find((s) => s.id === 'ucdp');
  const gdelt = sources.find((s) => s.id === 'gdelt');
  const days = gdelt?.coverFromS !== undefined && Number.isFinite(gdelt.coverFromS) ? Math.max(1, Math.round((gdelt.asOfS - gdelt.coverFromS) / 86400)) : null;
  return (
    <div className="pointer-events-none absolute bottom-[4.5rem] right-[4vw] flex max-w-[min(300px,50vw)] flex-col items-end gap-1.5 text-right font-[var(--font-mono)] text-[10px] uppercase leading-snug tracking-[0.14em] text-[var(--text-muted)]">
      <span>
        <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[var(--orange)] align-middle" />
        Filled: human-coded{ucdp ? ` (UCDP), to ${utcDate(ucdp.asOfS)}` : ''}
      </span>
      <span>
        <span className="mr-1.5 inline-block h-2 w-2 rounded-full border border-[var(--orange)] align-middle" />
        Ring: auto-coded{gdelt ? ` (GDELT news)${days !== null ? `, last ${days} days` : ''}` : ''}
      </span>
      <span>Protests are auto-coded only</span>
    </div>
  );
}
