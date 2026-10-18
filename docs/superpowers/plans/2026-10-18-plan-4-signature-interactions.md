# Signature Interactions Implementation Plan (Plan 4)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (Native: one session does every task, one fresh Sonnet reviewer at the end) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the signature features that are not done yet: Alliance Arcs, a time scrubber with Declassify, Grain = Data, the day/night terminator, Cursor = Radar, Pulse Border, Night Watch and World Sound.

**Architecture:** Each feature is a small pure module (maths, selection, state machine) with unit tests, plus either a Three.js layer file under `src/globe/` that `engine.ts` mounts, or a React component under `src/ui/`. Time travel is one shared state (`useTime`, seconds "back from now"); the event layer, grain, terminator, scrubber and sound all read it. Real data is never hidden or invented (Declassify is cosmetic, Pulse colour follows the tension index only when `comparable`, arcs come only from sourced data).

**Tech Stack:** TypeScript strict, Three.js 0.186 (ShaderMaterial, LineSegments, Points), React 19, Zustand, Web Audio API, Vitest + Testing Library (jsdom). No new runtime dependency.

**Spec:** `docs/superpowers/specs/2026-10-18-defcon-design.md` (sections 5, 7, 8). Earlier plans: Plan 1 (map and globe), Plan 2 (events), Plan 3 (dossiers, dive, palette, labels). Decisions D-001..D-040 in `docs/DECISIONS.md`.

## Global Constraints

- True black `#000000` background; 1px hairlines, **no `box-shadow`**; radius 24-28px cards, 100px pills; one easing `cubic-bezier(0.16, 1, 0.3, 1)`; tokens `--lime #D6FF57`, `--orange #FF4D00`, `--cyan #00FFF0`, bone `#EDEDE9`; violence orange, protests bone, selection lime.
- 60 fps on the owner's laptop with every feature active (Intel UHD, 474 px pane measured at 60 fps before this plan). Measure after each globe task; if a task costs more than 2 ms per frame, make it cheaper before moving on.
- Every motion feature respects `prefers-reduced-motion` (`src/lib/motion.ts`): grain static, pulse static colour, Night Watch without letterbox animation/typewriter and with instant camera moves, no scrub playback animation.
- Maps follow India's official perspective; arcs and the terminator never change a border. Allies = formal treaty memberships only; "Active disputes" = pairs on opposing sides of a UCDP state-based interstate dyad, source shown; a pair without a record has no arc; no editorial opinion.
- World Sound is **off by default**, never autoplays, one toggle, remembered (`localStorage`, wrapped in try/catch); `AudioContext` is created only inside the toggle's click handler.
- Real data are never hidden or invented. Missing is "unavailable". Tension is shown or used only when `comparable` (D-031).
- Initial JS stays under the 250 KB gzip budget (216 KB now). Night Watch, Sound and the scrubber may be dynamically imported if the budget needs it. Never raise a budget without a DECISIONS entry.
- Machine rule: one vitest/vite/build process at a time.

## Review Focus

1. Scrubbing back to the start of the archive, to "now", rapidly, and with no data loaded: no NaN/negative ages, no events from the future of the playhead, controls usable by keyboard, LIVE restores exactly "now". [Tasks 4, 5]
2. Arcs: a country with no allies and no disputes shows nothing (and says so in the dossier); hover on open water or a micro-state never throws; the antimeridian and antipodal pairs draw a sane arc; no arc ever appears without a source in the data. [Tasks 1, 2, 3]
3. Night Watch and Sound against the browser: idle timer cancelled by any input including touch and key; never starts while the palette, dossier, event card, scrubber or Sound toggle is in use; no audio before a click; `AudioContext` suspended/closed states, no more than 6 pings per second, audio nodes freed. [Tasks 9, 10]
4. Reduced motion: every feature has a static or instant fallback and nothing animates by default (grain, pulse, Night Watch, scrub playback). [Tasks 5, 6, 8, 9, 10]
5. Cursor reticle on touch devices and over UI panels: no stuck reticle, no hidden system cursor over the panels, no per-pointer-move React render storm. [Task 7]

---

## Files (decomposition)

