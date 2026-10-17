type MatchMedia = (query: string) => { matches: boolean };

export function prefersReducedMotion(
  mm: MatchMedia | undefined = typeof window !== 'undefined' ? window.matchMedia?.bind(window) : undefined,
): boolean {
  return mm ? mm('(prefers-reduced-motion: reduce)').matches : false;
}
