# War Tracker, data layer Implementation Plan (Plan 8)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (Native, TDD, one fresh Sonnet reviewer at the end). Steps use checkbox syntax.

**Goal:** A "War tracker" page that lists the current armed conflicts (Russia-Ukraine, Iran-Israel-USA, Israel-Palestine, Israel-Lebanon, Sudan and the rest) built **only from human-coded UCDP data**, with deaths and an honest range, a trend, a weekly timeline and the latest events with their sources. The curated, sourced key-events timeline is the next plan (Plan 9); nothing in this plan is written from memory.

**Architecture:** A build script streams the pinned UCDP files (GED 26.1 plus the 2026 candidate files), a pure function groups events by UCDP `conflict_name` and computes the windows relative to the **data end date** (not the wall clock), and writes `public/data/conflicts.json` (committed, derived from CC BY 4.0 data). The client lazy-loads it into a `#war` page (dialog, same keyboard rules as About) with a list and a detail view. No new dependency; the main bundle only gains a button and a lazy import.

**Tech Stack:** TypeScript strict, tsx scripts, csv-parse (already installed), React 19, Vitest + Testing Library + axe.

**Spec:** `docs/BRAINSTORM-v1.1.md` section 9 (War Tracker proposal), `docs/DESIGN-LANGUAGE.md`, `docs/DATA-SOURCES.md` (UCDP section), `docs/LICENCE-CHECK-v1.1.md` (UCDP CC BY 4.0, citation text).

## Global Constraints

- Honest data: every number says what it counts and its window; deaths are UCDP `best` with `low`-`high`; candidate data is **provisional** and labelled so; UCDP ends at the data end date and the page says it; no "live" wording; GDELT/auto-coded data is never mixed into these numbers.
- Attribution on the page: the UCDP citation text (DATA-SOURCES.md) and "CC BY 4.0".
- True black, hairline, no `box-shadow`, no emoji, type scale tokens (>= 11 px), WCAG AA, `prefers-reduced-motion`, keyboard: the page is a modal dialog (focus in, Tab stays inside, Esc closes and focus returns).
- Safety: all text from the data is rendered as React text (never HTML); the `#war=<id>` hash accepts only `[a-z0-9-]{1,60}`; external links only `https:` with `rel="noopener noreferrer"`.
- Performance: JS budget 250 KB gzip (main chunk stays under it; the page is a lazy chunk); `conflicts.json` is fetched only when the page opens and is under 400 KB.
- Machine rule: one vitest/vite/tsx heavy process at a time; the build script streams (about 100-200 MB RSS).
- The India-official map rules and guard tests are untouched.

## Review Focus

1. Windows are relative to the data end, not today: with data ending 2026-08-31 and the wall clock in October the page must not say "last 30 days" without the dates; a conflict with no event in the last 365 days is not listed. [Tasks 1, 3]
2. `low <= best <= high` always; sums never NaN; a candidate row with missing `low`/`high` falls back to `best`; the unnamed UCDP conflicts (`XXX475`) get a readable name and are still listed. [Task 1]
3. Duplicated event ids across files (a candidate row later superseded) count once, the newer file wins. [Task 1]
4. Trend with too little data says "low data", never a ratio from a zero denominator. [Task 1]
5. Failure states: `conflicts.json` missing or malformed shows a clear message and the globe keeps working; `#war=unknown` shows the list, not a crash. [Task 3]

---

### Task 1: Shared Gleditsch-Ward ids and the pure conflicts builder

**Files:** Create `scripts/relations/gw-ids.ts`, `scripts/conflicts/conflicts.ts`, `src/conflicts/types.ts`, `tests/relations/gw-ids.test.ts`, `tests/conflicts/conflicts.test.ts`; Modify `scripts/relations/build-relations.ts` (use the shared module, behaviour unchanged).