| File | Responsibility |
|------|----------------|
| `data/relations/alliances.json` | curated, sourced alliance memberships (hand-verified, committed) |
| `scripts/relations/build-relations.ts`, `scripts/relations/disputes.ts` | derive disputes from the pinned UCDP GED CSVs; write `public/data/relations.json` |
| `src/relations/types.ts`, `src/relations/load.ts`, `src/relations/lookup.ts` | `Relations` type, loader, `relationsFor(id)` |
| `src/globe/arcs.ts`, `src/globe/arcLayer.ts` | great-circle arc geometry (pure) and the Three.js layer (solid cyan, dashed orange) |
| `src/time/store.ts` | `useTime` Zustand store: `backS`, `playing`, helpers |
| `src/ui/Scrubber.tsx` | accessible time slider, LIVE and Play buttons |
| `src/ui/redaction.ts`, edit `src/ui/EventCard.tsx` | Declassify bars (cosmetic) |
| `src/globe/grain.ts`, `src/globe/grainLayer.ts` | density grid (pure) and the shader sphere |
| `src/globe/sun.ts`, `src/globe/terminatorLayer.ts` | subsolar point (pure) and the terminator line |
| `src/ui/Reticle.tsx`, `src/globe/radar.ts` | Cursor = Radar |
| `src/ui/TopBar.tsx`, `src/ui/pulse.ts`, `src/ui/PulseBorder.tsx` | top bar with the pulse border |
| `src/watch/nightWatch.ts`, `src/ui/NightWatch.tsx` | idle state machine, target choice, letterbox and caption |
| `src/sound/sonar.ts`, `src/ui/SoundToggle.tsx` | ping parameters, scheduler, audio, toggle |
| edit `src/globe/engine.ts`, `GlobeCanvas.tsx`, `App.tsx`, `eventLayer.ts` | mount the layers; new handle methods |

`GlobeHandle` additions (names fixed here, used by later tasks): `setRelations(rel: Relations | null, points: Record<string, { lat: number; lon: number }>): void`; `setTimeBack(backS: number): void`; `setSunTime(unixS: number): void`; `project(lat: number, lon: number): { x: number; y: number; visible: boolean } | null`; `onCursor(cb: (c: { x: number; y: number; lat: number; lon: number } | null, kmPerPx: number) => void): () => void`; `focus(t: { lat: number; lon: number; distance: number } | null): void`.

---

### Task 1: Relations data (alliances and active disputes)

**Files:**
- Create: `data/relations/alliances.json`, `scripts/relations/disputes.ts`, `scripts/relations/build-relations.ts`, `src/relations/types.ts`, `tests/relations/disputes.test.ts`, `tests/relations/relations-data.test.ts`
- Modify: `package.json` (script `data:relations`), `scripts/check-budgets.ts` (relations.json <= 8 KB gzip), `docs/DATA-SOURCES.md`

**Interfaces:**
- Produces `src/relations/types.ts`:
  `Alliance = { id: string; name: string; kind: 'multilateral' | 'bilateral'; members: string[]; source: string; url: string; asOf: string; note?: string }` (members are ADM0_A3 ids);
  `Dispute = { a: string; b: string; conflict: string; lastYear: number; events: number; source: string; url: string }` (`a < b` alphabetically; one record per pair);
  `Relations = { generated: string; alliances: Alliance[]; disputes: Dispute[] }`.
- Produces `disputesFromGed(rows: Record<string, string>[], gwToId: Record<string, string>, opts: { minLastYear: number }): Dispute[]` in `scripts/relations/disputes.ts`: keeps rows with `type_of_violence === '1'` and non-empty `gwnoa` and `gwnob`, groups by unordered pair, counts events, keeps pairs whose latest `year >= opts.minLastYear`; a GW number missing from `gwToId` **throws** naming the number and conflict.

- [ ] **Step 1: Write failing tests** (`disputes.test.ts`): two rows RUS/UKR (365/369) and one UKR/RUS reversed give one dispute `{a:'RUS', b:'UKR', events:3}`; a row with `type_of_violence '2'` is ignored; empty `gwnob` is ignored; a pair last active in 2022 is dropped with `minLastYear: 2025`; unknown GW `9999` throws with the number in the message; output is sorted by `a`, then `b`.
- [ ] **Step 2: Run** `npx vitest run tests/relations/disputes.test.ts` -> FAIL.
- [ ] **Step 3: Implement** `disputes.ts` (pure). Then `build-relations.ts`: streams the three pinned GED CSVs in `data/raw/ucdp/` (reuse the `csv-parse` setup of `scripts/events/ucdp.ts`), builds `gwToId` by mapping the GED `country_id` (Gleditsch-Ward) + `country` to our ADM0_A3 through the Natural Earth names in `public/data/countries.json` (normalise with `normalise` from `src/dossier/search.ts`; every id used by a dyad must resolve or the build fails), sets `minLastYear` = latest GED year - 1, sets `source: 'UCDP Georeferenced Event Dataset 26.1 (state-based, both sides governments)'`, `url: 'https://ucdp.uu.se/downloads/'`, and writes `public/data/relations.json` (compact JSON) merged with `data/relations/alliances.json`.
- [ ] **Step 4: Curate `alliances.json` from official pages only.** Fetch and read each source; record `url` and `asOf` (the date you checked); drop anything you cannot confirm and say so in the commit. Candidates: NATO (members from `data/relations/memberships.json`, source nato.int), CSTO (csto.org; add a `note` for any member that has publicly frozen participation, as stated by the source), ANZUS (Australia, New Zealand, United States; text of the 1951 treaty), and the US bilateral mutual defense treaties with Japan, South Korea and the Philippines (state.gov "Collective Defense Arrangements"). India has no formal alliance and gets none.
- [ ] **Step 5: Data tests** (`relations-data.test.ts`, reads the committed files): every alliance has `source`, `url` starting `https://`, `asOf` ISO date, at least 2 members, every member id exists in `public/data/countries.json`; NATO has 32 members and equals `memberships.json`; no dispute pair has `a === b`; every dispute id exists; USA/CAN are allies; IND has no alliance.
- [ ] **Step 6: Run** `npm run data:relations` (prints the disputes found: expect RUS-UKR, AFG-PAK among them; paste the list into the commit message as "found, not editorial"), then `npx vitest run tests/relations`, `npm run typecheck` -> PASS. **Step 7: Commit** `feat(relations): add sourced alliances and UCDP-derived active disputes`.

