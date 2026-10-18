import { useEffect, useState } from 'react';
import { loadRelations } from '../relations/load';
import { relationsFor } from '../relations/lookup';
import type { Relations } from '../relations/types';

const label = 'font-[var(--font-mono)] text-[11px] uppercase tracking-[0.12em] text-[var(--text-faint)]';
const int = (n: number) => n.toLocaleString('en-US');

// Formal alliances and active disputes (sourced: see docs/DATA-SOURCES.md). "None on record" is a real answer, not missing data.
export function RelationsBlock({ countryId, names }: { countryId: string; names: Map<string, string> }) {
  const [rel, setRel] = useState<Relations | null | undefined>(undefined); // undefined = loading, null = failed
  useEffect(() => {
    let live = true;
    loadRelations().then((r) => live && setRel(r), () => live && setRel(null));
    return () => {
      live = false;
    };
  }, []);

  const name = (id: string) => names.get(id) ?? id;
  const r = rel ? relationsFor(rel, countryId) : null;
  const mine = rel ? rel.alliances.filter((a) => a.members.includes(countryId)) : [];
  const srcLink = (url: string, text: string) => (
    <a href={url} target="_blank" rel="noopener noreferrer" className="underline decoration-[var(--border-strong)] underline-offset-2 hover:text-[var(--lime)]">
      {text}
    </a>
  );
  const bar = (
    <span className="inline-block h-3 w-16 rounded-sm bg-[var(--text-muted)]/40 align-middle" role="img" aria-label="unavailable" title="unavailable">
      <span className="sr-only">unavailable</span>
    </span>
  );

  return (
    <div className="mt-5 border-t border-[var(--border)] pt-3">
      <p className="font-[var(--font-mono)] text-[11.5px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Relations</p>
      <div className="mt-2 grid grid-cols-[92px_1fr] gap-x-3 gap-y-2 text-[13px]">
        <span className={label}>Formal allies</span>
        <span className="font-[var(--font-mono)]">
          {rel === undefined ? 'loading' : rel === null ? bar : r!.allies.length === 0 ? <span className="text-[var(--text-faint)]">none on record</span> : (
            r!.allies.map((a, i) => (
              <span key={a.id}>
                {i > 0 ? ', ' : ''}
                {name(a.id)} <span className="text-[var(--text-muted)]">({a.via.join(', ')})</span>
              </span>
            ))
          )}
        </span>
        <span className={label}>Active disputes</span>
        <span className="font-[var(--font-mono)]">
          {rel === undefined ? 'loading' : rel === null ? bar : r!.disputes.length === 0 ? <span className="text-[var(--text-faint)]">none on record</span> : (
            r!.disputes.map((d) => (
              <span key={d.id} className="block">
                {name(d.id)} <span className="text-[var(--text-muted)]">({d.conflict}: {int(d.events)} events, last {d.lastYear})</span>
              </span>
            ))
          )}
        </span>
      </div>
      {rel ? (
        <p className="mt-2 font-[var(--font-mono)] text-[11px] uppercase leading-relaxed tracking-[0.1em] text-[var(--text-faint)]">
          Sources:{' '}
          {mine.map((a) => (
            <span key={a.id}>
              {srcLink(a.url, a.name)},{' '}
            </span>
          ))}
          {srcLink('https://ucdp.uu.se/downloads/', 'UCDP')} (state-based events between governments, at least 3 in the last two years)
          {mine.filter((a) => a.note).map((a) => (
            <span key={a.id} className="mt-1 block normal-case tracking-normal">
              {a.name}: {a.note}
            </span>
          ))}
        </p>
      ) : null}
    </div>
  );
}
