# Hardening and Launch Implementation Plan (Plan 6)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (Native: one session does every task, one fresh Sonnet reviewer at the end) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the app launch-ready: adaptive quality tiers and a phone tier, keyboard and screen-reader access, a Content-Security-Policy and security headers verified against the real app, an About/Sources page, an error boundary with local diagnostics, a data-freshness monitor, and a launch checklist.

**Architecture:** Small pure modules (quality governor, tier detection, keyboard map, error log, header checks) with unit tests; the engine applies a quality tier through one `setQuality` entry; a tiny static server applies `vercel.json` headers to `dist/` so the CSP can be tested against the real built app in the browser; accessibility is tested with `axe-core` in jsdom plus targeted tests for keyboard paths.

**Tech Stack:** TypeScript strict, Three.js, React 19, Vitest + Testing Library, `axe-core` (dev dependency only), GitHub Actions. No analytics or third-party monitoring (no accounts).

**Spec:** `docs/superpowers/specs/2026-10-18-defcon-design.md` (sections 5, 10, 11). Decisions D-001..D-048 in `docs/DECISIONS.md`.

## Global Constraints

- 60 fps on the owner's laptop with every feature on; tiers only lower quality when frame time slips; the highest tier is the default on a desktop. Phone tier: usable on a 375x812 touch screen.
- Every motion feature respects `prefers-reduced-motion`; World Sound stays off by default; no cookies, no analytics, no third-party requests (fonts are self-hosted).
- Maps follow India's official perspective; the About page states the policy and links `docs/MAP-POLICY.md`.
- Honest data: the About page lists every source with licence, as-of date and what is not covered; auto-coded events are never presented as human-coded; tension only when comparable; the "DEFCON-style" index is never the official US DEFCON level.
- No `box-shadow`, no emoji in UI (guard test `tests/design/forbidden.test.ts`); tokens from `src/styles/tokens.css`.
- JS under 250 KB gzip initial (225 KB now); lazy-load About if needed. Machine rule: one vitest/vite/build process at a time.
- Never create accounts or spend money; secrets stay out of the repo; say plainly what was NOT verified (real phones, screen readers, other GPUs, the Vercel deployment).

## Review Focus

1. The CSP must not break the real app (globe, worker, fonts, dossiers, palette, About) and must not be so loose it is pointless: check `script-src` has no `unsafe-inline`/`unsafe-eval`, `object-src 'none'`, `frame-ancestors 'none'`, and that a violation shows in the console of the built app served with the headers. [Task 5]
2. Quality tiers must not flap (hysteresis) and must recover; the lowest tier must still be correct (no missing data, labels, arcs off is acceptable but the dossier and palette work). [Task 1]
3. Keyboard-only use: reach the globe, the palette, the scrubber, the dossier, About; Esc closes the top layer only; focus returns where it came from; no keyboard trap; visible focus. [Task 3]
4. A phone: pinch zoom and drag at the same time, no page scroll or pull-to-refresh fighting the canvas, safe-area insets, tap targets of 44 px, sheets that do not cover the controls. [Task 2]
5. An error in one panel must not blank the globe; diagnostics never leave the browser and never contain event text or personal data. [Task 7]

---

### Task 1: Adaptive quality governor

**Files:**
- Create: `src/perf/quality.ts`, `tests/perf/quality.test.ts`
- Modify: `src/globe/engine.ts`, `src/globe/GlobeCanvas.tsx`, `src/globe/labels.ts` (cap parameter already exists), `docs/TECH-STACK.md`

**Interfaces:**
- Produces `type Tier = 'high' | 'medium' | 'low'`; `TIERS: Record<Tier, { pixelRatio: number; grain: 0 | 0.5 | 1; labelCap: number; arcSegments: number; terminator: boolean; densityHz: number }>` (high: 2 / 1 / 40 / 48 / true / 4; medium: 1.5 / 0.5 / 24 / 32 / true / 2; low: 1 / 0 / 12 / 16 / false / 0);
  `createQualityGovernor(opts: { start: Tier; now?: () => number }): { sample(frameMs: number): Tier; tier(): Tier }`: it keeps a 90-frame window (ignores samples over 250 ms as tab switches), steps **down** one tier when the 90th-percentile frame time over a full window exceeds 22 ms, steps **up** one tier only after 10 s of a window whose 90th percentile is under 14 ms, never changes more often than every 4 s, and never goes above the starting tier plus one step... (the start tier is the ceiling).