### Task 2: Arc geometry, layer and hover wiring

**Files:**
- Create: `src/globe/arcs.ts`, `src/globe/arcLayer.ts`, `src/relations/load.ts`, `src/relations/lookup.ts`, `tests/globe/arcs.test.ts`, `tests/relations/lookup.test.ts`
- Modify: `src/globe/engine.ts`, `src/globe/GlobeCanvas.tsx`, `src/App.tsx`

**Interfaces:**
- Consumes: `Relations`, `latLonToVec3` (`src/lib/geo.ts`), `loadCountries()` (`src/dossier/load.ts`, rows carry label point `lat`, `lon`).
- Produces `arcPoints(a: {lat; lon}, b: {lat; lon}, segments = 48, lift = 0.18): [number, number, number][]` (great-circle slerp; radius `1 + lift * sin(pi * t) * min(1, angle / pi)`; antipodal inputs pick a deterministic mid-plane instead of dividing by zero; identical points return a single point);
  `solidSegments(pts): Float32Array` and `dashedSegments(pts, dash = 3, gap = 2): Float32Array` (pairs of xyz for `LineSegments`);
  `relationsFor(rel: Relations | null, id: string): { allies: { id: string; via: string[] }[]; disputes: { id: string; conflict: string; events: number }[] }` (allies de-duplicated across alliances with the alliance names in `via`; stable sort by id; `null`/unknown id -> empty lists);
  `loadRelations(): Promise<Relations | null>` (cached; `null` on any failure);
  `createArcLayer(): { object: THREE.Group; show(id: string | null, rel: Relations | null, points: Record<string, {lat: number; lon: number}>): void; dispose(): void }` (cyan solid `LineSegments` for allies, orange dashed for disputes, opacity 0.7, radius lift as above; draw-in over 400 ms via `setDrawRange`, instant under reduced motion; skips ids with no label point).

- [ ] **Step 1: Write failing tests:** `arcPoints` endpoints equal the inputs on the unit sphere (radius 1), the midpoint radius is above 1 and below `1 + lift + 1e-6`, an antipodal pair returns finite points only, `a == b` returns one point, an arc across lon 179 -> -179 stays short (max angular step below 3 degrees), `dashedSegments` has fewer vertices than `solidSegments` for the same points; `relationsFor` returns NATO allies of `FRA` without `FRA`, de-duplicates a country that is in two alliances with both names in `via`, returns disputes for `UKR` with `RUS`, returns empty lists for `IND`, for an unknown id and for `null`.
- [ ] **Step 2: Run** -> FAIL. **Step 3: Implement** the pure modules, then the layer, then mount it in `engine.ts`: `setRelations(rel, points)` stores them; the focus country is `hoverId`, else `diveId`; call `arcLayer.show` when the focus changes (not every frame); `GlobeCanvas` loads relations and countries after the globe exists (a failed load leaves the globe without arcs) and calls `setRelations`. **Step 4: Run** `npx vitest run`, typecheck, build -> PASS.
- [ ] **Step 5: Browser check:** hover FRA (many cyan arcs), RUS and UKR (orange dashed to each other), IND (none), open water (none, no console error); frame rate with 31 arcs (NATO member). **Step 6: Commit** `feat(globe): add alliance and active-dispute arcs on country hover`.

### Task 3: Relations in the dossier

**Files:**
- Modify: `src/ui/DossierPanel.tsx`; Create: `tests/ui/DossierRelations.test.tsx`

**Interfaces:** Consumes `relationsFor`, `loadRelations`. Produces a "RELATIONS" block in the dossier: "FORMAL ALLIES" (names with the alliance names and a source link) and "ACTIVE DISPUTES" (counterpart name, UCDP conflict name, "N events, last year Y", source link); empty lists render "none on record" in mono muted text, never a redaction bar; a failed relations load renders "unavailable" as a redaction bar.

