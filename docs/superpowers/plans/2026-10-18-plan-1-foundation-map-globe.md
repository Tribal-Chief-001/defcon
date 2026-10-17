# Defcon Plan 1: Foundation, India-correct map, and the globe core

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Vite + React + TypeScript app that renders a hairline 3D globe with accurate, India-official borders and capitals, picks countries on click, opens with the Sonar Boot, and has guard tests that fail if India's map is ever wrong.

**Architecture:** Offline build scripts turn Natural Earth (India point-of-view file) into compact TopoJSON in two detail levels plus a capitals file, applying patches and guarded by tests. The browser loads the low-detail file first, then the high-detail file. A custom Three.js engine (imperative, outside React) draws borders as GPU line geometry; React only mounts a canvas and the UI chrome. Pure functions (geo math, picking, boot timeline, frame stats) carry the logic so they can be unit-tested without WebGL.

**Tech Stack:** Vite, React, TypeScript (strict), Three.js, Zustand (installed here, used from Plan 2), Tailwind CSS (via its Vite plugin), Vitest, d3-geo, topojson-server/-client/-simplify, `shapefile`, turf (union/difference), @fontsource (Syne, Space Grotesk, JetBrains Mono).

**Spec:** `docs/superpowers/specs/2026-10-18-defcon-design.md` (approved 2026-10-18). Roadmap for the other plans: `docs/ROADMAP.md`.

## Global Constraints

Copied from the spec; every task includes these.

