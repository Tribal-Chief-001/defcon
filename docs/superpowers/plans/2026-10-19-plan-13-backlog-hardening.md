# Backlog hardening of the War room and the timeline (Plan 13)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (Native, TDD, one fresh Sonnet reviewer at the end).

**Goal:** close the code-level minors that the reviews of Plans 8, 9 and 10 left in `docs/BACKLOG.md`, so that the War room, the conflicts loader and the timeline validator are hardened before new features (Plans 14 and 15) go on top of them.

**Architecture:** no new features. Small, tested changes in the builders (`scripts/conflicts`, `scripts/timeline`), loaders (`src/conflicts/load.ts`, `src/timeline/load.ts`), the War room UI (`src/ui/war`, `src/ui/WarRoom.tsx`, `TimelineBlock`), the chart kit (`src/viz`) and the globe war layer (`src/globe`). Data files are rebuilt only where a builder change needs it.

**Spec:** `docs/BACKLOG.md` sections "Plan 8 review minors", "Plan 9 review minors", "Plan 10 deferred", "Plan 10 review minors", D-055, D-057, D-058.

## Global Constraints
- No regression: every existing test stays green; budgets unchanged or re-set with a ruling; behaviour of data without the new edge cases is identical (golden check: `conflicts.json` numbers do not change except where a task says so).
- Reduced motion, keyboard and accessible names stay as they are or improve; the India-official map rules are untouched.
- Wording stays "risk estimate", dates are the data end, never today; nothing is claimed about 2026 events from memory.
- One heavy process at a time.

## Not in this plan (and why)
- Data curation: more timeline theatres, Reuters/AP/BBC sources, replacing live-blog sources, the "Houthi coast in the Iran theatre" style data details (needs a human to read pages); a timeline that updates itself (a research process, not code; the monthly alert from Plan 12 tells when it is old).
- A real-GPU, real-phone and screen-reader pass (needs hardware and a person).
- Animation polish (line draw-in); naming anonymised UCDP conflicts (UCDP has not published the actors).

## Review Focus
1. A loader that is stricter must not reject the real committed files (run it against `public/data/*.json` in a test).
2. A builder change must not move numbers: compare the rebuilt `conflicts.json` against the old one (only names, places and headlines may differ).
3. Focus management: no focus trap, no lost focus when the room closes, nothing stolen on mount.
4. Globe picking: a click on empty globe still dives into the country; a click on a halo selects the conflict and never opens a dossier at the same time.
5. Timeline validator: new organisation aliases must not reject real entries (the committed `timeline.json` still validates).

### Task 1: Data hardening (builders, loaders, validator)
**Files:** `scripts/conflicts/conflicts.ts`, `scripts/conflicts/build-conflicts.ts`, `scripts/index/build-indices.ts`, `scripts/lib/dates.ts` (new), `src/conflicts/load.ts`, `src/timeline/load.ts`, `scripts/timeline/validate.ts`, tests.
- [ ] Tests first: names collapse repeated codes (`XXX100 - XXX100 (Colombia)` -> `XXX100 (Colombia)`); `place` whitespace-collapsed and cut at 120 characters with an ellipsis; a headline of joined parts (`;`) uses the first real part, whitespace-collapsed, cut with an ellipsis; `capDataEnd` (one future date cannot move the data end past today); the conflicts loader checks real calendar dates (`dataEnd`, `lastDate`, event `date`), the items of `latest[]`, `world.latest[]` and `world.countries[]`, and accepts the real committed file; the timeline validator: `isDate` returns false (no throw) for month 13 or 00, more two-level suffixes (`com.ua`, `gov.il`, `gov.uk`, `ac.uk`, `co.jp`, `com.pk`), a trailing-dot host, the same organisation under different domains (`bbc.com`/`bbc.co.uk`, `aljazeera.com`/`aljazeera.net`, `apnews.com`/`ap.org`) counts once, summaries with more than 10 consecutive quoted words are flagged; the timeline loader rejects empty `sources`, empty `summary` and non-string `conflicts`, and the committed file passes.
- [ ] Implement; rebuild `conflicts.json` and compare numbers; commit `fix(data): harden the conflicts and timeline builders, loaders and validator`.

### Task 2: War room UI minors
**Files:** `src/ui/war/*`, `src/ui/WarRoom.tsx`, `src/ui/TimelineBlock.tsx`, `src/ui/AboutPage.tsx`, `src/ui/CommandPalette.tsx`, `src/viz/*`, `scripts/check-budgets.ts`, tests.
- [ ] Tests first and implement: provisional share in the conflict header; a conflict with no deaths in 90 days says "no deaths in 90 days, last event <date>"; an unknown `selected` id is the overview (the World row is not pressed); cards use `lg:grid-cols-3`; focus moves to the detail heading when a conflict opens and back to its list row on Back; the loading text is a live region that exists from mount; the hero numeral is a paragraph, not a heading; TimelineBlock: no redundant `role`, keys include the theatre, tests for the default newest 8 and for loading; per-theatre "Timeline unavailable" only where a theatre covers the conflict; bubbles and stream dots leave the tab order (the league and the timeline list are the keyboard equivalents); axis ticks never read 0.5 or 2.5 for tiny values and the stream x axis names the year; notes under the weekly chart for spiky weeks and for provisional newest weeks; the room says when a past time-travel playhead is active, with a "Back to live" button; the bottom sheet keeps the safe-area padding; About uses `useDialog`; Ctrl+K does not open the palette over another dialog; `conflicts.json` has a size budget.

### Task 3: Globe war layer
**Files:** `src/globe/engine.ts`, `src/globe/warLayer.ts`, `src/globe/warGeometry.ts`, `src/ui/war/WarLabels.tsx`, `src/App.tsx`, tests.
- [ ] Tests first (pure parts) and implement: halo picking (`pickHalo(conflicts, ndc/screen point)` pure helper; a click inside a halo selects the conflict and does not dive); labels re-emit when the selection colour changes; war labels avoid the top controls strip; a stem click keeps the place focus; "Show on the map" twice after dragging the globe works again (focus request carries a counter); `pendingFocus` is cleared by `focus(null)`.

### Task 4: Per-conflict weekly deaths by kind
**Files:** `scripts/conflicts/conflicts.ts`, `src/conflicts/types.ts` (optional field), `src/conflicts/load.ts`, `ConflictView`, tests.
- [ ] Tests first: `weeklyByKind` per conflict sums to `weekly`; the loader accepts files without it; the conflict chart is stacked by kind when present.

### Task 5: Docs, review, merge
Mark each backlog line done or keep it with a reason; D-061; full gate twice; fresh Sonnet review with the Review Focus; one fix pass; merge, push, live check.