- [ ] **Step 1: Write failing tests** (mock `loadRelations`): RUS shows "UKR"'s name under ACTIVE DISPUTES with the event count; FRA lists NATO; IND shows "none on record" twice; a rejected load shows the redaction bar and does not break the rest of the panel; source links are `https:` with `rel="noopener noreferrer"`; names with `<` are text.
- [ ] **Step 2: Run** -> FAIL. **Step 3: Implement.** **Step 4: Run** the suite -> PASS. **Step 5: Commit** `feat(ui): show sourced alliances and active disputes in the dossier`.

### Task 4: Time model and event-layer time cut

**Files:**
- Create: `src/time/store.ts`, `tests/time/store.test.ts`
- Modify: `src/globe/eventLayer.ts`, `src/globe/engine.ts`, `src/globe/GlobeCanvas.tsx`, `tests/globe/eventLayer.test.ts` (create if absent)

**Interfaces:**
- Produces `useTime` (Zustand): `{ backS: number; playing: boolean; setBack(s: number): void; setPlaying(p: boolean): void; goLive(): void }`; `setBack` clamps to `[0, 365 * 86400]` and ignores non-finite values; `goLive` sets `backS = 0` and `playing = false`.
- Produces `playheadS(nowS: number, backS: number): number` (`nowS - backS`).
- `createEventLayer()` gains `setBack(backS: number): void` (uniform `uBack`, default 0). In the vertex shader: `age = aAge + uElapsed - uBack`; an event with `age < 0` is invisible (alpha 0, size 0); ripples only while `age < 6 h`; the 30-day fade is measured from the playhead. `GlobeHandle.setTimeBack(backS)` forwards it; `GlobeCanvas` subscribes to `useTime` and calls it.

- [ ] **Step 1: Write failing tests:** store clamps `setBack(-5)` to 0 and `setBack(1e12)` to 365 d, ignores `NaN`, `goLive` resets both fields; `playheadS(100, 40) === 60`; extract the visibility rule into a pure `visibleAt(ageS: number, backS: number): boolean` in `eventLayer.ts` (`ageS - backS >= 0`) and test it with ages 0, 100, and a negative result; `createEventLayer().setBack` accepts 0 and 86400 without throwing (jsdom: guard `THREE.ShaderMaterial` use the way the existing eventLayer tests do, or test only the pure rule if none exist).
- [ ] **Step 2: Run** -> FAIL. **Step 3: Implement.** **Step 4: Run** suite/typecheck/build -> PASS. **Step 5: Commit** `feat(globe): add the time model and event time cut`.

### Task 5: Scrubber, playback and Declassify

**Files:**
- Create: `src/ui/Scrubber.tsx`, `src/ui/redaction.ts`, `tests/ui/Scrubber.test.tsx`, `tests/ui/redaction.test.ts`
- Modify: `src/ui/EventCard.tsx`, `src/ui/Coverage.tsx` only if it overlaps the bottom edge, `src/App.tsx`, `tests/ui/EventCard.test.tsx`

**Interfaces:**
- `<Scrubber />` (reads `useTime` and the loaded snapshots): a native `<input type="range">` (min 0, max = days available in whole days, step 1 day in the UI, mapped to `backS`), left end = oldest data, right end = LIVE; `aria-label="Time travel"`, `aria-valuetext` "LIVE" or "12 days before the latest data, 2026-10-06 UTC"; a LIVE button (`goLive`) and a Play button (`playing`): while playing, `backS` decreases at 43,200 s per second (a week in 14 s) and stops at 0; nothing animates under reduced motion (Play is disabled with a title saying so); Escape or any manual slider input stops playback. Hidden when no snapshot is loaded.
- `redactionFor(eventAgeAtPlayheadS: number): number` in `redaction.ts`: the declassification progress in `[0, 1]`: `1` (fully declassified, no bars) at 14 days or older, `0` (full bars) for an event less than 24 h old at the playhead, linear in between (`clamp((age - 86400) / (13 * 86400), 0, 1)`); non-finite input returns `1`. The card passes `ageS - backS`.
- `EventCard` shows a thin bar (3 px, `--text-muted`) under each of the Deaths, Actors and Sources values whose width is `(1 - redactionFor(...)) * 100%`, animating with the house easing; the values themselves are always rendered as real text at full contrast, selectable and in the accessibility tree; a small stamp "FILE: CLASSIFIED / DECLASSIFIED" follows the progress. Cosmetic only, and the card text says nothing is withheld ("cosmetic: all details are shown").

