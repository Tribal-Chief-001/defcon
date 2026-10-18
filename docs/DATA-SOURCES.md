# Data sources

Terms, attribution, cadence and verification dates for every dataset. Update in the same change as any source change.

## Natural Earth (map geometry and places)

| Item | Value |
|------|-------|
| Files | `ne_10m_admin_0_countries_ind` (India point-of-view), `ne_10m_populated_places_simple` |
| Version | 5.1.1 |
| Licence | Public domain (Natural Earth terms) |
| Pinned by | SHA-256 of each zip in `data/map/sources.json`; `npm run map:fetch` verifies, `-- --accept-new` re-pins |
| Countries zip sha256 | `36a54ee97a509325e98eb44fd91bc7e53b0c5139cf10039918042bbd64102192` |
| Places zip sha256 | `2963ee08f7743f13f37d5243acd77a2f7a510e26a36c7e04b920f1b381f2b251` |
| Fetched / checked | 2026-10-18 |
| Notes | 50m and 110m India-POV variants do not exist (HTTP 403, 2026-10-18); the low-detail layer is derived by simplifying the 10m file. Raw files live in `data/raw/ne/` (gitignored). |

## Border build (derived data)

Built by `npm run map:build` from the pinned India-POV file into `public/data/borders.{high,low}.topo.json` (object `countries`, properties `{ id: ADM0_A3, name }`, 248 countries).

| Layer | Settings | Raw | Gzip (transfer) |
|-------|----------|-----|-----------------|
| high | quantization 5e4 (about 0.007 deg, 800 m), no simplification | 3.47 MB | 798 KB |
| low | presimplify + simplify min weight 2e-3, quantization 1e4 | 711 KB | 177 KB |

Budgets (spec section 10) are measured as **gzip transfer size**: low <= 300 KB, high <= 1 MB. Sweep done 2026-10-18: high at quantization 1e5 was 942 KB gz (too close to the cap); quantization 5e4 keeps margin and is below the 1:10m source precision.
Patches: `data/map/patches/*.json` are applied before topology building (see `scripts/map/patches.ts`). None exist yet; the Shaksgam patch is pending the owner's reference polygon (Plan 1 Task 4).

Border build also: rewinds wrongly wound polygons and drops rings that quantization flipped (see `docs/MAP-POLICY.md`). After the fix: high 3.47 MB raw, low 658 KB raw; low has 229 of 248 countries (micro-states vanish at far zoom; high detail has all 248).

## Capitals and country list (derived)

`public/data/capitals.json`: 212 capitals from `ne_10m_populated_places_simple` rows with `featurecla` `Admin-0 capital` (202) or `Admin-0 capital alt` (13), minus 3 whose country the India-POV file does not list. Fields: name, country (ADM0_A3), lat, lon (4 decimals), rank. `public/data/countries.json`: all 248 `{ id, name }` from the India-POV file.

## Survey of India Political Map of India (reference only)

| Item | Value |
|------|-------|
| File | `https://surveyofindia.gov.in/UserFiles/files/POLMAP_ENGLISH-2026.pdf` (English, 13th edition, file dated 23 Jan 2026) |
| Size / sha256 | 31,785,145 bytes / `75f4c9f9b14b94c3d383487b6a1b4d599870455f364b3a560e2538fff1c5fe00` |
| Downloaded | 2026-10-18 |
| Use | Cross-check of the India outline only (`scripts/map/soi-check/`, `docs/MAP-POLICY.md`). Not committed, not shipped, not used in the build. Government of India publication: check its copyright terms before redistributing any derived data. |


## UCDP (human-coded armed conflict events)

