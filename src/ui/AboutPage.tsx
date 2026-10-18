import { useEffect, useRef, useState } from 'react';
import { useEvents } from '../events/store';
import { errorLog } from '../lib/errorLog';
import { MethodSection } from './MethodSection';

const utcDate = (s: number) => (Number.isFinite(s) ? new Date(s * 1000).toISOString().slice(0, 10) : 'unknown');
const isHttps = (u?: string) => !!u && /^https:\/\//i.test(u);

const STATIC_SOURCES: { name: string; use: string; licence: string; url: string }[] = [
  { name: 'Natural Earth (India point-of-view data)', use: 'borders, country names, capitals', licence: 'public domain', url: 'https://www.naturalearthdata.com/' },
  { name: 'World Bank, World Development Indicators', use: 'population, area, GDP, military spending (SIPRI via World Bank)', licence: 'CC BY 4.0', url: 'https://datatopics.worldbank.org/world-development-indicators/' },
  { name: 'CIA World Factbook (archived mirror)', use: 'government type, languages, independence, organisations; discontinued 2026-02-04, data of 2026-01-22', licence: 'public domain', url: 'https://github.com/factbook/factbook.json' },
  { name: 'United Nations and NATO official member lists', use: 'membership flags, formal alliances', licence: 'facts, linked', url: 'https://www.un.org/en/about-us/member-states' },
  { name: 'UCDP Georeferenced Event Dataset (state-based dyads)', use: 'active disputes between governments', licence: 'CC BY 4.0', url: 'https://ucdp.uu.se/downloads/' },
];

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