- [ ] **Step 1: Write failing tests:** `redactionFor` is monotonic, 0 at 0 s and at 24 h, 1 at 14 d and later, `1` for `NaN`; `EventCard` always contains the actors, deaths and source text for age 0 and age 30 d (the point of the cosmetic rule) and the bar widths differ between them; `Scrubber` shows LIVE text at `backS 0`, changing the slider to 12 sets `useTime.backS` to `12 * 86400`, LIVE resets it, the slider is reachable by keyboard (ArrowLeft changes it), Play is disabled and does not tick under reduced motion (stub `matchMedia`), Play with fake timers walks `backS` down to 0 and stops, a manual input stops playback, `aria-valuetext` mentions the UTC date, nothing renders without a snapshot.
- [ ] **Step 2: Run** -> FAIL. **Step 3: Implement**; the playback loop is one `requestAnimationFrame` with a dt clamp, started and cancelled by the `playing` flag. **Step 4: Run** suite/typecheck/build -> PASS.
- [ ] **Step 5: Browser check:** scrub to -200 d, to 0, rapidly, press LIVE, Play; open an old and a new event card; frame rate. **Step 6: Commit** `feat(ui): add the time scrubber, playback and the Declassify bars`.

### Task 6: Grain = Data

**Files:**
- Create: `src/globe/grain.ts`, `src/globe/grainLayer.ts`, `tests/globe/grain.test.ts`
- Modify: `src/globe/engine.ts`

**Interfaces:**
- `buildDensity(list: EventAttrs[], backS: number, w = 180, h = 90): Uint8Array` (row-major, `w*h`): each visible event (`visibleAt`) adds weight `severity-size * fadeAt(age)` to its cell and a half-weight to the 8 neighbours (longitude wraps, latitude clamps); result normalised so the 98th-percentile non-zero cell is 255 (empty input -> all zeros, never NaN). Latitude and longitude come from `vec3ToLatLon` of the attribute positions.
- `createGrainLayer(): { object: THREE.Mesh; setDensity(d: Uint8Array, w: number, h: number): void; update(elapsedS: number, reduced: boolean): void; dispose(): void }`: an inward-facing-culled sphere (radius 1.0015, `depthWrite: false`, transparent) whose fragment shader samples the density texture (equirectangular, repeat wrap in longitude, linear filter) from the object-space normal, multiplies hashed noise (re-seeded about 12 times a second, fixed seed when `reduced`) and outputs bone at low density shifting to orange at high density, alpha at most 0.22. No DOM overlay.
- `engine.ts` rebuilds the density at most 4 times a second and only when `setEvents` or `setTimeBack` changed something.

- [ ] **Step 1: Write failing tests:** empty list -> all zeros; one event at lat 0 lon 0 lights cell (45, 90) and its neighbours less; an event at lon 179.9 also lights column 0 (wrap) but an event at lat 89.9 does not wrap to the south; events newer than the playhead (`visibleAt` false) add nothing; a hundred events in one cell cap that cell at 255 and a dense cell does not dim a lone one below 1 (normalisation by percentile); output length `w*h`; no NaN or values above 255 for sizes of 0 or `NaN` in the attrs.
- [ ] **Step 2: Run** -> FAIL. **Step 3: Implement.** **Step 4: Run** suite/typecheck/build -> PASS.
- [ ] **Step 5: Browser check:** the Sahel, Ukraine and Myanmar show warm grain, open ocean is clean; scrubbing back moves the heat; reduced motion stops the shimmer; frame time delta against grain off (record). **Step 6: Commit** `feat(globe): add Grain = Data, a shader heat grain from event density`.

### Task 7: Cursor = Radar

**Files:**
- Create: `src/globe/radar.ts`, `src/ui/Reticle.tsx`, `tests/globe/radar.test.ts`, `tests/ui/Reticle.test.tsx`
- Modify: `src/globe/engine.ts`, `src/globe/GlobeCanvas.tsx`, `src/App.tsx`

**Interfaces:**
- `snapTarget(cursor: {x: number; y: number}, candidates: {x: number; y: number; km: number}[], snapPx = 28): { x: number; y: number; km: number } | null` (nearest candidate within `snapPx`, ties by smaller `km`, `null` when none or non-finite input).
- `formatReadout(lat: number, lon: number, snappedKm: number | null): string` -> `"28.61N 77.21E"` plus `" // EVENT 12 KM"` when snapped (hemisphere letters from the sign; `"--"` when not finite).
- `GlobeHandle.project(lat, lon)` (x, y in CSS px relative to the canvas, `visible` false on the far side) and `onCursor(cb)`: called from the existing `pointermove` rAF with the cursor's canvas position, lat/lon or `null` off the globe, and `kmPerPx`; never during a drag.
- `<Reticle point readout snapped />`: an `aria-hidden` absolutely positioned SVG reticle (thin cyan ring and ticks) with the readout in mono; it eases toward the snapped point with the house easing, jumps instantly under reduced motion; the system cursor is hidden only over the canvas and only when `(hover: hover) and (pointer: fine)`; the reticle is not rendered on touch. `App` finds the nearest event with `pickEvent` (radius `snapPx * kmPerPx`) and projects it with `handle.project`; React state updates are limited to when the snapped event or the 0.01-degree rounded readout changes, the reticle position itself moves by direct style writes.