| Item | Value |
|------|-------|
| Datasets | UCDP Georeferenced Event Dataset (GED) Global 26.1 (1989-01-01 to 2025-12-31; 417,968 events; 39 MB zip, 274 MB CSV) and UCDP Candidate Events monthly CSVs (Jan-Jun 2026, Jul 2026, Aug 2026; about 2,500 events a month) |
| Where | `https://ucdp.uu.se/downloads/` (direct files listed in `data/events/sources.json`) |
| Access | Free direct downloads, no token. (The UCDP API needs a token since Feb 2026; not used.) |
| Licence | CC BY 4.0: free to use and redistribute provided the publications below are cited (stated on the UCDP downloads page, checked 2026-10-18) |
| Pinned | SHA-256 per file in `data/events/sources.json`; `npm run data:ucdp` verifies, `-- --accept-new` re-pins. Candidate files are provisional and get revised, so a mismatch is expected over time. New monthly files must be added to the manifest by hand. |
| Fetched | 2026-10-18; raw files in `data/raw/ucdp/` (gitignored) |
| Coverage in Plan 2 | The last 400 days: 20,655 events (17,863 armed, 2,792 civilian), 2025-09-13 to 2026-08-31, streamed in 22 s at about 100 MB RSS. UCDP lags by about 6 weeks, so the newest weeks come from GDELT only. UCDP has no protests. |
| Mapping | `type_of_violence` 1 and 2 -> `armed`, 3 -> `civilian`; `where_prec` 1-5 -> precision 1-5 (6, 7 -> 5); deaths = `best`; human-coded; country is assigned from the India-POV borders, not from UCDP's country name. |

**Citation text (from the UCDP page, checked 2026-10-18):**
- GED: Shawn Davies, Therese Pettersson, Magnus Oberg, *Organized violence 1989-2025, and violent political protests*, Journal of Peace Research, 2026, https://doi.org/10.1093/jopres/xjag046; Sundberg, Ralph and Erik Melander (2013) *Introducing the UCDP Georeferenced Event Dataset*, Journal of Peace Research 50(4).
- Candidate: Hegre, Havard, Mihai Croicu, Kristine Eck, and Stina Hogbladh (July 2020) *Introducing the UCDP Candidate Events Dataset*, Research & Politics.
- "UCDP is part of and funded by DEMSCORE, national research infrastructure grant 2021-00162 from the Swedish Research Council."

## GDELT 2.0 Events (auto-coded events)

| Item | Value |
|------|-------|
| Source | `http://data.gdeltproject.org/gdeltv2/<YYYYMMDDHHMM00>.export.CSV.zip`, one per 15 minutes (about 27 KB), `lastupdate.txt` lists the newest |
| Format | Tab-separated, no header, 61 columns (EventCode 26, EventRootCode 28, Goldstein 30, NumMentions 31, NumSources 32, ActionGeo type/name/lat/lon 51/52/56/57, DATEADDED 59, SOURCEURL 60) |
| Terms | Free for any use; any use or redistribution must cite the GDELT Project and link to `https://www.gdeltproject.org` (GDELT About page, checked 2026-10-18) |
| Politeness | At most 4 concurrent requests, requests start at least 100 ms apart, `User-Agent: Defcon/0.1 (research showcase)`, 3 attempts, cached files never refetched; 404s older than 2 h are remembered as missing |
| Cache | `data/raw/gdelt/` (gitignored); a 7-day backfill is 285 MB unzipped |
| Measured 2026-10-18 | 7-day backfill: 672 files, 723,710 rows, 28,092 kept (3.9%): armed 18,803, civilian 5,296, protest 3,839, riot 154; fetch phase 80 s (about 8 requests a second); before deduplication |

**Kind mapping (CAMEO EventCode; the owner reviews):** `145x` -> riot; other `14x` -> protest; `19x` -> armed; `18x` and `20x` -> civilian (violence against individuals / mass violence); everything else is not drawn. Precision from ActionGeo_Type: 4 and 3 -> 2, 5 and 2 -> 4.

