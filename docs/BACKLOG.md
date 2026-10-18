# Backlog

Open items found during Plan 1 that were deliberately not fixed. Each is graded Minor by effect unless noted. Source: final whole-branch review (2026-10-18) and implementer notes.

## Needs the owner

- ~~Shaksgam Valley patch~~ **Not needed** (D-027): Natural Earth's India file already includes the valley; verified against the Survey of India map.
- **Review the India guard point list** (`data/map/india-guard.json`, 18 verified points) against the Survey of India map.
- **Confirm** that capitals of Kosovo, Somaliland and Western Sahara stay dropped (D-022).

## Engine and UI

- `GlobeCanvas` effect depends on `onPick`: an inline callback rebuilds the globe and refetches data. Keep it in a ref.
- `installFrameOverlay` (dev only) never removes its element or key listener.
- A lost WebGL context shows the permanent "cannot run WebGL2" message with no restore path (wording misleading for a transient GPU reset).
- `dispose()` does not call `renderer.forceContextLoss()`; the `hasWebGL2` probe context is never released (context pile-up under HMR / React StrictMode).
- Data fetches are sequential and StrictMode double-fetches the low file: use `AbortController` and `Promise.all`.
- Until the high-detail file loads, picking uses the low-detail data (lacks about 19 micro-states); the picker swap is deferred twice.
- Picking at exactly lat -90, or exactly lon +-180 on Chukotka, returns null (exact equality only).
- Keyboard navigation and pinch zoom of the globe are not implemented (spec lists keyboard navigation; planned for Plan 5 accessibility pass).

## Tests, scripts, docs

- Regression test against the Survey of India reference: commit a simplified registered boundary (about 3,000 points) and assert the built India outline stays within about 8 km of it everywhere. Needs a decision on redistributing derived data from a Government of India map.
- Outline differences beyond Shaksgam are unchecked individually: e.g. the northern tip near 75.2E 37.0N differs by up to 18 km, and Kalapani/Sir Creek were not compared.
- `scripts/check-budgets.ts` passes silently when `dist/` or data files are missing; it should fail.
- `india-guard.json` `status` is not validated (a typo skips an entry) and a `pending-owner` entry only warns.
- `docs/DATA-SOURCES.md` border table has stale low-detail numbers (711 KB raw / 177 KB gz; measured 626 KB / 162 KB). D-021 should say the antimeridian split also caused the seam lines (fixed).
- Patch engine fails on overlaps only, not on gaps (cut-from without add-to); see D-026.
- Micro-states without a polygon (Vatican, Tuvalu's capital point, Coral Sea Islands, Scarborough Reef): point-based lookup in Plan 3.

## Plan 2 deferred minors (final review, 2026-10-18)

- `fetch-gdelt.ts` drops a slot silently after 3 failed attempts and ignores `Retry-After`; the summary does not report failures; `fetch-ucdp.ts` does not retry thrown network errors.
- `verifySnapshotHash` resolves true when SubtleCrypto is missing (plain http off localhost): the checksum is skipped silently.
- GDELT is fetched over plain http (GDELT offers no https for these files); source URLs from GDELT end up as links on the card (http(s) only, `noopener noreferrer`).
- `merge.ts`: merged groups lose the other rows' actors and place; `find` recurses without a depth limit; a row with the head's own id can add it to `alsoIds`.
- The idle archive load is not cancelled by a visibility change; the poller does not refetch when the tab becomes visible again.
- `freshness` shows `HH:MM UTC` without a date, ambiguous when days old.
- GDELT-only recent window: the recent snapshot has no UCDP data after 2026-08-31 and GDELT is US-centric and noisy (see `docs/TENSION-INDEX.md`); human-coded coverage (ACLED, newer UCDP) is the real fix.
- No scheduled 15-minute ingest yet (Plan 5): "live" means the age of the last manual build, shown honestly by the pill.

## Plan 3 deferred minors (2026-10-18)

- Clicking a capital marker that has an event under it opens the event card as well as the dive.
- Capital labels are not culled against the open dossier panel; no hover cursor over markers; no keyboard route to markers (the palette is the accessible route).
- The dive framing shift (0.17 / 0.2 of the canvas) is a fixed guess; desktop-width framing was not checked visually.
- Factbook fields are archived (data date 2026-01-22, D-038): replace them (Wikidata or national sources) in a later plan; 61 Factbook files did not match a country by capital coordinates (see DATA-SOURCES.md).
- `GlobeCanvas` rebuilds the whole globe when `onPick` or `onLabels` changes identity (both are stable today; keep them in refs if that changes).
- Natural Earth's "alternate capital" flag is not always the minor seat: for Tanzania it marks Dodoma (the Factbook's capital) as alternate, so the globe marks Dar es Salaam and the dossier lists Dodoma first. A small override table would fix it.
- 54 dossiers (for example GRL, ABW, HKG) have no capital: Natural Earth lists those capitals as "Admin-1" places. Nuuk and Oranjestad are not searchable. Palestine's type chip reads "Indeterminate".
- World Bank area for countries touching India's disputed areas (CHN 9,562,910 km2, PAK 796,100 km2) is the national statistic, not derived from India's depicted borders, while India's own figure is the World Bank's national one too. The Area row's source says so; a note in the dossier is a Plan 6 copy decision.
- Ids vs ISO3: `#c=` accepts both, but the dossier files and `CountryRow.id` use Natural Earth's ADM0_A3 (SDS for South Sudan, PSX for Palestine).

## Plan 4 deferred (2026-10-18)