- Engine: `GlobeHandle.setQuality(t: Tier): void` applies `TIERS[t]` (renderer pixel ratio, grain strength, label cap, arc segments passed to `arcPoints`, terminator visibility, density rebuild rate); `GlobeCanvas` feeds `onFrame` deltas into the governor and calls `setQuality` on a change.

- [ ] **Step 1: Write failing tests** with a fake clock: steady 12 ms frames keep `high`; 120 frames of 30 ms step down once, not twice within 4 s, and again after 4 s of continued slowness; 10 s of 10 ms frames step back up one tier; a 300 ms spike is ignored; the start tier is the ceiling; alternating fast and slow (a flap pattern) changes tier at most once per 4 s.
- [ ] **Step 2: Run** -> FAIL. **Step 3: Implement** the governor and `setQuality` (every knob is a setter that already exists or a small new one; no per-frame allocation). **Step 4: Run** suite/typecheck/build -> PASS. **Step 5: Browser check:** force each tier through a dev-only `?tier=low` query value (read once at start, ignored in production builds) and record the look and frame time of each tier. **Step 6: Commit** `feat(perf): add adaptive quality tiers`.

### Task 2: Phone tier and touch

**Files:**
- Create: `src/perf/device.ts`, `tests/perf/device.test.ts`, `src/globe/pinch.ts`, `tests/globe/pinch.test.ts`
- Modify: `src/globe/engine.ts`, `index.html`, `src/styles/index.css`, `src/ui/*.tsx` (tap targets, sheets)

**Interfaces:**
- `startTier(env: { coarse: boolean; memoryGb?: number; cores?: number; narrow: boolean }): Tier` (coarse pointer or width under 640 -> `medium`; also `low` when `memoryGb <= 2` or `cores <= 2`; otherwise `high`).
- `createPinch(): { down(id: number, x: number, y: number): void; move(id: number, x: number, y: number): { scale: number } | null; up(id: number): void; active(): boolean }`: with two pointers down, `move` returns the ratio of the current finger distance to the previous one (clamped 0.5..2 per event); with fewer than two it returns null. The engine uses it for zoom and suspends single-finger drag while two fingers are down; a pinch never counts as a click.
- CSS and markup: viewport `viewport-fit=cover`, safe-area insets (`env(safe-area-inset-*)`) on the top bar, scrubber and sheets, `overscroll-behavior: none` on the page, `touch-action: none` on the canvas (already), every button at least 44 px high on coarse pointers.

- [ ] **Step 1: Write failing tests:** `startTier` truth table; `createPinch`: spreading two fingers gives scale above 1, pinching below 1, a single finger gives null, lifting one finger ends the pinch, scale is clamped to 0.5 and 2 per event, ids can be re-used.
- [ ] **Step 2: Run** -> FAIL. **Step 3: Implement** and wire the engine (pointer events with `pointerType === 'touch'`). **Step 4: Run** the suite -> PASS. **Step 5: Browser check** with `resize_window` mobile (375x812): top bar, controls row, scrubber, dossier sheet, event card and About do not overlap; the dossier never hides the scrubber; record what you saw (the in-app browser sends mouse events: say that real touch was not exercised). **Step 6: Commit** `feat(ui): add the phone tier, pinch zoom and touch-sized controls`.

### Task 3: Keyboard and focus

**Files:**
- Create: `src/lib/keyboard.ts`, `tests/lib/keyboard.test.ts`, `src/ui/SkipLink.tsx`
- Modify: `src/globe/GlobeCanvas.tsx`, `src/globe/engine.ts`, `src/ui/CommandPalette.tsx`, `src/ui/DossierPanel.tsx`, `src/ui/EventCard.tsx`, `src/App.tsx`, `src/styles/index.css`, `tests/ui/*`