- [ ] **Step 1: Write failing tests:** `snapTarget` picks the nearest within 28 px, returns null at 40 px, prefers the smaller `km` on a tie, returns null for `NaN`; `formatReadout(28.61, 77.21, null) === '28.61N 77.21E'`, southern/western signs, `' // EVENT 12 KM'` suffix, `--` for `NaN`; `Reticle` has `aria-hidden="true"`, renders nothing when `point` is null, shows the readout text, and renders nothing when the media query for fine hover does not match.
- [ ] **Step 2: Run** -> FAIL. **Step 3: Implement.** **Step 4: Run** suite/typecheck/build -> PASS.
- [ ] **Step 5: Browser check:** reticle follows, snaps to an event, shows lat/lon and km, system cursor returns over the dossier and palette, off-globe pointer hides it; frame rate while moving. **Step 6: Commit** `feat(ui): add Cursor = Radar with magnetic event snapping`.

### Task 8: Day/night terminator

**Files:**
- Create: `src/globe/sun.ts`, `src/globe/terminatorLayer.ts`, `tests/globe/sun.test.ts`
- Modify: `src/globe/engine.ts`, `src/globe/GlobeCanvas.tsx`

**Interfaces:**
- `subsolarPoint(unixS: number): { lat: number; lon: number }` (declination and equation of time from the standard low-precision solar formulas, accurate to about 1 degree; longitude in `[-180, 180]`).
- `terminatorPoints(sun: {lat; lon}, n = 180): [number, number][]` (lat/lon pairs on the great circle 90 degrees from the sun; closed loop, no jump across the antimeridian larger than the step).
- `createTerminatorLayer(): { object: THREE.LineLoop; update(unixS: number): void; dispose(): void }` (bone line, opacity 0.35, radius 1.002). `GlobeHandle.setSunTime(unixS)`; `GlobeCanvas` passes `playheadS(now, backS)` once a minute and on scrub changes.

- [ ] **Step 1: Write failing tests:** 2026-06-21 08:24 UTC -> `lat` within 0.6 of 23.44; 2026-12-21 15:50 UTC -> within 0.6 of -23.44; 2026-03-20 14:46 UTC -> `|lat| < 0.6`; at 12:00 UTC on a day near the equinox the longitude is within 5 degrees of 0 (equation of time); longitude stays in range across 366 daily samples; every terminator point is within 0.5 degrees of 90 degrees from the sun (use `latLonToVec3` dot products); `terminatorPoints` has `n` points, no consecutive longitude jump above 25 degrees except the wrap; `NaN` input returns the previous or a `{lat: 0, lon: 0}` fallback without throwing.
- [ ] **Step 2: Run** -> FAIL. **Step 3: Implement.** **Step 4: Run** suite/typecheck/build -> PASS. **Step 5: Browser check:** edge sits where it should for the current UTC time (compare with a known source and record the result), moves when scrubbing. **Step 6: Commit** `feat(globe): add the live day/night terminator`.

### Task 9: Pulse Border and top bar

**Files:**
- Create: `src/ui/TopBar.tsx`, `src/ui/PulseBorder.tsx`, `src/ui/pulse.ts`, `tests/ui/pulse.test.ts`, `tests/ui/PulseBorder.test.tsx`
- Modify: `src/App.tsx` (replace the ad hoc top-left label and the free-floating `AsOf` with `TopBar`)

**Interfaces:**
- `pulsePeriodMs(eventsPerHour: number): number` (clamped 600..4000 ms; more events -> shorter period; non-finite -> 4000);
- `pulseColor(level: 1|2|3|4|5, comparable: boolean): string` (lime `#D6FF57` when not comparable, otherwise a linear blend lime -> orange `#FF4D00` by `(level - 1) / 4`, as `rgb()`);
- `spikesFor(prev: Snapshot | undefined, next: Snapshot): number`: a spike is raised when the recent snapshot's `meta.sha256` changes; the count is the number of events with `timeS > prev.meta.asOfS`, capped at 12; `0` for the first load (no `prev`) and for an unchanged hash.
- `<PulseBorder />` is a full-width canvas, 6 px high, pinned to the bottom edge of `TopBar`; it draws a 1 px baseline in `pulseColor(...)` with a heartbeat blip every `pulsePeriodMs(rate)` (rate = recent-snapshot events in the last 24 h / 24) and a taller spike per new event; under reduced motion it draws only the static baseline in the current colour. `TopBar` holds the brand "DEFCON // GLOBE CORE", `AsOf`, the Search hint and later the Sound toggle; its bottom border is the pulse; it keeps 1px borders, no shadow.

