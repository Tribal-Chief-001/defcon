# Defcon Plan 2: Events and live data

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Real conflict and protest events from UCDP (human-coded) and GDELT (auto-coded), normalised, deduplicated, published as a compact snapshot, and drawn on the globe as instanced points with sonar ripples, with an honest "data as of" label and an event detail card.

**Architecture:** Offline ingest scripts download and cache the sources, normalise them to one `Ev` schema, merge duplicates, assign countries with the India-POV picker from Plan 1, and write a binary struct-of-arrays snapshot (`recent`, `archive`) plus per-day detail shards. The browser fetches the snapshot in a Web Worker (conditional requests, about every 60 s), decodes it into typed arrays, builds GPU attributes, and the Three.js engine draws one `THREE.Points` object (one draw call). All logic that can be pure is pure and unit-tested; GPU code is checked in the browser.

**Tech Stack:** Existing (Vite, React, TypeScript, Three.js, Zustand, Vitest) plus `csv-parse` (dev, streaming CSV for UCDP). Node 22 `fetch`, `unzip` CLI (as in Plan 1).

**Spec:** `docs/superpowers/specs/2026-10-18-defcon-design.md` (sections 5, 7, 10). Roadmap: `docs/ROADMAP.md`. Previous plan: `docs/superpowers/plans/2026-10-18-plan-1-foundation-map-globe.md` (done, on `main`).

> **Corrections made during execution (see `docs/DECISIONS.md` D-032..D-034):** GDELT event time is the DATEADDED report time (not midday); detail shards live under `detail/<snapshot>/<day>.json?v=<sha12>`; the loader etag includes `asOfS`; the encoder is in `scripts/events/encode.ts`; the article merge rule is bounded; the tension function also returns `humanShare`/`comparable`.

## Verified facts this plan relies on (checked 2026-10-18)

- **GDELT 2.0 Events:** `http://data.gdeltproject.org/gdeltv2/lastupdate.txt` lists the newest `*.export.CSV.zip` (about 27 KB, one per 15 minutes). Tab-separated, **no header, 61 columns**: 0 GLOBALEVENTID, 1 SQLDATE (YYYYMMDD), 26 EventCode, 28 EventRootCode, 30 GoldsteinScale, 31 NumMentions, 32 NumSources, 33 NumArticles, 34 AvgTone, 51 ActionGeo_Type, 52 ActionGeo_FullName, 53 ActionGeo_CountryCode, 56 ActionGeo_Lat, 57 ActionGeo_Long, 58 ActionGeo_FeatureID, 59 DATEADDED (YYYYMMDDHHMMSS), 60 SOURCEURL. In one sample file (506 rows): 45 protest/violence rows had coordinates; 18 rows had an event date more than 7 days before DATEADDED (some over a year); ActionGeo_Type was 0 for 25, 1 (country centroid) for 84, 2 (US state) for 72, 3 (US city) for 47, 4 (world city) for 269, 5 (world state) for 9. GDELT terms: free for any use; any use or redistribution must cite the GDELT Project and link to gdeltproject.org.
- **UCDP GED 26.1:** `https://ucdp.uu.se/downloads/ged/ged261-csv.zip` (39 MB zip, 274 MB CSV, 417,968 events, 1989-01-01 to 2025-12-31, 49 columns, quoted fields with commas). `type_of_violence` is 1 state-based, 2 non-state, 3 one-sided (no protests). **UCDP candidate events** (monthly, same 49 columns, no token): `https://ucdp.uu.se/downloads/candidateged/GEDEvent_v26_01_26_06.csv` (Jan-Jun 2026), `GEDEvent_v26_0_7.csv`, `GEDEvent_v26_0_8.csv` (about 2,500 events per month). Columns used: `id, relid, year, type_of_violence, dyad_name, side_a, side_b, number_of_sources, source_headline, source_article, where_prec (1-7), where_description, adm_1, latitude, longitude, country, date_start, date_end, best, high, low`. UCDP datasets are licensed CC BY 4.0: cite the publications listed on `https://ucdp.uu.se/downloads/`.
- **Consequences:** no token is needed for Plan 2. Protests come **only from GDELT (auto-coded)** until ACLED is added; the UI must say so. UCDP's newest data lags (candidate data ends 2026-08), so the last weeks come from GDELT only.