**Interfaces:**
- `gw-ids.ts`: `GW_EXTRA`, `NAME_ALIAS` (moved from build-relations), `resolveGw(gwNames: Map<string, string>, countries: {id: string; name: string}[]): { gwToId: Record<string, string>; unmapped: { gw: string; name: string }[] }`.
- `types.ts`: `Range = { best: number; low: number; high: number }`; `ConflictEvent = { id: string; date: string /* YYYY-MM-DD */; place: string; country: string; lat: number; lon: number; precision: number; kind: 'state' | 'non-state' | 'one-sided'; deaths: Range; headline: string; sources: string[]; provisional: boolean }`; `Conflict = { id: string; name: string; kinds: ConflictEvent['kind'][]; countries: { id: string | null; name: string; deaths365: number }[]; deaths: { d30: Range; d90: Range; d365: Range }; events: { d30: number; d90: number; d365: number }; trend: 'rising' | 'steady' | 'falling' | 'low data'; lastDate: string; weekly: number[] /* 52 weeks of best deaths, oldest first, last week ends at dataEnd */; latest: ConflictEvent[] /* newest first, max 12 */; provisionalShare: number /* 0..1 of d365 events */ }`; `ConflictsFile = { generated: string; dataEnd: string; sources: string[]; conflicts: Conflict[] }`.
- `conflicts.ts`: `export type GedRow = Record<string, string | undefined>`; `conflictsFromRows(rows: { row: GedRow; provisional: boolean }[], opts: { dataEndS: number; gwToId: Record<string, string>; generated: string; sources: string[] }): ConflictsFile`.

Rules for `conflictsFromRows` (decide, test, document):
- Group by `conflict_name`; one event per `id` (later rows win); skip rows with a non-finite date, non-finite `best`, or after `dataEndS`; windows end at `dataEndS` (end of that UTC day) and are 30, 90 and 365 days; a conflict is listed when `d365.best >= 100` or `d90.best >= 25`.
- `Range`: `best` = sum of `best`; `low`/`high` = sums of `low`/`high` with a missing value falling back to `best`, then clamped so `low <= best <= high`.
- `kind` from `type_of_violence` 1/2/3 (state-based, non-state, one-sided); a conflict's `kinds` is the set seen.
- `name`: `conflict_name` unless it matches `/^XXX\d+/` or is empty, then `Unnamed conflict (<top country by d365 deaths>)`. `id`: slug of the name (`[a-z0-9-]`, unique within the file, a numeric suffix on collision).
- `countries`: from `country_id` via `gwToId` (null id when unmapped), with 365-day deaths, sorted by deaths desc.
- `trend`: `base = (d90.best - d30.best) / 2` (deaths per 30 days in the 60 days before the last 30); `low data` when `d30.best + base < 10`; `rising` when `d30.best >= 1.5 * base` and `d30.best >= 10`; `falling` when `d30.best <= 0.5 * base` and `base >= 10`; else `steady`. Never divides.
- `weekly`: 52 buckets of 7 days ending at `dataEndS`, `best` sums; `latest`: 12 newest events by date (ties by id), `place` = unique non-empty of `where_description`, `adm_1`, `country` joined with ", "; `headline` = `source_headline` trimmed to 200 chars; `sources` = unique `source_office` split on `;`.
- Sorted by `d90.best` desc, then name.

- [ ] **Step 1: Tests first** (`gw-ids.test.ts`: alias `DR Congo (Zaire)` -> COD, plain name, USA extra, unmapped listed; `conflicts.test.ts`: grouping and windows relative to `dataEndS`, event after dataEnd ignored, the 100/25 listing rule, range clamping with missing low/high, duplicate id counted once with the later file winning, XXX name -> `Unnamed conflict (Nigeria)`, slug collision, trend cases (rising, falling, steady, low data, base 0 no NaN), weekly sums and length 52, latest order and cap 12, provisional share, headline cut at 200, unmapped country gives `id: null`). Run: expected FAIL (modules missing).
- [ ] **Step 2: Implement** `gw-ids.ts` (move code from build-relations, which now imports it) and `conflicts.ts`, then run `npx vitest run tests/conflicts tests/relations`. Expected: PASS, including the existing relations tests.
- [ ] **Step 3: Commit** `feat(conflicts): add the UCDP conflicts builder and shared Gleditsch-Ward ids`.

### Task 2: Build script, committed data, data test

