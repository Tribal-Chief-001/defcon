import type { Field as FieldValue } from '../dossier/types';

// One dossier row. A missing value is a redaction bar that says "unavailable"; every present value carries its source and
// date in the accessible name and the hover/focus title.
export function Field<T>({ label, field, format }: { label: string; field: FieldValue<T>; format?: (v: T) => string }) {
  const text = field ? (format ? format(field.value) : String(field.value)) : null;
  const provenance = field ? `Source: ${field.source}, as of ${field.asOf}${field.note ? `. ${field.note}` : ''}` : 'No reliable source value';
  return (
    <div
      role="group"
      aria-label={field ? `${label}: ${text}. Source: ${field.source}, as of ${field.asOf}${field.note ? `. ${field.note}` : ''}` : `${label}: unavailable`}
      title={provenance}
      tabIndex={0}
      className="group grid grid-cols-[92px_1fr] gap-3 border-b border-[var(--border)] py-2 text-[12px] outline-none focus-visible:border-[var(--lime)]"
    >
      <span className="font-[var(--font-mono)] text-[9.5px] uppercase tracking-[0.12em] text-[var(--text-faint)] pt-0.5">{label}</span>
      {text !== null ? (
        <span className="font-[var(--font-mono)] font-bold break-words">{text}</span>
      ) : (
        <span className="w-fit select-none rounded-[2px] bg-[var(--text)]/85 px-1 font-[var(--font-mono)] text-transparent group-hover:text-black group-focus-visible:text-black">unavailable</span>
      )}
    </div>
  );
}
