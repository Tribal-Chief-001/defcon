# Event-data platforms vs Defcon: ACLED, UCDP, GDELT, CFR Global Conflict Tracker, Crisis Group CrisisWatch

All pages read on 2026-10-29 (today) unless a different date is given. "NOT READ" = I could not read it (blocked, login wall, empty or 404). "UNVERIFIED" = only from a search-result snippet or from memory; do not score on it without checking. WebFetch summaries come from a small model, so quotes are kept short and clause numbers are as reported by the tool. Nothing about 2026 events is from memory.

Read-method notes: crisisgroup.org returned a Cloudflare "Just a moment" challenge on its main URL (HTTP 403 via WebFetch and curl, challenge page in the built-in browser). I did not try to defeat it. One alternative route (`/ku/crisiswatch`) was readable via WebFetch. acleddata.com Explorer is behind a login wall. ucdp.uu.se is a JavaScript app, so it was read in the built-in browser.

---

## 1. ACLED (Armed Conflict Location & Event Data)

### Takeaway
ACLED is the richest near-real-time, human-coded, event-level political-violence dataset, but its free "Open" level gives no API and no event-level data. Its EULA also bars redistribution and competing products. It is a data source Defcon cannot legally republish, and a login-walled product Defcon can beat on openness.

### Cited Findings

