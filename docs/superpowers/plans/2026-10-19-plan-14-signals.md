# Signals layer (Plan 14)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (Native, TDD, one fresh Sonnet reviewer at the end).

**Goal:** add context signals that sit beside the conflict data without ever being mixed into it: fires near conflict areas (NASA FIRMS), humanitarian disaster alerts (GDACS) and non-earthquake seismic events (USGS), built at ingest time, shown in the War room with their licences, and available to the evidence trail of Plan 15.

**Why only these:** the licence check (`docs/LICENCE-CHECK-v1.1.md`, updated by this plan) found which sources may be used: USGS (public domain, read 2026-10-19), GDACS (CC BY 4.0 in the feed's own acknowledgement), NASA FIRMS (open sharing with an acknowledgement, keyless CSV). Not used: IODA (no terms found, API needs parameters I could not read), IMF PortWatch (its terms forbid automated bulk download without permission), GPSJAM (no reuse terms), Cloudflare Radar (needs an account token and is CC BY-NC), OONI (CC BY-NC-SA), EMSC (CC BY 4.0 but it duplicates USGS here).

**Architecture:** pure parsers in `scripts/signals` (tested on real, trimmed samples in `tests/fixtures/signals`), a builder that fetches each source with a timeout, never fails the ingest because one source is down (each source reports `ok`, `count`, `error`), aggregates FIRMS detections into 0.5-degree cells inside the conflict areas of `conflicts.json`, validates and writes `public/data/signals.json` (built in CI like the events snapshot, not committed). The client loads it lazily (`src/signals/load.ts`) and the War room shows a "Signals" section. Wording: "context, not confirmed events"; a fire has many causes.

**Spec:** `docs/BRAINSTORM-v1.1.md` section 4 (items 3 and 5), `docs/LICENCE-CHECK-v1.1.md`.

## Global Constraints
- Attribution on screen and in DATA-SOURCES for each source, exactly as each source asks (USGS: "U.S. Geological Survey"; GDACS: credit to GDACS; FIRMS: the acknowledgement text).
- No secret, no account, no new dependency; build-time fetch with a timeout and a size cap; a failing source must not fail the ingest and must not leave a stale signal looking fresh (each entry keeps its own time, the file keeps `generated`, the UI shows the age).
- `signals.json` stays under 60 KB gzip; the War room chunk grows by at most a few KB (budgets stay).
- Signals never change a conflict number, a score or an index; the About page says so.

## Review Focus
1. A parser accepts hostile or odd input (missing coordinates, magnitude null, HTML where XML was expected, a huge CSV line) without throwing or producing NaN.
2. A fire is not shown as proof of an attack: wording and placement.
3. One source down: the file is still written, the other sources are shown, the failed one says so.
4. FIRMS aggregation: cells at the antimeridian and the poles, detections with low confidence are dropped, the cap is applied after sorting.
5. The workflow step cannot fail the ingest for a network reason but does fail for a code bug (malformed output).

### Task 1: Parsers
**Files:** `src/signals/types.ts`, `scripts/signals/{usgs,gdacs,firms}.ts`, tests with the fixtures.
- [ ] Tests first: USGS (keep `explosion`-type events and drop `earthquake`, `quarry blast`, `ice quake`; coordinates and time; null magnitude ok; a malformed feature skipped), GDACS (RSS items with Orange or Red alert level; type, country, severity text, link https only, time; HTML instead of XML gives []), FIRMS (CSV rows with high or nominal confidence, `acq_date`/`acq_time` to a UTC time, frp; low confidence dropped; bad rows skipped) and `cellKey`/aggregation into 0.5-degree cells restricted to conflict areas.

### Task 2: Builder, validation, ingest
**Files:** `scripts/signals/build-signals.ts`, `scripts/signals/validate.ts`, `package.json`, `.github/workflows/ingest.yml`, `tests/ci`, `scripts/check-budgets.ts`, tests.
- [ ] Tests first: builder with injected fetch (all ok; one source 500; one source timeout; HTML for XML; oversize body), validator (bad coordinates, too many items, https links), workflow test (step present, no `continue-on-error`), budget for `signals.json`. Run once for real and look at the output.

### Task 3: Client and War room
**Files:** `src/signals/load.ts`, `src/ui/war/SignalsBlock.tsx`, `Overview.tsx`, `AboutPage`/`MethodSection` (sources), tests.
- [ ] Tests first: loader validates and returns null on failure; the block lists fires per conflict, disasters and explosions with ages and licences, says "context, not confirmed events", "Show on the map", empty and failed states; axe.

### Task 4: Docs, review, merge
LICENCE-CHECK update, DATA-SOURCES, D-062, README, BACKLOG; full gate twice; fresh review; fix pass; merge; push; live check of `signals.json`.