**Files:** Create `scripts/conflicts/build-conflicts.ts`, `tests/conflicts/conflicts-data.test.ts`, `public/data/conflicts.json` (generated); Modify `package.json` (`data:conflicts`), `docs/DATA-SOURCES.md`.
- `build-conflicts.ts`: read `data/events/sources.json`, stream each UCDP CSV (a file is **provisional** when its manifest `name` starts with `candidate`), find the data end (the latest `date_start` over all files), keep rows from `dataEnd - 366 d`, map ids with `resolveGw` (unmapped GW numbers are allowed here and listed in the log), write `public/data/conflicts.json` (compact JSON) and print one line per conflict. Usage: `npm run data:conflicts` after `npm run data:ucdp`.
- Data test (reads the committed file): `dataEnd` is a valid date; at least 10 conflicts; every conflict has `low <= best <= high` in all windows, no NaN/negative, `weekly.length === 52`, `latest.length <= 12`, ids unique and `[a-z0-9-]`; sorted by `d90.best`; contains a conflict named `Russia - Ukraine`; file size under 400 KB; every event date is not after `dataEnd`.
- [ ] **Step 1: Write the data test** (FAIL: file missing). **Step 2:** implement the script, run it once, check the printed list against the numbers seen on 2026-10-18 (Russia - Ukraine about 57.5 k deaths in the 2026 files; the full 365-day figure will be larger). **Step 3:** run the test (PASS), update DATA-SOURCES (new derived file, windows relative to data end, provisional rule, citation). **Step 4: Commit** `feat(conflicts): build and commit the conflicts data from UCDP`.

### Task 3: The War tracker page

**Files:** Create `src/conflicts/load.ts`, `src/ui/useDialog.ts`, `src/ui/ConflictsPage.tsx`, `tests/conflicts/load.test.ts`, `tests/ui/ConflictsPage.test.tsx`; Modify `src/lib/hashState.ts`, `tests/lib/hashState.test.ts` (or the existing test file for it), `src/App.tsx`, `tests/App.test.tsx`, `tests/a11y/axe.test.tsx`, `src/styles/*` only if a token is missing.
- `load.ts`: `loadConflicts(base?: string): Promise<ConflictsFile>` fetches `/data/conflicts.json`, validates the shape (arrays, finite numbers, `dataEnd` date) and throws a readable error otherwise; cached once per page load.
- `hashState.ts`: `parseHash` also returns `war?: string | null` (`#war` -> `''` meaning the list, `#war=<id>` with `[a-z0-9-]{1,60}`); `formatHash` unchanged for existing callers plus an optional `war` argument; existing hash tests stay green.
- `useDialog.ts`: the focus trap / Esc / focus return logic used by About, as a hook (About is **not** refactored in this plan).
- `ConflictsPage.tsx`: dialog `aria-labelledby`; header "War tracker" with "UCDP data through <date>" and "provisional 2026 data"; list of conflicts (button rows: name, kind chips, 90-day deaths best with range, trend word, tiny sparkline of `weekly`); detail for the selected conflict (metric cards for 30/90/365 days: deaths best with `low-high` and events count; weekly bar chart as an SVG with a text summary; countries as buttons that call `onDive(id)` when `id` is set; latest events list: date, place, deaths range, headline, sources, a "provisional" tag; footer with the caveats: provisional, UCDP ends <date>, newer events are on the globe and are auto-coded, deaths are estimates with ranges, plus the citation and licence). Loading, error and empty states. On a narrow screen the list and the detail are stacked and the detail has a back button.
- App: a "War tracker" button next to About (`aria-keyshortcuts` none), the page lazy-loaded (`React.lazy`) inside an `ErrorBoundary where="war"`, `#war` mirrored in the hash, closing returns to the previous hash state, `onDive` closes the page and dives into the country.
- [ ] **Step 1: Tests first:** `load` (valid file, malformed file throws, cached), hash parse/format (`#war`, `#war=russia-ukraine`, rejects `#war=<script>`, `#c=IND` still works), `ConflictsPage` (renders names and ranges from a fixture, the data-end date and "provisional" text, trend word, selecting a row shows its detail and latest events, a country button calls `onDive`, text containing `<` renders as text, error state when the loader rejects, Esc closes and calls `onClose`, Tab stays inside), axe has no violations, App test (clicking the button opens the dialog, `#war` on load opens it, unknown `#war=zzz` shows the list). Run: FAIL.
- [ ] **Step 2: Implement; run the suite; browser check at 1440, 1100 and 375 px** (screenshots into the session scratchpad, then `docs/images/war-tracker.png` at 1440).
- [ ] **Step 3: Commit** `feat(ui): add the War tracker page`.