- [ ] **Step 1: Write failing tests:** period shortens as the rate rises, clamps at both ends, `NaN` -> 4000; colour is exactly lime when not comparable and orange at level 5 comparable, mid blend at level 3; `spikesFor(undefined, s)` is 0 (no spike for the first load), a snapshot with a different hash and 3 newer events gives 3, an unchanged hash gives 0, more than 12 gives 12; `PulseBorder` renders a canvas, and under reduced motion does not start an animation frame loop (spy on `requestAnimationFrame`).
- [ ] **Step 2: Run** -> FAIL. **Step 3: Implement.** **Step 4: Run** suite/typecheck/build -> PASS. **Step 5: Browser check:** border colour and rhythm, a forced snapshot refresh spikes it once, `AsOf` pill still readable, nothing overlaps the palette button, narrow width. **Step 6: Commit** `feat(ui): add the Pulse Border and the top bar`.

### Task 10: Night Watch

**Files:**
- Create: `src/watch/nightWatch.ts`, `src/ui/NightWatch.tsx`, `tests/watch/nightWatch.test.ts`, `tests/ui/NightWatch.test.tsx`
- Modify: `src/globe/engine.ts` (`focus`), `src/globe/GlobeCanvas.tsx`, `src/App.tsx`

**Interfaces:**
- `watchTargets(s: Snapshot, nowS: number, n = 5): { index: number; lat: number; lon: number; severity: number; timeS: number; kind: Kind; human: boolean }[]`: events from the last 7 days, ranked by severity, then human-coded first, then newest, at most one per country, at most `n`; non-finite coordinates skipped.
- `nextState(state: WatchState, event: WatchEvent): WatchState` pure state machine; `WatchState = { phase: 'idle' | 'watching'; target: number; since: number }`; events `{type: 'tick', nowS}`, `{type: 'input'}`, `{type: 'blocked', value: boolean}`; goes to `watching` after 20 s without input while not blocked; `input` returns to `idle` immediately; while watching, advances `target` every 9 s.
- `caption(t: { place: string; timeS: number; kind: Kind }): string` -> `"KYIV, UKRAINE // 2026-10-18 04:12 UTC // ARMED CONFLICT"` (kind labels: armed -> ARMED CONFLICT, civilian -> VIOLENCE AGAINST CIVILIANS, riot -> RIOT, protest -> PROTEST, other -> EVENT; empty place -> "UNKNOWN LOCATION").
- `<NightWatch active caption />`: two letterbox bars (top and bottom, 12 vh) sliding in with the house easing, caption typed at 30 characters per second in mono (instant under reduced motion), `aria-live="polite"` text of the full caption; bars are `pointer-events: none`. `App` blocks the machine while the palette, dossier, an event card, scrubbing or Play is active; any `pointerdown`, `pointermove` (more than 4 px), `keydown`, `wheel` or `touchstart` is an `input`; the camera flies with `GlobeHandle.focus({lat, lon, distance: 1.9})` to each target and `focus(null)` leaves the view where it is on exit; the place text comes from `fetchDetail` (a failure falls back to the country name from the snapshot).

- [ ] **Step 1: Write failing tests:** `watchTargets` ranks severity 5 over 4, prefers human-coded on equal severity, returns at most one per country, ignores events older than 7 days and ones with `NaN` coordinates, returns `[]` for an empty snapshot; the state machine stays idle at 19 s, goes `watching` at 20 s, returns to idle on `input`, never starts while `blocked`, cycles targets every 9 s and wraps; `caption` for each kind and the empty-place case; `NightWatch` renders the full caption into the live region at once when reduced motion is on, types progressively (fake timers) otherwise, and has no pointer events.
- [ ] **Step 2: Run** -> FAIL. **Step 3: Implement.** **Step 4: Run** suite/typecheck/build -> PASS.
- [ ] **Step 5: Browser check:** wait 20 s idle (record it), flight, caption, exit by mouse, key and touch emulation, it does not start with the palette open; frame rate. **Step 6: Commit** `feat(ui): add Night Watch, the idle showcase mode`.

### Task 11: World Sound

**Files:**
- Create: `src/sound/sonar.ts`, `src/ui/SoundToggle.tsx`, `tests/sound/sonar.test.ts`, `tests/ui/SoundToggle.test.tsx`
- Modify: `src/ui/TopBar.tsx`, `src/App.tsx`

