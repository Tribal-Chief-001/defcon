# Research for v1.1: landscape, data sources, gaps and direction

Written 2026-10-18. Method: web searches and page reads on that day, plus what the project already knows about itself. Every claim below is tagged where it matters: **[read]** = I read the page, **[search]** = a search result summary, **[claim]** = the project's or vendor's own marketing, **[unverified]** = could not confirm. Star counts and prices change; re-check before quoting.

## 1. The short version

- The "open-source world monitor" space is **no longer empty**. One project, **World Monitor** (`koala73/worldmonitor`, AGPL-3.0), is far ahead on breadth: GitHub shows 88.7k stars, 13.6k forks and 8,612 commits **[read]**; its site claims 469 feeds, 58 map layers, 2M+ users and a paid Pro tier **[claim]**. Competing with it on number of layers is a losing game.
- Its own pages admit what it does not do: it "aggregates published reports rather than verifying events", is "not a citable dataset", and offers no downloadable event tables **[read]**. Nothing on its pages mentions map-policy correctness, accessibility or replay/archive **[read]**.
- Defcon's real strengths are different: honest provenance labels (human-coded vs auto-coded), India-official map with tests, per-country dossiers with a source per field, a 365-day scrubber, WCAG-tested UI, a strict CSP, no tracking, and a static architecture that costs nothing to run.
- **Recommendation:** do not race on breadth. Become the **trustworthy, citable, fast and beautiful** monitor (provenance and export), add a **South Asia / multilingual lens** nobody else builds, and add a small curated set of **weak-signal indicators** (the "pizza index" idea) as the creative layer. Details in section 6.

## 2. Who is out there

