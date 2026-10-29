# Defcon self-profile (honest, evidence-based)

Read on 2026-10-29 (UTC) by the project's own research agent. Repo: /home/lucifer/Documents/Projects/Defcon, HEAD f7f9a0c (2026-10-19), identical to origin/main (`gh api repos/Tribal-Chief-001/defcon/commits/main`, 2026-10-29). Live site: https://defcon-roan.vercel.app (queried with curl 2026-10-29 09:55 UTC). Nothing was built, no tests run, no data rebuilt. "INFERENCE" marks anything not read directly. Path shorthand: `docs/X.md` = /home/lucifer/Documents/Projects/Defcon/docs/X.md. Status of this file: complete (saved first after a session interruption, then extended).

## Identity and purpose
- "A real-time 3D world monitor of armed conflict and civil unrest, and a frontend design showcase" — README.md line 8; decision D-001 in docs/DECISIONS.md ("real-time world conflict/protest 3D globe monitor and a frontend design showcase").
- Static single-page app (Vite, React 19, TypeScript strict, custom Three.js globe, Zustand, Tailwind 4, d3-geo, topojson) — docs/TECH-STACK.md table; package.json dependencies.
- No always-on backend: scheduled ingestion writes static snapshots; the client re-checks about every 60 s (D-013, docs/DECISIONS.md).
- Not the US DEFCON level: the "tension index" is labelled "DEFCON-style" and shown only when comparable (D-007, D-031; docs/TENSION-INDEX.md "Comparability").
- Live: https://defcon-roan.vercel.app, HTTP 200, `server: Vercel` (curl -I 2026-10-29).

## Owner, funding, licence (code and each data file)
- Owner: GitHub user Tribal-Chief-001; 151 commits, all by that one author, dated 2026-10-18 (111) and 2026-10-19 (40) (`git log --format=%an`, `git log --format=%ad --date=short`, 2026-10-29). Single maintainer; the commits are AI-assisted (the CLAUDE.md-style workflow described in docs/DECISIONS.md "Who: Builder = Claude").
- Funding: none stated anywhere in README.md or docs/. Free tiers only: GitHub Actions and Vercel Hobby (D-047, docs/DECISIONS.md). INFERENCE: self-funded hobby/showcase project.
- Code licence: MIT, "Copyright (c) 2026 Tribal-Chief-001" (LICENSE line 1-3; GitHub API `license.spdx_id = MIT`, 2026-10-29). Repo is public (`visibility: public`), created 2026-10-18 (`gh api`, 2026-10-29).
- Data licences are separate from MIT (README.md "Licence"; docs/OPEN-DATA.md "Rules of the road"):
  - `events/*.bin`, `*.meta.json`: UCDP CC BY 4.0 plus GDELT (free, cite the GDELT Project) — live recent.meta.json `sources[].license`, 2026-10-29.
  - `conflicts.json`: UCDP GED and Candidate, CC BY 4.0 — docs/OPEN-DATA.md table.
  - `indices.json`: derived from UCDP and World Bank (CC BY 4.0) — docs/OPEN-DATA.md.
  - `signals.json`: NASA FIRMS (open, acknowledgement), GDACS (CC BY 4.0), USGS (public domain) — live signals.json `sources[].license`.
  - `displacement.json`: UNHCR, CC BY 4.0 — docs/DATA-SOURCES.md "Displacement".
  - `timeline.json`: facts in own words, sources linked, no licence stated beyond that — docs/OPEN-DATA.md; docs/DATA-SOURCES.md "Key-events timeline".
  - `countries.json`, `dossiers/*.json`, `relations.json`, `capitals.json`, `borders.*.topo.json`: Natural Earth (public domain), World Bank (CC BY 4.0), CIA World Factbook (public domain via a mirror), UN and NATO lists — docs/OPEN-DATA.md.
  - There is no single data licence file for the repo; data files carry no embedded licence header except `signals.json` and `*.meta.json` (INFERENCE from reading the sampled files; `conflicts.json` has a `sources` key, indices.json does not list one).

## Coverage (countries, years, conflicts, languages)
- Countries: 248 in the India-POV border file and 248 dossiers (`public/data/dossiers/index.json` length 248; docs/DATA-SOURCES.md "Border build"). Event data touches 165 countries in the live recent snapshot and 84 in the archive (decoded from live `recent.bin`/`archive.bin`, 2026-10-29).
- Event years in the UI: 365 days only. Time travel maxes at 365 days (`MAX_BACK_S = 365 * 86400`, src/time/store.ts line 3). Archive window starts 2025-10-29 (archive.meta.json `windowFromS`).
- Longer history exists only in derived series: indices monthly series (10 years; docs/DESIGN-LANGUAGE.md "Indices"), model training from 1998 (docs/DATA-SOURCES.md "Indices"), UCDP GED 1989-2025 is downloaded but not shown event-by-event (docs/DATA-SOURCES.md "UCDP").
- Conflicts: 104 listed in live conflicts.json (python over the file, 2026-10-29), threshold at least 100 deaths in 365 days or 25 in 90 days (docs/DATA-SOURCES.md "Conflicts"); data end 2026-08-31.
- Indices: 130 countries have a Fatality Index and an Instability Index (live indices.json: 130 countries, all with `risk`); other countries are "not modelled" (D-059).
- Timeline: 46 entries, four theatres, dates 2026-01-08 to 2026-10-16, statuses confirmed 33, reported 8, disputed 5 (live timeline.json, 2026-10-29).
- Languages: UI English only (`<html lang="en">` in index.html; `toLocaleString('en-US')` in src/ui/TopBar.tsx line 9; grep for i18n/react-intl in src returned nothing). Dossiers show the Factbook languages spoken in a country as data, not UI language.

## Data sources and provenance (human-coded vs auto-coded, with labels)
- Human-coded: UCDP GED 26.1 (1989-01-01 to 2025-12-31, 417,968 events) and monthly UCDP Candidate files (Jan-Aug 2026, provisional) — docs/DATA-SOURCES.md "UCDP"; data/events/sources.json (pinned SHA-256 per file).
- Auto-coded: GDELT 2.0 15-minute event files, kept 3.9% after filters (28,092 of 723,710 rows in the 2026-10-18 measurement) — docs/DATA-SOURCES.md "GDELT 2.0 Events".
- Labelling: every event stores a `human` flag (live bin, column `human`); recent snapshot 0 of 11,629 human-coded, archive 17,273 of 17,273 human-coded (decoded 2026-10-29). Coverage legend: filled = human-coded, ring = auto-coded (D-034).
- Severity rule: 4-5 requires human-coded deaths; auto-coded never above 3 (docs/SEVERITY.md; verified in the live snapshot: max auto severity 3, 359 human events at severity 4 or 5).
- Protests and riots come only from GDELT (D-029); in the live recent snapshot 1,829 protest and 230 riot events out of 11,629 (decoded 2026-10-29; kind order in src/events/types.ts line 1).
- Other sources: Natural Earth 5.1.1 (public domain), World Bank WDI/WGI (CC BY 4.0), CIA Factbook archived mirror (four fields, data date 2026-01-22), UN and NATO lists, UNHCR (CC BY 4.0), USGS, GDACS, NASA FIRMS (docs/DATA-SOURCES.md each section).
- Not used on purpose: ACLED (Open level has no API, EULA limits display; docs/BRAINSTORM-v1.1.md section 3), V-Dem (CC BY-SA), Cloudflare Radar (CC BY-NC), OONI (CC BY-NC-SA), IODA, PortWatch, GPSJAM (docs/LICENCE-CHECK-v1.1.md).
- AI involvement in data: the timeline was written and re-checked by AI research agents reading pages through a summarising fetch tool (docs/DATA-SOURCES.md "Key-events timeline", D-057). There is no human newsroom check.

