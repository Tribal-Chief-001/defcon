# War room Implementation Plan (Plan 10)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (Native, TDD, one fresh Sonnet reviewer at the end).

**Goal:** Replace the War tracker modal (a bland data dump) with a **War room**: a docked dashboard that sits beside the globe, tells the story with real charts, and is **present on the globe itself** (conflict halos, the shape of a conflict's zone from its death hotspots, timeline pins, camera fly-to). All data and honesty rules of Plans 8 and 9 stay; only the representation changes.

**Owner brief (2026-10-18):** "the popup is bland, a data dump; make it organic and approachable, a dashboard tab is fine but it must have a presence on the globe; loads of charts, key details, facts, figures, important events, timeline, shown visually in an appetising way, like chart porn; don't reduce the data, only how it is represented; think about how it integrates with the globe aesthetically and creatively."

**Architecture:** (1) the builder adds geography to `conflicts.json` (death-weighted centroid, spread, top death hotspots per conflict, weekly deaths by kind for the world) and the timeline entries get an optional `at` place; (2) a `warLayer` in the Three.js engine draws halos, a zone ring, hotspot points and timeline pins and exposes `setWar...` on the globe handle; (3) a small SVG chart kit (`src/viz`, no dependency, pure geometry helpers unit-tested) feeds a docked `WarRoom` (Overview and Conflict views) that replaces `ConflictsPage`; (4) `App` wires selection <-> globe (fly-to, hover pins), framing and hash (`#war`, `#war=<id>`, kept).

**Tech Stack:** TypeScript strict, React 19, Three.js (existing engine), hand-rolled SVG, Vitest + Testing Library + axe, headless Chrome screenshots.

**Spec:** `docs/DESIGN-LANGUAGE.md` (hairline, true black, bone, lime accent, orange for danger, no shadows, type scale >= 11 px), `docs/superpowers/plans/2026-10-18-plan-8-war-tracker-data.md` and `...plan-9-sourced-timeline.md` (data and honesty rules).

## The design (what the person sees)

- **Docked, not modal.** At 1100 px and wider the War room is a 560-720 px glass panel docked to the right edge, full height under the top bar; the globe stays interactive and shifts left (`framing`). Below 1100 px it is a bottom sheet over about 62% of the height with the globe visible above (`framing y`). No backdrop, no focus trap; Esc closes; the rails and the dossier step aside while it is open. Opening a country from it still dives (and closes it).
- **Overview** (default): (1) hero numeral "234,884" counting up, with its range and a three-arc ring for 30 / 90 / 365 days; (2) **stream chart** of weekly deaths by kind (state-based, non-state, one-sided) over 52 weeks with a hover scrubber and the timeline's key events as stems on top (events against deaths); (3) **bubble pack** of conflicts, area = deaths in 365 days, colour = activity trend, click selects; (4) **league**: top conflicts as range-whisker rows (low-high bar, a sparkline of weekly deaths, trend chip); (5) countries with most deaths as a bar strip; (6) key events as cards with status chips; (7) newest news reports (auto-coded).
- **Conflict view**: a big Syne title, kind chips, trend chip, three window numerals with range whiskers; a **deaths x events chart** (weekly area with the conflict's timeline events as status-coloured stems you can hover and click); countries as a share bar; the vertical **editorial timeline** (large date numerals, a spine, status badges, linked sources, "show on globe"); latest events; caveats and citations.
- **On the globe:** every conflict with deaths in the last 90 days gets a pulsing double ring at its death-weighted centroid (orange when rising, bone otherwise, ring size from log deaths); the top 6 carry a name label. Selecting a conflict flies the camera to it, draws a hairline zone ring, lights its death hotspots (the shape of the front) in lime and dims the ordinary event dots; timeline entries with a place appear as small diamond pins; hovering a card pulses its pin, clicking flies there. Leaving the War room restores the globe.
- **Motion** is count-up, line draw-in and staggered fade; all off under `prefers-reduced-motion`. Every chart has a text alternative and keyboard-reachable controls; colour is never the only carrier of meaning.

## Global Constraints

- Honesty unchanged: windows end at the data end date, best with low-high ranges, 2026 rows provisional, activity trend from event counts, news reports tagged auto-coded, timeline statuses and limits shown, protest-death wording as in Plan 8. New charts must show their window and units and never imply live data.
- Hairline language: 1 px strokes, no `box-shadow`, no gradients on text, bone and lime with orange only for rising/danger/disputed, cyan unused here; type scale tokens only; WCAG AA; the contrast and forbidden-pattern tests stay green.
- Performance: main JS stays under 250 KB gzip (the War room, charts and its data are lazy); the globe layer adds at most 4 draw calls and nothing per frame beyond uniforms; 60 fps tiers keep working (the layer is off on the `low` tier except halos).
- `conflicts.json` stays under 700 KB raw / 150 KB gzipped; `timeline.json` under 120 KB.
- Safety: text from data is rendered as text; hash route unchanged (`#war`, `#war=<[a-z0-9-]{1,60}>`); external links only https with `rel`.
- Machine rule: one vitest/vite/tsx/chrome process at a time.

## Review Focus

1. A chart that misleads: the stream's baseline and scale (deaths per week must start at zero, a shared scale on small multiples), the bubble areas (area, not radius, proportional to deaths), range whiskers drawn from low to high, the x axis dates (weeks end at the data end date), events plotted outside the data window (timeline events after the data end must not float over empty chart; say "after UCDP data").
2. The globe layer: halos at the wrong place (death-weighted centroid across the antimeridian, e.g. Russia, Fiji), hotspots that leak between conflicts, selection state left behind after closing, context loss, the `low` tier, `prefers-reduced-motion`.
3. Docked layout collisions at 1100, 1280, 1440, 1920 px and on 375 px: top bar, rails hidden, dossier, event card, scrubber, legend, controls row, the globe's pick area still usable.
4. Keyboard and screen reader: no focus trap but sensible focus on open and Esc, chart text alternatives, selection by keyboard, the list/bubble duplication (the league is the accessible equivalent of the bubbles), live updates not announced noisily.
5. Data/regression: the existing War tracker content (cards, ranges, timeline, news reports, citations, protest note) is all still reachable; `#war=<id>` deep links; failures of `conflicts.json` or `timeline.json` leave the globe working.

---

### Task 1: Geography in the data

**Files:** Modify `scripts/conflicts/conflicts.ts`, `src/conflicts/types.ts`, `src/conflicts/load.ts`, `scripts/timeline/validate.ts`, `src/timeline/types.ts`, `src/timeline/load.ts`; Create `scripts/timeline/places.ts`; Modify `public/data/conflicts.json` (regenerated), `public/data/timeline.json` (places added); tests: `tests/conflicts/conflicts.test.ts`, `tests/conflicts/load.test.ts`, `tests/conflicts/conflicts-data.test.ts`, `tests/conflicts/fixture.ts`, `tests/timeline/validate.test.ts`, `tests/timeline/timeline-data.test.ts`.
- `Conflict` gains `geo: { lat: number; lon: number; spreadKm: number; cells: [lat: number, lon: number, deaths: number][] } | null`: `lat/lon` = death-weighted centroid of the 365-day events **computed on the unit sphere** (mean of 3-D vectors, so it is correct across the antimeridian), `spreadKm` = death-weighted 75th-percentile great-circle distance to the centroid, clamped to 40-2500 km, `cells` = the top 40 cells of a 0.5-degree grid by deaths (lat/lon of the cell centre rounded to 2 decimals, deaths = sum of `best`, cells under 3 deaths dropped, ordered by deaths desc). `geo` is `null` when no event has usable coordinates. Weighted by `best`; an event with 0 deaths counts as 1 so conflicts of zero-death events still have a place.
- `World` gains `weeklyByKind: Record<Kind, number[]>` (52 buckets each, same window as `weekly`; their sum per week equals `weekly`).
- `TimelineEntry` gains optional `at?: { lat: number; lon: number; place: string }`; the validator checks ranges (|lat| <= 90, |lon| <= 180, a non-empty place); `public/data/timeline.json` gets `at` for entries with a clear location, from well-known coordinates of the named place (`places.ts` holds the table: Kyiv, Lviv, Bila Tserkva, Kramatorsk, Kostiantynivka, Lyman, Moscow area, Abu Dhabi, Tehran, Strait of Hormuz, Islamabad, Mocha, Beirut, Nabatieh area, Beaufort, Rafah, Gaza City, Jalud, Washington, and so on).
- The loaders accept `geo`/`at` optional (an old file still loads); `load.ts` validates `geo` shape when present and `weeklyByKind` (3 x 52 finite).
- [ ] **Step 1: Tests first** (builder: centroid across the antimeridian (events at 179.9 and -179.9 give about 180, not 0), death weighting, zero-death events count 1, spread clamp, cells grid and cap 40 and ordering, `geo: null` without coordinates; world `weeklyByKind` sums to `weekly`; validator: `at` ranges; data: every conflict's `geo` inside range and cells <= 40, size limits, every `at` place non-empty). Run: FAIL. **Step 2:** implement, regenerate `conflicts.json`, add places to `timeline.json` through `places.ts` (a one-off script documented in DATA-SOURCES), suite. **Step 3: Commit** `feat(conflicts): add geography to the conflicts data and places to the timeline`.

### Task 2: The globe's war layer

**Files:** Create `src/globe/warLayer.ts`, `src/globe/warGeometry.ts`, `tests/globe/warGeometry.test.ts`; Modify `src/globe/engine.ts` (create the layer, handle methods, per-frame update, dispose), `src/globe/GlobeCanvas.tsx` (props), `src/globe/framing.ts` (+ test), `src/lib/hashState.ts` untouched.
- `warGeometry.ts` (pure): `circlePoints(lat, lon, radiusKm, n): [lat, lon][]` (great-circle ring), `haloRadiusPx(deaths365)` (log scale, clamped 10-34 px), `kmToAngle(km)`, `visibleWarConflicts(list)` (those with `d90.best > 0` and a `geo`).
- `warLayer.ts`: halos (one `THREE.Points`, ring shader with two staggered pulses, colour per conflict: orange rising, bone otherwise, lime selected), zone ring (`LineLoop`), hotspots (`Points` sized by log deaths, lime, only for the selected conflict), pins (`Points` diamonds, hover pulse). API: `setConflicts(list)`, `select(id | null, geo)`, `setPins(pins)`, `hoverPin(index | null)`, `setActive(on)` (halos and dimming on or off), `update(nowMs, px)`, `dispose()`.
- `GlobeHandle` gains `setWar(state: { active: boolean; conflicts: WarConflict[]; selected: string | null; pins: WarPin[]; hoverPin: number | null }): void`; while `active` the ordinary event layer fades to 45%; `framingFor(panelOpen, narrow, war)` returns `{x: 0.2, y: 0}` for war on wide screens, `{x: 0, y: 0.22}` on narrow; the `low` tier draws halos only.
- Labels: a small React overlay `WarLabels` (rAF, uses `handle.project`) places names for the top 6 conflicts and the selected one; decorative `aria-hidden`.
- [ ] **Step 1: Tests first** for the pure geometry (ring points on the sphere at the right angular radius, across the antimeridian, `haloRadiusPx` monotonic and clamped, `visibleWarConflicts` rules) and `framingFor`. **Step 2:** implement the layer and engine wiring, check in headless Chrome (screenshot the globe with halos, a selected conflict with hotspots and pins). **Step 3: Commit** `feat(globe): add the war layer (halos, zone, hotspots, pins)`.

### Task 3: The chart kit

**Files:** Create `src/viz/scale.ts`, `src/viz/pack.ts`, `src/viz/useCountUp.ts`, `src/viz/Spark.tsx`, `src/viz/StreamChart.tsx`, `src/viz/Bubbles.tsx`, `src/viz/RangeBar.tsx`, `src/viz/Ring.tsx`, `src/viz/EventAxis.tsx`, tests under `tests/viz/`.
- Pure helpers: `scaleLinear`, `niceMax`, `weekEnd(dataEnd, i)` (date of week i's last day), `stackAreas(series): number[][]` (cumulative stack from zero), `packCircles(items: {id; value}[], width, height): {id; x; y; r}[]` (deterministic spiral packing; **area proportional to value**, no overlaps, inside the box, tested), `rangeGeometry(low, best, high, max)`.
- Components (SVG, hairline, text alternative each): `Spark` (area line of 52 weeks), `StreamChart` (stacked by kind from zero, hover scrubber with tooltip, optional event stems with status colour, x axis months, y axis ticks, "after UCDP data" shading for dates beyond the data end), `Bubbles` (buttons positioned by `packCircles`, label inside big ones, tooltip text, `aria-label` with deaths and trend), `RangeBar` (low-high whisker with the best marker), `Ring` (three concentric arcs 30/90/365), `useCountUp(value, ms)` (rAF; returns the final value at once under reduced motion or when `value` is not finite), `EventAxis` (the dated spine used by the timeline).
- [ ] **Step 1: Tests first** (pure helpers incl. the area-proportional packing and no overlap, stack from zero, week end dates, count-up reduced motion and final value, components render and name themselves, no NaN, axe). **Step 2-3:** implement, screenshot each chart on a test page in headless Chrome, commit `feat(viz): add the chart kit for the War room`.

### Task 4: The War room

**Files:** Create `src/ui/WarRoom.tsx` (shell), `src/ui/war/Overview.tsx`, `src/ui/war/ConflictView.tsx`, `src/ui/war/EditorialTimeline.tsx`, `src/ui/war/WarLabels.tsx`; Modify `src/App.tsx`, `src/ui/TopBar.tsx` only if needed, `src/ui/Rails.tsx` (hidden in war mode), `src/ui/ConflictsPage.tsx` (removed after its content is moved, `EventList` and `TimelineBlock` reused), tests: `tests/ui/WarRoom.test.tsx`, `tests/App.test.tsx`, `tests/a11y/axe.test.tsx`.
- `WarRoom` props: `{ selected: string | null; onSelect(id | null); onClose(); onDive(countryId); onFocusPlace(at | null); onHoverPin(index | null) }`; loads `conflicts.json` and `timeline.json` (same failure rules as before); Esc closes; docked classes (wide: right panel; narrow: bottom sheet).
- App: war state as before (`#war`, `#war=<id>`), `framing` from `framingFor`, passes `setWar` data to `GlobeCanvas` (halos always while the room is open; selected conflict; pins = that conflict's timeline entries with `at`; hover), a card click calls `focus` on the place; closing restores the globe; the old modal and `ConflictsPage` are deleted.
- Every piece of content from Plans 8 and 9 stays reachable (tests assert them): cards with ranges, by-kind table (as the stream's legend and a table), protest note, countries, latest events, timeline with sources, limits and notes, news reports, citations.
- [ ] **Step 1: Tests first:** the room is not a modal (no `aria-modal`, no backdrop role), Overview shows hero, stream, bubbles, league, countries, key events, reports; selecting a bubble or row opens the Conflict view and calls the globe selection; the Conflict view shows the three windows with ranges, the deaths x events chart, countries, the timeline, latest events; card hover/click call `onHoverPin`/`onFocusPlace`; unknown `#war=zzz` shows the overview; `timeline.json` failure shows "Timeline unavailable."; all prior content assertions; axe. **Step 2:** implement, delete `ConflictsPage`, run suite. **Step 3: Commit** `feat(ui): replace the War tracker modal with the docked War room`.

### Task 5: Polish, docs, review, merge

- [ ] Screenshots at 1440, 1100 and 375 px (overview, a conflict, the globe with halos), `docs/images/war-room*.png`; reduced-motion check (no count-up, no draw-in); `low` tier check; budgets, scan, build, two full-suite runs. Docs: DESIGN-LANGUAGE (War room, chart kit, globe war layer), DECISIONS D-058, BACKLOG, README (feature line and screenshot), BRAINSTORM status. One fresh Sonnet review (Review Focus above), one fix pass, merge ff-only, push, check CI and the live site.

---

## Self-review

- Covers the brief: docked dashboard (not a popup), many chart types, timeline and key events visual, and a presence on the globe (halos, zone, hotspots, pins, fly-to) without removing data.
- **Not in this plan:** a satellite or terrain base for conflict zones, frontline polygons (no licence-clear source: DeepState and ISW were rejected), live data, sound, a per-conflict map inset, new data sources.
- Types: `Conflict.geo`, `World.weeklyByKind`, `TimelineEntry.at`, `WarConflict`, `WarPin`, `setWar` are defined once above.
- Not verified yet: how the globe layer looks (shader and sizes are judged only in headless Chrome), real-device behaviour, whether 40 hotspot cells show a conflict's shape well.
