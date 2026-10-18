# Fatality Index and Instability Index Implementation Plan (Plan 11)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (Native, TDD, one fresh Sonnet reviewer at the end).

**Goal:** Build the two indices the owner asked for, comprehensively and honestly:
1. **Defcon Fatality Index (DFI)**: how deadly organised violence is **now**, per country, from observed UCDP deaths: a 0-100 score on a documented log scale with its low-high range, a band, deaths for 90 and 365 days, deaths per 100,000, an activity trend, a rank, and ten years of monthly deaths.
2. **Defcon Instability Index (the Violence Risk Index, VRI)**: how likely violence is to **continue** and to **rise sharply** in the next 3 months, from an empirical model (country history plus World Bank governance scores), each with a 90% interval, a **momentum** reading, a **confidence** label, a "why this score" breakdown, and a published backtest.
They appear in the country dossier, as an **Index board** in the War room, and in a **method** section (definitions, formulas, backtest, calibration, limits).

**Why not before (honest note):** the first two studies (`docs/VRI-BASELINE-STUDY.md`, `docs/VRI-STUDY-2.md`) were done first because the spec says to find out whether the model beats persistence before building a score. They did: "continue" is almost pure persistence (AUC 0.98), "rise" is modestly forecastable (AUC 0.81, governance adds a little), "onset" is not forecastable. This plan builds exactly what those results support and says so on screen.

**Architecture:** an offline build script (`npm run data:indices`, after `npm run data:ucdp` and `npm run index:fetch`) streams the pinned UCDP files, computes the observed statistics per country (pure functions, tested), trains two ridge logistic models on final data only (GED through 2025), predicts for every modelled country at the data end (2026-08-31) with a cluster-bootstrap interval, runs the time-split backtest, and writes `public/data/indices.json` (committed) and `docs/INDEX-BACKTEST.md`. The client lazy-loads the file; no model runs in the browser.

**Tech Stack:** TypeScript strict, tsx scripts, existing `scripts/index/{metrics,panel,structural,ged}.ts`, React 19, the `src/viz` chart kit, Vitest + axe.

**Spec:** `docs/INSTABILITY-INDEX.md` (design), `docs/VRI-BASELINE-STUDY.md`, `docs/VRI-STUDY-2.md` (what the data supports), `docs/BRAINSTORM-v1.1.md`, `docs/DESIGN-LANGUAGE.md`.

## Definitions (decided here, documented on the method panel)