**Interfaces:**
- `pingParams(severity: number, lon: number): { freq: number; pan: number; gain: number }`: `freq` from a pentatonic ladder on A3 (220 Hz) rising with severity 1..5 (severity clamped, non-finite -> 1), `pan = clamp(lon / 180, -1, 1)`, `gain` 0.04 for severity 1 up to 0.12 for severity 5 (always below 0.15).
- `createPingLimiter(maxPerSecond = 6, now: () => number): (n?: number) => boolean` (true when a ping is allowed; sliding one-second window).
- `createSonar(ctxFactory: () => AudioContextLike): { ping(severity: number, lon: number): void; suspend(): void; dispose(): void }`: each ping is a short sine with a fast attack and 450 ms exponential decay through a `StereoPannerNode` (falls back to no panning when the API is missing), nodes disconnected on `ended`; `ctxFactory` is only called on first use after enable.
- `<SoundToggle />`: button "SOUND OFF/ON" (`aria-pressed`), off by default; enabling is the only place that creates the context (inside the click), `localStorage` key `defcon.sound` remembers the choice **but a remembered "on" starts as off with a "tap to enable sound" affordance, because browsers block audio before a gesture**; failures are swallowed. Pings are fired for: events newly arrived in the recent snapshot (using `spikesFor`'s diff, capped by the limiter), events crossing the playhead during Play (`playing`), and the Night Watch target on arrival. Muted while the tab is hidden.

- [ ] **Step 1: Write failing tests:** `pingParams` is monotonic in severity, pans hard left at -180 and hard right at 180, clamps lon 400 and NaN severity, gain below 0.15; the limiter allows 6 then refuses the 7th within one second and allows again after 1 s (fake clock); `createSonar` with a fake `AudioContext` creates no context until the first `ping`, disconnects nodes when `ended` fires, tolerates a missing `createStereoPanner`, and `dispose` closes the context; `SoundToggle` is `aria-pressed="false"` initially, does not construct an `AudioContext` on mount (spy on the global), constructs one on click, persists to `localStorage`, still renders when `localStorage` throws, and a stored "on" does not create audio on mount.
- [ ] **Step 2: Run** -> FAIL. **Step 3: Implement.** **Step 4: Run** suite/typecheck/build -> PASS. **Step 5: Browser check:** silent on load; click, hear nothing but see the state (an audio check is not possible in the in-app browser: say so in the commit); Play during which `createSonar.ping` is called (log it); toggle off stops pings. **Step 6: Commit** `feat(sound): add optional World Sound, off by default`.

### Task 12: Close-out

**Files:** Modify `docs/DECISIONS.md`, `docs/ROADMAP.md`, `docs/README.md`, `README.md`, `docs/DESIGN-LANGUAGE.md`, `docs/BACKLOG.md`, `docs/TECH-STACK.md`, `docs/DATA-SOURCES.md`.

- [ ] **Step 1: Run** the full suite twice, typecheck, build, `check:budgets`; report numbers (JS gzip, relations.json size). **Step 2: Browser pass** with every feature on (hover arcs, scrub, Play, grain, terminator, reticle, pulse, Night Watch, sound toggle): console clean, frame rate over 5 s, record it honestly (including any feature that had to be made cheaper). **Step 3: Docs:** DECISIONS (relations sources and the "active dispute" rule with the pairs found, Declassify is cosmetic, Pulse uses `comparable`, Night Watch rules, Sound rules, terminator formula accuracy), ROADMAP status, README "what you can do", DESIGN-LANGUAGE entries for the reticle, pulse, letterbox and grain, BACKLOG (deferred), DATA-SOURCES (alliances and UCDP dyad derivation). **Step 4: Commit** `docs(plan-4): close out signature interactions`.

---

## Self-review

- **Spec coverage (section 5):** Sonar Boot (Plan 1); Pulse Border (9); Grain = Data (6); Cursor = Radar (7); Alliance Arcs (1-3); Declassify (4-5); Night Watch (10); World Sound (11); day/night terminator (8); Country Dive, palette and LOD (Plan 3). Section 8 relations (1, 3). Reduced motion (Global Constraints, Review Focus 4). **Not in this plan:** adaptive quality tier that lowers grain/arc detail (Plan 6), the hourly ingestion that makes "new events" arrive in production (Plan 5; until then spikes and pings fire only on a manual refresh), keyboard control of the reticle (Plan 6 accessibility).
- **Types:** `Relations`, `Alliance`, `Dispute`, `relationsFor`, `useTime`, `playheadS`, `visibleAt`, `buildDensity`, `subsolarPoint`, `snapTarget`, `spikesFor`, `watchTargets`, `pingParams` are each defined once and used with the same names; handle methods are listed once under Files.
- **Not verified (to check during the work):** which alliance sources are reachable and confirmable; that the GED `country_id` + name mapping resolves every dyad country; the cost of grain plus arcs on the integrated GPU; whether a 6 px canvas pulse border is crisp at DPR 2; audio output cannot be heard in the in-app browser.
