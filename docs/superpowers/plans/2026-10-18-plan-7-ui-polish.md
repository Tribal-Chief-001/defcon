# UI Polish Implementation Plan (Plan 7)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (Native, TDD, one fresh Sonnet reviewer at the end).

**Goal:** Fix what the owner saw on the live site: the default scrollbar clashes with the design, the top bar and the type are too small and thin, and the desktop layout feels empty. Keep the globe, background and motion exactly as they are (the owner likes them).

**Architecture:** Design tokens first (type scale, scrollbar), then real information in the empty space, built from data the app already has: a top bar with live global stats, a **Hotspots** rail (most active countries, 7 days) and a **Latest** rail (newest events), a faint HUD frame and the long-promised outline "DEFCON" word. Pure functions (stats, hotspots, latest) get unit tests; components get axe and behaviour tests. No new data, no new dependency.

**Spec:** `docs/superpowers/specs/2026-10-18-defcon-design.md` section 4 (design language) and `docs/DESIGN-LANGUAGE.md`. Philosophy kept: classified dossier HUD, typography is the UI, 1px lines not shadows, honest data (counts say what they count and how old), at most two accents per screen.

## Global Constraints

- True black, bone text, lime/orange/cyan tokens; **no `box-shadow`**, no emoji, no gradient text, one easing; guard tests stay green.
- Every number on a rail or in the top bar says what it counts and its window ("events, last 30 days"); auto-coded and human-coded are never mixed up; no tension level unless `comparable`.
- WCAG AA text (the token contrast test must stay green); every new control is a real button with a visible keyboard focus; reduced motion respected (no new animation without a check).
- 60 fps and the JS budget (250 KB gzip; 232 KB now). Rails are hidden below 1100 px wide and on touch phones (the globe stays the hero there).
- Machine rule: one vitest/vite/build process at a time.

## Review Focus

1. Rails and stats must never show wrong or misleading numbers: empty snapshot, snapshot with only auto-coded events, a country id missing from the index, time travel (rails follow the playhead or say they are live-only), NaN/undefined never rendered. [Tasks 2, 3]
2. Layout collisions at 1100, 1280, 1440 and 1920 px with: dossier open, event card open, About open, scrubber, legend, controls row; nothing covers anything. [Tasks 3, 4]
3. Keyboard and screen reader: rails are landmarks with names, list items are buttons, focus order is sensible, the decorative frame and the DEFCON word are `aria-hidden`. [Tasks 3, 4]
4. The scrollbar is usable (wide enough to grab, visible on hover, works in Chrome, Firefox) and the dossier still scrolls with keyboard and touch. [Task 1]

---

### Task 1: Type scale and scrollbar

**Files:** Modify `src/styles/tokens.css`, `src/styles/index.css`, `src/ui/DossierPanel.tsx`, `src/ui/Field.tsx`, `src/ui/Coverage.tsx`, `src/ui/Scrubber.tsx`, `src/ui/TopBar.tsx`, `src/App.tsx` (readout); Create `tests/design/scrollbar.test.ts`.
- Tokens: `--fs-label: 11.5px` (mono labels, was 9.5-10), `--fs-data: 13px` (mono data and pills), `--fs-body: 14px`, `--fs-title: 30px` (Syne 800), `--fs-hero: 52px` (Space Grotesk 600 numerals), `--track: 0.14em`. Replace the 9.5/10/11 px literals on labels, legend, pills and readouts with these.
- Scrollbar (all scroll areas): 10 px wide, transparent track, a 100 px-radius thumb of 28 % bone with a transparent 3 px border (so it reads as a 4 px hairline pill), thumb 60 % bone on hover and lime while dragging, no arrow buttons; Firefox `scrollbar-width: thin; scrollbar-color`.
- [ ] **Step 1: Write failing tests** (`scrollbar.test.ts` reads the CSS): `::-webkit-scrollbar` width 10px, a thumb rule with `border-radius`, no `box-shadow`, `scrollbar-width: thin` and a `scrollbar-color`, `::-webkit-scrollbar-button` hidden, a hover and an active thumb colour; the type tokens exist; no component still uses `text-[9.5px]` (grep).
- [ ] **Step 2-5: Run -> FAIL, implement, run suite, commit** `feat(ui): add a type scale and a hairline scrollbar`.

### Task 2: Top bar with live global stats

**Files:** Create `src/events/stats.ts`, `tests/events/stats.test.ts`; Modify `src/ui/TopBar.tsx`, `tests/ui/*` as needed.
- `globalStats(s: Snapshot | undefined, nowS: number): { events: number; humanShare: number | null; countries: number } | null` over the snapshot's last 30 days: `events` count, `humanShare` = human-coded / events (`null` when there are no events), `countries` = distinct countries with at least one event; `null` for no snapshot; ignores events in the future and non-finite times.
- TopBar (64 px high): wordmark "DEFCON" in Syne 800 at 22 px with the mono sub-label "GLOBE CORE" at 11.5 px; a centre strip (hidden below 900 px) of three stats, each a mono label above a 20 px numeral: "EVENTS · 30 D", "HUMAN-CODED", "COUNTRIES AFFECTED"; the freshness pill and AsOf at 12 px on the right; the pulse line stays on its bottom edge. Stats show "--" while loading and when unavailable, never 0 for missing.
- [ ] **Step 1: Write failing tests:** stats for an empty snapshot (events 0, share null, countries 0), a mixed one (counts, share rounded to a whole percent when rendered), only-auto-coded (share 0 %, not null), future and NaN-time events ignored, `undefined` -> null; the TopBar shows the three labels and values, shows "--" without data, and the strip is `aria-label`led. **Step 2-5:** run, implement, suite, commit `feat(ui): give the top bar real typography and live global stats`.

