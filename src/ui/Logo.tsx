// The Defcon mark: a "D" that is also a radar scope: hairline range rings, a lime sweep line from the stem and a lime ping. Decorative
// (the DEFCON wordmark beside it names the product); public/logo-mark.svg is the same drawing as a file.
export function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg aria-hidden="true" focusable="false" width={size} height={size} viewBox="0 0 64 64" fill="none" className="shrink-0">
      <path d="M19 23a9 9 0 0 1 0 18M19 16a16 16 0 0 1 0 32" stroke="var(--text)" strokeWidth="1.5" strokeLinecap="round" opacity=".28" />
      <path d="M19 9v46M19 9a23 23 0 0 1 0 46" stroke="var(--text)" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 32 37.8 18.8" stroke="var(--lime)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="32" cy="37.2" r="3" fill="var(--lime)" />
      <circle cx="19" cy="32" r="1.8" fill="var(--lime)" />
    </svg>
  );
}
