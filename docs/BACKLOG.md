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
- Plan 7 review minors left: `backdrop-blur` over the live canvas on integrated GPUs is unmeasured (reduced from xl to md/sm); the rails use `max-height` with their own scroll on short screens; the top-bar stats hide below 1200 px (no compact stats on tablets or phones yet).

## Instability Index (owner's priority, 2026-10-18)

The owner liked World Monitor's Country Instability Index and asked for it to be fleshed out comprehensively: see `docs/INSTABILITY-INDEX.md` (design only, not built). First step: confirm input licences (WGI, UNHCR), build the country-month feature table, fit a prior-violence-only baseline and see whether structural features beat it; only then models, backtest report and UI.

## Plan 8 deferred (War tracker data layer, 2026-10-18)

- **Plan 9: the sourced key-events timeline** (US/Israel-Iran, Russia-Ukraine, Israel-Gaza/Palestine, Lebanon, the wider Middle East): every entry has a date, one line, at least two independent sources with links, a status (confirmed / reported / disputed) and a "last checked" date. Written from web research with citations, never from memory.
- A per-conflict "since UCDP ends" feed from the live snapshot (GDELT) matched by country; the World overview already shows the newest reports worldwide.
- Show an event from the tracker on the globe (fly to it, open its card).
- Refactor About to use `useDialog` (the hook is used only by the War tracker so far).
- A real-phone and screen-reader pass of the War tracker (checked at 1440, 1100 and 375 px in headless Chrome only).
- Name the anonymised UCDP conflicts (`XXX475`) when UCDP publishes their actors.

## Plan 8 review minors (deferred, 2026-10-18)