- Alliances: add the US bilateral mutual defense treaties (Japan, South Korea, Philippines) and other formal pacts once an official page can be read and cited; SCO/BRICS and similar are not alliances and are excluded by rule.
- A dispute's conflict name is UCDP's own string (one is the placeholder "XXX2"); a display name table would be nicer.
- Cursor = Radar and the arcs have no keyboard equivalent (the palette and dossier are the accessible route); Plan 6 accessibility pass.
- Night Watch place text falls back to the country id when the event shard has no place; the snapshot carries no country names.
- Grain density is rebuilt on the main thread (about 4 times a second while scrubbing); move to the worker if a phone tier needs it (Plan 6).
- Sound: arrival pings only fire when a refreshed snapshot arrives (Plan 5 makes that real); no audio test is possible in the in-app browser.
- The terminator accuracy is about 1 degree; no twilight shading.
- Dive distance for countries with far-flung territories (France) is large because the bbox includes them.

## Plan 4 review minors (deferred, 2026-10-18)

- The audio context is never suspended or closed when Sound is turned off or the tab is hidden (no new pings fire, so it is silent); pending staggered pings are not cancelled on disable.
- Night Watch does not refresh its idle timer when the tab becomes visible again, so it can start at once on return.
- The grain texture is released only by the scene traversal, not by `grainLayer.dispose` (small GPU-memory leak per globe mount in dev/StrictMode).
- `focus()` before the boot ends is dropped, not retried (unreachable in practice: Night Watch needs 20 s idle).
- Scrubber label shows "0 days before now" for a paused sub-half-day playhead; reduced-motion preference is read once per render.
- Night Watch re-targets with instant camera cuts every 9 s under reduced motion (a decision to record, not a bug).
- Hovering another country during a dive swaps the dived country's arcs away (arcs follow hover first).
- ANZUS AUS-NZL source (State Department Office of the Historian) was read by the author only; a second reading is welcome.

## Plan 5 deferred (2026-10-18)

- 15-minute cadence: needs a public repo (unlimited Actions minutes) and room under the Vercel deployment limit; or a data origin decoupled from deployments (Vercel Blob, R2) so new data does not need a deploy.
- The Vercel deploy steps are unverified (no account access here); the first owner run of `gh workflow run ingest.yml` with the secrets set is the real test.
- The GDELT rolling cache is not size-capped beyond the 8-day prune; check cache usage after a few weeks.
- Alerting: a failed scheduled run only shows in the Actions tab (email from GitHub if enabled); monitoring is Plan 6.
- `npm audit` covers production dependencies only; dev-dependency advisories are left to Dependabot.

## Plan 5 review minors (deferred, 2026-10-18)

- The workflow builds the site twice when deploying (`npm run build`, then `vercel build`) and runs `npm ci` twice inside the job; the first run took 2 min 18 s with a cold cache (plan assumed about 3 minutes); re-measure with a warm cache.
- GDELT slots that returned 404 are marked missing permanently, so a transient outage leaves a gap.
- The validator has no comparison with the previous published snapshot (for example "event count dropped by more than half").
- `npm audit --audit-level=high` can fail an unrelated pull request when a new advisory appears.
- The secret scanner covers tracked files only and misses unprefixed tokens (a 24-character Vercel token has no prefix); GitHub's own secret scanning is the backstop (enable it for the repo).
- `eventsBase` over-rejects an upper-case `HTTPS://` scheme (harmless).

## Plan 6 deferred (2026-10-18)

- Real-device checks: phones (touch, pinch, safe areas), Safari and Firefox, a screen reader pass, audio output. The in-app browser only sends mouse events.
- Colour contrast of labels over the live globe imagery is not tested (only the tokens on flat black).
- The quality governor was only exercised by unit tests and forced tiers; a genuinely slow device has not been tried.
- Tab order places the canvas before the top bar (DOM order); a roving focus for the capital markers and event dots is not built (the palette and dossier are the accessible route).
- The Esc priority for the event card has no test; the About copy is the builder's draft for the owner to review.
- `?tier=` forcing exists in dev builds only; there is no in-app quality setting.
- The monitor only checks age; it does not check event counts or the CSP. Alerting beyond GitHub's failed-run email is not set up.

## Plan 6 review minors (deferred, 2026-10-18)

- Tier changes restart the arc draw-in animation (cosmetic); a lazy chunk that fails to load (offline) stays failed for About until a reload.
- The palette keeps its key handlers on its input only (focus on the page behind it is unusual); About uses window handlers.
- `announce()` with the same text twice in a row is not re-announced (the DOM does not change); keyboard users still cannot select an event, only a country (palette).
- The canvas aria-label says "Control K" on every platform; the palette button carries both Control and Meta shortcuts.
- `errorLog` strips query strings from absolute URLs only; a browser JSON SyntaxError can quote a few characters of a response. It never leaves the browser.
- `serve:dist` always falls back to index.html (Vercel has no rewrite and would 404 unknown paths; harmless with hash routing).
- A custom `VITE_EVENTS_BASE` origin must be added to `connect-src` by hand; the build does not check it.
- `package-lock.json` has a root `engines` entry that `package.json` does not declare (harmless drift).

## Plan 7 deferred (2026-10-18)

- The rails were checked only in headless Chrome screenshots (1100, 1280, 1440, 1920 px and 375 px) and unit tests; real-device feel, Firefox scrollbars and a screen-reader pass are not done.
- Hotspots rank GDELT-heavy countries (the US, UK) first because GDELT over-reports them; a per-capita or per-source-normalised ranking would be fairer but needs a decision on method.
- "Human-coded" shows 0 % for the last 30 days because UCDP's data ends 31 Aug 2026 (true, labelled); a newer human-coded source (ACLED, UCDP candidate releases) would fix the number itself.
- The faint DEFCON word and corner ticks have no reduced-motion concern (static) but were not tuned for very bright event clusters; the rails are hidden on tablets under 1100 px (no tablet layout yet).