**Interfaces:**
- `globeKey(e: { key: string; shiftKey: boolean }): { dYaw: number; dPitch: number; dZoom: number } | null` (arrows rotate 0.08 rad, with Shift 0.24; `+`/`=` zoom in, `-` zoom out by 12 %; Home returns to the home view; anything else null). The canvas gets `tabIndex=0`, `role="application"`, `aria-label="Interactive globe. Arrow keys rotate, plus and minus zoom, Control K searches."`, and a visible focus ring; `GlobeHandle.nudge(d)` and `GlobeHandle.home()` apply it.
- A skip link ("Skip to the globe") first in tab order; a single `aria-live="polite"` status region announces dives ("Showing France"), time travel changes, and data freshness changes (not every frame).
- Palette traps focus inside while open (Tab cycles), Esc closes only the palette; opening the dossier moves focus to its heading and closing returns focus to the opener; the event card likewise; Esc closes the topmost layer only (palette, then event card, then dossier/dive).
- Visible `:focus-visible` outline in lime on every interactive element (tokens), never removed.

- [ ] **Step 1: Write failing tests:** `globeKey` for each key and Shift; the palette keeps focus inside across Tab/Shift-Tab and returns it on Esc and on pick; Esc with the palette open leaves the dossier open; the dossier takes focus on open and returns it on close; the status region text for a dive and a scrub; the skip link is the first focusable element and moves focus to the canvas.
- [ ] **Step 2: Run** -> FAIL. **Step 3: Implement.** **Step 4: Run** suite/typecheck/build -> PASS. **Step 5: Browser check:** use only the keyboard to open the palette, dive, tab to the scrubber and move it, open About, close everything; record the tab order. **Step 6: Commit** `feat(a11y): add keyboard control of the globe, focus management and a live status region`.

### Task 4: Accessibility automated checks

**Files:**
- Create: `tests/a11y/axe.test.tsx`, `tests/a11y/contrast.test.ts`, `tests/a11y/reduced-motion.test.ts`
- Modify: `package.json` (dev dependency `axe-core` pinned), components as the checks require

**Interfaces:** `axe-core` runs in jsdom against each of: `TopBar`, `CommandPalette` (open), `DossierPanel` (loaded, a failed load), `EventCard`, `Scrubber`, `RelationsBlock`, `NightWatch`, `SoundToggle`, `Reticle`, the About page (Task 6): zero violations of the rules jsdom supports (color-contrast is excluded in jsdom and covered by the token test). `contrast.test.ts` parses `src/styles/tokens.css` and asserts WCAG AA (4.5:1 body text, 3:1 large and UI) for every text/background pair actually used (text, text-muted, text-faint on `--bg`, lime/orange/cyan on `--bg`); `text-faint` is allowed at 3:1 only for decorative labels and the test lists where it is used (fix colours that fail, never the threshold). `reduced-motion.test.ts` reads the source tree and asserts every file that uses `requestAnimationFrame`, `setInterval` animation, CSS `animation` or `transition` also references `prefersReducedMotion` or a `prefers-reduced-motion` media rule (an allowlist with a reason for each exception).

- [ ] **Step 1: Write the failing tests** (add the dependency first with `npm i -D axe-core@<pinned>`; check its licence is MPL-2.0 and note it in TECH-STACK). **Step 2: Run** -> record the failures. **Step 3: Fix** each real finding in the components (labels, roles, names, contrast tokens); an axe rule may be disabled only with a comment naming the reason. **Step 4: Run** the suite -> PASS. **Step 5: Commit** `test(a11y): add axe, contrast and reduced-motion checks and fix what they found`.

### Task 5: Content-Security-Policy and security headers

**Files:**
- Create: `scripts/serve-dist.ts`, `tests/ci/csp.test.ts`
- Modify: `vercel.json`, `docs/DEPLOY.md`, `docs/TECH-STACK.md`