// About and Sources: what this is, the map policy, every data source with licence and age, what the data does not cover, privacy.
// A modal dialog: focus moves in, Tab stays inside, Esc closes and focus returns to the opener.
export function AboutPage({ onClose }: { onClose: () => void }) {
  const { recent, archive } = useEvents();
  const sources = (recent ?? archive)?.meta.sources ?? [];
  const box = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);
  const [copied, setCopied] = useState(false);
  const diagnostics = errorLog.format();

  // keys are handled on the window while the dialog is open: after a click on plain text focus falls back to the page, where an
  // onKeyDown on the box would never fire (Esc would do nothing and Tab would walk into the page behind the dialog)
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    opener.current = document.activeElement;
    box.current?.querySelector<HTMLElement>('button')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
      } else if (e.key === 'Tab' && box.current) {
        const f = Array.from(box.current.querySelectorAll<HTMLElement>(FOCUSABLE));
        if (!f.length) return;
        const first = f[0]!;
        const last = f[f.length - 1]!;
        const inside = box.current.contains(document.activeElement);
        if (!inside || (e.shiftKey && document.activeElement === first)) {
          e.preventDefault();
          (e.shiftKey ? last : first).focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      (opener.current as HTMLElement | null)?.focus?.();
    };
  }, []);

  const link = (url: string, text: string) =>
    isHttps(url) ? (
      <a href={url} target="_blank" rel="noopener noreferrer" className="underline decoration-[var(--border-strong)] underline-offset-2 hover:text-[var(--lime)]">
        {text}
      </a>
    ) : (
      <span>{text}</span>
    );
  const h = 'font-[var(--font-mono)] text-[11.5px] uppercase tracking-[0.18em] text-[var(--text-muted)]';

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/80 p-[5vw] pt-[8vh] backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={box}
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-title"
        tabIndex={-1}
        className="w-[min(680px,100%)] rounded-[24px] border border-[var(--border)] bg-white/[0.06] p-6 backdrop-blur-xl"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="about-title" className="font-[var(--font-display)] text-2xl font-extrabold leading-none tracking-tight">
            About and sources
          </h2>
          <button type="button" onClick={onClose} className="rounded-full border border-[var(--border-strong)] px-3 py-1 font-[var(--font-mono)] text-[11.5px] uppercase tracking-[0.15em] text-[var(--text-muted)] hover:text-[var(--lime)]">
            Close
          </button>
        </div>

        <section className="mt-5 space-y-2 text-sm leading-relaxed">
          <p className={h}>What this is</p>
          <p>
            A world monitor of armed conflict and civil unrest on a 3D globe, and a showcase of frontend design. Events come from public datasets and are labelled by how they were coded. The tension level is Defcon's own
            "DEFCON-style" composite of recent event volume and severity: it is not the official US DEFCON level and says nothing about real-world readiness.
          </p>
        </section>

        <section className="mt-5 space-y-2 text-sm leading-relaxed">
          <p className={h}>Map policy</p>
          <p>
            Every map follows India's official map: the Natural Earth India point-of-view data, guarded by tests and cross-checked against the Survey of India's political map. There is no alternative-worldview switch. Other disputed
            territories are shown as in the same Natural Earth file.
          </p>
        </section>

        <section className="mt-5 space-y-2 text-sm leading-relaxed">
          <p className={h}>Event data</p>
          {sources.length === 0 ? (
            <p className="text-[var(--text-muted)]">No event data loaded.</p>
          ) : (
            <ul className="space-y-3">
              {sources.map((s) => (
                <li key={s.id} className="border-t border-[var(--border)] pt-2 font-[var(--font-mono)] text-[13px]">
                  <span className="font-bold">{s.name}</span>
                  <br />
                  <span className="text-[var(--text-muted)]">
                    {s.version} · data up to {utcDate(s.asOfS)}
                    {s.coverFromS !== undefined && Number.isFinite(s.coverFromS) ? ` · from ${utcDate(s.coverFromS)}` : ''} · licence: {s.license} · {link(s.url, 'source')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-5 space-y-2 text-sm leading-relaxed">
          <p className={h}>Country data</p>
          <ul className="space-y-2">
            {STATIC_SOURCES.map((s) => (
              <li key={s.name} className="border-t border-[var(--border)] pt-2 font-[var(--font-mono)] text-[13px]">
                <span className="font-bold">{s.name}</span>
                <br />
                <span className="text-[var(--text-muted)]">
                  {s.use} · licence: {s.licence} · {link(s.url, 'source')}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-5 space-y-2 text-sm leading-relaxed">
          <p className={h}>What the data does not cover</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Filled dots are human-coded (UCDP) and end at the dataset's last date; rings are auto-coded news reports (GDELT) from the last days only.</li>
            <li>Auto-coded events never reach severity 4 or 5, and protests are auto-coded only. A quiet place may simply have no reporting.</li>
            <li>News coverage is uneven: GDELT over-represents some regions. A gap is never a sign of calm.</li>
            <li>Missing values are shown as "unavailable", never guessed. The tension level is shown only when enough human-coded data backs it.</li>
            <li>Allies are formal treaty memberships; active disputes are pairs on opposing sides in UCDP state-based events. Neither is an opinion.</li>
          </ul>
        </section>

        <MethodSection />

        <section className="mt-5 space-y-2 text-sm leading-relaxed">
          <p className={h}>Privacy</p>
          <p>No cookies, no analytics, no accounts and no third-party requests; fonts are served from this site. Two small things are kept in your browser: your Sound on/off choice (local storage) and a flag that the opening animation has already played this session (session storage).</p>
        </section>

        <section className="mt-5 space-y-2 text-sm leading-relaxed">
          <p className={h}>Diagnostics</p>
          <p className="text-[var(--text-muted)]">Errors from this session, kept in memory only. Nothing is sent anywhere; copy them if you want to report a problem.</p>
          <pre data-diagnostics className="max-h-40 overflow-auto whitespace-pre-wrap rounded-[12px] border border-[var(--border)] p-3 font-[var(--font-mono)] text-[12px]">{diagnostics}</pre>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(diagnostics).then(() => setCopied(true), () => setCopied(false));
            }}
            className="rounded-full border border-[var(--border-strong)] px-3 py-1 font-[var(--font-mono)] text-[11.5px] uppercase tracking-[0.15em] text-[var(--text-muted)] hover:text-[var(--lime)]"
          >
            {copied ? 'Copied' : 'Copy diagnostics'}
          </button>
        </section>
      </div>
    </div>
  );
}