- Show `provisionalShare` in the conflict detail header (a conflict that is 100 % provisional looks final).
- Collapse repeated codes in unnamed names ("XXX100 - XXX100 (Colombia)") and cap `place` at about 120 characters with whitespace collapsed; add an ellipsis when a headline is cut and split joined headlines on `;`.
- Say "no deaths in 90 d, last event <date>" for conflicts with zero 90-day deaths instead of "low data".
- Treat an unknown `selected` id as null (the World row's `aria-pressed`); use `lg:grid-cols-3` for the cards (three cramped cards between 768 and 900 px, not verified in a browser).
- Move focus to the detail heading or Back button when a row hides the list on narrow screens; make the World region's name match its heading; the loading text is a `role="status"` rendered at mount.
- `useDialog` duplicates About's logic; Ctrl+K opens the palette on top of both dialogs.
- Loader: validate the items of `latest[]`, `world.latest`, `countries[]` and real calendar dates for `dataEnd`; builder: cap `dataEnd` against one bad future date.
- Plan deviations: list rows have no sparkline or kind chips; `conflicts.json` is not in `scripts/check-budgets.ts`.
- Clamped ranges understate uncertainty when UCDP's `high` is below `best` (Iran 13,280 shows 13,280-13,280); candidate-month lag may make the newest weeks look low and the chart does not say so.

## Plan 9 deferred (sourced timeline, 2026-10-18)

- **Keeping it fresh:** the timeline is hand-curated; nobody updates it automatically. A repeatable refresh (research agents plus the same second-pass check, monthly) is a process, not code; an automatic or scheduled version is not built and the page only says "checked <date>".
- More theatres (Sudan, Yemen and the Red Sea, Myanmar, Sahel) and the front-line changes that lacked two readable sources (Pokrovsk, Myrnohrad, Huliaipole, Kupiansk).
- Sources the tools could not reach: Reuters, AP, BBC, Guardian, ISW; add them when a human can read them.
- Show a timeline entry's place on the globe; link an entry to the UCDP events of that week.
- Per-theatre `note` (data limits) is stored in the file but not displayed yet.
- A shared "independence" check beyond registrable domains (two AFP-based pieces count as two).

## Plan 9 review minors (deferred, 2026-10-18)

- Validator: `isDate` throws a RangeError on month 13 or 00 instead of returning false (add tests); `registrable()` lacks more two-level suffixes (com.ua, gov.il, gov.uk, ac.uk, co.jp), a trailing-dot host breaks it, and the same organisation under different domains (bbc.com / bbc.co.uk, aljazeera.com / .net, apnews.com / ap.org) is only caught by the outlet name; it does not check the 10-quoted-words rule.
- Loader: an empty `sources`, an empty `summary` or non-string `conflicts` items pass; "Timeline unavailable." shows on every conflict when the file cannot be loaded (also those no theatre covers).
- TimelineBlock: `role="region"` on a section is redundant; the list key `date-title` could collide across theatres in the World feed; tests missing for the "newest 8" default and the loading state.
- Data details: the Houthi coast entry sits in the Iran theatre; "with Iran's help" in Lebanon 19 June is a US official's statement; some entries have `published` dates earlier than later updates of the page; some URLs are `/amp/` or non-canonical; Ukraine 11 October is dated by the event but its sources are from 15 October; headline asymmetry between Russian and Ukrainian strikes was reduced, not removed.
- Replace the live-blog sources (CBS, Times of Israel) with dated articles when a human can read them.

## Plan 10 deferred (War room, 2026-10-19)

- A real-GPU and real-phone look at the globe layer (the zone ring, hotspot glow and pins were checked only by forcing the quality tier in a software-rendered browser), the frame rate with the layer on, screen-reader and keyboard pass of the room.
- Name labels on the globe can crowd the top controls row and each other at some views; a collision pass like the capital labels would fix it.
- Pins and halos are not clickable (selection is from the room); picking a halo on the globe to select the conflict.
- Weekly deaths for Russia - Ukraine are spiky because UCDP records large country-level claims on single dates; the chart is faithful to the data but could carry a note.
- The three kinds of the stream cannot be split per conflict (only the world has `weeklyByKind`).
- Animation polish (line draw-in, staggered reveal) was left out to keep the bundle and the reduced-motion audit simple.
- About still does not use `useDialog` from Plan 8.

## Plan 10 review minors (deferred, 2026-10-19)

- A stem click in the Overview selects its conflict and loses the place focus (the selection effect clears it); "Show on the map" for the same place twice after dragging the globe does nothing (the focus effect compares numbers); `pendingFocus` survives a `focus(null)` when the room closes before the boot ends.
- Halos are not clickable; labels re-emit only when a position changes (a selection colour change on an unmoved label is missed); the sonar pulse can imply live activity for data that ends 31 Aug.
- The scrubber is hidden while the room is open although a past playhead may still be active (no indicator); no safe-area padding in the bottom sheet; at 1100 px and wider the room covers the AsOf error line.
- Axis ticks can read 0.5 or 2.5 for tiny conflicts, the x axis has no year, `locatedShare` is relative to geocoded events only, the hero numeral is an `h3`, `TimelineBlock` adds an sr-only month in the date.
- Keyboard: about 75 tab stops before the next section (31 stream dots, 30 bubbles, 12 league rows): consider `tabIndex=-1` on the bubbles now that the full list exists.
- The total JS budget (275 KB) leaves 23 KB of headroom for lazy chunks; revisit if it is used up.

## Plan 11 deferred (Fatality and Instability indices, 2026-10-19)

- A globe choropleth of the two indices (colour the countries by band or risk); a country-list sort by index in the search palette.
- Refresh is a reviewed change by design (Plan 12: `data:ucdp-discover`, a monthly alert workflow); an unattended rebuild-and-open-a-pull-request job is not done (needs the repository setting that lets Actions create pull requests).
- The model's training months and the event counts still use the start date of an event (the windows and series follow the days); calendar-month training features would change the model and need a new backtest.
- The key-events timeline is hand-curated: the monthly alert tells when it is old, but updating it is manual research.
- The 90% intervals cover training uncertainty only; a conformal or walk-forward interval would cover model error too. The yearly rolling backtest exists (Plan 12); the features were chosen after seeing 2021-2025, so a truly untouched final test period (hold out the next year before touching the features) is still missing.
- Reviewer minors not done: the calibration guard checks absolute bin errors only (0.05), not a relative error for the small bins; "Why this score" is the unclamped log-odds (the card says so when the rise is capped at "continue"); Iran-type cases (very deadly year, quiet quarter) can show a high rise estimate with momentum "falling" (stated in the limits).
- No independent review of the model by a person who does conflict forecasting; protests (ACLED) are not available, so unrest is not in the index.

## Plan 13 (2026-10-19): what the review minors of Plans 8 to 10 became

Done (tests first, D-061): provisional share in the conflict header (already there); "no deaths in 90 days, last event <date>" wording; repeated codes in unnamed names collapsed; place cut at 120 characters; headlines split on `;`, whitespace-collapsed, ellipsis; an unknown selected id cleared; focus to the heading on open and back to the row on Back; the loading text is a live region from the first render; the hero numeral is not a heading; conflicts loader validates real dates and the items of `latest[]`, `world.latest[]`, `countries[]`; `dataEnd` capped at today; `conflicts.json` and `indices.json` have size budgets; `useDialog` is shared with About; Ctrl+K does not open over a dialog; timeline validator: no throw on month 13, more two-level suffixes, trailing dot, same organisation under several domains, 10-quoted-words rule; timeline loader rejects empty sources and summaries; per-conflict "Timeline unavailable" only where a theatre covers it; "Loading the timeline"; tests for the newest-8 default; bubbles and stream dots out of the tab order; no fractional axis ticks and the year on the stream axis; notes for spiky and provisional weeks; the time-travel playhead shown in the room with "Back to live"; the room's header says the rings are not live; safe-area padding of the bottom sheet; AsOf error notes in the header flow; halos are clickable; a timeline stem keeps its place focus; "Show on the map" twice works; a withdrawn queued flight does not fly later; per-conflict weekly deaths by kind.

Still open (needs a person, hardware or research, or was judged not worth it):
- A real-GPU, real-phone and screen-reader pass. The window cards and the by-kind list use a container query (three columns when the room is at least 460 px wide) instead of a viewport breakpoint; checked in headless Chrome at 800 and 1100 px.
- Data curation: more timeline theatres, Reuters/AP/BBC/ISW sources, replacing live-blog sources, the data details of single entries; a timeline that updates itself (a research process; the monthly alert says when it is old).
- Clamped ranges understate uncertainty when UCDP's `high` equals `best` (a range of 13,280 to 13,280); `locatedShare` is relative to geocoded events; the sr-only month in the TimelineBlock date; animation polish; naming anonymised UCDP conflicts when UCDP publishes the actors.
- Labels already avoid the top controls strip and re-emit when the selection changes (no change was needed).

## Plan 14 and 15 deferred (2026-10-19)

- Signals: IODA (internet outages) needs its terms read from a normal browser or a reply from Georgia Tech; PortWatch forbids automated bulk download without permission; GPSJAM has no reuse terms; Cloudflare Radar needs an account token (owner-set secret) and is CC BY-NC; OONI is CC BY-NC-SA. FIRMS CSV downloads were keyless on 2026-10-19; if NASA starts requiring a login the ingest reports FIRMS as unavailable.
- Signals: fires are context only (most detections are vegetation fires); a smarter filter (excluding known agricultural burn seasons or flares) would need a method and a validation, not a guess.
- Evidence trail: signals are matched by distance and time only; a corroboration score was deliberately not built (no invented weights).
- Displacement: refreshed by hand after UNHCR's releases (no alert for a new UNHCR year); UNRWA-registered Palestine refugees are a separate dataset not included.
- Watchlist: countries only (radius alerts and "notify me by e-mail" need a server); notifications only while a tab is open.
- Share: `#e=<event id>` links (an event card) were not built; only the moment, the country and the conflict.
- Items 11 (Indicators desk) and 13 (Story mode) of the v1.1 list have no plan.

