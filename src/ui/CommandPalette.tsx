import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { loadIndex } from '../dossier/load';
import { searchCountries } from '../dossier/search';
import type { CountryIndexEntry } from '../dossier/types';

// Ctrl/Cmd-K: jump to a country or capital. Keyboard-first (combobox pattern), with a visible button for touch.
export function CommandPalette({ onPick, index: given }: { onPick: (id: string) => void; index?: CountryIndexEntry[] }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const [loaded, setLoaded] = useState<CountryIndexEntry[]>([]);
  const composing = useRef(false);
  const before = useRef<Element | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const uid = useId();
  const index = given ?? loaded;

  useEffect(() => {
    if (!given) void loadIndex().then(setLoaded);
  }, [given]);

  const show = () => {
    before.current = document.activeElement;
    setQ('');
    setActive(0);
    setOpen(true);
  };
  const hide = () => {
    setOpen(false);
    (before.current as HTMLElement | null)?.focus?.();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (open) hide();
        else show();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const results = useMemo(() => searchCountries(index, q), [index, q]);
  const pick = (id: string) => {
    onPick(id);
    hide();
  };
  const optId = (i: number) => `${uid}-opt-${i}`;

  return (
    <>
      <button
        type="button"
        onClick={show}
        aria-keyshortcuts="Control+K Meta+K"
        className="flex items-center gap-2 rounded-full border border-[var(--border-strong)] bg-black/40 px-3 py-1.5 font-[var(--font-mono)] text-[10px] uppercase tracking-[0.15em] text-[var(--text-muted)] backdrop-blur-md hover:text-[var(--lime)] focus-visible:text-[var(--lime)]"
      >
        Search <span className="text-[var(--text-faint)]">Ctrl K</span>
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-[5vw] pt-[14vh] backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && hide()}>
          <div role="dialog" aria-modal="true" aria-label="Search countries" className="w-[min(560px,100%)] rounded-[24px] border border-[var(--border)] bg-white/[0.06] p-4 backdrop-blur-xl">
            <input
              ref={inputRef}
              role="combobox"
              aria-expanded={results.length > 0}
              aria-controls={`${uid}-list`}
              aria-autocomplete="list"
              aria-activedescendant={results.length ? optId(active) : undefined}
              value={q}
              placeholder="Country or capital"
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => {
                setQ(e.target.value);
                setActive(0);
              }}
              onCompositionStart={() => (composing.current = true)}
              onCompositionEnd={() => (composing.current = false)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.stopPropagation();
                  hide();
                } else if (e.key === 'ArrowDown' && results.length) {
                  e.preventDefault();
                  setActive((a) => (a + 1) % results.length);
                } else if (e.key === 'ArrowUp' && results.length) {
                  e.preventDefault();
                  setActive((a) => (a - 1 + results.length) % results.length);
                } else if (e.key === 'Enter' && !composing.current && !e.nativeEvent.isComposing && results[active]) {
                  e.preventDefault();
                  pick(results[active]!.entry.id);
                }
              }}
              className="w-full rounded-[12px] border border-[var(--border)] bg-transparent px-4 py-3 font-[var(--font-body)] text-base outline-none placeholder:text-[var(--text-faint)] focus:border-[var(--lime)]"
            />
            <ul id={`${uid}-list`} role="listbox" aria-label="Results" className="mt-2 max-h-[50vh] overflow-y-auto">
              {results.map((r, i) => (
                <li
                  key={r.entry.id}
                  id={optId(i)}
                  role="option"
                  aria-selected={i === active}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(r.entry.id)}
                  className={`flex cursor-pointer items-baseline justify-between gap-3 rounded-[12px] px-3 py-2 ${i === active ? 'bg-white/10' : ''}`}
                >
                  <span className="text-[15px]">{r.entry.name}</span>
                  <span className="font-[var(--font-mono)] text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    {r.via === 'capital' ? `capital · ${r.match}` : r.via === 'code' ? `code · ${r.match}` : (r.entry.capitals[0] ?? r.entry.continent ?? '')}
                  </span>
                </li>
              ))}
            </ul>
            {q.trim() && results.length === 0 ? <p role="status" className="px-3 py-2 font-[var(--font-mono)] text-[11px] uppercase tracking-[0.15em] text-[var(--text-muted)]">No match</p> : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