## Global Constraints

Spec constraints still apply (see Plan 1's list). Added or specific to this plan, copied from the spec:

- Every event shows its source(s), age, and confidence. Auto-coded data is labelled as such; missing data is shown as missing (never guessed).
- "Data as of HH:MM UTC" is always visible. **No fake or simulated events**, ever. New events are animated in over a few seconds for clarity only.
- Never hammer a source: at most 4 concurrent requests, at least 100 ms between request starts, a `User-Agent` of `Defcon/0.1 (research showcase)`, 3 retries with backoff, cached files are never fetched again.
- At most two accents on one screen: violence is orange `#FF4D00`, protests are bone `#EDEDE9`; lime stays for selection and UI.
- Parsing and decoding run in a Web Worker; never one DOM node per event; one draw call for all events; 60 fps target on the owner's laptop.
- Budgets (gzip transfer): `recent.bin` at most 500 KB, `recent.bin` + `archive.bin` at most 2 MB; borders budgets from Plan 1 unchanged.
- Event data (`public/data/events/`, `data/raw/`) is generated and **gitignored**; the app must show a clear "no event data" state when it is missing.
- Dev machine: 7.4 GB RAM. Stream the 274 MB UCDP CSV (never read it whole), run one heavy process at a time.
- No secrets are needed in this plan. Never create accounts.
- Every task updates `docs/` where it changes a decision or source, and ends with a ledger-style commit (header, Why, Inventory, Verification including what was NOT verified, attribution trailer).

## Review Focus

Inputs the spec implies but the tasks would not otherwise exercise; each has a test in the named task.

1. GDELT rows with empty or non-numeric coordinates, ActionGeo_Type 0 or 1 (no place / country centroid), or coordinates exactly (0, 0) must be dropped, not drawn at "null island". [Task 4]
2. GDELT events whose date is far older than DATEADDED (about 4% of a sample file, some over a year) must be dropped. [Task 4]
3. The same event repeated across 15-minute files, across actors, and across sources must become one event with merged sources. [Task 5]
4. Events in open ocean, on the antimeridian, or at a pole: still drawn, country `null`, and no NaN ever reaches the GPU attribute buffers. [Tasks 5, 8]
5. Snapshot failures (HTTP 404, 304, malformed JSON, truncated binary, checksum mismatch) must leave the last good data on screen and show a stale/archive/error state, never a blank globe or an uncaught worker error. [Task 7]
6. UCDP CSV fields with commas, quotes and newlines (headlines) parse into the right columns. [Task 3]

---

### Task 1: Event schema, kinds, and severity

**Files:**
- Create: `src/events/types.ts`, `src/events/severity.ts`, `tests/events/severity.test.ts`, `docs/SEVERITY.md`

**Interfaces:**
- Produces (used by every later task):
  - `type Kind = 'armed' | 'civilian' | 'riot' | 'protest' | 'other'` and `const KINDS: readonly Kind[]` (index order: armed 0, civilian 1, riot 2, protest 3, other 4).
  - `type Ev = { id: string; source: 'ucdp' | 'gdelt'; alsoIds: string[]; timeS: number; lat: number; lon: number; precision: 1 | 2 | 3 | 4 | 5; country: string | null; kind: Kind; deaths: number | null; severity: 1 | 2 | 3 | 4 | 5; human: boolean; place: string; headline: string; actors: string; sources: { name: string; url?: string }[]; firstSeenS: number; updatedS: number }` (`timeS` = unix seconds UTC of event start; `precision` 1 exact site to 5 country/region; `country` = ADM0_A3 of the India-POV map or null).
  - `type Detail = { place: string; headline: string; actors: string; deaths: number | null; sources: { name: string; url?: string }[]; alsoIds: string[] }`.
  - `severity(i: { kind: Kind; deaths: number | null; human: boolean; goldstein?: number; numSources?: number }): 1 | 2 | 3 | 4 | 5`.

- [ ] **Step 1: Write the failing tests** (`severity.test.ts`), as a table:
  - Human armed/civilian by deaths: 0 -> 1, 1 -> 2, 4 -> 2, 5 -> 3, 24 -> 3, 25 -> 4, 99 -> 4, 100 -> 5, 5000 -> 5; `deaths: null` human -> 1.
  - Auto-coded (human `false`): armed or civilian base 2, Goldstein <= -9.5 adds 1, **never above 3**; protest 1; riot 2; protest/riot with `numSources >= 10` add 1, never above 3; `other` -> 1.
  - Never returns outside 1..5 for any input including `NaN` deaths (treated as null).
- [ ] **Step 2: Run** `npx vitest run tests/events/severity.test.ts` -> FAIL.
- [ ] **Step 3: Implement** `types.ts` and `severity()` exactly as the table; write `docs/SEVERITY.md` with the same table and the rule "severity 4-5 requires human-coded fatalities".
- [ ] **Step 4: Run** -> PASS; `npm run typecheck` clean.
- [ ] **Step 5: Commit** `feat(events): add event schema and documented severity formula`.

### Task 2: Binary snapshot codec

**Files:**
- Create: `src/events/snapshot.ts`, `tests/events/snapshot.test.ts`

**Interfaces:**
- Consumes: `Ev`, `Detail`, `KINDS` from Task 1.
- Produces:
  - `type SnapshotMeta = { v: 1; n: number; asOfS: number; generatedS: number; windowFromS: number; windowToS: number; countries: string[]; offsets: Record<'time' | 'lat' | 'lon' | 'detail' | 'country' | 'kind' | 'severity' | 'precision' | 'human', number>; bytes: number; sha256: string; sources: { id: 'ucdp' | 'gdelt'; name: string; version: string; asOfS: number; url: string; license: string }[] }`.
  - `type Snapshot = { n: number; timeS: Uint32Array; lat: Float32Array; lon: Float32Array; detailIdx: Uint32Array; country: Uint16Array; kind: Uint8Array; severity: Uint8Array; precision: Uint8Array; human: Uint8Array; countries: string[]; meta: SnapshotMeta }`.
  - `dayKey(timeS: number): string` (UTC `YYYY-MM-DD`).
  - `encodeSnapshot(events: Ev[], opts: { asOfS: number; generatedS: number; sources: SnapshotMeta['sources'] }): { bin: Uint8Array; meta: SnapshotMeta; details: Map<string, Detail[]> }` (events sorted by `timeS` then `id`; `detailIdx` = index inside that day's detail array; country index 0 means null; each column padded to a multiple of 4 bytes).
  - `decodeSnapshot(buf: ArrayBuffer, meta: SnapshotMeta): Snapshot`, throwing `Error('snapshot: ...')` on a length, checksum or offset mismatch.

- [ ] **Step 1: Write failing tests:** encode 5 hand-made events then decode: every column equals the input (lat/lon within 1e-5, time exact, kind/severity/precision/human exact, country names round-trip, `null` country -> index 0); events come out sorted by time; `details.get(dayKey(t))[detailIdx]` returns that event's text; `meta.bytes === bin.length` and `meta.sha256` is the SHA-256 of `bin`; decode of a buffer truncated by 1 byte throws `/snapshot/`; decode with a wrong checksum throws; `n = 0` encodes and decodes to empty arrays.
- [ ] **Step 2: Run** -> FAIL. **Step 3: Implement** (struct-of-arrays, `DataView`/typed arrays, SHA-256 via `node:crypto` in the encoder; the decoder verifies length and offsets only, and verifies the hash when `crypto.subtle` is available). **Step 4: Run** -> PASS.
- [ ] **Step 5: Commit** `feat(events): add binary snapshot codec with checksum`.

### Task 3: UCDP source (GED 26.1 + candidate files)

**Files:**
- Create: `scripts/events/ucdp.ts`, `scripts/events/fetch-ucdp.ts`, `data/events/sources.json`, `tests/events/ucdp.test.ts`, `tests/fixtures/ucdp-sample.csv`
- Modify: `package.json` (dev dependency `csv-parse`; script `data:ucdp`), `.gitignore` (add `public/data/events/`; `data/raw/` is already ignored)

**Interfaces:**
- Consumes: `Ev`, `severity` (Task 1).
- Produces: `ucdpRowToEv(row: Record<string, string>, nowS: number): Ev | null` (returns `null` for rows with invalid coordinates or dates); `streamUcdp(csvPath: string, sinceS: number, nowS: number): AsyncGenerator<Ev>` (streaming parse with `csv-parse`, only rows with `date_start >= sinceS`); `sources.json` entries `{ name, url, sha256, version }` for GED 26.1 and the three candidate CSVs, pinned like Plan 1's Natural Earth files.
- Mapping: `type_of_violence` 1 and 2 -> `armed`, 3 -> `civilian`; `precision` = `where_prec` clamped to 1..5 (6 and 7 -> 5); `deaths` = `best`; `human` true; `severity` from Task 1; `place` = `where_description` or `adm_1` and `country`; `actors` = `dyad_name`; `headline` = `source_headline`; `sources` = one `{ name }` per entry of `source_office` split on `;` (UCDP gives no URLs); `id` = `ucdp:<id>`; `timeS` from `date_start` (UTC).

- [ ] **Step 1: Write failing tests** using `tests/fixtures/ucdp-sample.csv` (3-4 real rows copied from the candidate file, one with a comma-and-quote headline and one with a newline inside a quoted field): the streamed events have the expected `id`, `kind`, `deaths`, `lat/lon`, `timeS`, and the comma/newline headline is intact (Review Focus 6); a row with latitude `""` or `NaN` returns `null`; `sinceS` filters older rows; `type_of_violence` 3 -> `civilian`; `where_prec` 7 -> `precision` 5.
- [ ] **Step 2: Run** -> FAIL. **Step 3: Implement** the mapping and the streaming reader; implement `fetch-ucdp.ts` (download with the politeness rules, verify SHA-256 against `sources.json` with `--accept-new` to record, unzip GED with the `unzip` CLI into `data/raw/ucdp/`). **Step 4: Run** tests -> PASS. Then `npm run data:ucdp -- --accept-new` and confirm the files exist and that streaming the GED file for the last 400 days yields a plausible count (about 15,000-30,000) without exceeding 500 MB RSS (`/usr/bin/time -v`).
- [ ] **Step 5: Docs:** `docs/DATA-SOURCES.md` UCDP section (URLs, versions, sha256, CC BY 4.0, required citation text from `https://ucdp.uu.se/downloads/`). **Step 6: Commit** `feat(events): ingest UCDP GED 26.1 and candidate events`.

### Task 4: GDELT source (parser, mapping, filters, fetch)

**Files:**
- Create: `scripts/events/gdelt.ts`, `scripts/events/fetch-gdelt.ts`, `tests/events/gdelt.test.ts`, `tests/fixtures/gdelt-sample.tsv`
- Modify: `package.json` (script `data:gdelt`)

**Interfaces:**
- Consumes: `Ev`, `Kind`, `severity`.
- Produces:
  - `cameoKind(eventCode: string): Kind | null` (null = not an event we draw).
  - `const GDELT_FILTER = { minSources: 2, minMentionsAlone: 3, maxLagDays: 2, allowedGeoTypes: [2, 3, 4, 5] }`.
  - `gdeltRowToEv(cols: string[], nowS: number): Ev | null` (`cols` = the 61 tab-split fields).
  - `readGdeltFile(path: string, nowS: number): Ev[]`.
  - `fetchGdelt(opts: { days: number; cacheDir: string; nowS: number }): Promise<string[]>` returning the cached file paths (uses `lastupdate.txt` for the newest slot, enumerates `YYYYMMDDHHMM00` 15-minute slots backwards for `days`, skips 404s, never refetches a cached file).
- Mapping (documented table in `docs/DATA-SOURCES.md`): EventCode prefix `145` -> `riot`; other `14x` -> `protest`; `19x` -> `armed`; `18x` -> `civilian`; `20x` -> `civilian`; everything else `null`. `precision`: ActionGeo_Type 4 -> 2, 3 -> 2, 5 -> 4, 2 -> 4. `human` false; `id` `gdelt:<GLOBALEVENTID>`; `sources` `[{ name: host of SOURCEURL, url: SOURCEURL }]`; `place` ActionGeo_FullName; `actors` Actor1Name/Actor2Name joined; `timeS` = SQLDATE at 12:00 UTC (GDELT has no time of day, so the event day is placed at midday).

- [ ] **Step 1: Write failing tests** with `gdelt-sample.tsv` (about 20 real rows from the file checked on 2026-10-18, including: a protest in New York, an assault with Goldstein -10, a country-level row, a row with empty lat/lon, a (0,0) row, a row with SQLDATE a year before DATEADDED, a root-code-04 row): `cameoKind` table (`'1451'` riot, `'141'` protest, `'193'` armed, `'186'` civilian, `'203'` civilian, `'040'` null); the New York protest row (ActionGeo_Type 2) -> kind `protest`, `precision` 4, `human` false; a row with ActionGeo_Type 1 -> `null`, ActionGeo_Type 0 -> `null`, empty or `NaN` coordinates -> `null`, lat 0 and lon 0 -> `null` (Review Focus 1); lag over 2 days -> `null` (Review Focus 2); `NumSources` 1 and `NumMentions` 1 -> `null`; `NumSources` 1 and `NumMentions` 3 -> kept; a row with fewer than 61 columns -> `null` without throwing; `severity` for armed/civilian never exceeds 3.
- [ ] **Step 2: Run** -> FAIL. **Step 3: Implement** the parser and filters (constants exported so tests and docs agree) and the fetcher (injected `fetch` for testability: test the slot enumeration and cache skip with a fake). **Step 4: Run** -> PASS. Then run `npm run data:gdelt -- --days 1` once and report how many rows were kept of how many read, and the polite request rate achieved.
- [ ] **Step 5: Docs:** mapping and filter tables, GDELT terms (free; cite GDELT Project, link `https://www.gdeltproject.org`). **Step 6: Commit** `feat(events): ingest GDELT 2.0 events with documented filters`.

### Task 5: Merge, deduplicate, assign countries

**Files:**
- Create: `scripts/events/merge.ts`, `tests/events/merge.test.ts`

**Interfaces:**
- Consumes: `Ev`, `createPicker` from `src/globe/pick.ts` (Plan 1: `(lat, lon) => string | null`).
- Produces: `mergeEvents(events: Ev[], pick: (lat: number, lon: number) => string | null): Ev[]`.
- Rules: (a) **within GDELT:** same `kind`, same rounded location (2 decimals), same event day, **or** same SOURCEURL host+path with the same kind -> one event; keep the highest `numSources` proxy by keeping the first id and putting the others in `alsoIds`; `sources` = union capped at 5 URLs. (b) **across sources:** a GDELT event within 0.3 degrees and 1 day of a UCDP event whose kind class matches (`armed`/`civilian` with `armed`/`civilian`) is folded into the UCDP event (`alsoIds`, extra `sources`), UCDP wins on every field. (c) `country` = `pick(lat, lon)` (null in open ocean). (d) Output sorted by `timeS`, then `id`; events with non-finite `lat`, `lon` or `timeS`, or `|lat| > 90`, `|lon| > 180` are dropped.

- [ ] **Step 1: Write failing tests:** three GDELT rows for the same article and place collapse to one event with 3 ids and capped sources (Review Focus 3); two GDELT rows for the same event on different days stay separate; a GDELT row near a UCDP event merges into it (UCDP fields win, GDELT URL kept in `sources`, `human` stays true) and one 2 days away or 1 degree away does not; a protest GDELT row near a UCDP armed event does not merge; a fake picker returns `'IND'`/`null` and `country` is set accordingly, including a point at lat 0, lon -140 (ocean) giving `null`; an event at exactly lat 90 and lon 180 is kept, and an event with `NaN` coordinates is dropped (Review Focus 4); output order is stable.
- [ ] **Step 2: Run** -> FAIL. **Step 3: Implement** with a spatial hash (0.5 degree cells x day) so 100k events merge in well under 2 s; add a timing test with 100,000 synthetic events. **Step 4: Run** -> PASS.
- [ ] **Step 5: Commit** `feat(events): merge duplicates across files, actors, and sources`.

### Task 6: Snapshot build script (`npm run data:build`)

**Files:**
- Create: `scripts/events/build-snapshot.ts`, `tests/events/build-snapshot.test.ts`
- Modify: `package.json` (scripts `data:build`, `data:refresh`), `scripts/check-budgets.ts`, `tests/scripts/budgets.test.ts`, `.gitignore`

**Interfaces:**
- Consumes: Tasks 2-5; `createPicker` over `public/data/borders.high.topo.json`.
- Produces: `buildSnapshots(inputs: { events: Ev[]; nowS: number; sources: SnapshotMeta['sources'] }): { recent: Encoded; archive: Encoded }` where `Encoded` is the result of `encodeSnapshot`; `recent` = last 30 days, `archive` = the 335 days before that (spec window 365 days); CLI `npm run data:build` reads `data/raw/`, writes `public/data/events/{recent,archive}.bin`, `{recent,archive}.meta.json`, `detail/YYYY-MM-DD.json`. `npm run data:refresh` = fetch GDELT (last 2 days, newest slots) + build.
- `checkBudgets` gains: `events/recent.bin` gzip at most 500 KB and `recent.bin` + `archive.bin` at most 2 MB (skipped when the files are absent).

- [ ] **Step 1: Write failing tests:** `buildSnapshots` splits events at `nowS - 30 days` (an event exactly on the boundary goes to `recent`), `recent.meta.windowToS` equals `nowS` and `asOfS` equals the newest source `asOfS`, detail shards exist for every day present, and `n` of both equals the input count; budget test: a 600 KB incompressible `recent.bin` fails with a message naming it, a 100 KB one passes, absent files pass.
- [ ] **Step 2: Run** -> FAIL. **Step 3: Implement** the builder and CLI. **Step 4: Run** tests -> PASS; then run the real pipeline once: `npm run data:ucdp` (cached), `npm run data:gdelt -- --days 7`, `npm run data:build`; report event counts per source and kind, the gzip sizes of both snapshots, and `npm run check:budgets`.
- [ ] **Step 5: Docs:** `docs/DATA-SOURCES.md` (snapshot layout, windows, cadence), `docs/TECH-STACK.md` commands. **Step 6: Commit** `feat(events): build recent and archive snapshots with detail shards`.

### Task 7: Browser data layer (worker, client, store, freshness)

**Files:**
- Create: `src/events/client.ts`, `src/events/freshness.ts`, `src/events/store.ts`, `src/events/worker.ts`, `src/events/workerCore.ts`, `tests/events/client.test.ts`, `tests/events/freshness.test.ts`, `tests/events/store.test.ts`

**Interfaces:**
- Consumes: `decodeSnapshot`, `Snapshot`, `SnapshotMeta` (Task 2).
- Produces:
  - `loadSnapshot(base: string, name: 'recent' | 'archive', prev: { etag?: string } | undefined, fetchFn?: typeof fetch): Promise<{ status: 'ok'; snapshot: Snapshot; etag?: string } | { status: 'unchanged' } | { status: 'error'; reason: string }>` (fetches `${base}/${name}.meta.json` then `${base}/${name}.bin`; sends `If-None-Match` when `prev.etag` is set; 304 -> `unchanged`; any failure -> `error`, never throws).
  - `freshness(asOfS: number, nowS: number): { state: 'live' | 'recent' | 'stale'; label: string }` (live <= 45 min, recent <= 3 h, else stale; `label` like `DATA AS OF 04:15 UTC`).
  - `useEvents` Zustand store: `{ recent?: Snapshot; archive?: Snapshot; status: 'idle' | 'loading' | 'ready' | 'error'; error?: string; setRecent(s: Snapshot): void; setArchive(s: Snapshot): void; fail(reason: string): void }` where `fail` keeps the last good snapshots.
  - `handleLoad(msg: { type: 'load'; base: string; name: 'recent' | 'archive'; etag?: string }, deps?: { fetchFn?: typeof fetch }): Promise<{ type: 'snapshot'; name: string; snapshot: Snapshot; etag?: string } | { type: 'unchanged'; name: string } | { type: 'error'; name: string; reason: string }>` in `workerCore.ts`; `worker.ts` only wires `self.onmessage` to it and transfers the typed-array buffers.
  - `startPolling(load: () => Promise<void>, intervalMs: number, timers?: { setTimeout; clearTimeout }): () => void` (next poll is scheduled after the previous one finishes; returns `stop`; pauses while `document.hidden`).

- [ ] **Step 1: Write failing tests** (Review Focus 5): `loadSnapshot` with a fake fetch: 200 + valid data -> `ok`; 304 -> `unchanged`; 404 -> `error` with reason `/404/`; invalid JSON in meta -> `error`; binary truncated by 1 byte -> `error` `/snapshot/`; network rejection -> `error`, no throw; `If-None-Match` is sent when an etag is given. `freshness`: 10 min -> `live`, 2 h -> `recent`, 5 h -> `stale`, label formatted in UTC; future `asOfS` (clock skew) -> `live`. Store: `fail` keeps previous `recent`; `setRecent` sets `status: 'ready'`. `startPolling`: with fake timers runs `load` at 0 and then every interval, does not overlap a slow load, `stop()` ends it.
- [ ] **Step 2: Run** -> FAIL. **Step 3: Implement.** **Step 4: Run** -> PASS, `npm run typecheck` clean.
- [ ] **Step 5: Commit** `feat(events): add worker-based snapshot client, freshness, and store`.

### Task 8: Event layer on the globe, picking, "as of" label, detail card

**Files:**
- Create: `src/events/attributes.ts`, `src/events/index.ts` (nearest-event grid), `src/globe/eventLayer.ts`, `src/ui/AsOf.tsx`, `src/ui/EventCard.tsx`, `tests/events/attributes.test.ts`, `tests/events/nearest.test.ts`, `tests/ui/AsOf.test.tsx`, `tests/ui/EventCard.test.tsx`
- Modify: `src/globe/engine.ts` (add `setEvents`, `onEventPick`), `src/globe/GlobeCanvas.tsx`, `src/App.tsx`

**Interfaces:**
- Consumes: `Snapshot` (Task 2), `freshness` and `useEvents` (Task 7), `latLonToVec3` (Plan 1), `Detail`, `dayKey`.
- Produces:
  - `buildAttributes(s: Snapshot, radius: number, nowS: number): { position: Float32Array; color: Float32Array; size: Float32Array; birth: Float32Array; hollow: Float32Array; count: number }` (violent kinds orange rgb, protest bone; `size` from severity 1..5 as 3..9 px; `birth` = seconds since `s.meta.windowFromS` as float; `hollow` 1 for auto-coded; events with a non-finite lat/lon/time are skipped and `count` reflects it).
  - `createEventIndex(s: Snapshot): { nearest(lat: number, lon: number, maxKm: number): number }` (grid hash; index into the snapshot or -1).
  - `GlobeHandle` additions: `setEvents(a: ReturnType<typeof buildAttributes>, nowS: number): void` and `onEventPick(cb: (index: number | null) => void): () => void`.
  - `<AsOf />` shows `freshness(...)` text plus a `LIVE | RECENT | STALE | ARCHIVE | NO DATA` pill; `<EventCard detail index />` shows place, kind, severity, human/auto badge ("HUMAN-CODED" / "AUTO-CODED"), age, deaths (or "unavailable"), actors, and source links (`rel="noopener noreferrer"`, `target="_blank"`).
- Visuals (checked in the browser): one `THREE.Points` at radius 1.004 with a `ShaderMaterial`; events younger than 6 h pulse a ripple ring (period 2.4 s, phase from index), older events are static dots fading from alpha 1 to 0.35 over 30 days; auto-coded events are rings (hollow) at 0.55 alpha, human-coded are filled; depth-tested so the far side is hidden; events fade in over 1.5 s after the boot is done.

- [ ] **Step 1: Write failing tests:** `buildAttributes`: 4 events (armed human sev 5, protest auto, one with `NaN` lat, one on lat 90 lon 180) -> `count` 3, no `NaN` anywhere in any buffer (Review Focus 4), orange for armed and bone for protest, `size` increases with severity, `hollow` is 1 for the auto-coded one; `createEventIndex.nearest`: returns the closest event within `maxKm`, -1 beyond it, handles the antimeridian (a query at lon -179.9 finds an event at lon 179.9 within 20 km) and an empty snapshot; `AsOf`: renders `LIVE` for a fresh `asOfS`, `STALE` for an old one, `ARCHIVE` when only the archive is loaded, `NO DATA` when the store is empty; `EventCard`: shows "AUTO-CODED" for a non-human detail, "unavailable" for `deaths: null`, and renders links with `rel` containing `noopener`.
- [ ] **Step 2: Run** -> FAIL. **Step 3: Implement** attributes, index, UI components, and `eventLayer.ts` plus the engine hooks (reuse the engine's raycast to get lat/lon, then `nearest` with a pixel-scaled radius). Wire the app: start the worker, poll `recent` every 60 s, load `archive` after the first render (idle), pass attributes to the engine, fetch the day's detail shard on pick. **Step 4: Run** `npm test && npm run typecheck && npm run build` -> PASS.
- [ ] **Step 5: Manual browser check (record what you saw):** run `npm run data:build` first; `npm run dev`; confirm events appear after the boot, recent ones ripple, a click on an event opens the card with working source links, "DATA AS OF" shows the snapshot time, removing `public/data/events/` shows `NO DATA` and the globe still works, and measure frame rate with the event count shown (backtick overlay).
- [ ] **Step 6: Commit** `feat(globe): draw events as instanced points with ripples, picking, and detail card`.

### Task 9: Tension index (pure function) and close-out

**Files:**
- Create: `src/events/tension.ts`, `tests/events/tension.test.ts`, `docs/TENSION-INDEX.md`
- Modify: `docs/DECISIONS.md`, `docs/ROADMAP.md`, `docs/README.md`, `docs/DATA-SOURCES.md`

**Interfaces:**
- Consumes: `Snapshot`.
- Produces: `tension(s: Snapshot, nowS: number, scope?: { country?: string }): { level: 1 | 2 | 3 | 4 | 5; score: number }` and `const TENSION = { windowDays: 7, halfLifeDays: 3, weights: { armed: 1, civilian: 1.2, riot: 0.6, protest: 0.3, other: 0 }, autoMultiplier: 0.5, scale: <calibrated> }`.
- Formula: `score = sum over events in the window of weight[kind] * severity^1.5 * (human ? 1 : autoMultiplier) * 0.5^(ageDays / halfLifeDays)`; `level = clamp(1 + 4 * (1 - exp(-score / scale)), 1, 5)` rounded to the nearest integer for `level`; `score` is returned unrounded. Labelled "DEFCON-style" in the UI, never the official US DEFCON level.

- [ ] **Step 1: Write failing tests:** no events -> level 1, score 0; more or higher-severity events never lower the score (monotonic); an old event (older than the window) contributes 0; a human event outweighs an identical auto event by exactly `1 / autoMultiplier`; `country` scope counts only that country; always within 1..5 for 10,000 random inputs; **calibration test**: `TENSION.scale` is chosen so that the median 7-day global score over the real archive maps to level 2 or 3 (runs only when `public/data/events/archive.bin` exists, otherwise `it.skip` with a visible reason).
- [ ] **Step 2: Run** -> FAIL. **Step 3: Implement**; calibrate `scale` from the real data with a one-off script output recorded in `docs/TENSION-INDEX.md` (formula, constants, how calibrated, date, "provisional, owner reviews"). **Step 4: Run** the full suite twice, typecheck, build, `npm run check:budgets` -> PASS; report numbers.
- [ ] **Step 5: Docs close-out:** DECISIONS (UCDP via public CSV downloads, no token; protests GDELT-only until ACLED; auto-coded severity capped at 3; snapshot format and windows; GDELT filters; tension index provisional), ROADMAP status, README index, DATA-SOURCES. **Step 6: Commit** `feat(events): add provisional tension index; close out Plan 2 docs`.

---

## Self-review

- **Spec coverage (Plan 2 scope):** event model with source/age/confidence (1, 8); P0 real archive from UCDP and P1 GDELT with documented filters (3, 4); dedupe and severity (1, 5); 15-minute-cadence publishing as static snapshots with "data as of" and conditional polling (6, 7, 8); Web Worker and typed arrays, one draw call, sonar ripples (7, 8); honesty labels and attribution (3, 4, 8, 9); tension index (9). **Not in this plan:** ACLED (needs the owner's account; the `Ev` schema and merge rules already accommodate a third source), P3 corroboration feeds, scheduling and hosting of the refresh job (Plan 5), Pulse Border / Grain / Radar / Declassify / Night Watch / Sound (Plan 4), country dossiers (Plan 3).
- **Known limits to state in the UI and docs:** protests are auto-coded only; GDELT geocoding is noisy; UCDP lags by about 6 weeks; GDELT carries no time of day.
- **Types:** `Ev`, `Detail`, `Snapshot`, `SnapshotMeta`, `Kind`, `dayKey`, `severity`, `createPicker`, `loadSnapshot`, `freshness`, `buildAttributes`, `createEventIndex` are defined once and used consistently.
- **Not verified (to check during the work):** UCDP candidate file column order across all three files; real GDELT throughput; GPU cost of 60k+ points on the owner's integrated GPU; tension `scale`; whether `unzip` exists on any future CI host.
