import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const walk = (d: string): string[] => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : /\.(tsx?|css)$/.test(f) ? [join(d, f)] : []));
const files = walk('src');

// anything that animates on its own: frame loops, timers that drive visuals, CSS animation/transition
const ANIMATES = /requestAnimationFrame|setAnimationLoop|animation:|transition:|\banimate-|\btransition(-\w+)?\b(?=[ "'`])|@keyframes/;
const HONOURS = /prefersReducedMotion|reducedMotion|prefers-reduced-motion|\breduced\b/;
// comments never count: a file that only mentions the word in a comment does not honour anything
export const stripComments = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

// files allowed to animate without referencing reduced motion, each with the reason
const ALLOWED: Record<string, string> = {
  'src/dev/frameOverlay.ts': 'developer frame-time overlay, tree-shaken from production builds',
  'src/globe/eventLayer.ts': 'event ripples are the data markers (shader time); motion is part of what an event is, and the layer is static when no event is young',
  'src/globe/boot.ts': 'pure boot timeline; the engine decides (boot is skipped/instant under reduced motion)',
  'src/ui/Reticle.tsx': 'honours reduced motion through the `reduced` flag',
  'src/styles/index.css': 'keyframes are only referenced by components that check reduced motion (NightWatch)',
};

describe('reduced motion', () => {
  it('does not let a comment satisfy the audit', () => {
    expect(HONOURS.test(stripComments('// reduced motion is handled elsewhere\nrequestAnimationFrame(f)'))).toBe(false);
    expect(HONOURS.test(stripComments('const r = prefersReducedMotion();'))).toBe(true);
  });
  it('every file that animates on its own honours prefers-reduced-motion (or has a documented reason)', () => {
    const offenders = files.filter((f) => {
      const text = readFileSync(f, 'utf8');
      return ANIMATES.test(text) && !HONOURS.test(stripComments(text)) && !(f.replace(/\\/g, '/') in ALLOWED);
    });
    expect(offenders).toEqual([]);
  });
  it('the allowlist has no stale entries', () => {
    for (const f of Object.keys(ALLOWED)) expect(files.map((x) => x.replace(/\\/g, '/')), f).toContain(f);
  });
  it('the main motion features read the preference: engine, scrubber, pulse border, Night Watch, grain', () => {
    for (const f of ['src/globe/GlobeCanvas.tsx', 'src/ui/Scrubber.tsx', 'src/ui/PulseBorder.tsx', 'src/ui/NightWatch.tsx', 'src/globe/engine.ts']) {
      expect(readFileSync(f, 'utf8'), f).toMatch(HONOURS);
    }
  });
});