- **Deaths:** UCDP `best` (all three kinds of organised violence), with `low`-`high`; windows end at the data end date (2026-08-31); candidate (2026) rows are provisional.
- **DFI score:** `100 * log10(1 + deaths90) / log10(1 + 10000)`, clamped to 0-100 (a log scale because deaths span five orders of magnitude; the reference 10,000 deaths in 90 days is about the heaviest country-quarter on record, Ukraine's 11,167 caps at 100). The range is the same formula on `low` and `high`. It is a **presentation scale, not a weighted composite**: no editorial weights.
- **Band** (UCDP's thresholds applied to all organised-violence deaths in 365 days, not only battle deaths): `none` (0 recorded), `minor` (under 25), `active` (25 to 999), `war` (1,000 or more).
- **Per 100,000:** deaths in 365 days over the latest World Bank population at or before 2025.
- **Activity trend:** as in the War room (event counts, last 30 days against the average 30 days of the 60 before).
- **Momentum:** `ln(1 + deaths30) - ln(1 + base)` with `base = (deaths90 - deaths30) / 2`; rising at or above ln 1.5, falling at or below -ln 1.5, "low data" under 10 deaths in the comparison.
- **VRI model:** two ridge logistic regressions on country-months, features `ln(1+deaths)` over the last 3, 12, 36 months plus five WGI estimates (government effectiveness, rule of law, control of corruption, voice and accountability, regulatory quality; the perceived-violence estimate is excluded because it overlaps the target), all standardised; WGI values come from the latest year before the prediction year (release lag). Targets: **continue** = at least 25 deaths in the next 3 months; **rise** = at least 25 and at least double the previous 3 months. Trained on final data only (labels need three observed future months: country-months up to 2025-09), predicted at 2026-08 using all data including provisional rows.
- **Interval:** 5th-95th percentile of the prediction over 100 cluster-bootstrap refits (countries resampled with replacement). It covers training-sample uncertainty only.
- **Confidence (a heuristic, not a statistical coverage claim):** the lowest of (a) located share of the last 365 days' deaths (>= 0.6 high, >= 0.3 medium, else low), (b) interval width of the "rise" probability (<= 0.10 high, <= 0.25 medium, else low), (c) share of the last 90 days' events that are provisional (<= 0.5 high, else medium; all provisional is medium, never low by itself).
- **Why this score:** coefficient times standardised value per feature on the log-odds scale (exactly additive), with plain labels, for the "rise" model; the five WGI terms are shown separately.
- **Not modelled:** a country that never appears in UCDP GED is outside the training universe: it gets a DFI of 0 ("no organised violence recorded by UCDP") and **no** risk numbers (the page says "not modelled", not "low").
- **Backtest** (published): train up to 2015-12, test 2021-01 to 2025-09: AUC, average precision, Brier skill against the base rate, five equal-count calibration bins, persistence baseline; regenerated by the script into `docs/INDEX-BACKTEST.md` and stored in the data file.

## Global Constraints

- Honesty: a score never appears without its range or interval and its confidence; wording is "risk estimate", never "will"; the page says what the number is not (not the official US DEFCON level; not a forecast of outbreaks in peaceful countries); provisional rows and the data end date are stated; no invented weights anywhere.
- The data file is derived from CC BY 4.0 data (UCDP, World Bank WDI and WGI aggregates only): attribution stays on the page and in DATA-SOURCES.
- True black, hairline, bone, lime and orange only, type scale tokens, WCAG AA; a gauge always has its number as text; band and confidence in words.
- Performance: `indices.json` under 200 KB raw and 60 KB gzipped, loaded lazily (dossier and War room only); main JS initial budget unchanged (<= 250 KB gzip), total <= 275 KB.
- Machine rule: one vitest/vite/tsx process at a time; the build script streams (about 400 MB peak, about 3 minutes with the bootstrap).

## Review Focus

1. A number that misleads: the DFI scale (log; a 25-death country must not look like a war), a score without its range, a probability shown as certainty, "not modelled" shown as "low", an interval shown as if it covered model error, backtest numbers copied from the wrong split.
2. Leakage: training rows whose label window crosses 2025-12, WGI values from the prediction year, the prediction features using future months, candidate (provisional) rows used for training.
3. Calibration: the published bins match the data; a guard test fails when the backtest degrades (AUC "rise" below 0.75, "continue" below 0.95, a negative Brier skill, a bin off by more than 0.12).
4. Country mapping: every GED country maps to a Natural Earth id; WDI/WGI joined by ISO3; territories sharing an ISO3; countries with no WGI or population.
5. UI: dossier card states, no-data and not-modelled states, text alternatives of the gauges, keyboard, the Index board's rows are buttons and the lists are equivalent text; nothing hides the method link.

---

### Task 1: The observed statistics (pure functions)

**Files:** Create `scripts/index/indices.ts`, `scripts/conflicts/trend.ts`, `src/indices/types.ts`, `tests/index/indices.test.ts`, `tests/conflicts/trend.test.ts`; Modify `scripts/conflicts/conflicts.ts` (use the shared trend).
- `activityTrend(d30: number, d90: number): 'rising' | 'steady' | 'falling' | 'low data'` (the rule of Plan 8, moved, behaviour unchanged).
- `dfiScore(deaths: number): number`, `dfiRange(r: Range): { score, low, high }`, `bandOf(d365: number)`, `momentumOf(d30: number, d90: number): { value: number; direction }`, `per100k(deaths: number, population: number | null): number | null`.
- `countryStats(rows: { row: GedRow; provisional: boolean }[], opts: { dataEndS: number; gwToId: Record<string, string> }): Map<string, Stats>` where `Stats = { deaths30, deaths90, deaths365: Range; events30, events90, events365: number; monthly: number[] /* last 120 months of best deaths, oldest first, ending in the data end month */; locatedShare365: number; provisionalShare90: number }`; one event per id (later row wins), windows end at the data end, countries without a mapped id are skipped and counted.
- `worldMonthly(...)`: the same monthly series for all countries together.
- [ ] **Step 1: Tests first:** scale (0 -> 0, 24 -> about 34, 1,000 -> 75, 10,000 -> 100, 50,000 -> 100 clamp, NaN/negative -> 0; monotonic), range ordering, band edges (0, 1, 24, 25, 999, 1000), momentum cases and no division, per-100k with null/zero population, `countryStats` windows relative to the data end, dedupe, monthly series length 120 and alignment with a known fixture, located share and provisional share, unmapped skipped; `activityTrend` cases (moved from the builder tests, same expectations). Run: FAIL. **Step 2:** implement; the conflicts builder imports the shared trend (its tests stay green). **Step 3: Commit** `feat(indices): add the observed-statistics maths for the Fatality Index`.

### Task 2: The model, the build script and the data

**Files:** Create `scripts/index/model.ts`, `scripts/index/build-indices.ts`, `tests/index/model.test.ts`, `tests/index/indices-data.test.ts`, `public/data/indices.json`, `docs/INDEX-BACKTEST.md` (generated); Modify `package.json` (`data:indices`), `src/indices/types.ts`.
- `model.ts` (pure): `buildTrainingRows(panel, wgi)`, `fitTwo(rows) -> { rise: Logit; continue: Logit }`, `predict(model, x) -> number`, `contributions(model, x) -> { name, value }[]`, `backtest(rows) -> { rise: Metrics; continue: Metrics }` (time split, calibration bins, persistence AUC), `bootstrapInterval(rows, xs, reps, seed) -> { lo: number; hi: number }[]`, `confidenceOf(...)`.
- `build-indices.ts`: reads the manifest, streams GED and the candidate files (data end 2026-08-31), builds stats (Task 1) and the panel through 2026-08, trains on final data only, predicts at the data end, writes `indices.json` (`IndicesFile`) and the backtest document.
- `IndicesFile = { generated, dataEnd, seriesEnd: 'YYYY-MM', model: ModelMeta, world: { monthly: number[] }, countries: CountryIndex[] }`; `CountryIndex = { id, fatality: { score, scoreLow, scoreHigh, deaths90: Range, deaths365: Range, per100k: number | null, band, trend, rank: number | null, monthly: number[] }, risk: null | { continue: Prob, rise: Prob, momentum: { value, direction }, confidence, why: { label, value }[] } }`, `Prob = { p, lo, hi }`.
- [ ] **Step 1: Tests first:** model on a synthetic panel with a known signal (recovers the sign of a feature, probabilities in (0,1), contributions add up exactly to the log-odds minus the intercept), `backtest` on synthetic data (calibration bins sorted by prediction and counts adding up, persistence AUC), `confidenceOf` cases, bootstrap interval brackets the point estimate and is reproducible (seeded); data test on the committed file: header, 126+ countries, scores within 0-100 and ordered `scoreLow <= score <= scoreHigh`, bands consistent with deaths365, ranks unique and dense, every risk has `lo <= p <= hi`, `continue.p >= rise.p` for every country (rise implies continue), momentum direction valid, `why` has the history and governance terms, monthly length 120, size limits, Russia - Ukraine / Ukraine has band `war` and the top DFI, a never-violent country (not in the file or `risk: null`); **guard tests:** backtest rise AUC >= 0.75, continue AUC >= 0.95, both Brier skills > 0, every calibration bin within 0.12 of its prediction. Run: FAIL. **Step 2:** implement, run the build once (the printed summary is read and compared with the earlier studies), commit the data. **Step 3: Commit** `feat(indices): train the risk model and build the indices data`.

### Task 3: The loader and the dossier card

**Files:** Create `src/indices/load.ts`, `src/viz/Gauge.tsx`, `src/ui/IndexCard.tsx`, `tests/indices/load.test.ts`, `tests/viz/gauge.test.tsx`, `tests/ui/IndexCard.test.tsx`; Modify `src/ui/DossierPanel.tsx`, `tests/ui/DossierPanel.test.tsx`, `tests/a11y/axe.test.tsx`.
- `loadIndices(): Promise<IndicesFile | null>` (validated, null on failure, cached); `indexFor(file, id)`.
- `Gauge({ value, low, high, label })`: a 270-degree hairline arc 0-100 with the range as a lime segment and the value as a tick, the number as text, `role="img"` with a full text alternative.
- `IndexCard`: the **Fatality Index** (gauge, band chip, deaths 90 and 365 days with ranges, per 100,000, trend, rank, ten-year monthly deaths as an area sparkline) and the **Instability Index** (two probabilities as bars with their 90% intervals: "violence continues" and "sharp rise", momentum arrow word, confidence chip with its reason, "why this score" list, "not modelled" and "no recorded violence" states, the one-line method statement "risk estimate from history and governance; backtest AUC ..., Brier skill ...", a button "How computed" that opens About), always with the data end date and the provisional note.
- Dossier shows the card at the top; a failed load shows nothing and never blocks the dossier.
- [ ] **Step 1: Tests first** for all of the above (states, wording, text not markup, the interval and confidence always present when a probability is, no NaN, axe). **Step 2-3:** implement, screenshots, commit `feat(ui): add the Fatality and Instability indices to the country dossier`.

### Task 4: The Index board and the method

**Files:** Create `src/ui/war/IndexBoard.tsx`, `src/ui/MethodSection.tsx`, tests; Modify `src/ui/war/Overview.tsx`, `src/ui/AboutPage.tsx`.
- **Index board** (War room overview, after the hero): two ranked lists of 15 countries, "Most deadly now (Fatality Index)" and "Highest risk of a sharp rise (Instability Index)", each row a dive button with the score or probability, its range and a RangeBar; the world's monthly deaths over ten years as an area chart; a line that says what the indices are and are not.
- **Method section in About:** the definitions above, the model's features, the backtest table and a calibration chart (five bins, predicted against observed), the limits (universe is the 126 countries in UCDP GED, deaths are estimates, governance scores are perceptions, one time split, intervals cover training uncertainty only, onset not forecast, provisional 2026 data), the licences and citations (UCDP, World Bank).
- [ ] **Step 1: Tests first** (board lists and sort order, dive buttons, ranges shown, method numbers come from the data file, the calibration table, axe). **Step 2-3:** implement, commit `feat(ui): add the Index board and the method section`.

### Task 5: Docs, review, merge

- [ ] Docs: INSTABILITY-INDEX (status and the final definitions), DATA-SOURCES (indices.json), DECISIONS D-059, DESIGN-LANGUAGE (gauge, index card, board), BACKLOG, README (features, screenshot), BRAINSTORM status, `docs/INDEX-BACKTEST.md` linked. Screenshots (dossier card, board). Full suite twice, typecheck, build, budgets, scan. One fresh Sonnet review (Review Focus above), one fix pass, merge ff-only, push, check CI and the live file.

---

## Self-review

- Covers both indices end to end: observed (Fatality) and modelled (Instability = violence risk with continue and rise, momentum, confidence, why, backtest), on the dossier, the board and the method page.
- **Not in this plan:** a globe choropleth of the indices (backlog), protest-based unrest in the index (UCDP has no protests; the GDELT tension index stays separate and labelled auto-coded), an onset forecast (not supported by the data), monthly auto-refresh in CI (the data file is rebuilt by hand with `npm run data:indices`), countries outside UCDP GED (not modelled).
- Types: `Stats`, `IndicesFile`, `CountryIndex`, `Prob`, `ModelMeta`, `loadIndices`, `indexFor` defined once above.
- Not verified yet: model results at the new data end (computed by the build), the look of the gauges and board, real devices.