## Update latency (how old is the newest UCDP event, GDELT slice, signals file on the day read; how data refreshes and what is manual)
Measured 2026-10-29 09:55:41 UTC from live files:
- Newest UCDP event: 2026-08-31 (recent/archive meta, ucdp `asOfS` 1788134400) = 59.4 days old. conflicts.json `dataEnd` and indices.json `dataEnd` are also 2026-08-31.
- UCDP has published a newer file: `HEAD https://ucdp.uu.se/downloads/candidateged/GEDEvent_v26_0_9.csv` returned HTTP 200 on 2026-10-29, and `..._v26_0_10.csv` returned 404. The pinned manifest ends at 26.0.8 (data/events/sources.json). So the live site is at least one monthly release behind.
- Newest GDELT slice: 2026-10-29 00:45 UTC (gdelt `asOfS` 1793234700) = 9.2 h old; snapshot generated 2026-10-29 01:00:27 UTC = 8.9 h old.
- GDELT coverage in the snapshot starts 2026-10-19 22:15 UTC (`coverFromS` 1792448100), i.e. 9.1 days.
- Signals file generated 2026-10-29T01:00:24Z = 8.9 h old (live signals.json `generated`).
- Other committed files: conflicts.json generated 2026-10-19, indices.json generated 2026-10-18, timeline.json checkedAt 2026-10-18 (11 days), displacement and dossiers by hand (live JSON `generated` keys).
- Scheduled refresh: `ingest.yml` cron `17 */3 * * *` plus on push and manual (.github/workflows/ingest.yml lines 6-11). Observed run times: the last 20 scheduled successes (gh run list, 2026-10-29) are between about 2.4 h and 8.6 h apart (my arithmetic on the timestamps; newest 2026-10-29 01:00 UTC, none newer by 09:55 UTC), so the real cadence is looser than "every 3 hours". All 20 listed runs concluded `success`.
- Freshness monitor: `monitor.yml` cron `41 */6 * * *` fails when recent.meta.json is older than 12 h (D-052); its last runs on 2026-10-29 06:23 UTC succeeded.
- What is manual: UCDP re-pin (`data:ucdp-discover -- --accept`), `data:conflicts`, `data:indices` (about 3 min), dossiers/World Bank/Factbook/memberships, UNHCR displacement, relations, and the whole timeline (docs/DATA-SOURCES.md "Refreshing UCDP data", docs/OPEN-DATA.md "Updated" column, D-060).
- Alert for the manual items: `data-updates.yml` runs on the 5th of each month (cron `23 6 5 * *`) and fails when a newer UCDP file exists or the timeline is over 45 days old. `gh run list -w "Data update alerts"` returned no runs on 2026-10-29, so it has never fired in the 11 days since it was added. The first scheduled run is 2026-11-05.
- Gap in the event layer (INFERENCE from decoding the live bins): archive events end at 2026-08-31 (max time 1788134400) and recent events start at 2026-10-19 (min time 1792448100), so 2026-09-01 to 2026-10-18 (49 days) has no events on the globe, although the "recent" window nominally spans from 2026-09-29.

## Event model and geo precision
- Binary struct-of-arrays snapshot: time u32, lat f32, lon f32, detail u32, country u16, kind u8, severity u8, precision u8, human u8 (docs/DATA-SOURCES.md "Event snapshots"; offsets in live recent.meta.json).
- Kinds: armed, civilian, riot, protest, other (src/events/types.ts line 1). UCDP types 1-2 map to armed, 3 to civilian; GDELT CAMEO 14x protest/riot, 19x armed, 18x/20x civilian (docs/DATA-SOURCES.md).
- Precision 1-5. UCDP `where_prec` 1-5 maps through, 6-7 to 5; GDELT ActionGeo type 3/4 to 2, 2/5 to 4 (docs/DATA-SOURCES.md). Live distribution: archive 1:8,227, 2:4,043, 3:2,381, 4:1,160, 5:1,462; GDELT recent 2:10,138, 4:1,491 (decoded 2026-10-29).
- GDELT filters drop country centroids, (0,0), events dated more than 2 days before DATEADDED, and rows with fewer than 2 sources and under 3 mentions (docs/DATA-SOURCES.md "Filters").
- Time: a GDELT event's time is when GDELT first reported it, shown as "reported X ago", never an exact event time (D-032).
- Country is assigned from the India-POV borders, not UCDP's country name (docs/DATA-SOURCES.md "Mapping").
- Dedupe: GDELT events fold into UCDP events within 2 days; same article merges within 1 degree and 1 day (D-032, D-034).
- Event card shows precision text and "N/5" (src/ui/EventCard.tsx lines 46, 125).
- War room geography uses only events at province precision or better (`where_prec` <= 4); in Russia-Ukraine only 12% of deaths are located (D-058, docs/DATA-SOURCES.md "Conflicts").
- Candidate events spanning months have deaths spread evenly over their days (D-060, scripts/lib/spread.ts).

## Methodology transparency (documents, decisions log, backtest, reproducible scripts)
- Decision ledger D-001 to D-063 with date, why and who (docs/DECISIONS.md, 69 rows).
- Per-source tables with licence, version, SHA-256, fetch date (docs/DATA-SOURCES.md, 228 lines); licence audit with "NOT READ" rows marked (docs/LICENCE-CHECK-v1.1.md).
- Formulas: severity (docs/SEVERITY.md), tension index and its calibration `scale = 1448` (docs/TENSION-INDEX.md), Fatality Index `100*log10(1+deaths90)/log10(10001)` (D-059).
- Backtest committed and generated: docs/INDEX-BACKTEST.md ("Generated by `npm run data:indices`"); studies docs/VRI-BASELINE-STUDY.md and docs/VRI-STUDY-2.md; guard test tests/index/indices-data.test.ts.
- Reproducible scripts: `npm run data:*` and `map:*` in package.json; UCDP and Natural Earth pinned by SHA-256; map cross-check scripts in scripts/map/soi-check/ (docs/MAP-POLICY.md).
- Method also shown in the app: MethodSection (src/ui/MethodSection.tsx) rendered on the About page (src/ui/AboutPage.tsx).
- Limits: the indices are rebuilt by hand and not in CI (docs/DATA-SOURCES.md "Indices" Refresh row). No independent review by a conflict-forecasting expert (docs/BACKLOG.md "Plan 11 deferred"). Raw inputs are gitignored (`data/raw/`), so a reader must re-download them to reproduce; the pins make that checkable.