**Filters (`GDELT_FILTER` in `scripts/events/gdelt.ts`; the owner reviews):** drop ActionGeo_Type 0 (no place) and 1 (country centroid); drop empty, non-numeric, out-of-range or exactly (0, 0) coordinates; drop events dated more than 2 days before DATEADDED (about 4% of a sample file, some over a year old); keep only rows with NumSources >= 2 or NumMentions >= 3.

**Known limits (state them in the UI):** auto-coded and noisy (for example code 190 "use conventional military force" is also assigned to statements and rhetoric, so `armed` is the largest GDELT group); geocoding errors are common; the event itself has no time of day: an event's time is when GDELT first reported it (DATEADDED, up to 2 days after the event date), shown as "reported ... ago" in the UI and never as an exact event time; no fatality counts, so severity never exceeds 3; protests come only from here until ACLED is added.

## Event snapshots (derived, generated, gitignored)

Built by `npm run data:build` into `public/data/events/` (not committed; `npm run data:refresh` fetches the newest GDELT files then rebuilds).

| File | Content |
|------|---------|
| `recent.bin` + `recent.meta.json` | events of the last 30 days (window ends at build time) |
| `archive.bin` + `archive.meta.json` | the 335 days before that (older than 365 days is dropped) |
| `detail/recent/<YYYY-MM-DD>.json?v=<sha12>`, `detail/archive/...` | per-day arrays of `{ place, headline, actors, deaths, sources, alsoIds }`, indexed by the snapshot's `detailIdx`; the path includes the snapshot name (the boundary day exists in both) and the client adds `?v=<first 12 hex of the snapshot SHA-256>` so a rebuilt snapshot never reads a cached old shard |

Binary layout: struct-of-arrays (time u32, lat f32, lon f32, detail u32, country u16, kind u8, severity u8, precision u8, human u8), each column padded to 4 bytes, offsets and SHA-256 in the meta file (`src/events/snapshot.ts`, `scripts/events/encode.ts`). `asOfS` is the newest source time (newest GDELT slot). Budgets (gzip): recent <= 500 KB, recent + archive <= 2 MB.

Measured 2026-10-18 (UCDP to 2026-08-31 + 7 days of GDELT, after the review fixes): read UCDP 18,064 and GDELT kept 28,092; after merging 26,806 events (UCDP 18,064; GDELT 8,742), by kind armed 20,679, civilian 4,664, protest 1,371, riot 92. `recent` n=8,742, 68 KB gzip; `archive` n=18,064, 120 KB gzip. As of the newest GDELT slot (00:15 UTC). Each source in `*.meta.json` carries `asOfS` and `coverFromS`, which the UI turns into its coverage legend.

## World Bank WDI (dossier numbers)

| Item | Value |
|------|-------|
| API | `https://api.worldbank.org/v2/country/all/indicator/<CODE>?format=json&per_page=500&mrnev=1` (`mrnev=1`: most recent non-empty value per country; one page of 265 rows including regional aggregates) |
| Indicators | `SP.POP.TOTL` population; `AG.SRF.TOTL.K2` surface area km2; `NY.GDP.MKTP.CD` GDP, current US$; `MS.MIL.XPND.CD` military expenditure, current US$ and `MS.MIL.XPND.GD.ZS` as % of GDP (underlying source: SIPRI Military Expenditure Database, republished by the World Bank, which resolves the SIPRI licence question) |
| Dataset licence | World Development Indicators: **Creative Commons Attribution 4.0** (World Bank Data Catalog, dataset 0037712, checked 2026-10-18); use, copy, modify and redistribute with attribution and a note of changes |
| Attribution text | "World Bank, World Development Indicators (CC BY 4.0); military expenditure: SIPRI Military Expenditure Database via the World Bank." |
| Data last updated | 2026-10-08 (API `lastupdated`); fetched 2026-10-18 into `data/raw/wb/` (gitignored); `npm run data:wb` refetches |
| Coverage of our 248 countries | population 220, area 220, GDP 217, military expenditure 171 (% of GDP 170). Years differ per country (population 2025, area 2024, military mostly 2025 but some only older); the year is shown as the field's "as of". |
| Mapping | by ISO3 (`ISO_A3_EH` of our country list; South Sudan is `SDS` in our ids and `SSD` here); countries with no row get `null` ("unavailable") |

