# Sourced key-events timeline Implementation Plan (Plan 9)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (Native, TDD, one fresh Sonnet reviewer at the end).

**Goal:** Key events of the big wars (US/Israel-Iran, Israel-Lebanon, Russia-Ukraine, Israel-Gaza/Palestine) from January 2026 to October 2026, each with a date, a neutral one-line summary, a status (confirmed / reported / disputed) and its sources with links, shown in the War tracker next to the UCDP numbers. It closes the gap after UCDP's data end (2026-08-31) without writing anything from memory.

**Architecture:** `public/data/timeline.json` (committed) is curated by research agents that **read every page they cite**; a validator (`scripts/timeline/validate.ts`) enforces the rules in a data test: valid dates, chronological, https sources, no blocked hosts, and "confirmed/disputed" only with two sources from different organisations (different outlets and registrable domains). I spot-check entries myself by re-reading sources. The page shows the timeline in the conflict detail and the newest entries on the World overview, with "checked <date>" and what the statuses mean; the loader returns null on failure (the tracker works without it).

**Spec:** `docs/BRAINSTORM-v1.1.md` section 9 (layer 2), `docs/superpowers/plans/2026-10-18-plan-8-war-tracker-data.md` (the page it extends), `docs/DESIGN-LANGUAGE.md`.

## Global Constraints

- Nothing from memory: the assistant's knowledge ends before many of these events; every entry is backed by pages that were read. No casualty figure without the party that gave it; contested claims are attributed ("Iran said ...").
- Status semantics are shown on the page; "checked <date>" is shown; an entry the validator rejects never ships.
- Source links: https only, `rel="noopener noreferrer"`, text from data rendered as text; no tracking parameters stripped or added.
- Copyright: summaries are in our own words (at most 45 words, at most 10 quoted words per source); outlets are credited and linked.
- Same visual rules as the tracker (hairline, no shadow, type scale, WCAG AA); the JS budget stays under 250 KB gzip (the timeline is part of the lazy chunk and a lazy JSON).

## Review Focus

1. A "confirmed" entry whose two sources are really one organisation (same wire story, subdomains), or whose sources do not support the summary; casualty or territory claims stated as fact. [Task 2]
2. Entries dated after the checked date or before the sources existed; the page claiming "live". [Tasks 1, 3]
3. Timeline missing or malformed: the tracker still works and says "timeline unavailable". [Task 3]
4. Political neutrality: parties' claims attributed, the same standard for every theatre. [Task 2]

---

### Task 1: Types, validator, loader
**Files:** Create `src/timeline/types.ts`, `src/timeline/load.ts`, `scripts/timeline/validate.ts`, `tests/timeline/validate.test.ts`, `tests/timeline/load.test.ts`.
- `validateTimeline(f: TimelineFile, opts: { conflictIds: Set<string> }): string[]` (empty = valid); `registrable(host)`; `loadTimeline(): Promise<TimelineFile | null>`.
- [ ] Tests first (RED seen), implement, commit `feat(timeline): add the timeline types, validator and loader`.

### Task 2: The data
**Files:** Create `public/data/timeline.json`, `tests/timeline/timeline-data.test.ts`.
- Four theatres mapped to conflict ids: `iran-war` -> `iran-israel-united-states-of-america`; `israel-lebanon` -> `israel-southern-lebanon`; `russia-ukraine` -> `russia-ukraine`; `israel-gaza` -> `israel-palestine`. 8-12 entries each, from the research agents' files, after my review: remove what I cannot support, tighten summaries, re-read at least one source of every "confirmed" entry that carries numbers or a territorial claim.
- Data test: the validator passes on the committed file against the real conflict ids; every theatre has at least 5 entries; the last entry of each theatre is not older than 120 days before `checkedAt`, or the theatre says so in a `note`.
- [ ] Commit `feat(timeline): add the sourced key-events timeline`.

### Task 3: The page
**Files:** Modify `src/ui/ConflictsPage.tsx`; Create `src/ui/TimelineBlock.tsx`, `tests/ui/TimelineBlock.test.tsx`; Modify `tests/ui/ConflictsPage.test.tsx`, `tests/a11y/axe.test.tsx`, `tests/App.test.tsx` (mock).
- `<TimelineBlock theatres entries />`: heading "Key events (sourced)", "checked <date>", a one-line legend of the three statuses, entries newest first: date, title, status word (confirmed / reported / disputed), summary, sources as links (outlet name). In a conflict's detail the matching theatres' entries; on the World overview the newest 8 across theatres with the theatre title. The loader result `null` shows "Timeline unavailable."; no matching theatre shows nothing.
- [ ] Tests first: render from a fixture, order newest first, status words, links https with rel, text not markup, unavailable state, no-theatre state, world feed limit 8, axe. Implement, screenshots (1440, 375), commit `feat(ui): show the sourced timeline in the War tracker`.

### Task 4: Docs, review, merge
- [ ] DATA-SOURCES (timeline file, curation rules, validator), DECISIONS D-057, DESIGN-LANGUAGE, BACKLOG (refresh process: who updates and how often; a scheduled reminder is not built), README line. Full suite, typecheck, build, budgets, scan; one fresh Sonnet review (Review Focus above), one fix pass, merge ff-only, push, check CI and the live file.

## Self-review
- Covers the owner's "war tracker timeline with latest attacks" with sourced entries. **Not in this plan:** automatic updating (the timeline is hand-curated and will age: the page shows "checked <date>"), other theatres (Sudan, Yemen, Myanmar), any live feed beyond what the globe already has.
- Not verified yet: the facts in the entries (they are only as good as the sources the agents read and my spot checks), the page layout.
