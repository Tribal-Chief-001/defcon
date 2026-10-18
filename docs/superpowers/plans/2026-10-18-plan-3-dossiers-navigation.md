# Defcon Plan 3: Country dossiers, Country Dive, command palette, capitals

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Click or search any country and get a sourced dossier: the camera flies there, its border draws in, the rest dims, and a glass panel shows facts (each with source and date, missing ones redacted as "unavailable"), recent events, and a 30-day chart. Cmd/Ctrl-K jumps to any country or capital. Capitals appear by zoom level.

**Architecture:** A build step merges four sources into one static JSON file per country (`public/data/dossiers/<ADM0_A3>.json`, committed, so a static deploy needs no pipeline) plus a small search index. Country identity, neighbours and bounding boxes come from our own India-POV borders, never from third-party country lists. Browser code is pure functions (search, dive target, label selection, event summary, hash state) with thin React/Three.js wrappers.

**Tech Stack:** Existing stack only (no new runtime dependency). Node `fetch` for ingest.

**Specs:** `docs/superpowers/specs/2026-10-18-defcon-design.md` (sections 5, 6, 8). Roadmap: `docs/ROADMAP.md`. Done: Plans 1 and 2 (on `main`, repo `Tribal-Chief-001/defcon`).

## Verified facts this plan relies on (checked 2026-10-18)