- Background `#000000`. Text `#EDEDE9`. Accents: lime `#D6FF57` (primary), orange `#FF4D00` (alert), cyan `#00FFF0` (data). At most two accents on one screen.
- Fonts: Syne 700/800 (display), Space Grotesk 300/400/600 (body), JetBrains Mono 400/700 (labels, data). Self-hosted, not from a CDN.
- 1px borders, **no `box-shadow` anywhere**, no gradient text, no emoji in UI, no stock icon packs.
- One easing: `cubic-bezier(0.16, 1, 0.3, 1)`.
- India's boundary must match India's official map (Survey of India reference). Source file: Natural Earth `ne_10m_admin_0_countries_ind`. Never use OSM/Protomaps-style border tiles. No alternative-worldview toggle.
- WebGL2 floor, no WebGPU. 60 fps target on Intel i5-10210U integrated graphics. Initial JS under 250 KB gzip (before data). Low-detail border data at most 300 KB, high-detail at most 1 MB.
- `prefers-reduced-motion` disables the boot and auto-rotation.
- Secrets only in gitignored `.env` files; never print or commit them. Never create accounts.
- Dev machine has 7.4 GB RAM: run one build/test process at a time (`vitest run`, never watch mode in scripts; no parallel Vite + tests).
- Every task updates `docs/` where it changes a decision or a data source, and ends with a commit written as a ledger entry (header `type(scope): summary`; sections Why, Inventory, Verification including what was NOT verified; then the attribution trailer from the session's system reminder).

## Review Focus

Inputs the spec implies but its tasks would not otherwise exercise. Each has a test in the task named in brackets.

1. A click that lands in the ocean or on a pole must return `null`/`ATA`, never a wrong country (d3 winding inversion returns the *complement* of a country if rings are wound wrongly). [Task 7]
2. Antimeridian: Fiji (≈ lat -17.7, lon 178.0 and -179.9) and Chukotka (≈ 66, -170) must pick correctly, and no border segment may cut through the sphere's interior. [Tasks 6, 7]
3. No WebGL2 (old browser, blocked GPU, lost context): show a clear message, never a blank screen or a thrown error. [Task 8]
4. `prefers-reduced-motion: reduce`: boot is skipped and the globe does not spin. [Task 9]
5. Patching India/China polygons must not create overlaps or gaps: feature count unchanged, a point inside the patch resolves to exactly one country. [Task 3]

---

### Task 1: Scaffold, tokens, and design guard tests

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/styles/tokens.css`, `src/styles/index.css`, `tests/design/tokens.test.ts`, `tests/design/forbidden.test.ts`
- Modify: `.gitignore` (add `data/raw/`)

**Interfaces:**
- Produces: CSS custom properties `--bg --text --text-muted --text-faint --border --border-strong --lime --orange --cyan --ease` in `src/styles/tokens.css`; npm scripts `dev`, `build`, `test` (= `vitest run`), `typecheck` (= `tsc --noEmit`).

- [ ] **Step 1: Write failing tests**
  - `tests/design/tokens.test.ts`: read `src/styles/tokens.css`; assert it contains exactly `--bg: #000000`, `--text: #EDEDE9`, `--lime: #D6FF57`, `--orange: #FF4D00`, `--cyan: #00FFF0`, `--border: rgba(255,255,255,.08)`, and `--ease: cubic-bezier(0.16, 1, 0.3, 1)`.
  - `tests/design/forbidden.test.ts`: glob `src/**/*.{css,ts,tsx}`; assert none match `/box-shadow/`, `/text-shadow/` is allowed, none match `/background-clip:\s*text/` (gradient text), none import `lucide-react`.
- [ ] **Step 2: Run** `npx vitest run tests/design` → FAIL (files missing).
- [ ] **Step 3: Scaffold** the project manually (no interactive `npm create`, the folder is not empty): install the stack above; Tailwind configured via its Vite plugin; `tokens.css` defines the variables and sets `body{background:var(--bg);color:var(--text)}`; import `@fontsource/syne/700.css`, `/800.css`, `@fontsource/space-grotesk/{300,400,600}.css`, `@fontsource/jetbrains-mono/{400,700}.css` in `src/main.tsx`; `App.tsx` renders an empty black full-viewport `<main>`.
- [ ] **Step 4: Run** `npm test && npm run typecheck && npm run build` → all PASS.
- [ ] **Step 5: Commit** `feat(app): scaffold Vite React TS app with design tokens and guard tests`.

### Task 2: Fetch and pin Natural Earth data

**Files:**
- Create: `scripts/map/fetch.ts`, `scripts/map/verify.ts`, `data/map/sources.json`, `tests/map/verify.test.ts`
- Modify: `package.json` (script `map:fetch`)

**Interfaces:**
- Produces: `verifySha256(bytes: Uint8Array, expectedHex: string): boolean` in `scripts/map/verify.ts`. `sources.json` shape: `{ files: { name: string; url: string; sha256: string; neVersion: string }[] }`. Fetched files land in `data/raw/ne/` (gitignored).

- [ ] **Step 1: Write failing test** `verify.test.ts`: `verifySha256(new TextEncoder().encode('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad') === true`; a different hash → `false`; uppercase hex of the right hash → `true`.
- [ ] **Step 2: Run** `npx vitest run tests/map/verify.test.ts` → FAIL.
- [ ] **Step 3: Implement** `verifySha256` (Node `crypto`). Implement `fetch.ts`: for each entry in `sources.json` download to `data/raw/ne/`, unzip, verify the hash; on mismatch exit 1 unless `--accept-new` is passed, in which case rewrite the entry's `sha256`. Files: `ne_10m_admin_0_countries_ind` (https://naciscdn.org/naturalearth/10m/cultural/ne_10m_admin_0_countries_ind.zip, version 5.1.1) and `ne_10m_populated_places_simple`. **Note:** `ne_50m_*_ind` and `ne_110m_*_ind` do not exist (HTTP 403 checked 2026-10-18); the low-detail layer is derived by simplification in Task 3.
- [ ] **Step 4: Run** the test → PASS. Then `npm run map:fetch -- --accept-new` and confirm `data/map/sources.json` now holds real hashes and `data/raw/ne/` has both shapefiles; run `npm run map:fetch` again (without the flag) → exit 0.
- [ ] **Step 5: Commit** `feat(map): pin Natural Earth India-POV and populated-places sources by SHA-256`. Add DATA-SOURCES.md entry (source, version, licence public domain, fetch date).

### Task 3: Build border data (two detail levels) and the patch engine

**Files:**
- Create: `scripts/map/build-borders.ts`, `scripts/map/patches.ts`, `data/map/patches/` (empty dir with `.gitkeep`), `tests/map/patches.test.ts`, `tests/map/borders.test.ts`
- Output (committed): `public/data/borders.high.topo.json`, `public/data/borders.low.topo.json`
- Modify: `package.json` (script `map:build`)

**Interfaces:**
- Produces: `type Patch = { id: string; op: 'add-to' | 'cut-from'; country: string; geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon; source: string }`; `applyPatches(fc: GeoJSON.FeatureCollection, patches: Patch[]): GeoJSON.FeatureCollection` (country matched on `properties.ADM0_A3`); `buildBorders(shpPath: string, dbfPath: string, outDir: string): Promise<{ countries: number; highBytes: number; lowBytes: number }>`. Each TopoJSON has object `countries` whose geometries carry `properties: { id: string /* ADM0_A3 */, name: string }`.

- [ ] **Step 1: Write failing tests**
  - `patches.test.ts`: synthetic collection of two adjacent squares "AAA" and "BBB". Patch `{op:'add-to', country:'AAA', geometry: square straddling the border}` plus the matching `{op:'cut-from', country:'BBB', same geometry}`. Assert feature count is unchanged (Review Focus 5), a point inside the patch is contained by AAA and **not** by BBB, and a point outside the patch is unchanged.
  - `borders.test.ts` (runs on built output): both files parse; `countries` ≥ 240 geometries; ids include `IND`, `PAK`, `CHN`, `ATA`, `FJI`; `statSync(low).size <= 300_000`; `statSync(high).size <= 1_000_000`.
- [ ] **Step 2: Run** `npx vitest run tests/map` → FAIL.
- [ ] **Step 3: Implement** `applyPatches` with turf `union`/`difference`. Implement `buildBorders`: read shapefile via `shapefile`, apply patches in `data/map/patches/*.json`, build topology with `topojson-server`, quantize, then write *high* (quantization about 1e5) and *low* (`presimplify` + `simplify` to a weight that meets the 300 KB cap, then coarser quantization). Pick the simplification weight by testing, record it in `docs/DATA-SOURCES.md`.
- [ ] **Step 4: Run** `npm run map:build && npx vitest run tests/map` → PASS. Print the byte sizes in the commit message.
- [ ] **Step 5: Commit** `feat(map): build India-POV border TopoJSON at two detail levels with patch engine`.

### Task 4: India guard (the map-correctness tripwire)

**Files:**
- Create: `data/map/india-guard.json`, `tests/map/india-guard.test.ts`, `tests/map/india-outline.test.ts`, `data/map/india-outline.sha256`, `scripts/map/pin-india.ts`, `docs/MAP-POLICY.md`
- Modify: `package.json` (script `map:pin-india`)

**Interfaces:**
- Consumes: Task 7's `createPicker` is **not** used here; this task uses `d3-geo` `geoContains` directly on `borders.high.topo.json` features so the guard does not depend on the picker.
- Produces: `india-guard.json` entries `{ name: string; lat: number; lon: number; expect: string; status: 'verified' | 'pending-owner' }`.

- [ ] **Step 1: Write failing tests**
  - `india-guard.test.ts`: for every entry with `status:'verified'` assert exactly one country contains the point and it equals `expect`. Entries with `status:'pending-owner'` are reported via `console.warn` (count shown) and skipped.
  - `india-outline.test.ts`: canonical outline of `IND` (coordinates rounded to 4 decimals, JSON-stringified) hashed with SHA-256 equals the contents of `data/map/india-outline.sha256`.
- [ ] **Step 2: Run** → FAIL (no data file).
- [ ] **Step 3: Create `india-guard.json`.** Measured 2026-10-18 against the unpatched Natural Earth India file, **already contained by IND:** Srinagar (34.08, 74.80), Leh (34.15, 77.58), Gilgit (35.92, 74.31), Muzaffarabad (34.37, 73.47), Skardu (35.30, 75.62), Aksai Chin (35.2, 79.5), Kargil (34.56, 76.13), Tawang (27.59, 91.86), Itanagar (27.08, 93.62), New Delhi (28.61, 77.21): mark `verified`. Controls that must stay outside: Islamabad (33.69, 73.05) `PAK`, Lahore (31.55, 74.34) `PAK`, Kathmandu (27.71, 85.32) `NPL`, Lhasa (29.65, 91.14) `CHN`: `verified`. **Shaksgam Valley (36.2, 77.0) resolves to CHN in the unpatched file; India's official map includes Shaksgam. Add it with `expect:'IND'`, `status:'pending-owner'`.** The coordinates of this and any further point must be checked against the Survey of India map by the owner before `verified`.
- [ ] **Step 4: Owner gate.** Ask the owner to supply or approve a reference polygon for Shaksgam (and review the full point list). When approved: add `data/map/patches/india-shaksgam.json` with an `add-to IND` patch and a matching `cut-from CHN` patch (`source` field names the reference), rebuild, flip the entry to `verified`, then `npm run map:pin-india` and note in the ledger. **All other tasks proceed without this gate; Plan 1 is not "done" until it clears.**
- [ ] **Step 5: Write `docs/MAP-POLICY.md`** (authority = Survey of India, patch process, how to change the pinned outline: only with an owner-approved ledger entry) and a ledger entry.
- [ ] **Step 6: Run** `npm test` → PASS (pending entries warn). **Step 7: Commit** `test(map): add India guard points and pinned outline checksum`.

### Task 5: Capitals and places

**Files:**
- Create: `scripts/map/build-places.ts`, `tests/map/places.test.ts`; output `public/data/capitals.json`
- Modify: `package.json` (script `map:build` also runs this)

**Interfaces:**
- Produces: `type Capital = { name: string; country: string /* ADM0_A3 */; lat: number; lon: number; rank: number }`; `buildCapitals(shpPath: string, dbfPath: string, outPath: string): Promise<Capital[]>`.

- [ ] **Step 1: Write failing test** on `public/data/capitals.json`: length ≥ 190; contains `{name:'New Delhi', country:'IND'}` within 0.5° of (28.61, 77.21); every `lat` in [-90, 90], every `lon` in [-180, 180]; no duplicate `name+country`; file ≤ 60 KB.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** `buildCapitals`: keep rows whose `FEATURECLA` marks an admin-0 capital (inspect the real values in the dbf first and record them in DATA-SOURCES.md); map `ADM0_A3` and `SCALERANK`→`rank`; round coordinates to 4 decimals.
- [ ] **Step 4: Run** → PASS. **Step 5: Commit** `feat(map): build capitals dataset from Natural Earth populated places`.

### Task 6: Geo math and border geometry

**Files:**
- Create: `src/lib/geo.ts`, `src/globe/borderGeometry.ts`, `tests/lib/geo.test.ts`, `tests/globe/borderGeometry.test.ts`

**Interfaces:**
- Produces:
  - `latLonToVec3(latDeg: number, lonDeg: number, r?: number): [number, number, number]` with x = r·cosφ·sinλ, y = r·sinφ, z = r·cosφ·cosλ (lon 0 faces +z).
  - `vec3ToLatLon(x: number, y: number, z: number): { lat: number; lon: number }`.
  - `buildBorderPositions(topo: Topology, radius: number, maxSegDeg?: number): Float32Array` (pairs of vertices for `THREE.LineSegments`, from `mesh(topo, topo.objects.countries)`; segments longer than `maxSegDeg`, default 1°, are subdivided along the great circle).

- [ ] **Step 1: Write failing tests**
  - `geo.test.ts`: `(0,0)→(0,0,1)`, `(0,90)→(1,0,0)`, `(90,0)→(0,1,0)` within 1e-9; round-trip `vec3ToLatLon(latLonToVec3(lat,lon))` for 200 random points returns the input within 1e-9 (lon -180 and 180 allowed to alias); `r=2` scales length to 2.
  - `borderGeometry.test.ts`: on the low TopoJSON, positions length is a multiple of 6, no NaN, every vertex length within 1e-6 of `radius`; and for a synthetic topology with one arc from lon 179° to lon -179° at the equator, the output contains a vertex with |lon| > 179.4 and none whose chord midpoint lies inside radius·0.99 (no cut through the sphere) (Review Focus 2).
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** both modules; subdivision uses spherical interpolation between consecutive vertices after converting with `latLonToVec3`. **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(globe): add geo math and great-circle-subdivided border geometry`.

### Task 7: Country picker

**Files:**
- Create: `src/globe/pick.ts`, `tests/globe/pick.test.ts`

**Interfaces:**
- Consumes: TopoJSON from Task 3 (`countries` object, `properties.id`).
- Produces: `createPicker(topo: Topology): (lat: number, lon: number) => string | null` returning the `ADM0_A3` id or `null`; uses `topojson-client` `feature` and `d3-geo` `geoContains` with a `geoBounds` prefilter built once.

- [ ] **Step 1: Write failing tests** against `borders.high.topo.json`: `(28.61, 77.21)→'IND'`; `(35.92, 74.31)→'IND'` (Gilgit); `(33.69, 73.05)→'PAK'`; ocean `(0, -140)→null` and `(-30, -30)→null` (Review Focus 1: a wrong-winding bug would return a country here); `(-85, 0)→'ATA'`; `(-17.7, 178.0)→'FJI'` and `(-17.7, -179.9)→'FJI'`; `(66, -170)→'RUS'` (Review Focus 2); lat/lon NaN → `null` without throwing. Also assert 1,000 random picks run in under 200 ms.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** If any ocean test fails, the cause is ring winding: fix in the build (`geoStitch`/rewind to d3's clockwise-exterior convention) not in the test. **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(globe): add antimeridian-safe country picker`.

### Task 8: Globe engine and canvas

**Files:**
- Create: `src/globe/engine.ts`, `src/globe/GlobeCanvas.tsx`, `src/globe/capabilities.ts`, `src/globe/Unsupported.tsx`, `tests/globe/capabilities.test.ts`, `tests/globe/GlobeCanvas.test.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Produces:
  - `hasWebGL2(makeCanvas?: () => { getContext(id: string): unknown }): boolean`.
  - `createGlobe(opts: { canvas: HTMLCanvasElement; low: Topology; high?: Topology; reducedMotion: boolean }): GlobeHandle` where `GlobeHandle = { setHighDetail(t: Topology): void; setHighlight(id: string | null): void; onPick(cb: (id: string | null, lat: number, lon: number) => void): () => void; boot: BootControl; dispose(): void }` (`BootControl` is defined in Task 9; until then a stub `{ skip(): void }`).
  - `<GlobeCanvas />` fetches `/data/borders.low.topo.json`, then `/data/borders.high.topo.json`, and mounts the engine.
- Behaviour: black clear colour; border lines 1px, colour `#EDEDE9` at about 0.5 alpha with the sphere rim slightly brighter; faint graticule every 30°; slow auto-rotate when not reduced-motion and not interacting; drag to orbit with damping; wheel zoom clamped; pointer click raycasts the sphere → `vec3ToLatLon` → picker; hovered/selected country outline drawn in lime; render loop pauses when the tab is hidden; `dispose()` frees geometries, materials, listeners and the renderer; `devicePixelRatio` capped at 2; handles resize and WebGL context loss (shows `<Unsupported/>`).

- [ ] **Step 1: Write failing tests**: `hasWebGL2(() => ({ getContext: () => null }))` is `false`, and `true` when it returns an object (Review Focus 3); `GlobeCanvas` test with `hasWebGL2` mocked false renders text matching `/WebGL2/i` and no canvas.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** the modules; keep Three.js imports out of React files except the canvas ref. **Step 4: Run** `npm test && npm run typecheck && npm run build` → PASS.
- [ ] **Step 5: Manual verification (record results, do not assume):** `npm run dev`, open in the Browser pane. Check: borders visible, Kashmir/Ladakh/Arunachal drawn as part of India, drag/zoom work, clicking India highlights it lime, clicking the ocean highlights nothing, no console errors. Note the observed frame rate on the owner's laptop.
- [ ] **Step 6: Commit** `feat(globe): add Three.js hairline globe engine with picking and WebGL2 fallback`.

### Task 9: Sonar Boot

**Files:**
- Create: `src/globe/boot.ts`, `src/lib/motion.ts`, `tests/globe/boot.test.ts`, `tests/lib/motion.test.ts`
- Modify: `src/globe/engine.ts`

**Interfaces:**
- Produces: `bootState(tMs: number): { dot: number; ring: number; equator: number; meridians: number; borders: number; done: boolean }` (each 0..1); `prefersReducedMotion(mm?: (q: string) => { matches: boolean }): boolean`; `type BootControl = { skip(): void; readonly done: boolean }`.
- Timeline (ms): dot 0-400, ring 400-1200, equator 1000-1800, meridians 1600-2400, borders 2200-3200; `done` at ≥ 3200.

- [ ] **Step 1: Write failing tests**: all values 0 at `t=0` except `dot` starting; each channel monotonic non-decreasing across 0..4000 in 50 ms steps; `done` false at 3199 and true at 3200; `prefersReducedMotion` true when the injected `matchMedia` matches `(prefers-reduced-motion: reduce)` (Review Focus 4); engine test (with a stubbed renderer if feasible, else asserted through `createGlobe`'s `boot.done === true` at construction when `reducedMotion: true`).
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** `bootState` with an ease built from the project easing, and wire the engine: dot, expanding ring (the ring radius reaches the globe rim and then *is* the equator), meridians drawn by growing their arcs, borders revealed via `geometry.setDrawRange`. Any key or click calls `boot.skip()`. Show once per session (`sessionStorage`, wrapped in try/catch). `reducedMotion` → boot already done and no auto-rotate.
- [ ] **Step 3b: Run** → PASS. **Step 4: Manual check** in the browser: boot plays about 3 s, skip works, reload within the session skips it, reduced-motion (emulated) shows the finished globe instantly. **Step 5: Commit** `feat(globe): add Sonar Boot intro with skip and reduced-motion handling`.

### Task 10: Budgets, frame stats, docs close-out

**Files:**
- Create: `scripts/check-budgets.ts`, `src/dev/frameStats.ts`, `tests/dev/frameStats.test.ts`, `tests/scripts/budgets.test.ts`, `docs/TECH-STACK.md`, `docs/ROADMAP.md` (if absent), `docs/DESIGN-LANGUAGE.md`
- Modify: `package.json` (script `check:budgets`), `docs/README.md`, `docs/DECISIONS.md`

**Interfaces:**
- Produces: `createFrameStats(windowSize?: number): { tick(nowMs: number): void; fps(): number; p95FrameMs(): number }`; `checkBudgets(distDir: string, dataDir: string): { ok: boolean; failures: string[] }` (JS gzip total < 250 KB; low border file ≤ 300 KB; high ≤ 1 MB).

- [ ] **Step 1: Write failing tests**: 120 ticks at 16.667 ms → `fps()` within 0.5 of 60 and `p95FrameMs()` ≈ 16.7; one 100 ms spike raises `p95FrameMs()` only when it falls in the window; `checkBudgets` on a temp dir with a 300 KB-gzip JS file → `ok:false` and a failure naming the file.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement**; show frame stats in a hidden dev overlay toggled with the backtick key (dev builds only).
- [ ] **Step 4: Run** `npm run build && npm run check:budgets && npm test` → PASS; report actual numbers.
- [ ] **Step 5: Docs.** Write `DESIGN-LANGUAGE.md` (spec section 4), `TECH-STACK.md` (versions actually installed), update `README.md` index and `DECISIONS.md` for any choices made (simplification weight, capital class values, any deviations). **Step 6: Commit** `docs(plan-1): close out foundation with budgets, frame stats, and ledger`.

---

## Self-review

- **Spec coverage (Plan 1 scope):** India-correct borders and guard (Tasks 3, 4, 7), capitals (5), Sonar Boot (9), custom Three.js globe with adaptive-free baseline and picking (6-8), tokens/fonts/forbidden patterns (1), performance budgets (10), docs ledger (every task, 10). Out of Plan 1 and listed in `docs/ROADMAP.md`: events/live data (Plan 2), dossiers, ⌘K, Country Dive (Plan 3), Pulse Border, Grain, Radar, Arcs, Declassify, Night Watch, Sound, terminator (Plan 4), adaptive quality tiers, a11y audit, About/Sources, deploy (Plan 5).
- **Known gap:** Shaksgam patch depends on an owner-supplied reference polygon (Task 4, Step 4). Plan 1 is not complete until it clears.
- **Types:** `createPicker`, `latLonToVec3`, `buildBorderPositions`, `bootState`, `BootControl`, `GlobeHandle` are defined once and used consistently.
- **Not verified:** exact package versions and the Tailwind/Vite plugin setup (the implementer follows each library's current docs); `FEATURECLA` capital values (to inspect in the dbf); simplification weights (found by measurement).