## Uncertainty shown to users (ranges, intervals, confidence, provisional flags)
- Deaths shown as best estimate with low-high range for 30/90/365 days (D-055; whisker charts `src/viz/RangeBar.tsx`).
- Instability Index: probabilities with 90% intervals from a 100-replicate cluster bootstrap (training uncertainty only), momentum, confidence label with a reason, "why this score" terms (D-059; live indices.json `model.bootstrapReps` = 100; docs/INDEX-BACKTEST.md header).
- Extremes shown as `>99.9%` and `<0.1%`, wording "risk estimate", never "will" (docs/DESIGN-LANGUAGE.md "Indices").
- Provisional flags: 2026 UCDP rows labelled provisional, share per conflict (D-055, docs/DATA-SOURCES.md "Provisional").
- Missing data as a redaction bar saying "unavailable"; "not modelled" is not "low" (D-009, D-059).
- Windows end at the data end date, and the War room says so (D-055).
- Known weaknesses of the uncertainty display (docs/BACKLOG.md "Plan 11 deferred"): intervals ignore model error; a range can collapse to 13,280-13,280 when UCDP `high` equals `best`; features were chosen after seeing 2021-2025, so there is no untouched final test period.
- The timeline shows confirmed / reported / disputed, the sources' limits, and "checked <date>" (D-057).

## Visual product (list every view)
Views, each with its source file:
- Globe: custom Three.js, hairline borders in two detail levels, picking, sonar ripples (README.md Features; src/globe/engine.ts, borderGeometry.ts, eventLayer.ts).
- Country dossier and Country Dive: 1.2 s camera flight, dossier beside the country, `#c=IND` links (D-039; src/ui/DossierPanel.tsx, src/globe/dive.ts).
- Command palette Ctrl/Cmd-K for countries and capitals (src/ui/CommandPalette.tsx; D-040).
- Capital labels with level of detail (src/ui/CapitalLabels.tsx, D-040).
- War room, `#war` and `#war=<id>`: docked dashboard, Overview (hero numeral, ring, stream chart, bubbles, league, countries, newest key events, news reports, latest events) and per-conflict view (src/ui/WarRoom.tsx, src/ui/war/Overview.tsx, ConflictView.tsx, EventList.tsx, NewsReports.tsx; docs/DESIGN-LANGUAGE.md "War room").
- Index board in the War room (two ranked lists of 15, world monthly deaths) and Index card in the dossier (gauge) (src/ui/war/IndexBoard.tsx, src/ui/IndexCard.tsx, src/viz/Gauge.tsx).
- Signals block in the War room (src/ui/war/SignalsBlock.tsx; D-062).
- South Asia lens: `RegionView` and `src/regions.ts` (eight SAARC states: AFG, BGD, BTN, IND, LKA, MDV, NPL, PAK).
- Sourced timeline (src/ui/TimelineBlock.tsx) with pins on the globe (src/ui/war/pins.ts, docs/DESIGN-LANGUAGE.md).
- Event card with evidence trail (src/ui/EventCard.tsx; D-063 distances: fires 40 km/2 days, seismic 100 km/3 h, disasters 300 km/7 days).
- Scrubber and time travel with Play, Back to live, cosmetic Declassify (src/ui/Scrubber.tsx, src/time/store.ts; D-043).
- Night Watch idle showcase after 20 s, up to 5 events, letterbox bars (src/ui/NightWatch.tsx, src/watch/nightWatch.ts; D-045).
- Rails: Hotspots (left) and Latest (right) at 1100 px and wider (src/ui/Rails.tsx line 35; docs/DESIGN-LANGUAGE.md "UI polish").
- Pulse border, radar cursor (Reticle), heat grain, day/night terminator, alliance arcs and active-dispute arcs, optional World Sound (README.md; D-044 to D-046).
- Watchlist panel and alerts (src/ui/WatchPanel.tsx, WatchAlerts.tsx, WatchToggle.tsx), Share button (src/ui/ShareButton.tsx), About page (src/ui/AboutPage.tsx), error boundary (src/ui/ErrorBoundary.tsx), displacement block (src/ui/DisplacementBlock.tsx).
- Mobile layout: the War room becomes a bottom sheet over 62% of a narrow screen with safe-area padding; top-bar stats hidden below 1200 px, rails hidden below 1100 px, HUD frame hidden on phones (docs/DESIGN-LANGUAGE.md "War room" and "UI polish"; docs/BACKLOG.md "Plan 7 deferred" says there is no tablet layout and no compact stats on tablets or phones). Pinch zoom uses two touch pointers (D-049). Checked only in headless Chrome at 375 px and similar, not on a real phone (docs/LAUNCH.md section 4).
- Reduced motion: audited by tests/a11y/reduced-motion.test.ts over the whole src tree; boot instant, auto-rotation off, Play disabled, grain still (D-044, docs/DESIGN-LANGUAGE.md "Rules", docs/LAUNCH.md section 3 checklist item).
- Quality tiers: high/medium/low (pixel ratio 2/1.5/1, grain 1/0.5/0, label cap 40/24/12, arc segments 48/32/16, terminator on/on/off, heat rebuild 4/2/0 Hz) in src/perf/quality.ts lines 3-8. Start tier from `detectStartTier` in src/perf/device.ts: low at 2 GB or less memory, medium for touch, narrow (max-width 639 px) or 2 or fewer cores, else high. No in-app quality setting (docs/BACKLOG.md "Plan 6 deferred").
- Design system: true black `#000000`, bone, lime, orange, cyan; Syne, Space Grotesk, JetBrains Mono self-hosted (docs/DESIGN-LANGUAGE.md "Tokens", "Type"); no emoji, no box-shadow (tests/design/forbidden.test.ts).