**Interfaces:**
- `scripts/serve-dist.ts` (`npm run serve:dist`): a dependency-free static server for `dist/` on port 4173 that applies the header rules of `vercel.json` (same regex semantics for the simple sources used) and falls back to `index.html`; used only for verification.
- CSP (single header on `/(.*)`): `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'` only if the build or React inline styles need it (prefer `style-src 'self'` plus `style-src-attr 'unsafe-inline'`); `img-src 'self' data:; font-src 'self'; connect-src 'self'` (plus the https events origin only when `VITE_EVENTS_BASE` is set: documented, not default); `worker-src 'self' blob:` only if needed; `object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests`. Also `Strict-Transport-Security: max-age=63072000; includeSubDomains`, `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Resource-Policy: same-origin`.

- [ ] **Step 1: Write failing tests** (`csp.test.ts`): `vercel.json` has the CSP and each directive above; `script-src` contains neither `unsafe-inline` nor `unsafe-eval` nor a wildcard; `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`; every directive value is a known keyword or `'self'`/`data:`/`blob:`; no header value has a newline; the built `dist/index.html` has no inline `<script>` without a src (build first; skip with a clear message when `dist/` is absent).
- [ ] **Step 2: Run** -> FAIL. **Step 3: Implement** the header and the server. **Step 4: Real-app check:** `npm run build && npm run serve:dist`, open it in the browser pane, exercise the globe, a dive, the palette, a dossier, About, time travel and Night Watch; `read_console_messages` for "Content Security Policy" violations; loosen only the specific directive that a real violation names and record why, or fix the code. Also prove the policy bites: inject a script tag from the console and show it is blocked. **Step 5: Run** the suite -> PASS. **Step 6: Commit** `feat(security): add a Content-Security-Policy and hardening headers, verified against the built app`.

### Task 6: About and Sources page

**Files:**
- Create: `src/ui/AboutPage.tsx`, `tests/ui/AboutPage.test.tsx`
- Modify: `src/ui/TopBar.tsx` (button), `src/App.tsx` (hash `#about`), `src/lib/hashState.ts`, `tests/lib/hashState.test.ts`

**Interfaces:** an accessible dialog (`role="dialog"`, labelled, focus trapped, Esc closes, opened by the top-bar "About" button and by `#about`, which `parseHash` returns as `{ about: true }`) with sections: What this is (and "DEFCON-style is Defcon's own index, not the official US level"); **Map policy** (India's official map, Natural Earth India point of view, link to docs/MAP-POLICY.md on GitHub is not possible while private, so the text is inline); **Data sources** generated from `snapshot.meta.sources` (name, version, as-of, coverage, licence, link) plus the static dossier sources (World Bank CC BY 4.0, archived CIA Factbook, UN/NATO lists, Natural Earth public domain, UCDP CC BY 4.0, GDELT); **What the data does not cover** (the Coverage legend's text, auto-coded vs human-coded, protests auto-coded only, GDELT US-centric bias); **Privacy** (no cookies, no analytics, no third-party requests; the sound choice is the only thing stored in `localStorage`); **Diagnostics** (Task 7, hidden until then). All text is static strings or snapshot fields rendered as text.

- [ ] **Step 1: Write failing tests:** the dialog opens from the button and from `#about`, closes with Esc and returns focus; it lists each source from a snapshot with licence and as-of; it states the map policy and the not-official-DEFCON sentence; links are `https` with `rel="noopener noreferrer"`; it renders with no snapshot loaded; `parseHash('#about')` -> `{ country: null, about: true }` and `#about` does not break `#c=IND`.
- [ ] **Step 2: Run** -> FAIL. **Step 3: Implement.** **Step 4: Run** suite/typecheck/build -> PASS (check the JS budget; lazy-load the page with `React.lazy` if it costs more than 8 KB gzip). **Step 5: Commit** `feat(ui): add the About and Sources page`.

### Task 7: Error boundary, diagnostics and the freshness monitor

**Files:**
- Create: `src/lib/errorLog.ts`, `src/ui/ErrorBoundary.tsx`, `tests/lib/errorLog.test.ts`, `tests/ui/ErrorBoundary.test.tsx`, `.github/workflows/monitor.yml`, `tests/ci/monitor.test.ts`
- Modify: `src/App.tsx`, `src/main.tsx`, `src/ui/AboutPage.tsx`, `docs/DEPLOY.md`