- **World Bank WDI API** (`https://api.worldbank.org/v2/country/all/indicator/<CODE>?format=json&per_page=500&mrnev=1`, `mrnev=1` = most recent non-empty value per country, each row has `countryiso3code`, `date`, `value`; 265 rows including regional aggregates; `lastupdated` 2026-10-08): `SP.POP.TOTL` population (2025), `AG.SRF.TOTL.K2` surface area km2 (2024; India 3,287,263), `NY.GDP.MKTP.CD` GDP current US$ (mostly 2025), `MS.MIL.XPND.CD` military expenditure current US$ and `MS.MIL.XPND.GD.ZS` % of GDP (mostly 2025, 191-193 countries have a value, some only older years, e.g. 1999-2024; source organisation: SIPRI Military Expenditure Database). Using the World Bank copy resolves the SIPRI licence question: the World Bank licenses datasets under CC BY 4.0 unless labelled otherwise (World Bank Data Catalog "Public Licenses"; the WDI dataset's own licence line must be re-checked in Task 2). ISO3 codes use World Bank conventions (SSD, XKX, PSE); Natural Earth's `ISO_A3_EH`/`WB_A3` match them (our id for South Sudan is `SDS`).
- **CIA World Factbook via the community mirror** `factbook/factbook.json` (repo licence CC0; last commit 2026-09-11; 254 country files named by FIPS/GEC 2-letter codes, no ISO crosswalk). Useful fields: `Government."Government type"`, `People and Society.Languages.Languages`, `Government.Independence`, `Government."International organization participation"` (free text), `Government.Capital` with `geographic coordinates` ("28 36 N, 77 12 E"). **Matching a Factbook file to our country by capital coordinates works:** 193 sovereign states matched within 60 km of a Natural Earth capital; the unmatched are territories (American Samoa, Aruba, Guam...) plus Burundi (its political capital Gitega differs from Natural Earth's Bujumbura, 62 km away); Samoa and Wallis and Futuna collided on one id. 115 entries have no Languages field. **Text parsing pitfall:** a naive search for "NATO" in the organisation text finds 34 countries, not 32 (Jordan and Malta are partners), so NATO and UN membership come from official lists, not from the Factbook text. The Factbook is a US-government product: **only the enumerated fields above are imported, never its free-text sections** (disputes, geography), to keep India's official-map policy intact. Its public-domain statement must be captured from cia.gov in Task 3 (the page is dynamic and was not captured in this check).
- **Official lists:** `https://www.nato.int/cps/en/natohq/nato_countries.htm` ("At present, NATO has 32 member countries", fetchable). `https://www.un.org/en/about-us/member-states` is fetchable with a browser User-Agent (plain curl gets 403); 193 member states plus 2 observer states (Holy See, State of Palestine).
- **Not usable:** REST Countries v3.1 is deprecated (returns an error object); Wikidata P463 gave 28 of 32 NATO members, so it is not trusted for memberships.
- Natural Earth (our India-POV file) already has per country: `ISO_A2_EH`, `ISO_A3_EH`, `NAME`, `NAME_LONG`, `FORMAL_EN`, `CONTINENT`, `SUBREGION`, `TYPE`, `LABEL_X`, `LABEL_Y`; six features have no ISO_A3_EH (Dhekelia, Guantanamo, Akrotiri, Bir Tawil, Spratly Is., Scarborough Reef). Known no-polygon countries in high detail: VAT, CSI, SCR; Tuvalu's capital point falls outside its polygon.

## Global Constraints

Plan 1 and 2 constraints still apply (tokens, fonts, no `box-shadow`, true black, WebGL2 floor, budgets, India map policy, honesty rules, one heavy process at a time, ledger-style commits with the attribution trailer). Specific to this plan:

- **Every dossier field carries its source and an "as of" date and shows both on hover and keyboard focus. A field with no reliable value is `null` and renders as a redaction bar that says "unavailable": never 0, never an empty string, never a guess.**
- Country identity, names, capitals and neighbours come from the India-POV Natural Earth data; Kosovo, Somaliland and Western Sahara are not countries there (D-022). Names and text are rendered as React text (no HTML injection).
- Static output is committed: `public/data/dossiers/` (about 250 files, index at most 40 KB gzip, each dossier at most 6 KB). `npm run build` must not need the network or raw data.
- No new always-on cost, no accounts, no secrets. Ingest: at most 4 concurrent requests, 100 ms start spacing, `User-Agent: Defcon/0.1 (research showcase)`, cached raw files in `data/raw/` (gitignored).
- Keyboard-first: the palette and the dossier are fully operable without a mouse; `prefers-reduced-motion` makes the dive instant.
- Frame rate target unchanged (60 fps on the owner's laptop) with the dossier open and labels shown.

## Review Focus

1. A missing value (World Bank `null`, Factbook field absent, territory, no polygon) must become `null` = "unavailable", never 0, `NaN`, "undefined" or a neighbour's value. [Tasks 2, 3, 5, 7]
2. India's policy: India's dossier lists Afghanistan, China, Pakistan, Nepal, Bhutan, Bangladesh and Myanmar as neighbours as derived from our borders; no Factbook free text is imported; Burundi shows Natural Earth's capital with the Factbook difference noted, not silently overwritten. [Tasks 1, 3, 5]
3. Id mapping: SDS/SSD, Factbook matches that collide (Samoa vs Wallis and Futuna), unmatched territories, countries with two capitals. [Tasks 3, 5]
4. Search and palette: diacritics ("Cote d'Ivoire", "Curacao"), empty query, no results, rapid typing, IME composition, Esc, focus returns to where it was, names containing HTML characters. [Task 8]
5. Dive edge cases: countries crossing the antimeridian (Russia, Fiji, USA), tiny countries, Antarctica, quick repeated dives/exits, reduced motion, deep link on load while the boot plays. [Task 9]
6. Dossier fetch failures (404, bad JSON) and fast switching between countries must never show another country's data or crash. [Task 7]
7. Labels: never more than the cap, never on the far side of the globe, no layout thrash each frame. [Task 10]

---

### Task 1: Rich country list, neighbours, bounding boxes

**Files:**
- Modify: `scripts/map/build-borders.ts`, `scripts/map/build.ts`, `tests/map/borders.test.ts`
- Create: `src/dossier/types.ts`, `scripts/map/neighbours.ts`, `tests/map/neighbours.test.ts`

**Interfaces:**
- Produces (used by all later tasks):
  - `type CountryRow = { id: string; name: string; formalName: string | null; iso2: string | null; iso3: string | null; type: string; continent: string | null; subregion: string | null; lat: number; lon: number; hasPolygon: boolean; bbox: [number, number, number, number] | null; neighbours: string[] }` (`iso2`/`iso3` from `ISO_A2_EH`/`ISO_A3_EH`, `-99` -> `null`; `lat/lon` = `LABEL_Y`/`LABEL_X`; `bbox` = `[w, s, e, n]` of the high-detail polygons, `w > e` when crossing the antimeridian, `null` when no polygon; `neighbours` sorted ADM0_A3 of countries sharing a border arc).
  - `neighboursOf(topo: Topology): Record<string, string[]>` (topojson-client `neighbors` over `topo.objects.countries`, ids from `properties.id`, symmetric, sorted, no self).
  - `type Provenance`, `Field<T>`, `Dossier`, `CountryIndexEntry` exactly as in Task 5's Interfaces, declared in `src/dossier/types.ts`.
- `public/data/countries.json` becomes an array of `CountryRow` (still 248 rows, sorted by id; existing readers only use `id` and `name`).

- [ ] **Step 1: Write failing tests:** `neighbours.test.ts` on `public/data/borders.high.topo.json`: result is symmetric (if A lists B then B lists A), has no self entries, `IND` contains `BGD, BTN, CHN, MMR, NPL, PAK` **and `AFG`** (India's depiction of Gilgit-Baltistan), `FRA` contains `BEL, ESP` (and `BRA`, `SUR` through Guiana if the file treats it as France), an island country (`JPN`) has `[]`. `borders.test.ts` additions: `countries.json` rows have the `CountryRow` fields; `IND.iso3 === 'IND'`, `SDS.iso3 === 'SSD'`; the six no-ISO features have `iso3 === null`; `hasPolygon` is false exactly for `VAT, CSI, SCR`; `bbox` of `FJI` has `w > e` (antimeridian) and `bbox` of `RUS` too; all `lat`/`lon` finite.
- [ ] **Step 2: Run** `npx vitest run tests/map` -> FAIL.
- [ ] **Step 3: Implement** the fields in `build-borders.ts` (read the extra dbf columns through `clean()`), `neighboursOf` in `scripts/map/neighbours.ts`, the bbox via `d3-geo` `geoBounds`; rebuild with `npm run map:build`; the India outline pin must be unchanged (`npm test` still green).
- [ ] **Step 4: Run** the full suite -> PASS; `npm run typecheck` clean. **Step 5: Commit** `feat(map): richer country list with ISO codes, neighbours and bounding boxes`.

### Task 2: World Bank ingest

**Files:**
- Create: `scripts/dossiers/worldbank.ts`, `scripts/dossiers/fetch-worldbank.ts`, `tests/dossiers/worldbank.test.ts`, `tests/fixtures/wb-pop.json`
- Modify: `package.json` (script `data:wb`)

**Interfaces:**
- Consumes: `CountryRow` (Task 1).
- Produces: `type WbValue = { value: number; year: number }`; `parseWb(json: unknown): Map<string, WbValue>` keyed by `countryiso3code` (rows with a null value, an empty or non-3-letter code, or a non-finite value are skipped); `WB_INDICATORS = { population: 'SP.POP.TOTL', areaKm2: 'AG.SRF.TOTL.K2', gdpUsd: 'NY.GDP.MKTP.CD', milExpUsd: 'MS.MIL.XPND.CD', milExpGdpPct: 'MS.MIL.XPND.GD.ZS' }`; `fetchWorldBank(cacheDir, fetchFn?)` writes `data/raw/wb/<CODE>.json` and `data/raw/wb/meta.json` (`{ fetchedAt, lastupdated }`); the CLI `npm run data:wb`.

- [ ] **Step 1: Write failing tests** with a trimmed real fixture (10 rows incl. an aggregate `ARB`, a null value, a `SSD` row): `parseWb` returns the numbers and years, skips null values and rows with an empty or non-3-letter code (aggregates such as `ARB` have 3-letter codes: they stay in the map but are never looked up, because lookups use our `iso3`), rejects a non-numeric value such as `"abc"`, and returns an empty map without throwing for an empty array or a non-array input; `fetchWorldBank` with a fake `fetchFn` writes the five files and the meta, retries a failing request 3 times, and fails clearly (error naming the indicator) on an HTTP 500 after retries.
- [ ] **Step 2: Run** -> FAIL. **Step 3: Implement.** **Step 4: Run** -> PASS. Then run `npm run data:wb` for real and report how many of our 248 countries have a value per indicator.
- [ ] **Step 5: Docs:** `docs/DATA-SOURCES.md` World Bank section (URLs, indicators, years seen, SIPRI as the underlying source, **the licence line of the WDI dataset copied from the World Bank Data Catalog**, required attribution text). **Step 6: Commit** `feat(dossiers): ingest World Bank WDI indicators`.

### Task 3: CIA Factbook mirror ingest and matching

**Files:**
- Create: `scripts/dossiers/factbook.ts`, `scripts/dossiers/fetch-factbook.ts`, `tests/dossiers/factbook.test.ts`, `tests/fixtures/factbook/` (4 trimmed real country files: `in.json`, `bi.json`, `ws.json`, `wf.json`)
- Modify: `package.json` (script `data:factbook`)

**Interfaces:**
- Consumes: `CountryRow`, `Capital` (Plan 1 `capitals.json`: `{ name, country, lat, lon, rank }`).
- Produces: `type FactbookFacts = { governmentType?: string; languages?: string; independence?: string; organisations?: string; capitalName?: string; capitalLat?: number; capitalLon?: number }`; `parseFactbook(json: unknown): FactbookFacts` (only the enumerated fields; text trimmed; anything else ignored); `parseDms(text: string): { lat: number; lon: number } | null` ("28 36 N, 77 12 E"); `matchFactbook(files: Record<string, FactbookFacts>, caps: Capital[]): { byCountry: Record<string, string>; unmatched: string[] }` mapping ADM0_A3 -> factbook file key by capital coordinates (within 80 km of one of that country's NE capitals, nearest wins, a country is claimed by at most one file: the closest); `fetchFactbook(cacheDir, fetchFn?)` downloads the file list from the GitHub tree API and each country JSON (politeness rules) and writes `data/raw/factbook/<key>.json` plus `meta.json` with the mirror's latest commit date and sha.

- [ ] **Step 1: Write failing tests:** `parseDms('28 36 N, 77 12 E')` -> 28.6, 77.2; `'33 52 S, 151 12 W'` -> negative lat/lon; garbage -> `null`; `parseFactbook(in.json)` returns `governmentType 'federal parliamentary republic'` and a languages string starting with "Hindi", and **has no other keys** (no disputes or geography text leaks); missing sections return `{}`; `matchFactbook` maps India's file to `IND`; **Samoa and Wallis and Futuna: only the nearer file claims `WSM`** (Review Focus 3), the other lands in `unmatched`; Burundi's file matches `BDI` at 62 km; a file with no capital coordinates is `unmatched`; empty inputs do not throw.
- [ ] **Step 2: Run** -> FAIL. **Step 3: Implement.** **Step 4: Run** -> PASS; then `npm run data:factbook` for real and report matched/unmatched counts (expect about 193 matched).
- [ ] **Step 5: Docs:** DATA-SOURCES Factbook section: mirror URL and licence (CC0 repo), the **exact public-domain statement captured from cia.gov** (use the in-app browser if the page needs JavaScript; if it cannot be captured, say so and keep the attribution), the list of imported fields, and the rule "no free-text sections". **Step 6: Commit** `feat(dossiers): ingest CIA Factbook mirror and match it to countries`.

### Task 4: Official membership lists (UN, NATO)

**Files:**
- Create: `data/relations/memberships.json`, `tests/dossiers/memberships.test.ts`, `scripts/dossiers/memberships.ts`

**Interfaces:**
- Produces: `memberships.json` = `{ un: { members: string[]; observers: string[]; source: string; asOf: string }, nato: { members: string[]; source: string; asOf: string } }` with ids in **ADM0_A3**; `loadMemberships(path?): Memberships`; `membershipOf(m: Memberships, id: string): { un: 'member' | 'observer' | 'non-member'; nato: boolean }`.

- [ ] **Step 1: Write failing tests:** `nato.members.length === 32` and includes `FIN, SWE, USA, TUR`, excludes `JOR, MLT` (the Factbook false positives); `un.members.length === 193`, `observers` equals `['PSE', 'VAT']` sorted; every id exists in `public/data/countries.json`; no id in both members and observers; `membershipOf` for `IND` -> `{ un: 'member', nato: false }`, `VAT` -> observer, `TWN` -> `non-member`.
- [ ] **Step 2: Run** -> FAIL. **Step 3: Build the file** from the two official pages (fetch with a browser User-Agent for the UN page, read the lists, map names to ADM0_A3 with `countries.json`; any name that does not map is listed in the ledger and resolved by hand), record `source` URLs and `asOf` = today. **Step 4: Run** -> PASS. Cross-check against the Factbook organisation text (report differences, do not change the official lists).
- [ ] **Step 5: Docs:** DATA-SOURCES memberships section (sources, date, how to refresh by hand). **Step 6: Commit** `feat(dossiers): add official UN and NATO membership lists`.

### Task 5: Dossier builder and outputs

**Files:**
- Create: `scripts/dossiers/build-dossiers.ts`, `tests/dossiers/build-dossiers.test.ts`, `public/data/dossiers/` (generated, committed)
- Modify: `package.json` (script `data:dossiers`), `scripts/check-budgets.ts`, `tests/scripts/budgets.test.ts`

**Interfaces:**
- Produces in `src/dossier/types.ts`:
  - `type Provenance = { source: string; asOf: string; url?: string }`; `type Field<T> = ({ value: T } & Provenance) | null`.
  - `type Dossier = { id: string; iso2: string | null; iso3: string | null; name: string; formalName: string | null; type: string; continent: string | null; subregion: string | null; capitals: { name: string; lat: number; lon: number; note?: string }[]; neighbours: string[]; population: Field<number>; areaKm2: Field<number>; gdpUsd: Field<number>; milExpUsd: Field<number>; milExpGdpPct: Field<number>; governmentType: Field<string>; languages: Field<string>; independence: Field<string>; organisations: Field<string>; un: Field<'member' | 'observer' | 'non-member'>; nato: Field<boolean> }`.
  - `type CountryIndexEntry = { id: string; name: string; iso2: string | null; iso3: string | null; capitals: string[]; continent: string | null; lat: number; lon: number; hasPolygon: boolean }`.
- `buildDossier(row: CountryRow, caps: Capital[], wb: Record<keyof typeof WB_INDICATORS, Map<string, WbValue>>, wbMeta: { lastupdated: string }, fb: FactbookFacts | undefined, fbMeta: { commitDate: string; url: string }, mem: Memberships): Dossier` and `buildAll(...)` returning `{ dossiers: Dossier[]; index: CountryIndexEntry[] }`; CLI writes `public/data/dossiers/<id>.json` and `index.json`.
- Provenance rules: World Bank fields `source: 'World Bank WDI'` (`milExp*`: `'SIPRI via World Bank WDI'`), `asOf` = the data year as a string; Factbook fields `source: 'CIA World Factbook'`, `asOf` = the mirror commit date; memberships `source` = the official list URL host, `asOf` = list date; Natural Earth for names/capitals/neighbours is stated once in the panel footer, not per field.
- `checkBudgets` gains: `dossiers/index.json` at most 40 KB gzip, every `dossiers/*.json` at most 6 KB raw (skipped when absent).

- [ ] **Step 1: Write failing tests** with small fixtures: a country with every source present has all fields non-null with the right provenance; **a country with no World Bank row, no Factbook file and not in the membership lists has `null` for every sourced field and still has name, capitals, neighbours** (Review Focus 1: no 0/NaN/"undefined" anywhere: assert `JSON.stringify` contains no `NaN` or `undefined`); South Sudan (`SDS`) takes `SSD` World Bank values; Burundi gets Natural Earth's capital `Bujumbura` plus a `note` mentioning the Factbook's `Gitega`; `capitals` empty for a country without a capital row; `un`/`nato` come only from the membership lists; the index has one entry per country with lower-case-free original names; budgets: oversized index fails naming `index.json`, a 7 KB dossier fails naming the file, absent files pass.
- [ ] **Step 2: Run** -> FAIL. **Step 3: Implement.** **Step 4: Run** the tests -> PASS; then run the real pipeline `npm run data:dossiers`, `npm run check:budgets`, and report: files written, how many dossiers have each field non-null, total size.
- [ ] **Step 5: Docs:** DATA-SOURCES dossier section (layout, provenance rules, counts). **Step 6: Commit** `feat(dossiers): build per-country dossiers and search index` (generated files included).

### Task 6: Country event summary

**Files:**
- Create: `src/dossier/summary.ts`, `tests/dossier/summary.test.ts`

**Interfaces:**
- Consumes: `Snapshot` (Plan 2), `KINDS`, `tension` (Plan 2).
- Produces: `countrySummary(snaps: (Snapshot | undefined)[], countryId: string, nowS: number): { total: number; byKind: Record<Kind, number>; human: number; auto: number; daily: number[]; peakDay: number; tension: ReturnType<typeof tension> | null }` where `daily` has 30 bins, oldest first, UTC days ending at `nowS`'s day, `total` counts events of the last 30 days for that country across all snapshots without double counting an event present in two snapshots (same `timeS`, lat, lon, kind), and `tension` is computed from the newest snapshot only, `null` when no snapshot is loaded.

- [ ] **Step 1: Write failing tests:** counts per kind and per day on a hand-made snapshot; events outside 30 days and other countries ignored; the boundary day lands in the right bin; recent+archive overlap on the boundary day is not double counted; an unknown country id returns zeros and `daily` of 30 zeros; `snaps` all `undefined` -> zeros and `tension: null`; `tension.comparable` is passed through unchanged.
- [ ] **Step 2: Run** -> FAIL. **Step 3: Implement.** **Step 4: Run** -> PASS. **Step 5: Commit** `feat(dossiers): add per-country event summary`.

### Task 7: Dossier panel UI

**Files:**
- Create: `src/dossier/load.ts`, `src/ui/DossierPanel.tsx`, `src/ui/Field.tsx`, `src/ui/Sparkline.tsx`, `tests/dossier/load.test.ts`, `tests/ui/DossierPanel.test.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `Dossier`, `Field`, `countrySummary`, `useEvents`, `createLatest` (Plan 2).
- Produces: `loadDossier(id: string, fetchFn?: typeof fetch): Promise<Dossier | null>` (fetches `/data/dossiers/<id>.json`, validates the shape, caches per id, returns `null` on 404, bad JSON or a mismatched `id`, never throws); `<Field label value format? />` (renders the value or a redaction bar; the whole row has `tabIndex={0}`, `title` and `aria-label` of the form `"<label>: <value>. Source: <source>, as of <asOf>"` or `"<label>: unavailable"`); `<Sparkline data />` (SVG, 1px strokes, accessible title); `<DossierPanel countryId onClose />`.
- Visual: glass panel (1px border, 24-28 px radius, blur), mono labels above values, a spec table, a redaction bar is an inline block of bone colour at 85% that shows "unavailable" on hover/focus (the Declassify look), a footer listing each source with licence and date, a note when `tension.comparable` is false ("auto-coded data only: no tension level"), the 30-day sparkline, kind counts, human/auto split.

- [ ] **Step 1: Write failing tests:** `loadDossier` returns the dossier, caches (one fetch for two calls), returns `null` for 404, invalid JSON, a non-object, and an `id` that differs from the request (Review Focus 6); `Field`: a value shows source and as-of in its `aria-label`; `null` shows "unavailable" and no number or "undefined"/"NaN" text; `DossierPanel` with a fixture dossier shows the name, capital, neighbours as names, population formatted with separators, `unavailable` rows for nulls, the sources footer, and the "auto-coded data only" note when `comparable` is false; switching `countryId` quickly shows only the latest country (a slow first response must not overwrite it); a `null` load shows an error state with a close button; names with `<img onerror>` render as text.
- [ ] **Step 2: Run** -> FAIL. **Step 3: Implement** and mount the panel in `App` (left side on desktop, bottom sheet under 640 px). **Step 4: Run** `npm test && npm run typecheck && npm run build` -> PASS. **Step 5: Commit** `feat(ui): add sourced country dossier panel with redaction bars`.

### Task 8: Search index and command palette

**Files:**
- Create: `src/dossier/search.ts`, `src/ui/CommandPalette.tsx`, `tests/dossier/search.test.ts`, `tests/ui/CommandPalette.test.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `CountryIndexEntry`.
- Produces: `normalise(s: string): string` (lower case, NFD, diacritics and apostrophes removed, trimmed); `searchCountries(index: CountryIndexEntry[], query: string, limit?: number): { entry: CountryIndexEntry; via: 'name' | 'capital' | 'code'; match: string }[]` (default limit 8; ranking: exact ISO2/ISO3 > name prefix > capital prefix > word-prefix in name/capital > substring; ties by shorter name then alphabetical; empty query returns `[]`); `loadIndex(fetchFn?)` (cached `/data/dossiers/index.json`, `[]` on failure); `<CommandPalette onPick(id: string) />` opened by Ctrl/Cmd+K, closed by Esc.
- Accessibility: `role="dialog"`, `aria-modal`, input with `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`; list `role="listbox"` with `role="option"`; Up/Down/Home/End move, Enter picks, Esc closes and returns focus to the previously focused element; a visible "Search  Ctrl K" button for touch users.

- [ ] **Step 1: Write failing tests:** `normalise("Cote d'Ivoire") === 'cote divoire'`, `"Curaçao"` -> `'curacao'`; `searchCountries`: `'ind'` returns `IND` first via code, `'new d'` finds India via capital "New Delhi", `'cote'` finds Cote d'Ivoire, `'zzzz'` and `''` return `[]`, `limit` honoured, a name with `<b>` is returned verbatim (escaping is the renderer's job); palette (jsdom): Ctrl+K opens and focuses the input, typing filters, ArrowDown/Enter calls `onPick` with the id, Esc closes and restores focus, an empty result shows "No match", the button opens it, `aria-activedescendant` follows the selection, text with HTML characters is rendered as text, holding IME composition (`compositionstart`) does not fire Enter picks.
- [ ] **Step 2: Run** -> FAIL. **Step 3: Implement.** **Step 4: Run** -> PASS. **Step 5: Commit** `feat(ui): add Ctrl/Cmd-K command palette with country and capital search`.

### Task 9: Country Dive

**Files:**
- Create: `src/globe/dive.ts`, `src/lib/hashState.ts`, `tests/globe/dive.test.ts`, `tests/lib/hashState.test.ts`
- Modify: `src/globe/engine.ts`, `src/globe/GlobeCanvas.tsx`, `src/App.tsx`

**Interfaces:**
- Consumes: `CountryRow.bbox`, `lat`, `lon`; `latLonToVec3`; the engine's view state.
- Produces: `diveTarget(bbox: [number, number, number, number] | null, label: { lat: number; lon: number }): { lat: number; lon: number; distance: number }` (centre handles the antimeridian by averaging on the circle; `distance = clamp(1.25 + sizeRad * 1.8, 1.45, 3.6)` where `sizeRad` is the larger bbox side in radians; `bbox === null` uses the label point and 2.2); `easeDive(t: number): number` (0..1, exponential ease-out); `parseHash(h: string): { country: string | null }` and `formatHash(id: string | null): string` (`#c=IND`; invalid or lowercase ids normalise or return `null`; never throws).
- `GlobeHandle` additions: `dive(id: string | null, target?: { lat: number; lon: number; distance: number }): void` (camera flies 1.2 s with `easeDive`, instant under reduced motion; the country outline draws in over 1.2 s; other borders dim to 0.25 opacity; `null` restores); `onView(cb)` is added in Task 10. Esc exits the dive. The App keeps `diveId` in state and mirrors it to `location.hash`; a hash present on load dives after the boot is done (or immediately if skipped); `hashchange` is honoured.
- Dive entry points: click a country (picker id), choose in the palette, and capital markers (Task 10).

- [ ] **Step 1: Write failing tests:** `diveTarget`: Luxembourg-sized bbox -> distance 1.45 (floor); a huge bbox -> 3.6 (cap); distance is monotonic in size; **Fiji's bbox (w > e) centres near lon 180, not near 0** and Russia's and the USA's likewise; Antarctica (lat -90..-60, all longitudes) gives a finite centre and distance 3.6; `null` bbox falls back to the label point; `easeDive` is 0 at 0, 1 at 1, monotonic; `parseHash`: `'#c=IND'` -> `IND`, `'#c=ind'` -> `IND`, `'#c='`, `'#x=1'`, `'#c=<script>'`, `''` -> `null`; `formatHash(null) === ''`, `formatHash('IND') === '#c=IND'`.
- [ ] **Step 2: Run** -> FAIL. **Step 3: Implement** the pure modules, then the engine camera animation (target lat/lon/distance with interpolation and a latest-wins rule: a new dive or an exit cancels the previous animation), the outline draw-in and dimming, and the App wiring. **Step 4: Run** `npm test && npm run typecheck && npm run build` -> PASS.
- [ ] **Step 5: Manual browser check (record what you saw):** click India, Russia, Fiji, Luxembourg and Antarctica; Esc; palette dive; reload with `#c=IND`; quick repeated clicks; frame rate during a dive. **Step 6: Commit** `feat(globe): add Country Dive with fly-to, outline draw-in, dimming and deep links`.

### Task 10: Capital markers and label LOD

**Files:**
- Create: `src/globe/labels.ts`, `src/ui/CapitalLabels.tsx`, `tests/globe/labels.test.ts`, `tests/ui/CapitalLabels.test.tsx`
- Modify: `src/globe/engine.ts`, `src/globe/GlobeCanvas.tsx`, `src/App.tsx`

**Interfaces:**
- Consumes: `Capital` (`public/data/capitals.json`), `latLonToVec3`.
- Produces: `selectCapitals(caps: Capital[], view: { lat: number; lon: number; distance: number }, diveId: string | null, cap?: number): Capital[]` (none when `distance > 3.2` and no dive; by distance: `> 2.4` ranks <= 2 (at most 12), `> 1.8` ranks <= 4 (at most 24), otherwise ranks <= 7 (at most `cap`, default 40); in a dive the dived country's capitals are always included; only capitals on the visible hemisphere, i.e. `dot(normal, viewDirection) > 0.12`; stable order); `GlobeHandle.setCapitals(caps)` and `onView(cb: (v: { lat: number; lon: number; distance: number }) => void)` (called at most 15 times a second and only when the view changed); the engine draws a 1px cyan crosshair marker (one `THREE.Points`) for the selected capitals; `<CapitalLabels labels />` renders at most `cap` absolutely positioned mono labels from projected screen positions supplied by the engine (`onLabels(cb: (l: { id: string; name: string; x: number; y: number }[]) => void)`).
- Clicking within 14 px of a visible capital marker dives into that capital's country (this also covers micro-states with no polygon, e.g. the Holy See).

- [ ] **Step 1: Write failing tests:** `selectCapitals`: far view returns `[]`; mid view returns only rank <= 2 and at most 12; near view at most `cap`; far side of the globe is excluded (a capital at the antipode of the view); a dive on `FRA` forces Paris even when it would otherwise be hidden by rank; no duplicates; deterministic order; empty input; `CapitalLabels` renders exactly the given labels as text, never more than `cap`, escapes HTML characters, and has `aria-hidden` (decorative: the palette and the dossier are the accessible route).
- [ ] **Step 2: Run** -> FAIL. **Step 3: Implement.** **Step 4: Run** `npm test && npm run typecheck && npm run build` -> PASS.
- [ ] **Step 5: Manual browser check:** zoom from far to near and watch labels appear and disappear; click a capital marker; click Vatican City's marker; confirm frame rate with 40 labels. **Step 6: Commit** `feat(globe): add capital markers and zoom-based label levels`.

### Task 11: Close-out

**Files:**
- Modify: `docs/DECISIONS.md`, `docs/ROADMAP.md`, `docs/README.md`, `README.md`, `docs/TECH-STACK.md`, `docs/BACKLOG.md`

- [ ] **Step 1: Run** the full suite twice, `npm run typecheck`, `npm run build`, `npm run check:budgets`; report numbers (bundle size, dossier sizes). **Step 2: Browser pass** on the finished app (dossier open with events, palette, dive, labels): console clean, frame rate, record. **Step 3: Docs:** DECISIONS (data sources and mapping choices, Factbook field whitelist, memberships from official lists, committed dossiers, Burundi note), ROADMAP status, README quick start (`data:wb`, `data:factbook`, `data:dossiers` refresh commands), BACKLOG (what was deferred). **Step 4: Commit** `docs(plan-3): close out dossiers and navigation`.

---

## Self-review

- **Spec coverage (spec sections 5, 6, 8):** dossier fields with source and date and redaction (5, 7); Country Dive and Cmd/Ctrl-K (9, 8); level-of-detail capitals and labels (10); micro-state lookup via capital markers (10); neighbours and names from India-POV data (1); official memberships (4); recent-event summary and 30-day chart (6, 7); tension shown only when comparable (7). **Not in this plan:** ally and "active dispute" relations and arcs (Plan 4), UN/NATO beyond the two flags (organisation text is shown as the Factbook states it), alliance datasets, the About/Sources page (Plan 6).
- **Types:** `CountryRow`, `Dossier`, `Field`, `CountryIndexEntry`, `Capital`, `WbValue`, `FactbookFacts`, `Memberships`, `countrySummary`, `diveTarget`, `selectCapitals` are defined once and used consistently.
- **Not verified (to check during the work):** the WDI dataset's exact licence line and the Factbook public-domain statement; whether the High-detail France polygon touches `BRA`/`SUR`; Factbook field availability beyond the 4 fixture countries; performance of 40 projected labels per frame on the integrated GPU; UN page structure for parsing.