### Task 4: World overview (fatalities monitor and the latest strikes worldwide)

Owner ask (2026-10-18, mid-execution): "latest attacks, strikes, bombings across the world" and a fatalities/violence monitor with counts. Added to this plan because it reads the same data.
- `ConflictsFile.world` (builder, `src/conflicts/types.ts`): `World = { deaths: { d30: Range; d90: Range; d365: Range }; byKind: Record<Kind, { d90: Range; d365: Range }>; weekly: number[] /* 52 */; countries: { id: string | null; name: string; deaths90: number; deaths365: number }[] /* top 12 by 90-day deaths */; conflictsListed: number; latest: ConflictEvent[] /* 20 newest events anywhere, usable coordinates */ }`. It counts **every** valid event (also the conflicts below the listing threshold); `world` is the reserved conflict id `world`, so no conflict slug may be `world`.
- Builder hygiene found in review of the page: a `source_headline` that is only a date ("31 August 2026") becomes an empty headline.
- Page: the list starts with a "World overview" row; with nothing selected the wide layout shows it by default (`selected === 'world'` or null). It shows the deaths cards (30/90/365 days, all kinds), a by-kind table, the weekly chart, the countries with most deaths in 90 days (dive buttons), a plain note that protest deaths are not counted (UCDP covers organised violence only), the 20 latest human-coded events, and "Newest reports (news, auto-coded, last 7 days)": up to 8 armed/civilian events from the live snapshot, one per country, with the country name, kind, age and an "auto-coded" tag, or "No recent reports loaded". On a narrow screen the page header and footer are shortened.
- [ ] **Step 1: Tests first** (builder: world totals include unlisted conflicts, by-kind sums equal totals, weekly 52, top-12 countries sorted, latest 20 across conflicts, date-only headline emptied, slug `world` never used; loader rejects a malformed `world`; data test invariants; page: overview default and for `selected='world'`, protest note, by-kind rows, country button dives, newest-reports section with a snapshot and its empty state, text not markup; axe). Run: FAIL. **Step 2:** implement, regenerate `conflicts.json`, suite, screenshots. **Step 3: Commit** `feat(conflicts): add the World overview with a fatalities monitor and the latest strikes`.

### Task 5: Docs, review, merge

- [ ] Docs: DESIGN-LANGUAGE (War tracker page), DECISIONS D-055 (UCDP-only data layer, windows relative to data end, provisional label, no memory-written claims), BACKLOG (Plan 9: sourced key-events timeline; per-conflict GDELT "since UCDP" feed), BRAINSTORM section 9 status, README feature line and screenshot, `LAUNCH.md` untouched.
- [ ] Full suite twice, typecheck, build, `check:budgets`, `ci:scan`. One fresh Sonnet review of the whole branch with the Review Focus above, one fix pass (each fix RED -> GREEN), merge ff-only to main, push, check CI and the live site (the deploy needs `conflicts.json` served with the right headers).

---

## Self-review

- Covers the owner's ask for the data half (conflicts, deaths range, timeline, latest strikes) from verified human-coded data only. **Not in this plan:** the curated key-events timeline with cited sources (Plan 9), any GDELT "newer than UCDP" feed per conflict, any claim about events after 2026-08-31, casualty totals from outside UCDP.
- Types: `Range`, `ConflictEvent`, `Conflict`, `ConflictsFile`, `conflictsFromRows`, `resolveGw`, `loadConflicts` are defined once above.
- Not verified yet: how the page looks on small screens, whether 12 latest events per conflict is the right density, whether the 100/25 listing rule hides a relevant conflict.