| Project | What it is | Notes | Licence / cost |
|---|---|---|---|
| **World Monitor** (worldmonitor.app) | Real-time geopolitics dashboard: news feeds, conflicts, aviation, AIS, cables, markets, climate, cyber; Country Instability Index for 31 countries; AI briefs; desktop apps; MCP/REST API | Biggest by far. Stack: vanilla TS, Vite, globe.gl + deck.gl, Tauri, Vercel Edge, Upstash Redis **[read]**. Free tier $0; Pro from $39.99/month; API tiers from $99.99/month **[claim]**. Source list is on a separate docs page I did not read. | AGPL-3.0; commercial licence offered |
| **ShadowBroker** | Self-hosted geospatial dashboard, 15 to 60 live feeds, Docker | About 11.2k stars (third-party, undated) **[search]**; needs an aisstream key; no telemetry | AGPL-3.0 |
| **Crucix** | Terminal-style signals monitor (economic, market, threat), 27 sources, 15-minute refresh | **[search]** | not checked |
| **OSIRIS** | Zero-install browser OSINT dashboard (flights, CCTV, earthquakes, conflict zones, news) | OpenSky, USGS, FIRMS, GDELT, GDACS, EONET **[search]** | MIT **[search]** |
| **OSINT-War-Room**, **osint-world-monitor**, **osintmonitor** | Smaller GitHub dashboards (GDELT every 15 min, ADS-B, AIS; a Streamlit app using keyless APIs) | **[search]** | various |
| **Liveuamap** | Long-running real-time conflict map | Ad-funded, proprietary; API $150/month for 200 requests/day, Enterprise from $1,000/month **[claim, from a competitor's page]** | proprietary |
| **ACLED** | The research-grade hand-coded dataset and dashboards | Free but registration-gated; commercial use needs a paid licence; API on paid tiers **[search, secondary]** | EULA |
| **UCDP** | Academic hand-coded events, versioned and citable | What Defcon already uses | CC BY 4.0 |
| **Deep State Map**, **GeoConfirmed**, **ISW**, **ICG CrisisWatch** | Frontline map for Ukraine (manual); volunteer geolocation verification; daily narrative; monthly brief on 70+ conflicts | No public APIs found **[search]** | free, mostly no data licence |
| **Dataminr** | Enterprise real-time alerting | Hard to price: a 2022 UK procurement sheet lists First Alert from $20,000 a year **[search]**; "enterprise, quote only" | commercial |
| **GDELT Cloud** | Hosted, structured events built on the GDELT stream, hourly, API, free tier **[search]** | Docs warn data before March 2026 is spotty | commercial with free tier |
| **VIEWS** (Uppsala + PRIO) | Open conflict **forecasts**: monthly, up to 3 years ahead, country and sub-national **[search]** | The only open forecasting system found | open |
| **Pizzint Watch / Polyglobe** | "Pentagon Pizza Index": Google Popular Times at pizzerias near the Pentagon plus Polymarket odds; a 3D globe of Polymarket data **[search]** | Anonymous creators, unofficial, evidence of predictive value is mixed **[search]** | free |

## 3. Data sources worth knowing

| Source | What | Access | Verdict for Defcon |
|---|---|---|---|
| UCDP GED + candidate | Hand-coded events | Free downloads | In use. Candidate releases are monthly; the real fix for "human-coded 0 %". |
| GDELT 2.0 | Machine-coded news events, 15-minute files | Free, no key | In use. Known limits below. |
| ACLED | Hand-coded events, near-real-time, strong on protests | Registration; free Open level is aggregates only with no API; API and event data need Research level or higher; redistribution restricted **[read, see 5a]** | Ask first; aggregates-only layer at most. |
| HDX HAPI | Standardised indicators incl. ACLED-derived conflict events, daily | Free; needs an app identifier **[search]** | A possible, licence-friendlier route to ACLED-derived counts; check terms. |
| ReliefWeb API | UN OCHA reports and disasters | Free; asks for an `appname`; a secondary source says 1,000 calls/day **[search]** | Good for humanitarian context and headlines with attribution. |
| UNHCR Refugee Data Finder API | Displacement statistics | Open, no credentials **[search]** | Easy, high value "human cost" layer. |
| IOM DTM | Internal displacement | API key now required **[search]** | Maybe later. |
| WFP HungerMap Live (2026) | Hunger early warning | No API confirmed; datasets on HDX **[search]** | Via HDX. |
| USGS, GDACS, NASA EONET, NASA FIRMS | Earthquakes, disasters, fires | FIRMS needs a free key; others keyless **[search]** | Cheap hazard layer; FIRMS near conflict zones is a classic OSINT signal. |
| OpenSky, aisstream.io, CelesTrak | Aircraft, ships (free key), satellites (no key) **[search]** | Free with limits | Optional; heavy and not core to conflict. |
| Cloudflare Radar API, IODA | Internet outages and shutdowns | Cloudflare needs an API token; terms not confirmed **[search]** | Strong, underused conflict indicator. |
| Polymarket Gamma / CLOB / Data APIs | Market odds | Public, read-only, no auth **[search]** | Possible context layer. See risks. |
| OpenSanctions | Sanctions and persons of interest | **CC BY-NC**; commercial needs a licence **[search]** | Non-commercial only; skip unless the project stays non-commercial. |
| News APIs (GNews, NewsData, NewsAPI, Mediastack) | Headlines | Free tiers delayed 12 to 24 h, some non-commercial only **[search]** | Not useful for "live"; GDELT (15 min) and RSS are better. |

**GDELT's limits (important for honesty):** a study of automated event data found only about 21 % of valid GDELT protest URLs indicated a true protest event, with high duplication **[search]**; the UK Office for National Statistics notes "significant concerns" about its quality **[search]**; a 2026 preprint reports an English-language bias that under-indexes local-language conflict reporting **[search]**. Defcon already caps auto-coded severity at 3 and labels rings; the next step is to say more about confidence (section 6).

## 4. What the evidence says people lack

1. **Verification and provenance.** World Monitor says it does not verify events **[read]**; OSINT practitioners rely on manual geolocation, chronolocation and satellite imagery, and say rural strikes with few landmarks are very hard to verify, while commercial imagery access has become delayed in some regions **[search]**. A monitor that shows *how much to trust each dot* is rare.
2. **Citable, downloadable data.** World Monitor concedes it produces no downloadable event tables and is not a citable dataset **[read]**. Researchers and journalists need exports with source and licence.
3. **Local-language and regional depth.** GDELT is English-skewed; countries with less media access are under-coded in ACLED-style data **[search]**; a South Asia dataset like SATP depends on English-language press for Pakistan **[search]**.
4. **Map-policy correctness.** The big map platforms (Google, Mapbox, HERE) offer per-country "worldviews" for disputed borders **[search]**; none of the open-source world monitors I read mention the issue. For an Indian audience this is a real trust issue.
5. **Alerts that are not just by country.** World Monitor says its alerts are scoped by country, not by a radius around a place **[read]**.
6. **Access without a paywall.** Programmatic access to the leading open-source monitor needs a paid key **[read]**; the commercial tools cost thousands of dollars a year.
7. **Weak signals and markets in one place.** The pizza-index sites show strong public appetite for quirky proxy indicators and Polymarket odds, but they are single-purpose and anonymous **[search]**.

Not found: community criticism (Hacker News, Reddit) of World Monitor; user research on what newsrooms or NGOs actually pay for. Treat points 1 to 7 as informed hypotheses, not validated demand.

## 5. Gaps ranked by value and effort

| # | Gap | Why it is real | Effort | Fit |
|---|---|---|---|---|
| A | **Per-event evidence trail and confidence** (how many reports merged, how many distinct sources, links to originals, a simple confidence tier) | Nobody shows it; Defcon already stores merged ids and sources | Low to medium | Core identity: honesty |
| B | **Open exports and a free static API** (daily GeoJSON, NDJSON and CSV with licences; permalinks for a moment in time `#t=`) | Competitors paywall or lack it; static files cost nothing | Low | Citable, shareable |
| C | **Shareable moments**: screenshot/GIF export, "story mode" playback of a week, embed widget | Showcase + virality; the scrubber and Night Watch already exist | Medium | Creative |
| D | **South Asia / multilingual lens**: curated local-language RSS (Hindi, Urdu, Bengali, Nepali, Sinhala, Tamil...), a regional view and dossier section | Real data gap, matches the audience and the map policy | Medium to high | Differentiator |
| E | **Indicators desk** (pizza-index style): internet outages, FIRMS fires near conflict zones, earthquakes, Polymarket odds as read-only context, each with source and age | Cheap public APIs; viral appeal | Medium | Creative layer |
| F | **Human-cost layer**: UNHCR displacement, hunger via HDX, outbreaks | Open APIs; adds meaning beyond "events" | Low to medium | Depth |
| G | **Newer human-coded data** (UCDP candidate monthly; HDX HAPI or ACLED if the licence allows) | Fixes the "0 % human-coded" number | Low to medium | Data quality |
| H | **Radius and watchlist alerts** with no backend (client-side, Atom/RSS feed per country) | Competitor admits country-only | Medium | Utility |
| I | **Forecast layer** from VIEWS, clearly separated from observed events | Only open forecasting system; check licence and format | Medium to high | Novel, but needs care |
| J | **Explainers instead of AI slop**: every number has a "how this is computed" popover; optional local-model summaries with citations only | Accuracy risk and cost of LLM features; trust is the product | Low | Identity |

## 5a. ACLED in detail (pages read 2026-10-18)

ACLED = Armed Conflict Location & Event Data: hand-coded, near-real-time events (weekly updates), strong on protests and riots. Terms were read from acleddata.com: the EULA (updated 8 July 2025), the myACLED FAQ, the API pages, the Attribution Policy and the Content Usage Terms.

**Access.** Register at acleddata.com/user/register. The level depends on the email domain: a public address (gmail.com) gets **Open** access: *aggregated* data grouped by administrative unit, **no API**. Research, Partner and Enterprise levels add the API and event-level data (Research is lagged; Partner weekly; Enterprise unlimited and expedited). The FAQ asks for an institutional email; the length of the lag, any row caps and prices are **not stated**. The API (base `https://acleddata.com/api/`) uses OAuth with the account's own username and password (token 24 h, refresh 14 days); the old key-and-email system is retired; JSON/CSV/XML, 5,000 rows by default; page-based paging is deprecated from 27 Oct 2026 in favour of a cursor. Rate-limit numbers are not stated. A static site cannot call it from the browser: it would need a build-time fetch with credentials kept as a secret.

**What the licence allows (EULA 3.1/3.3, my reading).** A non-exclusive licence to publish materials that incorporate ACLED content for **non-commercial** purposes, but external materials must be **transformative** ("cannot be reverse engineered to recreate the Licensed Content"). It is "not sufficient" that content is excerpted, reorganised or "made available through Licensee's own dashboard", and the licensee must not allow direct access to the Licensed Content except via derivative materials. Content is treated as confidential for internal use. Scraping is prohibited; downloading via the platform or API is allowed. Termination requires deleting the content and what was made from it unless ACLED agrees otherwise. Prohibited: building a product that competes with or substitutes for ACLED, benchmarking such a product, sharing credentials, AI/ML/LLM uses that substitute for ACLED or give access to its data, commercial use without a corporate licence, using the logo without permission. Required attribution: "ACLED (Armed Conflict Location & Event Data)", a citation on the visual itself, access date, filters and what was changed; academic uses cite Raleigh, Kishi and Linke (2023), doi 10.1057/s41599-023-01559-4. **Not stated:** whether a non-commercial open-source site may commit derived JSON to a public repo, and whether any media/non-profit exception exists. The Attribution Policy says to contact ACLED for uses it does not describe.

**What this means for Defcon.** Showing ACLED events as individual dots in a public, open-source world monitor (which is also a dashboard of conflict events) is very likely **outside** what the licence allows without ACLED's written agreement, and committing per-event ACLED data to the public repo is likely not allowed. What probably fits "transformative" is **aggregates that cannot be reversed into events** (for example counts of events by country or admin-1 unit per month and type, as a heat or intensity layer), with the required citation on the visual. Even that needs API-level access, which a gmail account will not get. **The right first step is to ask ACLED**, explaining the project is non-commercial, open source, shows only aggregates and credits ACLED on the visual. HDX HAPI also exposes conflict-event data (an endpoint named `coordination-context/conflict-events` exists, daily from the changelog), but its source, granularity and licence could not be read (pages returned 403); read its Terms of Use in a browser before planning on it.

**Update 2026-10-18 (owner's myACLED account, Open level): ACLED is closed for v1.1.** The owner registered with a gmail address and the API call returned "Access denied". The myACLED FAQ (read the same day) lists the API only for Research, Partner and Enterprise levels, and the level follows the email domain, so Open has no API (inferred from a blank table cell; ACLED never mentions a 403). Combined with the EULA limits above, ACLED is not an input to the index or the globe. Reopen only if the owner wants a Research-level licence and written permission.

## 5b. Priority list (top 12 after adding the Instability Index)

*Item 1 below is closed (see the update above); the live order is in `BRAINSTORM-v1.1.md` section 4.*

1. **ACLED**: phase 0 (no code, the owner): email ACLED to ask for access and written permission for an aggregates-only layer; phase 1 (only if the answer is yes): build-time fetch with secrets, monthly aggregates by country/admin-1/event type, a heat/intensity layer with the citation on the visual, no per-event ACLED data in git. If the answer is no: skip, nothing is lost.
2. **Defcon Instability Index** (flagship, the owner likes World Monitor's CII): an empirical, backtested, all-countries, uncertainty-aware score with separate Risk / Momentum / Activity-now constructs; full design in `docs/INSTABILITY-INDEX.md`. First step is a data and baseline study, not UI.
3. **Newer human-coded data** (UCDP candidate releases, CC BY 4.0, clearly allowed): fixes "human-coded 0 %" (also an input to the index).
4. **Evidence trail and confidence on every event.**
5. **Open exports and a free static API** (of our own derived data only, never ACLED event data).
6. **Moment permalinks and share/screenshot.**
7. **"How this number is computed" popovers and fairer Hotspots.**
8. **Human-cost layer** (UNHCR displacement, hunger via HDX).
9. **South Asia lens MVP** (local-language sources, regional view).
10. **Indicators desk MVP** (keyless indicators first).
11. **Radius and watchlist alerts** (no backend).
12. **Story mode** (week playback with captions, GIF/video export).

## 6. Directions (pick one base, borrow from the others)

1. **"The honest monitor" (recommended base).** A, B, G, J, then C. Positioning: *the monitor you can cite*. Small, fast, accessible, no tracking, free data files. This is the thing World Monitor cannot easily copy because its strength is breadth.
2. **"South Asia lens" (recommended differentiator).** D plus F and parts of A. Positioning: *the conflict monitor that reads the region's own languages and draws the region's own map*. Works for an Indian owner and audience, and fills a documented data gap.
3. **"Signals desk" (creative, optional).** E (plus I later). Positioning: *weak signals in one glass panel*. Keep it small, labelled "context, not prediction", and never present market odds as facts.

Not recommended: chasing 50+ layers, an AI chat as the headline feature, a paid API, trading or token features.

## 7. Suggested v1.1 sequence

1. **Evidence trail and confidence tiers** (A) + **newer human-coded data** (G).
2. **Open exports and moment permalinks** (B).
3. **Human-cost layer** (F: UNHCR first, it is open and keyless) and **an indicators desk MVP** (E: internet outages and fires first).
4. **Shareable moments** (C).
5. **South Asia lens** (D) as the v1.2 headline once the pipeline can carry multilingual sources.

Each step follows the usual protocol: a short plan, TDD, a fresh Sonnet review, merge.

## 8. Risks and constraints

- **Licences:** ACLED redistribution needs its licence (the repo is public); OpenSanctions is non-commercial; Vercel Hobby is for non-commercial use; Cloudflare, FIRMS, aisstream and DTM need keys (never commit them); WFP and others vary. Check each before ingesting.
- **AGPL:** World Monitor and ShadowBroker are AGPL. Defcon is MIT: **do not copy their code**; learn from public descriptions only.
- **Prediction markets:** January and February 2026 reporting describes suspected insider trading around geopolitical markets, regulatory pushback (Kalshi refunds, proposed restrictions) and an offshore exchange **[search]**. Show odds as read-only context, with age and a disclaimer, never as a recommendation or a trading link.
- **Scraping:** no scraping of Liveuamap, Telegram, or Google Popular Times (the pizza index scrapes it); respect each site's terms.
- **Cost:** more data means more Actions minutes (free on a public repo) and larger snapshots; the JS budget (250 KB) and the 11 MB event shards are the real limits.
- **Accuracy:** novel events with no baseline are an unsolved problem even for the top monitor (its author says so **[search]**); LLM forecasting has known knowledge gaps across conflict zones **[search]**. Label everything by method.

## 9. What I could not verify

- Whether the star counts of World Monitor differ by source (41k, 59k, 65k, 88.7k) only because of dates; the GitHub page figure is the only one I read directly.
- World Monitor's full source list (the data-sources docs page was not read) and its real data licences.
- ACLED's current 2026 access terms, HDX HAPI quotas, Cloudflare Radar's free-tier terms, ReliefWeb's current quota, Dataminr's real price.
- Any Hacker News or Reddit discussion of these tools; any user research.

## Sources

- World Monitor: [GitHub](https://github.com/koala73/worldmonitor), [site](https://www.worldmonitor.app/), [vs ACLED](https://www.worldmonitor.app/compare/worldmonitor-vs-acled/), [Liveuamap alternatives](https://www.worldmonitor.app/compare/liveuamap-alternatives/), [interview coverage](https://siliconcanals.com/sc-n-anghami-ceos-side-project-world-monitor-now-has-2-million-users-tracking-conflicts-in-real-time/)
- Open-source peers: [ShadowBroker](https://github.com/bigbodycobain/shadowbroker), [OSIRIS](https://github.com/simplifaisoul/osiris), [OSINT-War-Room](https://github.com/Hue-Jhan/OSINT-War-Room), [osint-world-monitor](https://github.com/arkadipbasu/osint-world-monitor), [stack overview](https://themenonlab.blog/blog/osint-shadowbroker-crucix-thinkcreate-intel-stack)
- Pizza index: [Pizzint Watch](https://pm.wiki/projects/pizzint-watch), [Polyglobe](https://pizza.mountainguan.tech/about/polyglobe)
- Data: [ACLED EULA](https://acleddata.com/eula), [HDX HAPI](https://data.humdata.org/hapi), [ReliefWeb API](https://reliefweb.int/blogpost/reliefweb-api-documentation-revamped), [UNHCR API](https://www.unhcr.org/refugee-statistics/insights/explainers/forcibly-displaced-api.html), [IOM DTM API](https://dtmapi.readthedocs.io/en/latest/), [Polymarket docs](https://docs.polymarket.com/getting-started/api), [OpenSanctions](https://www.opensanctions.org/docs/about/), [Cloudflare Radar](https://blog.cloudflare.com/announcing-cloudflare-radar-outage-center), [GDELT Cloud](https://gdeltcloud.com/compare), [VIEWS](https://www.uu.se/en/news/2018/2018-06-04-first-open-system-providing-warning-of-conflicts)
- Quality and bias: [GDELT cautions](https://politicalviolenceataglance.org/2014/02/20/raining-on-the-parade-some-cautions-regarding-the-global-database-of-events-language-and-tone-dataset/), [ONS data quality note](https://www.ons.gov.uk/peoplepopulationandcommunity/birthsdeathsandmarriages/deaths/methodologies/globaldatabaseofeventslanguageandtonegdeltdataqualitynote), [LLM forecasting limits (arXiv)](https://arxiv.org/pdf/2607.00018), [verification practice](https://datajournalism.com/read/newsletters/navigating-the-russia-ukraine-war-with-osint-technologies)
- Maps: [Mapbox worldviews](https://blog.mapbox.com/dynamically-change-disputed-national-borders-14c820cae923), [HERE](https://docs.here.com/maps-api-for-js/docs/customize-your-map)
- Prediction markets: [Fortune](https://dc.fortune.com/2026/04/02/prediction-markets-insider-trading)
- Pricing: [Dataminr (Capterra)](https://www.capterra.com/p/201153/Dataminr/)