## CIA World Factbook (archived; government type, languages, independence, organisations)

| Item | Value |
|------|-------|
| **Status** | **The CIA retired the World Factbook on 2026-02-04** ("Spotlighting The World Factbook as We Bid a Fond Farewell", https://www.cia.gov/stories/story/spotlighting-the-world-factbook-as-we-bid-a-fond-farewell/, read 2026-10-18). The data below is the last published edition and will not be updated. The dossier labels these fields "CIA World Factbook, archived" with the data date. |
| Mirror | `https://github.com/factbook/factbook.json` (255 country files named by FIPS codes). The mirror's weekly "auto-update" commits ended on **2026-01-22** (the India file's last data commit; the repo's newest commit, 2026-09-11, is a README change). `meta.json` records both dates; the dossier uses the data date 2026-01-22. |
| Licence | The mirror's README states the country profiles are "in the public domain (that is, no copyright(s), no rights reserved, no license)" and the repo is CC0. The CIA's own copyright page could not be retrieved (the Factbook site is retired and the URL redirects to the farewell story); the status rests on the mirror's statement and the long-standing US-government-work status. Attribution is given anyway. |
| Imported fields only | `Government.Government type`, `People and Society.Languages.Languages`, `Government.Independence`, `Government.International organization participation` (free text, shown as the Factbook states it, not interpreted), and the capital name and coordinates (used only to match files to our countries). **No other section is read** (disputes, geography, maps) so the Factbook's cartography cannot reach India's dossier (tests assert it). |
| Matching | Factbook files use FIPS codes, we use ADM0_A3: files are matched by capital coordinates (within 80 km of one of the country's Natural Earth capitals, closest pair wins, one file per country). Real run 2026-10-18: 255 files, **194 countries matched**, 61 unmatched (territories and others); government type for 194, independence for 193, languages for 125. Known source quirk: the Wallis and Futuna file carries coordinates next to Apia, so Samoa (closer) wins and Wallis and Futuna stays unmatched; Burundi's file lists Gitega first (62 km from Natural Earth's Bujumbura). |
| Why not membership flags | A text search for "NATO" finds 34 countries (Jordan and Malta are partners); UN and NATO membership come from the official lists (Task 4), not from this text. |

## UN and NATO membership (official lists)

| Item | Value |
|------|-------|
| File | `data/relations/memberships.json` (committed; ids are our ADM0_A3), rebuilt by hand with `npm run data:memberships` a few times a year |
| UN members | 193, parsed from `https://www.un.org/en/about-us/member-states` (193 "Date of Admission" entries; the site returns 403 to a bare client, so a browser-like User-Agent is sent) |
| UN observers | Holy See (`VAT`) and State of Palestine (`PSX`; ISO3 PSE) from `https://www.un.org/en/about-us/non-member-states` |
| NATO members | 32, `https://www.nato.int/cps/en/natohq/nato_countries.htm`. The member list is prose on that page, so the 32 names are written down in `scripts/dossiers/memberships.ts` and the builder **checks them against the page**: it must say "NATO has 32 member countries" and mention every name, otherwise the build fails. |
| As of | 2026-10-18 |
| Independent cross-check (2026-10-18) | Against the archived Factbook organisation text: UN differs only by Nauru (not in the Factbook match) and the Holy See (observer); NATO differs only by Jordan and Malta, which the Factbook text lists as partners. |
| Not covered | Other alliances and groupings (CSTO, SCO, EU, ...): the dossier shows the Factbook's organisation text as stated; alliance arcs are Plan 4. |

## Country dossiers (derived, committed)

Built by `npm run data:dossiers` (after `data:wb` and `data:factbook`) into `public/data/dossiers/`: one `<ADM0_A3>.json` per country (248) plus `index.json` (search index). Output is **committed** so a static deploy needs no pipeline; refresh monthly or when a source changes.

| Item | Value |
|------|-------|
| Per-country file | `Dossier` (see `src/dossier/types.ts`): identity and ISO codes, capitals (Natural Earth; a different Factbook capital is added as a `note`, e.g. Burundi's Gitega, never replaces it), neighbours (from our India-POV borders), World Bank fields, Factbook fields, UN and NATO membership |
| Field shape | `{ value, source, asOf, url?, note? }` or `null` = unavailable. A source without a row gives `null`, never 0; a real 0 is kept; a non-finite number becomes `null`. UN and NATO are always answered (the official lists are complete): not in the list = `non-member` / `false`. |
| Provenance | World Bank: `World Bank WDI` (`SIPRI via World Bank WDI` for military), `asOf` = the data year; Factbook: `CIA World Factbook (archived)`, `asOf` 2026-01-22 with the sunset note; memberships: official list, `asOf` = list date |
| Measured 2026-10-18 | 248 dossiers, 575 KB total, largest 4.2 KB, index 9.0 KB gzip. Non-null: population 220, area 220, GDP 217, military 171 (% GDP 170), government type 194, languages 125, independence 193, organisations 194; 194 have a capital, 166 have neighbours. Budgets (`check:budgets`): index <= 40 KB gzip, each dossier <= 6 KB. |
| Text cleaning | The Factbook text contains HTML entities (`&nbsp;`, `&eacute;`, ...): decoded to real characters and whitespace collapsed (tests cover all 30 entity names present in the data). |

## Relations: alliances and active disputes (derived, committed)

Built by `npm run data:relations` into `public/data/relations.json` (about 2 KB gzip, budget 8 KB). Spec rule: **allies = formal treaty memberships only; "active disputes" = pairs on opposing sides in a named armed-conflict dataset, source shown; no editorial opinion.**

| Item | Value |
|------|-------|
| Alliances (`data/relations/alliances.json`, hand-curated, each with a source URL read on 2026-10-18) | NATO (32, official list, same file as the dossiers); CSTO (Armenia, Belarus, Kazakhstan, Kyrgyzstan, Russia, Tajikistan: `en.odkb-csto.org/25years/`, which states Uzbekistan suspended in 2012 and says nothing about Armenia); ANZUS as two pairs, Australia-United States and Australia-New Zealand (US Office of the Historian page, which states the US suspended its obligations toward New Zealand in 1986, so that pair is not drawn). |
| Not included | US bilateral mutual defense treaties with Japan, South Korea and the Philippines: state.gov and the Japanese foreign ministry answered 403/404 and no other official page stating them was found on 2026-10-18. Not added from memory; backlog. India has no formal alliance on record. |
| Disputes | UCDP GED (the pinned CSVs in `data/events/sources.json`): rows with `type_of_violence = 1` and a Gleditsch-Ward number on both sides; coalition sides (`2;200;900`) pair every government with every government on the other side; only events from the dataset's latest year minus one count, and a pair needs at least 3 of them. The mapping from Gleditsch-Ward numbers to ADM0_A3 comes from the GED country names and fails the build on any unresolved number. A pair needs at least 3 events (one row is not an active dispute). Found 2026-10-18 (data, not editorial): AFG-PAK, IND-PAK (2025), IRN-ISR, ISR-SYR, ISR-YEM, KHM-THA, RUS-UKR. UCDP's own conflict name is shown as given. |
| Licence | UCDP: CC BY 4.0 (attribution in the record). NATO/CSTO/State Department: facts about membership, linked to the page. |

## Publishing gate: snapshot validator

`npm run data:validate` (`scripts/events/validate-snapshot.ts`) runs before anything is published. It fails (exit 1, problems listed) on: a missing `recent`/`archive` file, a hash that does not match the bytes, a snapshot that cannot be decoded, fewer than 500 recent events, a non-finite as-of time, data older than 12 h (so a GDELT outage turns the run red instead of re-publishing old data) or more than 1 h in the future, GDELT covering fewer than 5 days, a non-finite or out-of-range coordinate, a kind/severity/country index out of range, a detail shard that is missing, not valid JSON or too short for the events pointing into it, or overlapping recent and archive windows. It has no comparison with the previous snapshot. A failed ingest therefore leaves the live site on the previous data.

Cadence: the scheduled ingest runs every 3 hours (D-047), so "live" means at most about 3 hours old plus the GDELT delay; the pill says exactly how old the data is.

## Conflicts (War tracker data, derived, committed)

| Item | Value |
|------|-------|
| File | `public/data/conflicts.json` (about 530 KB, 119 KB gzipped; loaded only when the War tracker opens) |
| Built by | `npm run data:conflicts` (`scripts/conflicts/build-conflicts.ts`) from the pinned UCDP files: GED 26.1 and the 2026 candidate releases (run `npm run data:ucdp` first) |
| Content | UCDP events grouped by `conflict_name`; per conflict: deaths as `best` with the `low`-`high` range for 30, 90 and 365 days, event counts, a trend word, 52 weekly buckets (364 days), the 12 newest events with place, headline and source names, the countries involved |
| Windows | End at the **data end date** (the latest UCDP event, 2026-08-31 on 2026-10-18), never at today. A conflict is listed with at least 100 deaths in 365 days or 25 in 90 days (104 conflicts after Plan 12). | **Dates an event covers (Plan 12):** UCDP candidate rows often cover a month or several months (`date_prec` 4 and 5, start on the 1st, end on the last day); an event's deaths are spread evenly over its days (end clipped to the data end), and each window, the weekly series and the monthly series take the share of days they contain. Events without `date_end` are one day. Event counts, places and the model's training months still use the start date; windows are rounded after summing, so weekly bars may differ from the total by a few deaths.
| Activity trend | **Event counts** (not deaths, so one mass-casualty event cannot flip it): events in the last 30 days against the average 30 days of the 60 days before: rising (>= 1.5x and >= 5 events), falling (<= 0.5x and base >= 5), steady, or "low data" (under 5 events to compare) |
| Provisional | Rows from candidate files are provisional (UCDP revises them); each event and each conflict carries that flag or share |
| Unnamed | UCDP candidate files anonymise some actors as `XXX<number>`; those conflicts keep the code in their name next to the main country |
| Licence | CC BY 4.0 (UCDP); citation text as in the UCDP section above |
| Geography (`geo`) | Per conflict: a death-weighted centroid (mean of 3-D unit vectors, right across the antimeridian), the death-weighted 75th-percentile spread (40-2500 km) and the top 40 hotspots on a 0.5-degree grid. Only events UCDP located to a province or better (`where_prec` <= 4: 1 exact, 2 within 25 km, 3 district, 4 province) are used, because events it can only place in a region or the whole country share one geocode (in Russia - Ukraine one point, 49.0 / 32.0, holds about 74,000 of the deaths); `locatedShare` is the share of deaths that could be placed (Russia - Ukraine 12%, Israel: Palestine 100%). World `weeklyByKind`: the 52 weeks split by kind. |
| Not included | Anything after the data end, GDELT events (auto-coded), any claim not in UCDP |

## Indices (Fatality Index and Instability Index, built, committed)

| Item | Value |
|------|-------|
| File | `public/data/indices.json` (182 KB, 22.6 KB gzipped; loaded only by the dossier, the War room and About) |
| Built by | `npm run data:indices` (`scripts/index/build-indices.ts`, about 3 minutes with the bootstrap) after `npm run data:ucdp` and `npm run index:fetch` (World Bank WGI and WDI files, aggregates only) |
| Content | per country of UCDP GED (130): the Fatality Index (score and range, deaths for 90 and 365 days with ranges, per 100,000, band, trend, rank, 120 monthly values) and, for the modelled countries, the Instability Index (probabilities of continuing and of a sharp rise with 90% intervals, momentum, confidence and its reason, the feature contributions); the world's monthly deaths; the model's backtest metrics and calibration bins |
| Training | final UCDP GED only, country-months from 1998 up to 2025-09 (labels need three observed future months); predicted at the data end (2026-08-31) using provisional candidate rows; WGI values are the latest year before the prediction year |
| Backtest | fit up to 2015-12, evaluate 2021-01 to 2025-09; regenerated into [INDEX-BACKTEST.md](INDEX-BACKTEST.md); `tests/index/indices-data.test.ts` fails if the model degrades (AUC floors, Brier skill, calibration) |
| Refresh | by hand (`npm run data:indices`), not in CI; the file carries its data end date |
| Licence | derived from CC BY 4.0 data (UCDP, World Bank WGI and WDI); attribution on the About page |
| Not included | countries without a UCDP record (shown as "not modelled", never "low"), protests, onset forecasts |

## Refreshing UCDP data (Plan 12)

| Item | Value |
|------|-------|
| Alert | `.github/workflows/data-updates.yml` runs on the 5th of every month (read-only, no secrets) and fails, so GitHub emails the owner, when UCDP has published the next monthly candidate file (`npm run data:ucdp-discover -- --check`, a HEAD request) or when the timeline is more than 45 days old (`npm run data:timeline-age`) |
| Refresh | `npm run data:ucdp-discover -- --accept` downloads the next file and pins its SHA-256, then `npm run data:conflicts` and `npm run data:indices`, then `npm test`, then commit `data/events/sources.json`, `public/data/conflicts.json`, `public/data/indices.json` and `docs/INDEX-BACKTEST.md` |
| Why not unattended | the SHA-256 pin is a supply-chain control and the indices are a model output: a person looks at the diff and the guard tests before it goes live |

## Key-events timeline (curated, committed)

| Item | Value |
|------|-------|
| File | `public/data/timeline.json` (46 entries, 4 theatres: US/Israel-Iran, Israel-Lebanon, Russia-Ukraine, Israel-Gaza and Palestine; checked 2026-10-18) |
| Built by | Hand curation from news pages that research agents actually read, then re-checked by separate agents (AI agents reading pages through a summarising fetch tool, long pages only to their first 100,000 characters, so the check is strong but not complete; 35 of 46 entries needed wording fixes: numbers given by only one outlet are now attributed to it, claims are attributed to the party that made them, confirmed means two outlets). Not generated by a script. |
| Rules | `scripts/timeline/validate.ts` (tested, run in `tests/timeline/timeline-data.test.ts`): valid and chronological dates, nothing after the checked date, https sources, blocked content-farm hosts, a verified note per source, no source published more than a day before the event, and **confirmed or disputed needs two sources from different outlets and different registrable domains** |
| Statuses | confirmed: two independent outlets report the event (figures and claims stay attributed, not verified); reported: one reliable source or one claimant; disputed: sources or parties differ |
| Limits | Reuters, AP, BBC and Guardian were not reachable by the research tools, so sources are mainly Al Jazeera, Times of Israel, Kyiv Independent, France 24 (AFP), CBS News and official statements. France 24 and AFP-based pieces are not fully independent of other wire reports. Front-line changes (Pokrovsk, Myrnohrad, Huliaipole, Kupiansk) are not listed: two readable independent sources were not found. The list ages: the page shows "checked <date>". |
| Licence | Facts, summarised in our own words with attribution; each entry links its sources. No article text is copied. |

**Timeline places:** `npm run data:timeline-places` (`scripts/timeline/places.ts`) adds an approximate `at` (city, area or strait a reader would look for, not the exact site) to 44 of the 46 timeline entries so they can be pinned on the globe.

