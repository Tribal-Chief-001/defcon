import { useEffect, useState } from 'react';
import { loadDisplacement } from '../displacement/load';
import type { DisplacementFile } from '../displacement/types';

const int = (n: number) => n.toLocaleString('en-US');
const METHOD = 'https://www.unhcr.org/refugee-statistics/methodology/';
const link = 'underline decoration-[var(--border-strong)] underline-offset-2 hover:text-[var(--lime)]';

function Row({ name, v }: { name: string; v: number | null | undefined }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-[var(--text-muted)]">{name}</dt>
      <dd className="font-[var(--font-mono)]">{v === null || v === undefined ? <span className="text-[var(--text-faint)]">not reported</span> : int(v)}</dd>
    </div>
  );
}

// The human-cost layer of a country dossier: UNHCR displacement figures of the latest year (people who fled the country, people displaced
// inside it, people it hosts). Figures UNHCR does not report say "not reported", never 0. These are not conflict deaths and have many causes.
// Credit as UNHCR asks: "UNHCR Refugee Population Statistics Database", with a link to its Terms of Use for Datasets.
export function DisplacementBlock({ iso3 }: { iso3: string | null }) {
  const [file, setFile] = useState<DisplacementFile | null | undefined>(undefined);
  useEffect(() => {
    let live = true;
    void loadDisplacement().then((f) => live && setFile(f));
    return () => {
      live = false;
    };
  }, []);
  if (!iso3 || !file) return null;
  const c = file.countries[iso3.toUpperCase()];
  return (
    <section role="region" aria-label="Displacement" className="mt-5 border-t border-[var(--border)] pt-4">
      <h3 className="font-[var(--font-mono)] text-[11.5px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Displacement (UNHCR, {file.year})</h3>
      {!c ? (
        <p className="mt-2 text-[13px] text-[var(--text-muted)]">There are no UNHCR figures for this country in {file.year}.</p>
      ) : (
        <dl className="mt-2 space-y-1 text-[13px]">
          {c.from ? (
            <>
              <Row name="Refugees from this country" v={c.from.refugees} />
              <Row name="Asylum-seekers from this country" v={c.from.asylumSeekers} />
              <Row name="Displaced inside the country" v={c.from.idps} />
            </>
          ) : null}
          {c.hosted ? <Row name="Refugees hosted here" v={c.hosted.refugees} /> : null}
          {c.hosted ? <Row name="Asylum-seekers hosted here" v={c.hosted.asylumSeekers} /> : null}
        </dl>
      )}
      <p className="mt-3 text-[12px] leading-relaxed text-[var(--text-muted)]">
        People, not conflict deaths: displacement has many causes. Source: {file.source} ({file.licence}),{' '}
        <a href={file.termsUrl} target="_blank" rel="noopener noreferrer" className={link}>
          terms of use for datasets
        </a>
        ,{' '}
        <a href={METHOD} target="_blank" rel="noopener noreferrer" className={link}>
          what each figure includes
        </a>
        .
      </p>
    </section>
  );
}