**Interfaces:**
- `errorLog`: `record(e: unknown, where: string): void` keeps the last 20 entries `{ at: number; where: string; message: string }` in memory only, message truncated to 200 characters and stripped of URLs' query strings; `entries()`; `format(): string` for the About "Diagnostics" copy button; installs `window` `error` and `unhandledrejection` listeners once (`installGlobalHandlers()`); never stores event text, never sends anything.
- `<ErrorBoundary where fallback>`: wraps the dossier, event card, About, scrubber and top bar separately (a render error shows a small inline "this panel failed, close it and try again" message and records the error); the globe keeps its existing `Unsupported` fallback and is isolated from panel errors.
- `monitor.yml` ("Data freshness monitor"): `schedule` every 6 hours and `workflow_dispatch`, `permissions: contents: read`, pinned actions, runs only when the repository variable `SITE_URL` is set (https URL), fetches `${SITE_URL}/data/events/recent.meta.json` with `curl --fail --max-time 20`, fails when the file is missing or its `asOfS` is older than 12 hours (a failed scheduled run emails the owner through GitHub notifications); the URL is passed through `env:` and validated as `https://` before use.

- [ ] **Step 1: Write failing tests:** `errorLog` caps at 20, truncates, strips query strings, records global errors and unhandled rejections, `format()` contains no object dumps; `ErrorBoundary` shows the fallback for a throwing child and keeps siblings rendered; `monitor.yml` passes the same workflow rules as the others (pinned SHAs, permissions, timeout) and references `vars.SITE_URL` only through `env:`.
- [ ] **Step 2: Run** -> FAIL. **Step 3: Implement.** **Step 4: Run** suite/typecheck/build -> PASS. **Step 5: Commit** `feat(reliability): add an error boundary, local diagnostics and a data-freshness monitor`.

### Task 8: Launch checklist, tier measurements and close-out

**Files:** Create `docs/LAUNCH.md`; modify `docs/DECISIONS.md`, `docs/ROADMAP.md`, `docs/BACKLOG.md`, `README.md`, `docs/TECH-STACK.md`, `docs/README.md`.

- [ ] **Step 1: Run** the full suite twice, typecheck, build, `check:budgets`, `ci:scan`, `data:validate`; report numbers. **Step 2: Browser pass** on `npm run serve:dist` (headers applied): desktop size and `resize_window` mobile; each quality tier; keyboard path; About; console clean; frame rate per tier; record honestly. **Step 3: `docs/LAUNCH.md`:** a checklist the owner can tick: owner reviews (India guard-point list, licence choice, the About text), Vercel project and three secrets, first ingest run, domain and HTTPS, CSP check in the browser console, `SITE_URL` variable for the monitor, make the repo public or not (what changes), backups and rotation notes, known limitations (what was not verified: real phones, screen readers, Vercel). **Step 4: Docs:** DECISIONS (tiers and thresholds, phone tier, keyboard map, CSP and why each directive, About content rules, diagnostics stay local, monitor), ROADMAP (all six plans done), BACKLOG, README (status: launch-ready pending the owner items). **Step 5: Commit** `docs(plan-6): close out hardening and write the launch checklist`.

---

## Self-review

- **Spec coverage (sections 5, 10, 11):** adaptive tier and phone tier (1, 2); accessibility incl. keyboard and reduced motion (3, 4); CSP and headers verified against the real app (5); About/Sources and honesty copy (6); error boundary and monitoring (7); launch checklist (8). **Not in this plan:** real-device testing, a screen-reader pass with real assistive technology, analytics (excluded by design), WebGPU, a custom domain (owner).
- **Types:** `Tier`, `TIERS`, `createQualityGovernor`, `startTier`, `createPinch`, `globeKey`, `errorLog`, `GlobeHandle.setQuality/nudge/home` are defined once and used with these names.
- **Not verified (to check during the work):** whether the Vite build emits any inline script or style that the CSP must allow; `axe-core` coverage in jsdom; the pinch/drag interaction on a real touch screen; `style-src-attr` support in the browsers used.
