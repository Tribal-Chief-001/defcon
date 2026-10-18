# Calendar-true windows, safe data refresh and stability checks (Plan 12)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (Native, TDD, one fresh Sonnet reviewer at the end).

**Goal:** close the "C" list that Plan 11 left: (1) deaths in the 30/90/365-day windows and the weekly and monthly series follow the dates an event covers, not only its start date; (2) the pinned UCDP files can be refreshed with one command and the owner is alerted when a newer file exists; (3) the key-events timeline shows when it is getting old; (4) the backtest is published for rolling years, not one split.

**Why:** UCDP candidate rows can cover a whole month or several months (`date_prec` 4 and 5: start on the 1st, end on the last day). Dated by start, Ukraine's last 90 days read 11,071 while its calendar quarter is about 15,200, and a month's deaths land on one day. Found in the Plan 11 review.

**Architecture:** a pure helper `scripts/lib/spread.ts` (`spanOf`, `share`) shared by `scripts/conflicts/conflicts.ts` and `scripts/index/indices.ts`: an event's deaths are spread evenly over its days (end clipped to the data end), each window takes its share; events without `date_end` behave exactly as before. Event counts, geography and the training panel keep the start date (documented). Refresh tooling is a script plus a read-only scheduled workflow that alerts; unattended commits of data are deliberately not added (the pins are a supply-chain control).

**Spec:** `docs/superpowers/plans/2026-10-19-plan-11-indices.md`, `docs/BACKLOG.md` (Plan 11 deferred), D-055, D-059.

## Global Constraints
- No regression: events without `date_end` give byte-identical window numbers; every existing test stays green; budgets unchanged (scripts only plus a few UI lines).
- Workflows keep `permissions: contents: read`, SHA-pinned actions, timeouts; `tests/ci/workflows.test.ts` must pass. No new secrets, no pushes from CI.
- Honesty: what is spread and what is not (counts, geography, training months) is written on the About page and in the docs.
- One heavy process at a time (data rebuilds take about 3 minutes).

## Review Focus
1. Spreading creates or loses deaths: the sum over all days equals the event's deaths when the whole span is inside the window; clipped at the data end; an event that started over 365 days ago but ends inside the window must count partly.
2. Rounding: windows are rounded after summing; `low <= best <= high` must survive; weeks need not add to d365 exactly (state it).
3. A bad `date_end` (empty, before the start, malformed, years long) must not crash or inflate.
4. The refresh script must never overwrite a pin silently: new file added only with an explicit flag; a 404 is "no newer file", not an error; HEAD-only in the alert mode.
5. Timeline age warning uses the checked date, not today's build date, and never hides entries.

### Task 1: Spread helper and the two builders
**Files:** Create `scripts/lib/spread.ts`, `tests/lib/spread.test.ts`; Modify `scripts/conflicts/conflicts.ts`, `scripts/conflicts/build-conflicts.ts`, `scripts/index/indices.ts`, `scripts/index/build-indices.ts`, tests of both builders and the data tests; rebuild `conflicts.json` and `indices.json`.
- [ ] Tests first (helper: single day, a month, several months, clipping, bad end, the share sums to 1; builders: a monthly event splits across the 30/90 windows, an old-start event counts partly, no `date_end` unchanged, monthly series follows month overlap; the Ukraine data test: `deaths90` within 5% of the calendar quarter). Remove the Plan 11 first-of-month rule and its test (superseded). Rebuild both files, run the data guards, update docs and the About limit text.

### Task 2: Refresh tooling and alerts
**Files:** Create `scripts/events/discover-ucdp.ts`, `tests/events/discover-ucdp.test.ts`, `.github/workflows/data-updates.yml`, `scripts/timeline/age.ts`, tests; Modify `package.json`, `docs/DEPLOY.md`, `docs/DATA-SOURCES.md`.
- `nextCandidateNames(manifest)`: the file names that would follow the newest pinned candidate (monthly `GEDEvent_v26_0_9.csv`, rolling over the year).
- `npm run data:ucdp-discover` (`--check` exits 1 when a newer file exists, HEAD only; `--accept` downloads and pins it); a monthly read-only workflow runs the check and the timeline age check and fails (the owner is emailed) when either is due.
- [ ] Tests first; the workflow test must pass.

### Task 3: Timeline age on screen
**Files:** Modify `src/ui/TimelineBlock.tsx`, its test. A line "Checked N days ago: newer events are not listed" when the checked date is more than 30 days before the data end... (checked date against today), never hiding entries.

### Task 4: Rolling-origin backtest
**Files:** Modify `scripts/index/model.ts`/`build-indices.ts` (document), `docs/INDEX-BACKTEST.md` (generated), data test. A table of AUC per test year 2016-2025 for both targets, a guard that the rise AUC is at least 0.70 in every year with positives.

### Task 5: Docs, review, merge
Docs (D-060, DATA-SOURCES, DEPLOY, BACKLOG, README), full gate twice, fresh Sonnet review, one fix pass, ff-only merge, push, CI and live check.