## Accessibility (what the tests cover, what is not verified)
- Keyboard-operable canvas (arrows 0.08 rad, +/- zoom, Home reset), skip link, one polite live region, focus moves into dossier/event card and returns, Esc closes top layer only (D-050, docs/DECISIONS.md).
- Tests: axe-core in jsdom over AboutPage, TimelineBlock, CommandPalette, DossierPanel, EventCard, NightWatch, Rails, RelationsBlock, Reticle, Scrubber, SkipLink, SoundToggle, StatusRegion, TopBar with `color-contrast` and `region` rules disabled (tests/a11y/axe.test.tsx lines 1-40); a token contrast test for `--text-muted` 68% and `--text-faint` 55% on black at WCAG AA 4.5:1 (tests/a11y/contrast.test.ts; docs/DESIGN-LANGUAGE.md "Text colours"); a reduced-motion source audit (tests/a11y/reduced-motion.test.ts).
- Charts have text alternatives and the League and timeline list are the keyboard equivalents of the bubbles and stream dots (docs/DESIGN-LANGUAGE.md "Charts"; D-061).
- Not verified (docs/LAUNCH.md section 4; docs/BACKLOG.md "Plan 6 deferred"): any real screen reader (NVDA, JAWS, VoiceOver, TalkBack); real phones and touch; Safari and Firefox; colour contrast of labels over the live globe imagery; the DOM tab order puts the canvas before the top bar; capital markers, event dots, radar cursor and arcs have no keyboard route (the palette and dossier are the route); `announce()` does not repeat identical text. Axe in jsdom cannot test layout, so contrast and focus-visibility on the rendered page are unmeasured by axe (INFERENCE from the test's own comment, tests/a11y/axe.test.tsx).
- No WCAG conformance statement or audit report exists in the repo (searched docs/; INFERENCE from absence).

## Performance and size (JS gzip, data sizes, quality governor)
- Budgets in scripts/check-budgets.ts lines 8-20: initial JS 250,000 B gzip, all JS 275,000 B, borders low 300 KB and high 1 MB, conflicts 180 KB, indices 60 KB, displacement 40 KB, signals 60 KB, events recent 500 KB and total 2 MB, relations 8 KB, dossier index 40 KB, one dossier 6,000 B raw. The script passes silently when `dist/` or data is missing (docs/BACKLOG.md "Plan 1" item; code uses `existsSync` guards).
- Built output in dist/ (files dated 2026-10-19 15:43, the same minute as the last commit; INFERENCE that it is the build of HEAD) gzipped with `gzip -c | wc -c` on 2026-10-29: index-BTE8Yy5d.js 241,076 B; WarRoom-CJcGC-Z2.js 15,794; AboutPage-CdYlRbv_.js 6,930; format-Dgt-hTkF.js 4,780; worker-D3OOQAuK.js 1,240; CSS index-DRe2VvyV.css 8,886. JS total 269,820 B (budget 275,000, headroom about 5.2 KB). Initial load (entry script plus `format` modulepreload, per dist/index.html) 245,856 B (budget 250,000, headroom about 4.1 KB). 27 woff2 font files in dist/assets.
- docs/TECH-STACK.md and D-058 still say 238 KB initial and 252 KB total; the build in dist/ is larger (see list B).
- Live data (raw / gzip bytes, 2026-10-29): borders.low 626,371 / 162,349; borders.high 3,436,603 / 795,674; conflicts 588,470 / 126,499; indices 183,188 / 22,837; timeline 67,633 / 17,199; signals 126,740 / 14,218; displacement 32,922 / 4,747; countries 71,348 / 16,667; capitals 15,462 / 4,674; relations 3,085 / 1,003; events recent.bin 255,852 / 85,809; archive.bin 380,020 / 114,922.
- Quality governor: steps down when the 90th-percentile frame time over 90 frames exceeds 22 ms; steps up after 10 s under 14-19 ms (relative to the best median seen); minimum 4 s between changes; ignores frames over 250 ms; never above the start tier (src/perf/quality.ts lines 10-18; D-049). Exercised only by unit tests and forced tiers, never on a genuinely slow device (docs/BACKLOG.md "Plan 6 deferred").
- Measured frame rate: 60.2-60.3 fps in the in-app browser on Intel UHD at about 465 px wide, DPR 1 (docs/TECH-STACK.md "Measured"). Not measured at full-screen desktop, HiDPI, or on phones. Frame rates since Plan 7 (rails, war layer, grain) are not in the docs (INFERENCE from searching docs/TECH-STACK.md).
- Cache headers: events no-cache (`max-age=0, must-revalidate`); borders/countries/capitals 1 h with stale-while-revalidate 1 day; assets immutable 1 year (vercel.json). Other data files (conflicts, indices, signals, timeline) have no explicit rule and came back `max-age=0, must-revalidate` on the live site (curl -I 2026-10-29).

## Privacy, accounts, tracking, security headers
- No cookies, no analytics, no accounts, no third-party requests; fonts self-hosted (src/ui/AboutPage.tsx privacy paragraph; D-052). index.html loads no external scripts (CSP `connect-src 'self'` and `script-src 'self'` enforce this).
- Browser storage: `defcon.watchlist.v1` in localStorage (src/watchlist/watchlist.ts line 7), a Sound on/off key (src/sound/store.ts), a session flag for the opening animation (src/globe/engine.ts line 146). The About page names only the sound flag and the animation flag, not the watchlist (see list B).
- Diagnostics are an in-memory log, never sent (D-052).
- Live response headers (curl -I https://defcon-roan.vercel.app/, 2026-10-29): Content-Security-Policy `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests`; Strict-Transport-Security `max-age=63072000` (no includeSubDomains, no preload); X-Frame-Options DENY; X-Content-Type-Options nosniff; Referrer-Policy strict-origin-when-cross-origin; Permissions-Policy `camera=(), microphone=(), geolocation=(), payment=()`; COOP same-origin; CORP same-origin. These match vercel.json.
- `/data/*` files return `access-control-allow-origin: *` on the live site (curl -I on conflicts.json) although `Cross-Origin-Resource-Policy: same-origin` is set on pages; INFERENCE: browsers' cross-origin fetches of the data files are governed by CORS, so other sites can fetch them. Not tested from a browser.
- Supply chain: workflows pinned to full commit SHAs, top-level `permissions: contents: read`, secret scan, `npm audit --omit=dev --audit-level=high`, Dependabot weekly (D-048, .github/workflows/ci.yml lines 20-31, .github/dependabot.yml). No security.txt, no robots.txt and no sitemap (curl returned 404 for /robots.txt and /sitemap.xml, 2026-10-29).
- Commit author email is visible in public history (docs/LAUNCH.md section 1 states this).

## API, exports, open data
- The static JSON files are the "API"; no server API, no versioned endpoint, no OpenAPI (docs/OPEN-DATA.md line 3). CORS open on the live files (see above). Shapes are the TypeScript types in `src/*/types.ts` (docs/OPEN-DATA.md "Stability"); there is no JSON Schema file (INFERENCE from `ls`).
- CSV export from the War room (conflicts) and the Index board (indices), built in the browser; formula-injection guard (leading apostrophe) and UTF-8 BOM (docs/OPEN-DATA.md "CSV exports"; src/exports/csv.ts).
- No per-event export; no GeoJSON; no embed or iframe (frame-ancestors 'none', X-Frame-Options DENY in vercel.json, so embedding in other sites is blocked by design).
- Share links: `#c=`, `#war`, `#war=<id>`, `#about`, `&t=<unix>`; no `#e=<event id>` (docs/BACKLOG.md "Plan 14 and 15 deferred"; src/lib/hashState.ts).
- Web App Manifest exists (public/site.webmanifest) but no service worker (grep found none in src/ or index.html), so not installable offline (INFERENCE; the manifest has `display: standalone`).

## Pricing
- Free. No paid tier, no ads, no accounts in the repo (README.md; D-052). Hosted on Vercel Hobby and GitHub free Actions (D-047). Nothing about pricing exists in the docs beyond that.

## Open-source status
- Public repo, MIT, created 2026-10-18, release v1.0.0 (2026-10-18) as the only release (`gh release list`, 2026-10-29).
- Stars 0, forks 0, watchers 0, open issues 2 (both Dependabot bumps: vite 8.3.4 to 8.3.5, zustand 5.0.15 to 5.0.16, opened 2026-10-25) (`gh api repos/Tribal-Chief-001/defcon`, `gh api .../issues`, 2026-10-29).
- 15 topics set (3d-globe, accessibility, conflict-monitoring, gdelt, india, ucdp, ...) (same API call).
- No CONTRIBUTING.md, CODE_OF_CONDUCT or issue templates seen (`ls` of repo root and .github showed only dependabot.yml and workflows; INFERENCE that none exist). package.json has `"private": true` and version 0.0.0 (not published to npm).

## Alerting and personalisation (watchlist, notifications, what needs a server)
- Watchlist of countries kept in localStorage; alerts only while a tab is open; browser notification only after an explicit click and only when the document is hidden (src/watchlist/watchlist.ts, src/ui/WatchAlerts.tsx line 27, src/ui/WatchPanel.tsx; D-063).
- Not possible without a server: e-mail or push alerts when the tab is closed, radius alerts, saved views across devices (docs/BACKLOG.md "Plan 14 and 15 deferred").
- Two browser tabs overwrite each other's watchlist (BACKLOG, same section).
- No accounts, no saved annotations, no sharing of annotations (no such code in src/; INFERENCE from the file list).
- Owner-side alerts: GitHub emails on failed workflow runs (monitor.yml, data-updates.yml) — these go to the maintainer, not to users.

## Forecasting or risk (VRI facts with the real numbers)
From docs/INDEX-BACKTEST.md (generated 2026-10-18; data end 2026-08-31; 43,014 training country-months from 1998 to 2025-09; fit to 2015-12, test 2021-01 to 2025-09):
- "Continue" (at least 25 deaths in the next 3 months): 7,410 test country-months, 1,839 positives (24.8%); AUC 0.9831 vs persistence baseline 0.9718; average precision 0.962; Brier skill 79.3%. Tail (predictions of 30% or more): predicted 81.0%, observed 82.1% over 2,086 country-months.
- "Rise" (at least 25 deaths and at least double the previous 3 months): 380 positives (5.1%); AUC 0.8455 vs 0.7424; average precision 0.2333; Brier skill 10.5%. Tail: predicted 37.6%, observed 34.6% over 205 country-months.
- Rolling-origin by year 2016-2025: "rise" AUC 0.8029 (2021) to 0.916 (2017), above the baseline in every year; "continue" AUC 0.9637 to 0.9929.
- The first model was overconfident in the tail (predicted 62%, observed 38%) before the trend and squared terms (D-059).
- Honest limits stated by the project: "continue" is mostly persistence; onset in peaceful countries is not forecastable from these inputs (docs/VRI-STUDY-2.md; docs/INDEX-BACKTEST.md "Reading it"); intervals cover training uncertainty only; no outside expert review; no protest data in the index (docs/BACKLOG.md "Plan 11 deferred").
- The "rise" AUC of 0.8455 comes with an average precision of 0.2333 on a 5.1% base rate (docs/INDEX-BACKTEST.md), so many high-ranked months will be false alarms (INFERENCE from AP being low).
- Fatality Index is observed deaths, not a forecast (D-059). Tension index "DEFCON-style" is a separate provisional score and is non-comparable on GDELT-only windows (docs/TENSION-INDEX.md).
- Model is trained on final GED but applied at 2026-08-31 using provisional candidate rows (docs/DATA-SOURCES.md "Indices" Training row), so current predictions are 59 days old (live indices.json `dataEnd`).

## Testing and quality assurance
- 158 test files (`find tests -name '*.test.*' | wc -l`, 2026-10-29): ui 35, events 24, globe 18, map 9, lib 8, index 6, ci 5, viz 5, and smaller folders. About 1,160 `it(`/`test(` occurrences by grep (`grep -rhoE "\b(it|test)\(" tests`), which undercounts `it.each` expansions; no doc states a total test count and I did not run the suite (INFERENCE only for the exact number).
- CI (`ci.yml` lines 20-31): checkout, setup-node, `npm ci`, secret scan, `npm audit --omit=dev --audit-level=high`, typecheck, `npm test`, `npm run build`, `check:budgets`. Last runs of the other workflows succeeded (gh run list, 2026-10-29); I did not list `CI` run history.
- Guard tests: India map guard points and outline hash (tests/map/india-guard.test.ts, india-outline.test.ts; docs/MAP-POLICY.md); design rules (tests/design/); CSP and workflow rules (tests/ci/csp.test.ts, workflows.test.ts, vercel-config.test.ts); committed data files read by tests (D-061); timeline validator (tests/timeline/timeline-data.test.ts); index model guard (tests/index/indices-data.test.ts).
- Review process: each plan had a fresh-reviewer pass of the whole branch and one fix pass, recorded in the ledger (docs/BRAINSTORM-v1.1.md section 5 "Process"; D-059, D-063 "Review fixes"). The reviewers are AI sub-agents (docs/DECISIONS.md "Builder"). No human code review is documented, and the repo has a single author.
- Verified gaps: no end-to-end (browser) test in tests/ (folders listed above; INFERENCE, I did not grep for Playwright, but package.json has no Playwright/Cypress dependency); no visual regression test; no real-device test.
- Machine disk: not attributable to this project. `du -sh` on 2026-10-29: node_modules 263 MB, dist 19 MB, data/ (gitignored raw UCDP/GDELT caches) 653 MB, public 17 MB, .git 28 MB, about 1 GB in all, while `df -h /` shows 15 GB free of 182 GB. The project is a small part of the used space, so low disk space is not listed as a project risk.

## Governance and neutrality (India-official map policy, wording rules)
- Hard rule: India's boundary must match India's official map; Natural Earth India-POV file; no alternative-worldview toggle; no OSM-derived tiles (D-002; docs/MAP-POLICY.md lines 3-9).
- Survey of India 13th edition (file dated 2026-01-23) was used for a cross-check only: Shaksgam sector median 3.9 km from Natural Earth's outline, "consistent ... not proven identical" (docs/MAP-POLICY.md "Cross-check"). Guard list of 18 points awaits the owner's review (docs/LAUNCH.md section 1; docs/BACKLOG.md "Needs the owner").
- D-018/D-023 wrongly said a Shaksgam patch was needed; corrected in D-027 and recorded (docs/DECISIONS.md).
- Capitals of Kosovo, Somaliland and Western Sahara are dropped to follow the same worldview (D-022, MAP-POLICY). Palestine's dossier notes UCDP files Gaza and the West Bank under Israel (D-059).
- Wording rules: "risk estimate", not "will"; "not the official US DEFCON level"; "context, never evidence of an attack" for signals; protest deaths named as not counted; no "kills" in timeline titles (tests ban it) (D-059, D-062, D-057).
- Alliance arcs: formal treaty memberships only; disputes are UCDP opposing-side pairs, shown as data, India pairs without special treatment (D-015, D-042). US bilateral treaties (Japan, South Korea, Philippines) are left out because no official page could be read (D-042), which makes the alliance layer incomplete.
- Neutrality limits: the timeline's sources are mostly Al Jazeera, Times of Israel, Kyiv Independent, France 24, CBS; no Reuters, AP, BBC, Guardian (D-057, docs/DATA-SOURCES.md). The war theatres chosen (US/Israel-Iran, Israel-Lebanon, Russia-Ukraine, Gaza) are the owner's selection (docs/BRAINSTORM-v1.1.md section 9).

## Adoption signals
- None known. 0 stars, 0 forks, 0 watchers, 2 open issues (both Dependabot) as of 2026-10-29. No download counts, no analytics (by design, so there is no traffic data either). I found no press, no citations and no external contributors in the repo or GitHub API output. No search of the wider web was done in this pass.

## Strengths (evidence)
- Honest labelling is enforced in code, not only in copy: `human` flag per event, severity 4-5 only for human-coded events, auto-coded max 3 (live snapshot decode 2026-10-29; docs/SEVERITY.md); a non-comparable tension level is not shown as tension (D-031).
- Uncertainty is a first-class output: death ranges, 90% intervals, confidence reasons, "not modelled" rather than "low" (D-059; live indices.json).
- A published, regenerated backtest with year-by-year results and a calibration table, and a guard test that fails if the model degrades (docs/INDEX-BACKTEST.md; tests/index/indices-data.test.ts). The ledger records the model's own earlier overconfidence (D-059).
- Strong provenance discipline: SHA-256 pins for UCDP and Natural Earth, per-source licence tables, a licence audit that marks unread pages "NOT READ" (docs/DATA-SOURCES.md; docs/LICENCE-CHECK-v1.1.md).
- Self-correcting record: D-027 reverses the project's own wrong Shaksgam claim and says why.
- Privacy: no cookies, analytics, accounts or third-party requests, enforced by a CSP with `default-src 'self'` and `connect-src 'self'` (live headers 2026-10-29).
- Zero running cost and no server to attack: static files on Vercel plus GitHub Actions (D-013, D-047).
- Automated 3-hourly-target ingest with a validation gate that keeps old data on failure (D-047; docs/DATA-SOURCES.md "Publishing gate"); the last 20 runs all succeeded (gh run list, 2026-10-29).
- Open static data files with documented shapes, CSV exports with formula-injection guard (docs/OPEN-DATA.md).
- Breadth of views from a small bundle: globe, dossiers for 248 countries, War room, Index board, signals, UNHCR displacement, South Asia lens, watchlist, time travel, with JS 269.8 KB gzip total (dist/ measurement above).
- Accessibility work beyond the usual: keyboard canvas, live region, AA token contrast test, reduced-motion audit (D-050; tests/a11y/).
- Adaptive quality governor with tests (src/perf/quality.ts; tests/perf/quality.test.ts).
- India-official map is guarded by tests and an outline hash (tests/map/; docs/MAP-POLICY.md).

## Weaknesses and gaps (evidence, each checked against code or the live site)
1. Human-coded events end 2026-08-31, 59 days before 2026-10-29, and UCDP has already published 26.0.9 (HTTP 200 on 2026-10-29), which is not ingested. Source: live meta files, curl HEAD, data/events/sources.json.
2. The globe's event layer has a hole from 2026-09-01 to 2026-10-18: nothing human-coded after Aug 31 and GDELT covers only the last 9.1 days (INFERENCE from decoding live archive.bin and recent.bin, min/max times). The 30-day "recent" window is mostly empty; 100% of its 11,629 events are auto-coded.
3. The "human-coded share" for the live window is 0% by construction, so the tension index is non-comparable at the moment and the Pulse Border stays lime (D-045, D-031, docs/BACKLOG.md "Plan 7 deferred").
4. GDELT is noisy and US-centric: code 190 "use conventional military force" also marks rhetoric, so `armed` is the largest group (58.9% of the live recent snapshot, 6,852 of 11,629); the Hotspots rail ranks GDELT-heavy countries (US, UK) first (docs/DATA-SOURCES.md "Known limits"; docs/BACKLOG.md "Plan 7 deferred").
5. Event coverage is narrower than ACLED. ACLED is not used (no API at the free level, display restrictions; docs/BRAINSTORM-v1.1.md section 3). No protests or riots are human-coded anywhere; protest/riot appear only as GDELT auto-coded events (D-029). Unrest is not in the risk index (docs/BACKLOG.md "Plan 11 deferred").
6. History in the UI is 365 days (src/time/store.ts line 3). Longer series exist only as aggregates (10-year monthly deaths per country in indices.json); there is no multi-year event browser.
7. Several data files are refreshed by hand: conflicts.json (generated 2026-10-19), indices.json (2026-10-18), timeline.json (checked 2026-10-18), displacement, dossiers, relations (docs/OPEN-DATA.md "Updated"). The monthly alert workflow has never run (no runs listed, 2026-10-29).
8. Ingest cadence is looser than the nominal 3 hours: observed gaps 2.4 to 8.6 h over the last 20 runs, and the snapshot was 8.9 h old at read time (gh run list; live meta). Not 15-minute "real time" (D-047 chose 3 h; docs/BACKLOG.md "Plan 5 deferred").
9. The sourced timeline is hand-curated, written and checked by AI agents reading through a summarising tool, with no Reuters, AP, BBC or Guardian and a few live-blog sources; the latest entry is 2026-10-16 and only four theatres are covered (live timeline.json; D-057; docs/DATA-SOURCES.md). No Sudan, Yemen/Red Sea, Myanmar or Sahel theatre (docs/BACKLOG.md "Plan 9 deferred").
10. The risk model has no independent expert review, intervals ignore model error, features were tuned after seeing 2021-2025 (docs/BACKLOG.md "Plan 11 deferred"); "rise" average precision is 0.2333 (docs/INDEX-BACKTEST.md); the VRI covers 130 countries, not all 248.
11. No real-device verification: no real phone, no Safari or Firefox pass, no real screen reader, no audio check, no slow-device test of the governor (docs/LAUNCH.md section 4; docs/BACKLOG.md "Plan 6 deferred"). No end-to-end browser test framework in package.json.
12. No mobile app: only a Web App Manifest, no service worker, so no offline or push (src/ and index.html grep; public/site.webmanifest). The layout has no tablet breakpoint and no compact top-bar stats under 1200 px (docs/BACKLOG.md "Plan 7 deferred").
13. No accounts, no saved or shared annotations or views (no code in src/; grep "annotat" found nothing). The watchlist is per-browser, alerts only with a tab open, tabs overwrite each other (docs/BACKLOG.md "Plan 14 and 15 deferred").
14. No i18n: English only; `en-US` number formatting hard-coded (src/ui/TopBar.tsx line 9, DossierPanel.tsx line 17, DisplacementBlock.tsx line 5).
15. No embeddable widgets: `frame-ancestors 'none'` and `X-Frame-Options: DENY` block iframes (vercel.json). No `#e=<event id>` share link. No per-event export or GeoJSON.
16. Single maintainer and effectively one bot-assisted author: 151 commits by one account over two days (2026-10-18/19); last human commit 2026-10-19; later repository activity is Dependabot only (git log; gh api issues).
17. Map data compromises: Vatican, Coral Sea Islands, Scarborough Reef have no polygon; low-detail borders lose 19 micro-states; Kosovo, Somaliland, Western Sahara not separate (docs/MAP-POLICY.md; D-020, D-022).
18. Dossier fields from the CIA Factbook are archived (data date 2026-01-22, source discontinued 2026-02-04) and only 194 of 255 files matched countries; languages exist for 125 countries (docs/DATA-SOURCES.md "CIA World Factbook").
19. The alliance layer is incomplete: US bilateral treaties with Japan, South Korea, Philippines are missing (D-042).
20. The checked-in Survey of India comparison has no regression test; the registered boundary is not committed (docs/MAP-POLICY.md "Not yet done"; docs/BACKLOG.md "Tests, scripts, docs").
21. The budget script exits "ok" when dist or data are missing (scripts/check-budgets.ts uses `existsSync` guards and defaults to 0), so a broken build path could pass silently (docs/BACKLOG.md). JS total headroom is about 5 KB (269,820 of 275,000 B).
22. No robots.txt, sitemap or security contact file (curl 404, ls); not discoverable by SEO means beyond the Open Graph tags in index.html (INFERENCE).
23. Dependabot has two open PRs unmerged since 2026-10-25 (gh api issues).

## Distinctive USPs (what the repo evidence says is unusual)
These are per-repo observations; whether any competitor does the same is not tested here, so "no competitor does" is not claimed.
- A custom WebGL2 globe with no map library, an adaptive quality governor and a 270 KB JS total (dist/ measurement; D-006, D-049).
- Every event carries a human-coded versus auto-coded flag visible in the data and the UI legend, with a hard severity cap for auto-coded events (live bin decode; docs/SEVERITY.md).
- A trained and backtested per-country risk model with published calibration and year-by-year results, shipped as static JSON (docs/INDEX-BACKTEST.md; live indices.json).
- India-official borders by policy with guard tests and a cross-check against the Survey of India map (docs/MAP-POLICY.md; tests/map/).
- Evidence trail on the event card: coding, place precision, and nearby FIRMS fires, USGS explosion-type seismic events and GDACS alerts, always as context (D-063; src/ui/EventCard.tsx).
- Time-travel permalinks with `&t=<unix>` (src/lib/hashState.ts).
- Zero-tracking static architecture with open data files and a CSP that forbids third-party requests (vercel.json; docs/OPEN-DATA.md).
- A decision ledger and a docs-as-ledger commit discipline (docs/DECISIONS.md; README.md "Principles").
- South Asia lens limited to a filter and camera move with no borders drawn (src/regions.ts comment).
- Night Watch idle showcase and optional sonified events (D-045, D-046). These are showcase features; their user value is not tested (INFERENCE).

## Risks
- Data licence mix: the repo is MIT but the data is CC BY 4.0 (UCDP, World Bank, UNHCR, GDACS), public domain (Natural Earth, USGS), NASA open with acknowledgement, and GDELT "cite the GDELT Project". Reusers must keep attribution; the open files do not all carry licence headers (docs/OPEN-DATA.md; live JSON). No CC BY-SA or CC BY-NC data is used now because V-Dem, Cloudflare Radar and OONI were left out (docs/LICENCE-CHECK-v1.1.md). Any later addition of those would conflict with the MIT/CC BY plan.
- Third-party terms not fully settled: GDACS licence statement conflicts between the channel (`public domain`) and the item (CC BY 4.0), the stricter one is followed; FIRMS is keyless "today" and may require a login later; the CIA Factbook public-domain status rests on a mirror's statement (docs/LICENCE-CHECK-v1.1.md update; docs/DATA-SOURCES.md).
- UCDP dependence and lag: the only human-coded source; latest data is 59 days old and a newer file exists (see weakness 1). UCDP revises candidate files, so pins mismatch over time (docs/DATA-SOURCES.md "Pinned"). GDELT is fetched over plain http (docs/BACKLOG.md "Plan 2 deferred minors").
- Single maintainer and single point of failure: one owner account holds the repo, GitHub Actions (the only scheduler), and the Vercel token; if the owner stops, the data goes stale and the pill says so but nothing recovers it (docs/LAUNCH.md section 5; INFERENCE on consequence). If the Vercel deploy secrets fail the workflow turns red and the site keeps the previous data (docs/DATA-SOURCES.md "Publishing gate").
- Platform limits: Vercel Hobby (100 deployments a day, noted in D-047) and Actions minutes; each ingest run triggers a production deploy (ingest.yml lines 63-74). Hobby plans are for non-commercial use (INFERENCE from Vercel's published terms, not read in this pass).
- Misreading risk: users may take a 0 or absence as calm; the app states the opposite ("a gap is never a sign of calm", README.md), but the gap of 2026-09-01 to 2026-10-18 above is not visually announced on the globe except by the coverage legend and AsOf pill (INFERENCE; legend code src/ui/Coverage.tsx not inspected in this pass).
- Model misuse: the Instability Index could be read as a forecast of outbreaks; docs state it is not (docs/INDEX-BACKTEST.md "Reading it") and tail calibration is only checked on the held-out period.
- Abuse of open data: the files are CORS-open (`access-control-allow-origin: *`) and static, so anyone can build maps from them; the data is derived from UCDP/GDELT without per-event licences beyond the sources' terms; a third party could present the numbers without the warnings (INFERENCE).
- Map-policy risk: the India-official map is a legal and political choice; other jurisdictions may object, and the only comparison with the official map is a 4 km accuracy registration, not proof of identity (docs/MAP-POLICY.md "Cross-check").
- Security: low surface (static, strict CSP, SHA-pinned actions), but HSTS has no `includeSubDomains`/`preload`, no security.txt, and a leaked `VERCEL_TOKEN` would allow deploys (workflow uses secrets; docs/LAUNCH.md section 5 advises rotation). Vulnerability scanning covers production dependencies only (docs/BACKLOG.md "Plan 5 deferred").
- Privacy: the maintainer's commit email is public in the git history (docs/LAUNCH.md section 1).

## (A) Verified capabilities with the file or doc that proves each
Each was checked by reading the file or by measuring the live site on 2026-10-29.
1. Public MIT repo, 0 stars: `gh api repos/Tribal-Chief-001/defcon`; LICENSE.
2. Static SPA on Vercel returns HTTP 200: curl -I https://defcon-roan.vercel.app/.
3. Strict CSP, HSTS, XFO, COOP, CORP, Permissions-Policy, nosniff served live: curl -I; vercel.json.
4. Live site serves the same build as dist/ (same hashed asset names): curl of index.html; dist/index.html.
5. Ingest workflow (target every 3 hours) with cron `17 */3 * * *`, SHA-pinned actions: .github/workflows/ingest.yml lines 6-11, 27-74.
6. Last 20 ingest runs succeeded: `gh run list -w "Ingest and publish"`.
7. Freshness monitor workflow (12 h threshold) exists and last ran OK: .github/workflows/monitor.yml; `gh run list`.
8. Monthly data-update alert workflow exists: .github/workflows/data-updates.yml (never run yet).
9. CI runs secret scan, audit, typecheck, tests, build, budgets: .github/workflows/ci.yml lines 25-31.
10. Event snapshot with human flag, kind, severity, precision per event: live recent.meta.json, recent.bin decode; docs/DATA-SOURCES.md "Event snapshots".
11. Auto-coded severity cap at 3, human-coded 4-5 exist: decode of live bins; docs/SEVERITY.md.
12. Coverage window metadata per source (asOf, coverFrom, licence): live recent.meta.json `sources`.
13. 104 conflicts with deaths, ranges, weekly series, geography: live conflicts.json.
14. Indices for 130 countries with Fatality and risk blocks: live indices.json.
15. Backtest numbers published (AUC 0.8455 rise, 0.9831 continue, yearly table): docs/INDEX-BACKTEST.md.
16. Index guard test file exists: tests/index/indices-data.test.ts.
17. Signals file with 3 sources, licence strings, soft-failure flags: live signals.json `sources`; scripts/signals/.
18. UNHCR displacement file: live displacement.json (4.7 KB gz); docs/DATA-SOURCES.md "Displacement".
19. 46-entry sourced timeline with statuses and limits: live timeline.json (33 confirmed, 8 reported, 5 disputed).
20. 248 dossiers: public/data/dossiers/index.json length 248.
21. Relations (alliances and disputes) file: live relations.json (1,003 B gz).
22. Two border detail levels within budget: live borders.low 162 KB gz, high 796 KB gz; scripts/check-budgets.ts.
23. JS 269.8 KB gzip total, 245.9 KB initial: dist/assets measurement above.
24. Lazy chunks War room (15.8 KB gz) and About (6.9 KB gz): dist/assets.
25. Web worker for snapshot decode: dist/assets/worker-D3OOQAuK.js; src/events/worker.ts.
26. Quality tiers and governor: src/perf/quality.ts; src/perf/device.ts; tests/perf/.
27. Country palette Ctrl/Cmd-K: src/ui/CommandPalette.tsx; tests/ui/CommandPalette.test.tsx.
28. Deep links `#c=`, `#war=`, `#about`, `&t=`: src/lib/hashState.ts.
29. Time-travel store capped at 365 days: src/time/store.ts line 3.
30. Scrubber UI: src/ui/Scrubber.tsx.
31. Night Watch: src/ui/NightWatch.tsx; src/watch/nightWatch.ts; D-045.
32. Share button using navigator.share with fallback: src/ui/ShareButton.tsx lines 18-19.
33. CSV exports: src/exports/csv.ts; tests/exports/; docs/OPEN-DATA.md.
34. Watchlist with localStorage and notifications on click: src/watchlist/watchlist.ts; src/ui/WatchPanel.tsx; src/ui/WatchAlerts.tsx.
35. South Asia lens (8 SAARC states): src/regions.ts; src/ui/war/RegionView.tsx.
36. Event card with precision text and evidence trail: src/ui/EventCard.tsx lines 46, 125; src/signals/nearby.ts.
37. Index board and gauge: src/ui/war/IndexBoard.tsx; src/viz/Gauge.tsx.
38. Hand-rolled SVG charts (stream, bubbles, range bar, ring, sparkline): src/viz/.
39. Reduced-motion audit test: tests/a11y/reduced-motion.test.ts.
40. Axe test and contrast test: tests/a11y/axe.test.tsx, contrast.test.ts.
41. Keyboard control and pinch zoom code: src/lib/keyboard.ts; src/globe/pinch.ts.
42. India map guard and outline hash tests: tests/map/india-guard.test.ts, india-outline.test.ts; docs/MAP-POLICY.md.
43. Pinned source hashes for UCDP: data/events/sources.json.
44. 158 test files: `find tests -name '*.test.*' | wc -l`.
45. Error boundary: src/ui/ErrorBoundary.tsx; tests/ui/ErrorBoundary.test.tsx.
46. No analytics or third-party requests (CSP `connect-src 'self'`): vercel.json; live headers.
47. UCDP newer candidate exists but is not ingested: curl HEAD GEDEvent_v26_0_9.csv returned 200 on 2026-10-29.
48. Web App Manifest present: public/site.webmanifest.
49. Design token and forbidden-pattern tests: tests/design/.
50. Public repo topics and v1.0.0 release: `gh api`, `gh release list`.

## (B) Claims the docs make that I could not verify or found to be out of date
Out of date (found by comparing docs with code or live data):
1. docs/ROADMAP.md says the repo is a "private GitHub repo" and Plans 3-6 are "Done on branch ... (review and merge pending)" and "choosing a licence" is open. D-053 and `gh api` show the repo is public with MIT, and the branches are merged.
2. docs/TECH-STACK.md "Measured" and D-058 say JS initial 238 KB and total 252 KB gzip; dist/ now measures 245.9 KB initial and 269.8 KB total (Plan 11-15 growth). The same doc's "Machine rule" and commands table lacks newer scripts (`data:conflicts`, `data:indices`, `data:signals`, `data:displacement`), which are in package.json.
3. docs/DATA-SOURCES.md says `signals.json` is about 83 KB / 10 KB gzipped; the live file is 126,740 B raw and 14,218 B gzip (more fire cells and alerts). It lists conflicts.json at "about 591 KB, 135 KB gzipped" and in another row 530 KB / 119 KB; the live file is 588,470 B raw and 126,499 B gzip.
4. docs/DATA-SOURCES.md border table still shows low 711 KB / 177 KB gzip and says "None exist yet; the Shaksgam patch is pending the owner's reference polygon"; the live low file is 626,371 B / 162,349 B and D-027 says no patch is needed (docs/BACKLOG.md line 28 itself lists the stale numbers).
5. docs/BACKLOG.md "Engine and UI" says keyboard navigation and pinch zoom are not implemented, and "Plan 2 deferred" says there is no scheduled ingest; D-049, D-050, D-047, src/lib/keyboard.ts, src/globe/pinch.ts and ingest.yml show they exist.
6. The About page privacy text says two small things are kept in the browser (sound flag, animation flag) but the watchlist key `defcon.watchlist.v1` is also stored (src/ui/AboutPage.tsx; src/watchlist/watchlist.ts line 7).
7. docs/BRAINSTORM-v1.1.md is headed "Nothing here is built yet" and lists the JS budget as "232 KB now", although later status notes in the same file say items were built.
8. docs/INSTABILITY-INDEX.md and docs/BRAINSTORM-v1.1.md call the model the "Violence Risk Index (VRI)"/"DII" while the product calls it "Instability Index"; naming is inconsistent across docs (docs/INSTABILITY-INDEX.md header; D-059).
9. docs/LAUNCH.md lists live-site checks as unticked (CSP in console, keyboard, phone, reduced motion, sound, frame rate); no evidence in the repo that they were done after launch.
Could not verify:
10. README.md says "A monthly workflow emails the owner when UCDP has newer data": the workflow exists but has not run, and the email path depends on the owner's GitHub notification settings (not visible).
11. README.md and D-049 claim 60 fps; the only measurements are 465-474 px wide in an in-app browser on Intel UHD (docs/TECH-STACK.md); not verified at desktop sizes or on later builds.
12. Claims that the globe layer, War-room halos and grain look right on a real GPU are explicitly unverified (docs/BACKLOG.md "Plan 10 deferred").
13. "WCAG AA text colours": tokens only; contrast over the globe imagery is not tested (docs/LAUNCH.md section 4).
14. "Screen-reader announcements": tests use axe in jsdom and a live region exists, no real screen reader was used.
15. The Vercel header behaviour in the CSP description (docs said "verified locally") was not re-tested by running the built app, but the live curl output matches vercel.json.
16. UCDP "lag of about 6 weeks" (docs/DATA-SOURCES.md): measured lag is 59 days at read time; I did not measure UCDP's publish schedule.
17. docs/DATA-SOURCES.md numbers from 2026-10-18 (28,092 GDELT rows kept, 18,064 UCDP events, 194 Factbook matches, 54 dossiers without capital) were not recomputed; I read only the live snapshots, which differ (recent 11,629; archive 17,273).
18. The count of tests: no doc gives a test total, and I did not run the suite; 1,160 is a grep count of `it(`/`test(` and is approximate.
19. The Survey of India comparison (rms 3.66 km etc.) relies on a PDF that is not in the repo; I did not rerun scripts/map/soi-check/.
20. Timeline accuracy: I did not re-read the cited news pages; the "33 confirmed" status rests on the project's validator and AI re-check (D-057), not on my check.
21. GitHub "CI" workflow history was not listed; only Ingest, Monitor and Data update alerts runs were read.
22. Adoption: no web search was done, so absence of external mentions is not established.