### Task 3: Hotspots and Latest rails

**Files:** Create `src/events/rails.ts`, `tests/events/rails.test.ts`, `src/ui/Rails.tsx`, `tests/ui/Rails.test.tsx`; Modify `src/App.tsx`, `src/globe/GlobeCanvas.tsx` (no change if `focus` suffices), `tests/App.test.tsx`, `tests/a11y/axe.test.tsx`.
- `hotspots(s: Snapshot, nowS: number, n = 6): { country: string; events: number; share: number; score: number }[]`: countries ranked by `tension(s, nowS, { country }).score` over the last 7 days (reuse `src/events/tension.ts`), `events` = count in the 7 days, `share` = score / top score (0..1 for the bar); countries without events are not listed; ties broken by id; max `n`; empty snapshot -> `[]`.
- `latestEvents(s: Snapshot, nowS: number, n = 6): { index: number; country: string; kind: Kind; severity: number; human: boolean; timeS: number; lat: number; lon: number }[]`: newest first, last 7 days, not in the future, finite coordinates, at most one per country (so one busy country does not fill the list).
- `<Rails />` (desktop >= 1100 px, hidden under it): left **Hotspots** (`aside`, `aria-label="Hotspots, last 7 days"`): mono label, then up to 6 rows: rank, country name (from the index), a 2 px hairline bar scaled by `share`, the event count; each row a button that dives into the country. Hidden while the dossier is open. Right **Latest** (`aria-label="Latest events"`): rows with a kind dot (orange violence, bone protest), country, kind label, five severity pips, "2 h ago" and a "HUMAN"/"AUTO" tag; a button that flies to the event and opens its card. Hidden while the event card is open. Both follow the live snapshot only: during time travel (`backS > 0`) they show a muted "live view only" line instead of numbers.
- App: refactor the event-opening part of `onPick` into `openEvent(lat, lon, kmPerPx)`; the Latest rows call it and set a temporary `focus` target so the camera flies there, cleared after 1.6 s.
- [ ] **Step 1: Write failing tests:** `hotspots`/`latestEvents` rankings, windows, one-per-country, empty, ties, future and NaN; `Rails` renders names from the index (not ids), shows "live view only" when `backS > 0`, hides Hotspots when a dossier is open and Latest when a card is open, clicking a Hotspot calls `onDive(id)` and clicking a Latest row calls `onOpenEvent(index)`, names with `<` render as text, a missing index entry falls back to the id; axe has no violations; App test: clicking a hotspot opens its dossier. **Step 2-5:** run, implement, suite, browser check at 1440 px, commit `feat(ui): add Hotspots and Latest rails`.

### Task 4: HUD frame, outline DEFCON word, typography pass

**Files:** Create `src/ui/HudFrame.tsx`, `tests/ui/HudFrame.test.tsx`; Modify `src/App.tsx`, `src/ui/DossierPanel.tsx`, `src/ui/Field.tsx`, `src/ui/EventCard.tsx`, `src/ui/Coverage.tsx`, `src/styles/index.css`.
- `<HudFrame />`: `aria-hidden`, `pointer-events: none`: four 18 px L-shaped corner ticks at 8 px from the viewport corners in `--border-strong`, plus a huge outline "DEFCON" (Syne 800, about 21 vw, transparent fill, `-webkit-text-stroke: 1px rgba(237,237,233,.07)`) anchored at the bottom centre and cropped by the edge, drawn above the canvas but below all UI. Hidden under 640 px (phones keep a clean globe).
- Typography pass on the dossier, event card, legend and field labels with the Task 1 tokens (labels 11.5 px, data 13 px, titles 30 px), keeping the contrast test green.
- [ ] **Step 1: Write failing tests:** the frame is `aria-hidden`, has no pointer events, has no focusable child; the contrast and forbidden-pattern tests stay green; no label under 11 px remains (grep). **Step 2-5:** implement, suite, browser screenshots at 1440 and 1920, commit `feat(ui): add the HUD frame, the outline DEFCON word and a typography pass`.

### Task 5: Responsive check, docs, review, merge

- [ ] Browser at 1100, 1280, 1440, 1920 and 375 px (mobile preset): no overlaps with dossier, event card, About, scrubber, legend; screenshots saved to `docs/images/` (replace `home.png`, `dive.png` with the new look). Full suite twice, typecheck, build, budgets, ci:scan.
- [ ] Docs: DESIGN-LANGUAGE (type scale, scrollbar, rails, HUD frame), DECISIONS D-054, BACKLOG, README images. One fresh Sonnet review of the whole branch, one fix pass, merge, push, check CI and the live deploy.

---

## Self-review

- Covers the owner's three complaints (scrollbar, small/thin typography and top bar, hollow dashboard) and closes the old "outline DEFCON word" gap. **Not in this plan:** a light theme, new data sources, charts beyond the existing sparkline, real-phone testing.
- Types: `globalStats`, `hotspots`, `latestEvents`, `Rails` props (`onDive`, `onOpenEvent`) are defined once.
- Not verified yet: the look at 1100 px and on real screens; whether six rows per rail is the right density.