**Owner and funding**
- Registered US non-profit, 501(c)(3). The only funder named on that page is the UN Complex Risk Analytics Fund (CRAF'd). — [ACLED about](https://acleddata.com/about-acled), read 2026-10-29
- Other funders, budget, staff: NOT READ.

**What it measures and coverage**
- Dataset of political violence, demonstration and strategic-development events. API endpoints are `ACLED`, `Deleted` and `CAST`. — [API getting started](https://acleddata.com/api-documentation/getting-started), read 2026-10-29
- Country and year coverage: NOT READ. The /acled-data page returned 404 and the Explorer is login-gated.
- A third party says ACLED has no fatality threshold, so a zero-death protest sits next to a battle. That page also reports "over 240,000 reported deaths" in a recent 12-month period. Secondary and UNVERIFIED. — [armedconflicts.org](https://armedconflicts.org/where-acled-and-ucdp-disagree.html) (banner "UPDATED 2026-10-29")
- ACLED's own FAQ says it has no fatality threshold for inclusion (search snippet, UNVERIFIED). — [ACLED fatality methodology (search result)](https://acleddata.com/methodology/fatalities)

**Sources, provenance, human vs automated**
- Fatalities come from "the most reliable sources and partners" for each conflict. ACLED reflects source reports and does not independently verify them. — [ACLED fatalities methodology](https://acleddata.com/methodology/fatalities), read 2026-10-29
- Researchers review and code events, usually within about a week of occurrence. Secondary (Atlas) and UNVERIFIED. — [Atlas data-source page (search result)](https://atlas.co/data-sources/acled-armed-conflict-location-event-data)

**Update frequency and latency**
- Weekly file uploads. Africa, Latin America and the Middle East on Monday; Asia-Pacific, Europe/Central Asia and US/Canada on Tuesday. Each covers the previous Saturday to Friday. — [When are ACLED data updated](https://acleddata.com/use-access/when-are-acled-data-updated), read 2026-10-29
- An expedited Thursday upload covers Saturday to Monday of the current week. Daily data (select locations only) is published within 24 hours.
- Explorer, CAST, Trends and the Weekly Conflict Index update on Wednesday. Gaza, Middle East and Yemen monitors update on Tuesday.
- A 2026 arXiv study of African events (June 2024 to June 2025) found over half are reported within two weeks. Higher-fatality events are reported faster, and restrictive environments report slower. UNVERIFIED (search snippet). — [arXiv 2603.25964](https://arxiv.org/abs/2603.25964v1)
- Newest event date visible on the day: NOT READ. The Explorer shows only a registration wall to a non-logged-in visitor.

**Event granularity**
- One fatality figure per event, with no range. Vague words are coded as "tens"=10, "dozens"=12, "hundreds"=100. Unknown count with a likely high toll is coded 10, otherwise 3. Reports of "casualties" only are coded 0. Multi-day or multi-location totals are split evenly. — [ACLED fatalities methodology](https://acleddata.com/methodology/fatalities), read 2026-10-29
- When sources conflict ACLED uses the most conservative figure and notes the dispute. The page says fatalities are the least accurate part of conflict reporting and may be undercounted. Fatalities are not attributed to specific groups.
- Geo precision, actor fields: NOT READ (codebook not fetched).

**Methodology transparency**
- Public codebook exists and is referenced from the Conflict Index methodology (not fetched). — [About Conflict Index](https://acleddata.com/general-guide/about-conflict-index)
- No separate validation process is described for the Conflict Index. — same page

**Visual product (what I saw)**
- The Explorer URL shows only "Register or log in to access ACLED Explorer", with Register, Login and Get in touch buttons, plus a cookie banner (Customize, Decline, Accept). No map is visible without an account. — [ACLED Explorer](https://acleddata.com/platform/explorer), viewed in the built-in browser 2026-10-29
- The CAST results page also requires a myACLED account. — [CAST page](https://acleddata.com/platform/cast-conflict-alert-system)
- The public Conflict Index page is readable. Newest date visible: 11 December 2025. Data window 1 Dec 2024 to 28 Nov 2025. — [Conflict Index](https://acleddata.com/conflict-index/)
- Mobile, embeds, time travel: NOT READ.

**Accessibility**: not found.

**API, bulk download, export**
- API requires a myACLED account. Cookie auth or OAuth (client_id "acled", Bearer token valid 24 h, refresh token 14 days). Default max 5,000 events per call, with pagination. CSV and JSON. — [API getting started](https://acleddata.com/api-documentation/getting-started)
- Access level is assigned from your organisation's email domain. Gmail-type addresses get "Open myACLED". — [myACLED FAQ](https://acleddata.com/myacled-faqs)
- Tier table (the tool flagged that five data labels map to four columns, so mapping is a best reading):

| Level | Data | API | Explorer | Trends / Weekly Conflict Index / Monitors |
|---|---|---|---|---|
| Open | Real-time, grouped by admin unit | No | Yes | No |
| Research | Aggregated | Yes | Yes | No |
| Partner | Aggregated + lagged event data | Yes | Yes (curated files) | Yes |
| Enterprise | Disaggregated weekly, unlimited, expedited | Yes | Yes | Yes (plus private briefings) |

  — [myACLED FAQ](https://acleddata.com/myacled-faqs)
- **Verified for this project: ACLED API is not available on the free Open tier** (API row = No). Open is the only tier without API. Research gets the API but only via an institutional domain. A gmail-style address cannot self-select it.

**Licence and terms**
- Terms are three documents: EULA, Content Usage Terms, Attribution Policy. — [Terms](https://acleddata.com/terms-of-use/)
- EULA 1.2: commercial entities need a corporate licence. EULA 3.1: royalty-free, non-exclusive, non-transferable licence "for non-commercial purposes, which may include internal use". — [EULA](https://acleddata.com/eula)
- EULA 3.1/3.3/3.5: external materials must be "transformative" so they cannot be reverse-engineered to recreate the content. Excerpting, reorganising or showing it on your own dashboard is not enough. Direct access to the content may not be given to others. Scraping is prohibited. Access may not be given to competitors.
- EULA 7.1-7.3: AI/ML/LLM use must attribute ACLED and may not build substitutes. EULA 10: no use to support competing products, datasets or APIs.
- Content Usage Terms and Attribution Policy: NOT READ.
- Commercial use: only with a paid corporate or public-sector licence. FAQ also says ACLED limits organisations "monetizing products created using ACLED's data".

**Pricing and tiers**: no prices published on pages read. Higher tiers: "contact ACLED". Enterprise price NOT FOUND.

**Open source**: no official ACLED repo found. I tried one guessed path (ACLED/acled-r, 404) and did not search exhaustively.

**Alerting, personalisation, accounts**: account required for Explorer and CAST. Monitors and Weekly Conflict Index are Partner and Enterprise only. — [myACLED FAQ](https://acleddata.com/myacled-faqs)

**Forecasting and risk metrics**
- CAST: light gradient boosted machine with Tweedie objective. Forecasts event counts per four-week period for Battles, Explosions/remote violence and Violence against civilians (and their total) at admin1, country and global level. Horizon is six consecutive four-week periods, published weekly. Prediction intervals come from rolling cross-validation residuals. The page says accuracy metrics are published but names no metric and gives no value. — [CAST methodology](https://acleddata.com/methodology/cast-methodology), read 2026-10-29
- Conflict Index: four indicators (Deadliness, Danger, Diffusion, Fragmentation), ranked and averaged. Top 10 "extreme", next 20 "high", next 20 "turbulent". Annual release each December, plus a Weekly Conflict Index every Wednesday (Partner and Enterprise). — [About Conflict Index](https://acleddata.com/general-guide/about-conflict-index)
- Published AUC, Brier or calibration: none found.

**Adoption signals**: no owner-published user numbers read. A third-party dashboard (World Monitor) says it uses ACLED for protest detection (their marketing claim, UNVERIFIED). — [worldmonitor.app](https://www.worldmonitor.app/)

**Documented strengths**: weekly human-coded cadence, broad event definition (protests, riots, strategic developments), daily data for select places, CAST forecast with intervals.

**Documented weaknesses and criticisms**
- Eck (Cooperation and Conflict, 2012) advises caution with ACLED for subnational work because of uneven quality control, and notes media-source reliance in both ACLED and UCDP. UNVERIFIED (search snippet). — [ALNAP library](https://library.alnap.org/node/64946)
- Öberg and Yilmaz, Research & Politics 2025, "Measurement issues in conflict event data", argue ACLED-vs-UCDP gaps stem mostly from auxiliary coding rules and source-evaluation standards, replying to Raleigh, Kishi and Linke. UNVERIFIED (search snippet). — [DOAJ](https://doaj.org/article/a9fe5df517e34e3288fefc54086af44f)
- ACLED itself concedes its fatality counts may undercount (see fatalities page above).

**Distinctive USP**: weekly, human-coded, worldwide event stream including non-lethal events, plus CAST forecast and a Conflict Index.

**Legal or neutrality risks**: EULA 3.1/3.3/10 prohibit redistribution and competing datasets. EULA 7 restricts AI use. Content Usage Terms NOT READ.

### Inferences (mine)
- **Do better**: no login wall, a visible "newest event" date, ranges (low/high) instead of one number, open code and open data, and published validation numbers (ACLED publishes none that I could find).
- **Must not copy**: ACLED data cannot be bundled into Defcon's CC BY or MIT JSON or CSV exports, because the EULA bars redistribution and a free API is not available. Do not call ACLED from the 3-hourly static build.
- Their tiered model is built for paid institutions. An open-by-default project should say plainly that it uses UCDP and not ACLED.

### Gaps
- Newest event date and map behaviour (login wall).
- Coverage start years and number of countries, Content Usage Terms, Attribution Policy, codebook, enterprise pricing.
- Any published CAST accuracy numbers (page says they exist but gave none).

---

## 2. UCDP (Uppsala Conflict Data Program)

### Takeaway
UCDP is the academic gold standard: CC BY 4.0, human-coded, with best/low/high fatality estimates and precision flags. It is annual for final data and monthly for Candidate data. Its public web app needs no account and is the closest existing analogue to Defcon's globe, but the API now needs a token.

### Cited Findings

**Owner and funding**
- Department of Peace and Conflict Research, Uppsala University. Founded mid-1980s, renamed UCDP 2003, encyclopedia online 2004. Funding mostly external: Swedish Research Council, Bank of Sweden Tercentenary Foundation, Uppsala University (Sida previously). 10-15 staff. Turnover 5-10 million SEK. Page undated. — [UCDP background](https://uu.se/en/department/peace-and-conflict-research/research/ucdp/about-ucdp/ucdp-background), read 2026-10-29

**What it measures and coverage**
- GED 26.1: global, 1989-01-01 to 2025-12-31. An event requires at least one death in the high, best or low estimate. — [GED codebook v26.1](https://ucdp.uu.se/downloads/ged/ged261.pdf), read via PDF 2026-10-29
- Conflict-level datasets use a 25 battle-related deaths per year threshold (state-based, non-state, one-sided). — same codebook
- Datasets on downloads page: UCDP/PRIO Armed Conflict 1946-2025, Dyadic 1946-2025, One-sided and Non-state 1989-2025, Battle-Related Deaths, Actor, Country-Year, Violent Political Protest (VPP GED 2011-2025). — [UCDP downloads](https://ucdp.uu.se/downloads/)
- A third party reports 65 state-based conflicts in 2025, the most since 1946, attributed to Davies, Pettersson and Öberg (JPR, June 2026). UNVERIFIED secondary. — [armedconflicts.org](https://armedconflicts.org/where-acled-and-ucdp-disagree.html)

**Sources and human vs automated**
- Codebook describes coders applying precision and clarity rules. The PRIO paper title confirms "UCDP coders" exist (human). Source types section of the codebook: NOT READ in detail. — [PRIO publication](https://www.prio.org/publications/14755), search result
- UCDP "tends to be highly conservative when counting fatalities". — [GED codebook v26.1](https://ucdp.uu.se/downloads/ged/ged261.pdf)

**Update frequency and latency**
- Final yearly datasets: version 26.1 covers through 2025. — [UCDP downloads](https://ucdp.uu.se/downloads/)
- Candidate Events: monthly, latest 26.0.9 (September 2026), covering January to September 2026. Exact newest event date in it: NOT READ (API needs token).
- Candidate extracted from UCDP systems on the 20th of each month (codebook v1.5), with "not more than a month's lag". Candidate events are not final. A majority later enter GED. UNVERIFIED (search snippets). — [Candidate codebook 1.5](https://ucdp.uu.se/downloads/candidateged/ucdp-candidate-codebook1.5.pdf); [2020 release notice](https://www.uu.se/en/department/peace-and-conflict-research/news/archive/2020-06-16-major-data-releases-from-ucdp)

**Event granularity and uncertainty**
- Best, high and low fatality estimates per event, plus deaths by side a, side b, civilians and unknown. — [GED codebook v26.1](https://ucdp.uu.se/downloads/ged/ged261.pdf)
- `where_prec` (geo precision), `date_prec` (1 = exact day, 2 = 2-6 day range, 3 = week, 4 = 8-30 days, 5 = up to a year), `event_clarity` (1 = fully identified event, 2 = aggregated source that could not be split).
- Fatality ranges and precision codes are the key feature Defcon already mirrors.

**Methodology transparency**: full public codebook with versioning. Versioned API calls return the same data "indefinitely". — [UCDP API docs](https://ucdp.uu.se/apidocs/)

**Visual product (what I saw)**
- ucdp.uu.se renders a dark-style flat world map with a search box ("actors, conflicts, countries"), two view buttons ("Countries in conflict view", "Fatalities view") and a download icon. Left rail: About, API, Download, a year bookmark ("2025"), Charts. A line chart "Number of Conflicts 1975-2025" with filters for State-Based, Non-State and One-Sided violence. A round "Explore UCDP Events" bubble showed cluster counts 94 and 1458. No login. — viewed in the built-in browser 2026-10-29, [ucdp.uu.se](https://ucdp.uu.se/)
- Globe, time travel beyond year selection, mobile, embeds: NOT READ.

**Accessibility**: not found.

**API, bulk, export**
- API is free but requires a token, sent in header `x-ucdp-access-token`, requested by email with a short description of use. Reviewed in 3-5 working days. 5,000 requests per day, errors counted. Paging required. Resources: gedevents (incl. Candidate), ucdpprioconflict, dyadic, nonstate, onesided, battledeaths, organizedviolencecy. Version number mandatory. — [UCDP API docs](https://ucdp.uu.se/apidocs/), read 2026-10-29
- Token introduced February 2026 per one version of the docs, to curb bot traffic. UNVERIFIED (search snippet, single copy). — [search result](https://ucdp.uu.se/apidocs/)
- Bulk downloads: CSV, Excel, codebook PDF. — [UCDP downloads](https://ucdp.uu.se/downloads/)

**Licence and terms**: all datasets CC BY 4.0, "free to use and redistribute" with citations. Citation lists per dataset (for example Davies et al. 2026; Sundberg and Melander 2013). The API docs page itself states no licence. — [UCDP downloads](https://ucdp.uu.se/downloads/)

**Pricing**: free. No commercial restriction beyond CC BY 4.0.

**Open source**: UCDP site code not found. Related ViEWS org on GitHub: views-pipeline-core 3 stars, MIT, pushed 2026-09-29; views-hydranet 5 stars, MIT, pushed 2026-10-29; views-models 2 stars, MIT, pushed 2026-10-28. — read via `gh api` 2026-10-29

**Alerting and accounts**: no accounts for the web app or downloads. UCDP "update alert" pages exist; email subscription NOT READ.

**Forecasting (ViEWS)**
- ViEWS is co-hosted by Uppsala's Department of Peace and Conflict Research and PRIO. Forecasts at country and sub-national levels for likelihood, extent and severity, 1-36 months ahead, new forecasts every month. Latest: "Conflict Forecasts for Sep 2026-Aug 2029", posted 30 Sep 2026. Data and code open; no licence named on the site. — [ViEWS](https://viewsforecasting.org/), read 2026-10-29
- Published validation: the 2019 launch paper reports performance; a 2020 JPR retrospective (July 2018 to December 2019) says performance was in line with expectations. Metrics used in the later literature are AUC, average precision and Brier. Numeric values NOT READ (PDF was 403). UNVERIFIED snippets. — [Hegre et al. 2019](https://journals.sagepub.com/doi/10.1177/0022343319823860); [Hegre et al. 2020](https://journals.sagepub.com/doi/full/10.1177/0022343320962157)

**Adoption signals**: Our World in Data builds charts on UCDP data (page seen in search). Owner-published usage numbers: not found.

**Documented strengths**: CC BY 4.0, stable definitions designed for comparability across decades, ranges and precision flags, versioned reproducible releases, free no-account web app.

**Documented weaknesses and criticisms**
- Strict definition excludes violent events ACLED records, for example events by "unidentified armed groups" (EU asylum agency note, search snippet, UNVERIFIED). — [EUAA](https://www.euaa.europa.eu/coi-report-afghanistan-country-focus/sources-security-incidents)
- Vesco et al. (J. Conflict Resolution, 2026) argue UCDP probably undercounts deaths, using a survey of UCDP coders (search snippet, UNVERIFIED). — [PRIO](https://www.prio.org/publications/14755)
- Eck 2012 flags media-source reliance. — [ALNAP](https://library.alnap.org/node/64946)
- Final data lags a year, Candidate data is provisional, and the API now needs a manual token.

**Distinctive USP**: academic credibility, CC BY 4.0, fatality low-best-high, conflict-year thresholds, and a sibling forecasting system (ViEWS) with 36-month open forecasts.

**Legal or neutrality risks**: low. Needs citation under CC BY 4.0. UCDP also asks that the right publications be cited.

### Inferences (mine)
- Defcon is closest to UCDP in data philosophy. Its differentiators are a 3D globe, 3-hourly build, risk and fatality indices with a published backtest, and signals (fires, displacement).
- **Must not copy**: UCDP's annual lag for final data, and the manual token barrier. **Could do better**: show Candidate-data freshness on screen, with the version label, and explain low/high ranges to lay users.

### Gaps
- Newest Candidate event date (token needed), ViEWS numeric metrics, accessibility statement, UCDP email-alert details, funding for ViEWS.

---

## 3. GDELT (Global Database of Events, Language and Tone)

### Takeaway
GDELT is a free, fully automated, near-real-time news-derived event and tone database with unrestricted use (citation required). Its automated coding is noisy for conflict counting, and it has no fatality ranges or human review.

### Cited Findings

**Owner and funding**
- Created by Kalev H. Leetaru. The about page names no funding source. It acknowledges Google (Ideas, Cloud, News), a Georgetown Yahoo! Fellowship, BBC Monitoring, LexisNexis, JSTOR, the Internet Archive and past NSF grants. Acknowledgement is not stated as funding. — [GDELT about](https://www.gdeltproject.org/about.html), read 2026-10-29

**What it measures and coverage**
- Events plus the Global Knowledge Graph (GKG). 1.0 events from 1979, GKG from 1 April 2013. 2.0 adds 65 translated languages and a mentions table. — [GDELT data](https://www.gdeltproject.org/data.html), read 2026-10-29
- Sources: "hundreds of thousands" of broadcast, print and online outlets in 100+ languages. — [GDELT about](https://www.gdeltproject.org/about.html)

**Provenance, automated**
- Machine-coded from news, with no human review on the pages read. The about page says nothing about machine-coding accuracy. — [GDELT about](https://www.gdeltproject.org/about.html)

**Update frequency and latency (measured today)**
- 2.0 updates every 15 minutes. — [GDELT data](https://www.gdeltproject.org/data.html)
- On 2026-10-29 at 09:43:18 UTC (HTTP date header) `lastupdate.txt` listed export, mentions and gkg files stamped `20261029094500`. So the newest batch was labelled the current 15-minute slot. The label was slightly ahead of the server clock, meaning it likely names the interval and not the completion time. — [lastupdate.txt](https://data.gdeltproject.org/gdeltv2/lastupdate.txt), fetched with curl
- Blog active: posts dated 24-28 Oct 2026, several per day. — [GDELT blog](https://blog.gdeltproject.org/)

**Event granularity**: tab-delimited event rows. GDELT's CAMEO event coding, Goldstein scale and fatality fields were not read, so I cannot state whether any fatality field exists. NOT READ.

**Methodology transparency and known biases**
- Codebooks and lookup files are published. — [GDELT data](https://www.gdeltproject.org/data.html)
- A 2014 Political Violence at a Glance critique: one event covered by many outlets can appear many times, with no duplicate-linking code. UNVERIFIED (snippet). — [Political Violence at a Glance](https://politicalviolenceataglance.org/2014/02/20/raining-on-the-parade-some-cautions-regarding-the-global-database-of-events-language-and-tone-dataset/)
- Beieler: "potentially high" false-positive rate, comparison with ICEWS reached a similar conclusion. UNVERIFIED (snippet). — [John Beieler](https://johnbeieler.org/blog/2013/10/28/noise-and-gdelt/)
- UK Office for National Statistics data-quality note cites Hammond and Weidmann (2014): use GDELT with caution for subnational geospatial analysis. UNVERIFIED (snippet). — [ONS note](https://www.ons.gov.uk/peoplepopulationandcommunity/birthsdeathsandmarriages/deaths/methodologies/globaldatabaseofeventslanguageandtonegdeltdataqualitynote)
- A protest-data comparison found GDELT and a hand-coded series uncorrelated (r = -0.11) while another post says Arab Spring protest coding compares favourably. UNVERIFIED (snippets) — [Political Violence at a Glance](https://politicalviolenceataglance.org/?p=3680)

**Visual product**
- GDELT Analysis Service: browser tool with 14 visualisation and export tools, currently searches only GDELT 1.0. — [GDELT data](https://www.gdeltproject.org/data.html)
- GEO 2.0 API: maps any English keyword, point maps, heatmaps, country and ADM1 maps. Time window 15 minutes to 1 week. Formats HTML, GeoJSON, RSS, JSONFeed, CSV. — [GEO 2.0 API post](https://blog.gdeltproject.org/gdelt-geo-2-0-api-debuts/)
- TV News Explorer exists (blog post 28 Oct 2026). Live look at the visual tools: NOT READ.

**Accessibility**: not found.

**API, bulk, export**: raw ZIP CSV files, BigQuery (updated every 15 minutes), DOC, GEO and TV APIs, Analysis Service exports (CSV, Google Earth, Gephi). — [GDELT data](https://www.gdeltproject.org/data.html)

**Licence and terms**: "unlimited and unrestricted use for any academic, commercial, or governmental use of any kind without fee". Redistribution allowed with citation to the GDELT Project and a link to gdeltproject.org. No warranty disclaimer found on the page. — [GDELT about](https://www.gdeltproject.org/about.html)

**Pricing**: free. BigQuery costs are Google's, not read.

**Open source / alerting / accounts**: no official repo found. Alerts and personalisation: not found. No account needed for raw files.

**Forecasting**: none found.

**Adoption signals**: none read from the owner; third-party dashboards cite it (for example World Monitor says it uses GDELT for protest detection, UNVERIFIED marketing claim).

**Strengths**: scale, 15-minute freshness, free commercial use, multilingual, tone and theme graph.

**Weaknesses and criticisms**: see methodology section: duplicates, false positives, weak geolocation, not suitable for fatality counts.

**Distinctive USP**: global scale and speed at zero cost, with the GKG themes and tone layers.

**Legal or neutrality risks**: low legal risk (open terms). Source articles remain third-party copyright; GKG content licensing was NOT READ.

### Inferences (mine)
- Defcon can use GDELT only as a "media attention" or early-warning signal, always labelled as machine-coded, never as a death count. **Must not copy**: presenting auto-coded events as facts.

### Gaps
- Event schema (fatality fields), GDELT's own statement on accuracy, current funding, any recent peer-review validation beyond 2013-2014 snippets, hands-on look at the visual explorers.

---

## 4. CFR Global Conflict Tracker (Council on Foreign Relations)

### Takeaway
A small, editorial, US-policy-oriented tracker of 27 conflicts with analyst judgements (type, status, impact on the US). No data, no API, no open licence. It is more a curated briefing than an event-data platform.

### Cited Findings

**Owner and funding**
- Header reads "Published by CFR's Wachenheim Center for Peace and Security". The methodology says the Wachenheim Center for Peace and Security (WCPS) produces the Tracker with CFR experts. — [CFR tracker](https://www.cfr.org/global-conflict-tracker); [methodology](https://www.cfr.org/global-conflict-tracker/methodology), read 2026-10-29
- Older CFR pages call the producer the Center for Preventive Action and say the tracker is supported by the Sue and Edgar Wachenheim Foundation, launched 2014 from the Preventive Priorities Survey (search snippets, UNVERIFIED). A renaming is a plausible reading but I did not find it confirmed. — [CFR CPA](https://www.cfr.org/programs/center-preventive-action)

**What it measures and coverage**
- 27 conflicts in 4 regions on 2026-10-29 (Americas 4, Asia 6, Europe/Eurasia 2, MENA 8, Sub-Saharan Africa 7). Filters: type (Civil War, Criminal Violence, Interstate War, Political Instability, Sectarian, Territorial Dispute, Terrorism, Unconventional), status (Worsening, Improving, Unchanging, Developing), impact on U.S. (High, Medium, Low). — [CFR tracker](https://www.cfr.org/global-conflict-tracker), HTML read 2026-10-29
- Inclusion: level of violence, humanitarian impact or escalation risk. Archived after sustained reductions. — [methodology](https://www.cfr.org/global-conflict-tracker/methodology)

**Sources, human vs automated**: analyst-written from "monitoring developments, watch lists, conflict analyses" and government and intergovernmental reports. Status labels are "analytical judgments rather than legal determinations". — [methodology](https://www.cfr.org/global-conflict-tracker/methodology)

**Update frequency**: each conflict reviewed at least quarterly, more often for high-activity conflicts. Each entry shows a "Last Reviewed" date. (An older snippet says monthly; the live methodology says quarterly: treat the current page as correct.) The India-Pakistan page showed "Last updated: October 28, 2026", type Interstate War, impact Medium, status Unchanging. — [India-Pakistan entry](https://www.cfr.org/global-conflict-tracker/conflict/conflict-between-india-and-pakistan), read 2026-10-29

**Event granularity**: none. Entries are narrative: overview, Latest News, Background, Recent Developments, Recommended Resources, Nearby Conflicts. No fatality fields or numbers, no ranges. — same page

**Methodology transparency**: a public methodology page. No validation, no published error metrics.

**Visual product**: static HTML shows a list with filters and a search box, plus nav links "Conflict Dashboard", "Newsletters", "Methodology". Whether there is an interactive map, time travel, mobile layout or embeds: NOT READ (I read static HTML only).

**Accessibility**: not found.

**API, bulk, export**: none found.

**Licence and terms**: CFR owns content. Grants "free-of-charge access"; prohibits selling, modifying, and reproducing, displaying or distributing for public or commercial purposes. No open licence, and embedding not addressed. — [CFR terms](https://www.cfr.org/terms-use) ("Use of Materials")

**Pricing / open source / alerts**: free to read. No repo. Newsletters link exists, and its terms NOT READ.

**Forecasting**: no forecast metrics. Related annual Preventive Priorities Survey exists (PDF 2025 edition seen in search results). Details NOT READ.

**Adoption**: owner-published adoption: not found. Listed on a school library guide (low-value signal).

**Strengths**: curated, readable, rates impact on U.S. interests, frequent page refresh.

**Weaknesses**: no data, no counts, US-centric lens by design (the "Impact on U.S." column), only 27 situations, quarterly review minimum. Independent critiques: none found in my search.

**USP**: policy-maker context with a built-in "impact on U.S." rating.

**Legal or neutrality risks**: neutrality risk of a US-policy lens. India-Pakistan is listed as "Conflict Between India and Pakistan"; how its map treats Kashmir NOT READ (matters for Defcon's India-official map).

### Inferences (mine)
- CFR competes for the "I want a quick view of what matters" user, not for data users. **Do better**: numbers, sources per figure, open licence, downloadable data. **Must not copy**: an unexplained US-impact score, or all-subjective status labels with no tested method.

### Gaps
- Rendered view (map, mobile, embed), accessibility, funding amounts, independent critiques, how maps depict disputed borders.

---

## 5. International Crisis Group CrisisWatch

### Takeaway
A qualitative, analyst-written monthly tracker of 70+ situations with trend arrows and alerts, a searchable archive back to 2003, and email and PDF delivery. It has no numbers or open data. The main site is bot-protected, so some detail is NOT READ.

### Cited Findings

**Owner and funding**
- International Crisis Group. Funding mix from older or secondary sources only: Crisis Group's own site for 2012-13 gave governments 49%, institutional foundations 20%, individual and corporate donors 31%. A secondary source gave 43/31/22 for FY2019. Current mix NOT READ. UNVERIFIED (search snippets). — [search result: Crisis Group](https://crisisgroup.org/node/285)

**What it measures and coverage**
- Regular monitoring of "over 70 conflicts and crises each month" plus "standby monitoring" of over 50 more. History back to 2003. A companion product "On the Horizon" flags 3 to 6 month risks. — [CrisisWatch tracker page](https://www.crisisgroup.org/ku/crisiswatch), read via alternate route 2026-10-29

**Provenance, human vs automated**: described as qualitative, relying on Crisis Group analysts, with arrows per month and optional alerts for the next month (search snippet, UNVERIFIED). Sourcing criteria and verification of numbers: not found. — [search result](https://crisisgroup.org/node/642)

**Update frequency and latency**
- Monthly. The edition shown on 2026-10-29 was September 2026 trends with October outlook ("CrisisWatch: September Trends and October Alerts 2026"). Publication date of that edition NOT READ. — [CrisisWatch page](https://www.crisisgroup.org/ku/crisiswatch)
- September 2026: five situations deteriorated (Afghanistan, Ethiopia, Pakistan, Saudi Arabia, Yemen). Seven conflict risk alerts for October (Afghanistan, Eritrea, Ethiopia, Iran, Pakistan, Saudi Arabia, Yemen). A search snippet says none improved (UNVERIFIED). — same page

**Event granularity**: country-level monthly summaries. Older database records contain killed, injured or displaced counts in prose (GHDx records, UNVERIFIED). No coordinates, no fatality ranges. — [GHDx](https://ghdx.healthdata.org/print/139432)

**Methodology transparency**: "About" and "Using CrisisWatch" sections exist but the text was truncated and NOT READ. No validation or published bias statement found.

**Visual product**: interactive map exists with legend markers "Resolution Opportunity" and "Risk Alert", and trend colours Improved, Deteriorated, Unchanged, Standby monitoring, Not monitored. In my capture the map said "Loading Map", so I saw only the legend. Also database search by region, country and date range, share (Facebook, Twitter, email), print and PDF download, and a PDF archive. — [CrisisWatch page](https://www.crisisgroup.org/ku/crisiswatch)

**Accessibility**: not found (main page behind Cloudflare challenge; footer not read).

**API, bulk, export**: PDF and print views only. No API found.

**Licence and terms**: NOT READ (a `/ku/terms-and-conditions` guess returned 404).

**Pricing, alerting, accounts**: free. A "Subscribe" link exists (terms NOT READ). No account for reading.

**Open source**: none found.

**Forecasting**: "Risk Alert" and "Resolution Opportunity" are expert flags, not probabilities. No published accuracy numbers found.

**Adoption**: no owner-published numbers read.

**Strengths**: expert analysis, 20+ years of archive, early-warning alerts, resolution opportunities, PDF and subscription delivery.

**Weaknesses**: bot-protected site (Cloudflare challenge), monthly granularity, qualitative with no counts, no data export. Independent critique: none found. An NGO Monitor profile surfaced in search but was not read (advocacy source).

**USP**: named expert analysts with "risk alerts" and "resolution opportunities" and a 2003 archive.

**Legal or neutrality risks**: advocacy-leaning think tank with government and foundation donors (older mix above). Content copyright terms NOT READ.

### Inferences (mine)
- CrisisWatch is the closest to Defcon's "sourced timeline" in spirit. **Do better**: daily or 3-hourly freshness, data export, open licence, no bot wall. **Must not copy**: unquantified arrows with no stated criteria.

### Gaps
- Terms, accessibility statement, About and Using CrisisWatch text, edition publication date, current funding split, rendered map and mobile view.

---

## Cross-platform notes (for the scorer)

- Account wall: ACLED Explorer and CAST require a myACLED account; UCDP web app, GDELT raw files, CFR and CrisisWatch pages do not. UCDP API requires a manually issued token.
- Open data licence: only UCDP (CC BY 4.0) and GDELT (unrestricted with citation) allow redistribution. ACLED, CFR forbid it by terms. CrisisWatch terms NOT READ.
- Fatality uncertainty: only UCDP publishes low/best/high. ACLED gives one number. GDELT and CFR: no fatality fields read. CrisisWatch: prose.
- Published validation numbers for risk or forecast: none found for ACLED CAST (page says metrics published but gave none), none for CFR or CrisisWatch. ViEWS has JPR evaluations but numeric values NOT READ.
- Adjacent finding (not in scope): while trying CrisisWatch the built-in browser tab ended up on worldmonitor.app. Its own page describes a free, no-signup, AGPL-3.0 dashboard using ACLED and GDELT with 59 map layers and paid Pro from $39.99/month. All self-reported and UNVERIFIED. — [worldmonitor.app](https://www.worldmonitor.app/), read 2026-10-29. Another researcher may cover it.
