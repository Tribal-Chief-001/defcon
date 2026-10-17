# Defcon: design (v1 draft for approval)

Date: 2026-10-18. Status: APPROVED by owner on 2026-10-18 (including the builder's calls and "Active disputes" arcs for all pairs per dataset record, no special treatment). Nothing has been built yet.

## 1. Intent

Defcon is a real-time world monitor of armed conflict and civil unrest, rendered as a 3D globe. It is also a serious **frontend design showcase**: the owner wants a visitor to be genuinely excited within the first 10 seconds of opening it, and wants every pixel to feel authored, not generated.

Two things are the product, equally:

1. **Originality of the design language and motion.** It must look like nothing else: no templates, no "AI slop" (default gradients, generic glass cards, stock icons, emoji, lucide-everywhere).
2. **Accuracy of the map and country information.** All borders, capitals and country dossiers must be correct and sourced.

The owner is Indian. The map is drawn from India's official perspective (see section 6). This is a hard requirement, not a preference.

## 2. Goals, non-goals, anti-goals

**Goals**
- A globe that is the whole interface: 1px hairline borders, true-black void, sonar ripples.
- Detailed, accurate world borders and capitals, plus a sourced dossier for every country.
- As much live data as can be sourced legitimately and reliably (section 7).
- 60 fps on the owner's own laptop (Intel i5-10210U, integrated UHD graphics, 7.4 GB RAM). Page usable in about 1 s on a normal connection. If it is smooth there, it is smooth almost everywhere.
- Eight signature interactions (section 5), all in v1.
- A `docs/` ledger kept up to date as the project's development pipeline (section 9).

**Non-goals**
- Street-level maps or satellite imagery.
- User accounts, comments, personalisation.
- A native mobile app. (The site must still work on a phone, degraded gracefully.)
- Predictions, advice or "who is right" judgments.

**Anti-goals (would make it a failure even if it technically works)**
- Looks like a template, a Dribbble clone, or a generic dark dashboard.
- Any depiction of India's boundary that differs from India's official map.
- Showing data as fact when it is auto-coded, unverified or missing. Missing data must look missing.
- Jank: dropped frames, layout shift, a long blank load.
- Presenting the tension index as the official US DEFCON level.

## 3. Constraints

- Dev machine: 7.4 GB RAM, 4 cores. Heavy tasks (builds, test suites) run one at a time; JVM/Node heap flags kept small.
- Every decision is recorded in `docs/DECISIONS.md` (the ledger) as it is made.
- Secrets (API tokens) live only in gitignored `.env` files; never printed or committed. The owner creates the accounts/tokens; the builder never creates accounts.
- Everything is verified before it is called done; failures are reported plainly.

## 4. Design language

A classified technical dossier redesigned by a very good agency in 2026: brutalist but premium, information-dense but breathing. Inspiration shown by the owner: Vercel-style AMOLED black and sleek minimal typography, and the "M1 Abrams evolution archive" pages (outline display type, mono labels, bento panels, lime accent). The owner's earlier "DOSSIER PRO MAX" prompt is context, not a rulebook: where it conflicts with this section, this section wins.

**Tokens (starting values; builder may refine, must record changes in the ledger)**
- Background `#000000` (true black for AMOLED). This overrides the earlier prompt's `#050507`. *Builder's call to confirm visually.* Soft surface `#0A0A0D`.
- Text bone `#EDEDE9`; muted `rgba(237,237,233,.5)`; faint `.25`. Borders `rgba(255,255,255,.08)`, strong `.15`.
- Accents: lime `#D6FF57` primary, orange `#FF4D00` alert/severity, cyan `#00FFF0` data/coordinates. At most two accents on one screen.
- Type: Syne 700/800 (display, tight, outline variant), Space Grotesk (body), JetBrains Mono (labels, data, numbers). Mono labels sit above content. Never centre long text.
- 1px borders instead of shadows (no `box-shadow`). Radius 24-28px cards, 100px pills. Glass = translucent + backdrop blur + 1px border.
- Motion: one easing, `cubic-bezier(0.16, 1, 0.3, 1)`; physical, never bouncy.
- Orbs/blobs from the earlier prompt are **dropped**: the globe and its light are the only light sources.

**Chosen visual direction (owner picked):** "Hairline Sonar" as the base: wireframe/hairline globe, sonar ripples at events, dashed arcs. It absorbs the time-rewind scrubber and fading heat "scars" from "Long Exposure", and a very faint outline "DEFCON" word behind (from "Lightfall"). Accepted mockups are in `.superpowers/brainstorm/` (local, gitignored); they are references, not code to reuse.

## 5. Signature features (all in v1)

1. **Sonar Boot.** First load: a point in the dark, a sonar ring, the ring becomes the equator, meridians unfold, borders draw in hairline. About 3 s, skippable by any key/click, shown once per session. It must be the loading experience, not a screen in front of one.
2. **Pulse Border.** The nav's bottom 1px border is the world's pulse. New events spike it; rate sets its rhythm; tension index moves its colour lime to orange. Index is Defcon's own (section 7), labelled "DEFCON-style".
3. **Grain = Data.** Film grain over the globe whose density and warmth follow local event density. Grain is the heatmap. Must be done in a shader, not a DOM overlay.
4. **Cursor = Radar.** Over the globe the cursor becomes a reticle, snaps magnetically to the nearest event, and shows lat/lon plus distance in mono.
5. **Alliance Arcs.** Hovering a country lights arcs to allies (cyan, solid) and rivals (orange, dashed). Needs a curated, sourced relations dataset (section 8).
6. **Declassify.** Scrubbing time backwards removes the redaction bars from older events' details, as if files were declassified. Cosmetic effect on real data; real data are never hidden or invented.
7. **Night Watch.** After about 20 s idle: letterbox bars, the camera flies to the most significant recent event, a typewriter caption states it (place, time UTC, type). Any input exits. This is also the showcase "trailer".
8. **World Sound.** Optional soft sonar ping per event: pitch from severity, stereo pan from longitude. **Off by default**, one toggle, remembered. Never autoplays.

Also: **Country Dive** (click a country: camera moves, its border draws, others dim, dossier slides in), **⌘K jump** (type a country or capital, fly there), a live **day/night terminator** drawn as a thin light edge, and **level-of-detail** (countries when far; capitals and labels as you approach).

Every motion feature respects `prefers-reduced-motion` (boot, grain animation, Night Watch, pulse become static or minimal).

## 6. Map and borders (India worldview is mandatory)

- Source: Natural Earth (public domain), 1:10m, **India point-of-view variant** (`ne_10m_admin_0_countries_ind`). Its download exists (checked 2026-10-18, HTTP 200). Natural Earth's default file shows de facto boundaries and is **not** acceptable.
- Ready-made basemap tiles (OSM-based, Protomaps, etc.) are **not** used for borders: their boundaries do not follow India's official map. Borders are built from the file above into our own compact vector data (TopoJSON and/or PMTiles), at two detail levels (50m-ish far, 10m near).
- **Authority (builder's call, owner to confirm):** the reference for "India's official map" is the Survey of India's official political map of India (and the MEA's published depiction). The Natural Earth India file only *approximates* it, so geometry patching in the build step is a planned workstream with its own tooling, not a footnote. Scope: land boundary and territorial extent (J&K, Ladakh incl. Aksai Chin, Gilgit-Baltistan/PoK, Shaksgam, Arunachal Pradesh, and the rest of the LAC/LoC as India depicts them). Maritime zones (EEZ) are out of scope for v1.
- **Verification before trusting the file (not yet done):** render it and inspect J&K, Ladakh (including Aksai Chin), PoK/Gilgit-Baltistan, Shaksgam, and Arunachal Pradesh against India's official map. Anything missing is fixed in our build step, not ignored.
- **Automated guard:** a test suite asserts that a fixed list of points (e.g. Srinagar, Leh, Gilgit, Muzaffarabad, Tawang, Itanagar, and points in Aksai Chin and Shaksgam) fall inside India's polygon, and that the India outline checksum has not changed. The owner reviews that point list.
- Labels and dossier for the Kashmir region follow the same policy. No alternative-worldview toggle is offered.
- Other disputed territories (Crimea, Taiwan, Western Sahara, Kosovo, Palestine, Cyprus and similar): follow the same Natural Earth file as shipped, show contested lines distinctly (dashed), and document each in `docs/MAP-POLICY.md`. Open for owner review.

## 7. Data

**Event model.** Every source is normalised to one schema: id, source, source URL, time (UTC), lat/lon, location precision, country (ISO), type (armed conflict / protest / riot / violence against civilians / other), actors where available, fatalities where available, severity (Defcon's own 1-5, documented formula), confidence (source-dependent: e.g. auto-coded vs human-coded), first-seen and last-updated times. Duplicates across sources are merged, keeping every source link.

**Sources, in build order**
- **P0, real historical seed (builder's call):** a frozen snapshot of *real* events taken from public downloadable datasets (e.g. UCDP GED CSV downloads, which do not need the API token), a few thousand events covering the last 12+ months of available data, never invented. It makes the globe rich from day one, works offline, feeds Declassify and the 30-day charts, and is the fallback when live sources fail. It is clearly labelled "archive" in the UI.
- **P1, GDELT 2.0 Events (free, no key):** updates every 15 minutes, CAMEO-coded (protest = root 14, conflict codes 18-20). Auto-coded and noisy: geocoding errors are common. Must be filtered (minimum mentions, location precision, confidence) and shown with low confidence.
- **P2, UCDP (candidate events) and ACLED:** human-coded and higher quality, but need accounts/tokens that **only the owner can create**. UCDP added token access in Feb 2026 (request by email to the maintainer). ACLED requires registration and acceptance of terms; commercial-use limits and attribution rules apply, and the terms page found is dated October 2023, so **current terms must be re-checked before use**. If the site is ever monetised this matters.
- **P3, optional corroboration (decide later):** NASA FIRMS thermal anomalies, USGS earthquakes. Only if they add signal without clutter.
- **Excluded:** scraping Telegram/OSINT channels or Liveuamap. Terms-of-service and legal risk, high maintenance, unreliable. Revisit only on the owner's explicit instruction.

**Honesty rules.** Each event shows its source(s), age, and confidence. Auto-coded data is labelled as such. Attribution requirements of each source are followed and listed on an About/Sources page.

**Tension index.** Defcon's own composite (per country and global) from event volume, severity and trend over a window. Methodology is written in `docs/` and shown in the UI. Not the official US DEFCON level; labelled "DEFCON-style".

**Delivery (builder's call).** v1 has no always-on backend. "Live" means: a scheduled job ingests every 15 minutes (GDELT's cadence) and publishes compact static JSON snapshots to a CDN; the browser loads the latest snapshot instantly and re-checks about every 60 s with conditional requests (ETag). SSE is deferred until a real backend exists. The UI always shows "data as of HH:MM UTC". Because events arrive in batches, new events are animated in over a few seconds for clarity; Pulse Border and Night Watch are designed for batch arrival, and **no fake or simulated events are ever shown**. Parsing and filtering run in a Web Worker. Never hammer a source; respect rate limits and cache.

**Event type mapping (builder's call, owner reviews).** A documented table maps GDELT CAMEO root codes (14 protest; 18-20 coercion/assault/fight) and UCDP/ACLED categories onto Defcon's types, with an explicit rule for protest versus riot. Lives in `docs/DATA-SOURCES.md`.

## 8. Country dossiers

Per country: name, ISO codes, capital(s) with coordinates, area, population, government type, neighbours, languages, currency, UN/alliance memberships, military expenditure, recent-event summary and 30-day chart, tension index, and ally/rival relations.

- Sources (candidates): Natural Earth (geometry, capitals), World Bank (population, area, economy), CIA World Factbook (public domain, broad), SIPRI (military expenditure; check licence for display), UN data, curated relations data. **Allies** = formal treaty/alliance memberships only. The second arc type is **"Active disputes"** (not "rivals"): pairs that appear as opposing sides in a named armed-conflict dataset (e.g. UCDP dyads), with source shown. If a pair has no such record, no arc. No editorial opinion. SIPRI display licence to be checked; if unclear, show the figure with a link instead of mirroring the dataset.
- **Every field carries its source and "as of" date**, shown on hover.
- Fields with no reliable value render as a redaction bar and say "unavailable" on hover. Never guess, never leave a plausible-looking wrong number.
- The data is prepared in a build step into compact per-country JSON, so the dossier opens instantly.

## 9. Docs ledger (owner's standing rule)

`docs/` is part of the development pipeline and is updated in the same change as the work it describes:
- `docs/README.md`: index.
- `docs/DECISIONS.md`: dated decision log (id, decision, why, who decided: owner or builder).
- `docs/DESIGN-LANGUAGE.md`: tokens, type, motion, component rules (created from section 4 when building starts).
- `docs/TECH-STACK.md`, `docs/DATA-SOURCES.md` (terms, attribution, refresh cadence, verification dates), `docs/MAP-POLICY.md`, `docs/ROADMAP.md`.
- `docs/superpowers/specs/`, `docs/superpowers/plans/`: designs and plans.
Commits are detailed ledger entries (why, inventory, verification, what was not verified).

## 10. Technical direction (builder's calls, owner delegated)

- Vite + React + TypeScript (no Next.js/SSR: a single-page app). Zustand for state, with transient updates so live data never re-renders the React tree. Tailwind for styling; no external UI kit.
- **Globe: custom Three.js renderer** (not a map library), because grain-as-data, sonar ripples, arcs and the boot sequence need custom shaders. Borders as GPU line geometry; events as instanced points; ripples and heat in shaders; HTML only for a small number of labels (LOD-limited). Never one DOM node per event.
- Spatial indexing/clustering for zoomed-out views if density demands it.
- Worker for data parsing. Virtualised lists for any long list.
- **Floor (builder's call):** WebGL2, no WebGPU. The 60 fps target means all features active (boot, grain, ripples, arcs) on the owner's laptop. An adaptive quality tier lowers grain resolution, ripple count and arc detail when frame time slips. On phones the globe still renders with a reduced tier (fewer effects, no World Sound by default); it is not a static image.
- **Mockups** in `.superpowers/brainstorm/` are visual references for feel, not pixel specs and not code to reuse.
- Performance budgets (to be turned into tests): first useful paint about 1 s, initial JS gzip small (target under 250 KB before data), globe data under about 1 MB, steady 60 fps on the owner's laptop.
- Hosting: static host plus one scheduled job; provider is the builder's call (record in ledger), subject to the owner's confirmation before anything is deployed or any spend.
- Accessibility: `prefers-reduced-motion`, keyboard navigation, visible focus, sound off by default, contrast checked on the black background.

## 11. Left to the builder

Exact shader techniques, file layout, tile format, hosting provider, relation-dataset method (within the "no editorial opinion" rule), and the severity formula (documented and owner-reviewed).

## 12. Needed from the owner (cannot be done by the builder)

- Create the UCDP token request and ACLED account (or say to skip P2 for now).
- Approve the Kashmir/Ladakh/Arunachal test-point list in section 6.
- Confirm hosting/domain and any spend before launch.

## 13. Not yet verified

- India POV file geometry (rendered inspection pending).
- Current ACLED terms (2026), UCDP candidate endpoint access in practice, GDELT usage terms (read from secondary sources only).
- Performance targets on the owner's hardware (nothing built yet).
