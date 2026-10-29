# Live OSINT / conflict-map dashboards: competitor profiles for Defcon

Read date for everything below: 2026-10-29 unless a different date is given. Method: WebFetch, WebSearch, GitHub API via `gh`, and one live look at worldmonitor.app in the in-app browser. Labels: **READ** = I fetched the page myself; **SNIPPET** = only a search-result summary; **UNVERIFIED** = memory or a single vendor-adjacent source; **NOT READ** = blocked or not fetched. Quotes are under 25 words.

Blocked or unreadable during this run (so Liveuamap, ISW and Global Incident Map profiles lean on secondary sources): liveuamap.com and ukraine.liveuamap.com (HTTP 403, then a Cloudflare "Just a moment" bot check in the browser pane), liveuamap.com/about (403), understandingwar.org/map (403), criticalthreats.org (403), deepstatemap.live (page returned only a loader/error shell), globalincidentmap.com (302 to a tollbit page that returned HTTP 402 Payment Required), dou.ua (403), web.archive.org (tool refuses), en.wikipedia DeepStateMap.live (404).

Defcon reference points used for the "inference" paragraphs (from the task brief, not re-verified): free, MIT/CC BY, no account, static JSON every 3 h, custom 3D globe, human-coded UCDP deaths with low-high ranges, sourced timeline, per-country Fatality Index and Violence Risk Index with published backtest, War room, FIRMS, UNHCR, CSV, India-official map.

---

## 1. Liveuamap (Live Universal Awareness Map)

### Takeaway
Liveuamap is the best-known consumer conflict map (founded 2014): a human-confirmed, event-pin news map on a flat map, ad-funded with a paid app tier and a paid API. It shows each event with a source link but no uncertainty range, no scores, and no open data. The product site is bot-walled, so UI details are NOT READ first-hand.

### Cited Findings
**Owner and funding**
- Founded by Ukrainian software engineers Rodion Rozhkovskiy and Oleksandr Bilchenko from Dnipro; site launched 18 Feb 2014 — [Wikipedia Liveuamap](https://en.wikipedia.org/wiki/Liveuamap) (READ 2026-10-29).
- MBFC says the site calls itself an NGO that "cooperates with multiple governments worldwide", gives no named owner, lists advertising as revenue, country USA — [MBFC](https://mediabiasfactcheck.com/live-universal-awareness-map-bias/) (READ; review last updated 14 Mar 2025).
- App Store seller is Altwork LLC, copyright line "Liveuamap LLC" — [App Store AU](https://apps.apple.com/au/app/liveuamap/id1003808504) (READ). Self-description as "nonprofit, volunteer-run" civic journalism appears in one search summary only — [search summary of NonprofitQuarterly/others](https://nonprofitquarterly.org/citizen-journalists-collaboratively-map-conflict-in-ukraine/) (SNIPPET; likely old, conflicts with the ad-funded LLC structure above).

**Coverage**
- Ukraine/Russia, Syria, Yemen, Arab-Israeli conflict and others, with regional sub-maps; users cited include UN, MSF, NZZ, The Guardian — [Wikipedia](https://en.wikipedia.org/wiki/Liveuamap). Also protests, disasters, weather — [World Monitor comparison page](https://www.worldmonitor.app/compare/worldmonitor-vs-liveuamap/) (competitor-authored, see bias note).

**Data sources, provenance, verification**
- Algorithms filter and correlate geolocated social posts and score authors by history, activity and follows. Once thresholds are passed, at least two Liveuamap members must confirm an event before it appears; satellite imagery and official statements are also used — [Wikipedia](https://en.wikipedia.org/wiki/Liveuamap). The EU open data portal describes "AI web crawlers" plus expert fact-checking — [data.europa.eu](https://data.europa.eu/en/news/live-universal-awareness-map-displays-events-related-russias-invasion-ukraine) (SNIPPET).
- Model: hybrid automated + human (two-person confirmation). Crowd input is not described in what I read.

**Latency, event model, geo precision**
- "Real-time" per a third-party mapping guide; no continuous front-line polygon, point events only — [ukraine-war-analytics.com](https://ukraine-war-analytics.com/analysis/frontline-mapping-methods.html) (READ; article dated 19 Feb 2026, updated 23 Feb 2026). Newest item on 2026-10-29: NOT READ (bot wall). Geo precision per event: NOT READ.

**Editorial and neutrality**
- MBFC: "Least Biased", "Mostly Factual (2.2)", no failed fact checks, but some sources cannot be verified — [MBFC](https://mediabiasfactcheck.com/live-universal-awareness-map-bias/).
- Third-party guide: relies heavily on unverified sources, cross-check — [ukraine-war-analytics.com](https://ukraine-war-analytics.com/analysis/frontline-mapping-methods.html). A Hacker News comment calls it reposted tweets; that is anecdotal — [HN thread](https://news.ycombinator.com/threads?id=al00sh) (SNIPPET).
- Early error: 2014 MH-17 first reported as a different aircraft, then corrected — search summary only (UNVERIFIED). Crimea/Russia map-policy controversy: no source found. I found no formal accuracy study.

**Uncertainty shown to users**
- Not found. No confidence score or ranges seen in any source; the per-event model is a pin with source link (inferred from the sources above; not verified in the UI).

**Visual product, accessibility**
- Flat map, regional sub-sites, iOS app (3.0.67, 70.1 MB, English only, News category, 18+, contains advertising) — [App Store AU](https://apps.apple.com/au/app/liveuamap/id1003808504). Globe, time travel, filters, charts, embeds, dark mode, accessibility: NOT READ. Archives let users see how a map changed over time — [Wikipedia](https://en.wikipedia.org/wiki/Liveuamap).

**Accounts, paywalls, ads, tracking**
- App is free with ads; subscriptions remove ads and unlock extra map features. AU App Store prices read today: $2.99 monthly, $14.99 half-year. Adapty lists $1.99 and $10.49, which I could not confirm (different region or date) — [App Store AU](https://apps.apple.com/au/app/liveuamap/id1003808504); [Adapty](https://adapty.io/paywall-library/liveuamap/) (SNIPPET).
- Privacy labels (developer-declared): third-party advertising uses Device ID; app functionality uses precise and coarse location, email and device ID; analytics uses crash data — [App Store AU](https://apps.apple.com/au/app/liveuamap/id1003808504).
- Free web map: ad-funded, no signup, recent events free, older history needs PRO — [World Monitor comparison page](https://www.worldmonitor.app/compare/worldmonitor-vs-liveuamap/) (competitor-authored; UNVERIFIED by me).
- App Store rating 2.5/5 from 16 ratings (AU storefront today). Adapty snippet showed 2.8-2.9 with 181-232 ratings; reviews summarised as complaining about intrusive ads and non-working premium — [Adapty](https://adapty.io/paywall-library/liveuamap/) (SNIPPET).

**API, licence, pricing**
- Paid API: Pro $150/month for 200 requests/day, Enterprise from $1,000/month for 1,500 requests/day, as read by World Monitor on 5 Sep 2026 from liveuamap.com/promo/api — [World Monitor comparison page](https://www.worldmonitor.app/compare/worldmonitor-vs-liveuamap/) (UNVERIFIED, competitor-authored). No open data, no open-source repo found. Terms page: NOT READ.

**Alerting, forecasting, languages, adoption**
- Alerts: app push notifications are implied by a news app but I did not read them; NOT READ. Forecasting/risk score: none found. Languages: app English only (App Store); the web site has multiple languages per memory, UNVERIFIED.
- Adoption: no published user numbers found. Cited by UN, MSF, NZZ, Guardian (Wikipedia). Competitor concedes "a decade of audience familiarity" — [World Monitor comparison](https://www.worldmonitor.app/compare/worldmonitor-vs-liveuamap/).

**Strengths (fair):** longest-running brand, two-person confirmation rule, per-event source links, many regional maps, a dated archive, MBFC "least biased".
**Documented weaknesses:** unverified-source reliance (guide, MBFC), no front-line polygon, ad-heavy low-rated app, paywalled history and API, no ranges/confidence, opaque ownership.
**Legal/ToS risk:** I did not read their terms. Scraping is bot-walled, so any reuse needs the paid API.

### Inferences
- What a new project could do better or must not copy (inference): Defcon should not copy ad-funded monetisation and opaque ownership. It can beat Liveuamap on stated uncertainty (ranges), public method, open exports, and no tracking. Liveuamap wins on real-time latency (minutes vs a 3-hour build) and breadth of cities and minor incidents, so Defcon should not claim to be live; it should say "updated every 3 hours".

### Gaps
- Home page content, newest event timestamp, UI features, terms, accessibility, current ownership: blocked (403/Cloudflare). A manual browser visit is needed.

---

## 2. World Monitor (worldmonitor.app)

### Takeaway
World Monitor is by far the biggest look-alike: free no-signup, AGPL-3.0, ~89.7k GitHub stars, 59 layers, 468 news feeds, 31-country "Country Instability Index" (CII) with an open, formula-level methodology that is explicitly editorial and not validated. Its forecast accuracy scorecard was withdrawn under audit as of today. It is a breadth-first, AI-flavoured, freemium product; Defcon's depth (human-coded deaths, ranges, backtest) is where it is weakest.

### Cited Findings
**Owner and funding**
- Creator Elie Habib (CEO of Anghami); built January 2026; copyright "2024-2026 Elie Habib" — [GitHub repo](https://github.com/koala73/worldmonitor) (READ); [Entrepreneur ME](https://mena.entrepreneur.com/business-news/how-elie-habib-built-world-monitor-to-track-global-events-in-real-time) (SNIPPET); [AFP via Philstar, 16 Mar 2026](https://www.philstar.com/lifestyle/gadgets/2026/03/16/2514729/gods-view-rise-ai-war-dashboards) (READ).
- Funding: freemium subscriptions, API plans, enterprise; reported "no adverts" because Habib does not want to profit from conflict — [Mean.ceo summary](https://blog.mean.ceo/?p=2997) (SNIPPET); pricing below (READ).

**Coverage**
- Global dashboard: 59 map layers, 468 news and OSINT feeds, 779 attributed providers, 5 "independent alert origins", 28 languages, 13 chokepoints, 98 subsea cables, 313 AI datacentres, markets and macro, aviation, maritime, cyber — [homepage](https://www.worldmonitor.app) (READ 2026-10-29; self-reported; page stamped "as of 26 October 2026").
- Variants: world, tech, finance, commodity, happy, energy — [GitHub](https://github.com/koala73/worldmonitor).

**Country Instability Index, what the score is made of** — [CII methodology](https://www.worldmonitor.app/docs/methodology/cii-risk-scores.md) (READ; methodology_version v14, dated 2026-10-21)
- 0-100 `combinedScore` for **31 Tier-1 countries only** (curated). A separate Country Resilience Index covers 196 (the homepage text elsewhere says 170 for resilience rankings; inconsistent).
- `composite = baseline x 0.4 + eventScore x 0.6 + boosts`, clamped to a floor.
- `eventScore = U x 0.25 + C x 0.30 + S x 0.20 + I x 0.25`: Unrest (ACLED protests/riots, outages), Conflict (ACLED battles/explosions/civilian violence, Israel OREF alerts), Security (foreign military flights/vessels, GPS jamming, aviation disruption), Information (weighted classified headlines).
- Baseline is a hand-set number per country (e.g. UA 50, SY 50, IN 20, US 5) with a hand-set event multiplier (e.g. KP 3.0, US 0.3).
- Boosts, each capped: climate 15, fire 8, advisory 15, displacement 20, earthquake 25, sanctions 14, AIS 10, strike pressure 10, news urgency 5, cross-border arrivals 5. Cyber boost removed in v14.
- Floors: UCDP war-level 70 / minor 50; US State Dept "do not travel" 60, "reconsider" 50; strike floor up to 70.
- "Weights are editorial, not empirical." Page reports no formal backtest or accuracy statistic. It states the score is "a triage tool, not a forecast".
- Production caveat on the page: ACLED is not accessible, so GDELT media-derived terms substitute and "carry much of" the Conflict/Unrest signal; UCDP input is limited to a 2,000-event retention from a 365-day slice; Gaza text routes to Israel with no separate score.
- Blog (Habib, 30 May 2026, updated 1 Sep 2026) calls the weights "an editorial judgment", gives five bands Low 0-30 to Critical 81-100, and says it makes no accuracy claims — [blog](https://www.worldmonitor.app/blog/posts/country-instability-index-methodology-explained/) (READ). Update cadence: "continuously" in body, "roughly every eight minutes" in the FAQ (same post).
- Older docs describe a v8 (and earlier a three-component 40/30/30) model; docs conflict across pages and mirrors, so cite v14 only — [search summary](https://worldmonitor.app/docs/country-instability-index) (SNIPPET).
- Strategic Risk dial: weighted top-5 average, banded to 15-85 — CII page.

**Data sources, provenance, human vs automated**
- Mostly automated seeders into Redis caches; Telegram treated as "raw OSINT leads, not endorsed truth"; some human-reviewed inputs; AI classifier for strike extraction. Source tiers rank editorial reliability, not truth; state-affiliated sources included with risk tags — [data-sources doc](https://www.worldmonitor.app/docs/data-sources) (READ).
- Documented lag: UCDP annual release about 7 months, monthly candidate about 1 month; displacement about 3 weeks late; a freshness tracker labels sources fresh (<15 min), stale (2 h), very stale (6 h). GPS jamming inferred from ADS-B anomalies. Missing data is "shown as unavailable rather than zero" (same page).
- Some data licences restrict reuse: airplanes.live and adsb.fi non-commercial; OpenSky excluded from API outputs; SIPRI derived aggregates only (data-sources doc; [pricing](https://www.worldmonitor.app/pricing.md)).

**Latency**
- Free tier refresh "typically every 5-15 minutes" — [pricing](https://www.worldmonitor.app/pricing.md). On 2026-10-29 09:46 UTC the dashboard header showed that live time; the newest news item on the home page was a 25 Oct 2026 Euronews piece (homepage). In my browser read, the "Country Instability" panel was labelled CACHED and "Strategic risk overview" showed "CACHED · 7/40 sources" (live dashboard, 2026-10-29), i.e. at least in that session it was running on cache and partial sources.

**Event model and geo precision**
- Layers of many types, not one unified event record; per-country scores attribute coordinates using Natural Earth 1:50m borders, approximate within about 2 km of borders (CII page). Unit of analysis is country, not event.

**Verification and editorial policy**
- No human editorial line for the score; AI briefs and "scenarios" are generated. AFP/experts flagged hallucination risk and unconfirmed pins (e.g. an unconfirmed drone strike pin) — [AFP via Philstar](https://www.philstar.com/lifestyle/gadgets/2026/03/16/2514729/gods-view-rise-ai-war-dashboards) (READ).

**Neutrality / map policy**
- No map-policy statement found for borders or disputed territory (NOT READ for Kashmir/India-China handling; Defcon's India-official map would be a point of difference but I cannot confirm WM's stance).

**Uncertainty shown to users**
- Degradation flags `degraded` and `stale` in the API; bands; 24-hour delta; no confidence interval on CII (CII page). The scorecard for AI forecasts is withdrawn: audit open since 2026-10-07 found three scoring errors; 11 of 17 resolved published forecasts since 8 Oct were VOID (64.7%); 120 forecasts voided — [Accuracy page](https://www.worldmonitor.app/accuracy) (READ 2026-10-29). That page reports no backtest and no CII validation.

**Visual product (seen live 2026-10-29)**
- 2D/3D toggle (globe.gl + deck.gl/MapLibre per README), workspace chooser (Crisis Desk, Supply-Chain Risk, Energy Security, News Seeker, Stock Geek, Tech/AI Watcher, Good News Explorer, Country Watcher), panels (Live News 85 streams, Live Webcams 22, AI Insights, Threat Timeline, AI Strategic Posture, AI Forecasts, Country Instability, Strategic Risk Overview), Cmd-K search, URL-encoded layer/time-range state (`timeRange=7d`), dark theme, footer "V2.11.6". An "Upgrade to Pro" banner and a "Sign In" button are visible. Page loaded slowly on my 4-core laptop pane; I did not measure performance. Accessibility: NOT READ (dark-only theme observed; no audit found).

**Accounts, paywalls, ads, tracking, privacy**
- Free, no signup for the dashboard; free MCP calls need a free account. No ads reported (Mean.ceo, SNIPPET). Privacy/tracking policy: not described on the data-sources page; NOT READ elsewhere.

**API, export, open data**
- REST API, MCP server (99 tools per homepage), SDKs (Python, Ruby, Go, JS), CSV/JSON/PDF export only in Pro Business and above — [pricing](https://www.worldmonitor.app/pricing.md).

**Licence and pricing**
- Code AGPL-3.0; commercial licence offered; private-source or official branding needs permission — [GitHub](https://github.com/koala73/worldmonitor). Subscription licences are separate from source licences.
- Tiers (pricing.md, READ): Free $0 (all layers except Resilience; 3 dashboard tabs; refresh 5-15 min). Pro $39.99/mo or $359.99/yr (AI analyst, scenario engine, Resilience layer, digests). Pro Business $49.99/$449.99 (adds CSV/JSON/PDF export). API Starter $99.99/mo (1,000 req/day, internal use). API Business $299.99/mo (redistribution R1-R3). Enterprise custom (SSO, on-prem, white-label).

**Open-source status**
- koala73/worldmonitor: 89,739 stars, 13,820 forks, 342 open issues, AGPL-3.0, created 2026-01-08, last push 2026-10-29T09:41Z — `gh api repos/koala73/worldmonitor` (READ 2026-10-29). Many forks and clones exist (e.g. gklps/worldmonitor-palantir, SNIPPET).

**Alerting, forecasting**
- Breaking alerts, watchlists on the free tier; digests to Slack/Discord/Telegram/email/webhook on Pro; "AI Forecasts" panel (showed 0 live in my read); CII is explicitly not a forecast — pricing.md; CII page.

**Languages and adoption**
- 28 languages (homepage). "2M+ users" self-reported (homepage); press: 4.4 million visits since January (AFP via Philstar, March 2026), listed in coverage by WIRED (homepage badge), L'Orient Today, Entrepreneur ME (SNIPPET). Desktop apps (Tauri) and PWA (GitHub).

**Strengths (fair):** transparent, formula-level CII, public changelog culture (versioned formulas), huge feature breadth, free tier is generous, strong momentum (stars/forks daily push), documents source limits unusually honestly (provenance page), API/MCP ecosystem.
**Documented weaknesses:** CII has no validation; weights editorial; only 31 countries; depends on GDELT because ACLED access is not available; forecast scorecard withdrawn and mostly VOID; docs and counts internally inconsistent (170 vs 196, CII v8 vs v14); AFP/experts flag reliability and hallucination risk; free tier limits (3 tabs); AI-heavy summaries; onboarding upsell.
**Legal/ToS risk:** AGPL network-use clause obliges source release if Defcon ever copied code; some upstream data is non-commercial; Polymarket and Telegram scraping carry ToS exposure (data-sources doc).

### Inferences
- What a new project could do better or must not copy (inference): Do not copy a score with undocumented validity or an AI forecast panel with a broken scorecard; do not mix unrelated domains (markets, datacentres) into a conflict score. Defcon's published backtest, UCDP-coded deaths with ranges, and free CSV export are clear differentiators against a product whose own page says "editorial, not empirical". Do copy: formula-level methodology page with version numbers and a changelog, honest per-source lag labels and freshness states. Defcon must also expect the question "why not just use World Monitor?" and answer it with depth, validation and neutrality rather than layer count. A static, no-tracking, MIT build is easier to reuse than AGPL.

### Gaps
- India/Kashmir/disputed-border handling, accessibility, privacy policy, performance numbers, exact countries in the free instability panel: NOT READ.
- Whether the live CII uses ACLED today: page says unavailable, but the pricing/homepage list ACLED as a provider; unresolved.

---

## 3. ISW / Critical Threats Project interactive maps (Institute for the Study of War)

### Takeaway
ISW is a hawkish-leaning, defence-industry-funded think tank whose daily "assessed control of terrain" maps are the most-republished analyst maps of the Ukraine war (Reuters, BBC, NYT, FT, Guardian in 2022). Map pages were bot-blocked here, so product details are mostly from Wikipedia and secondary guides.

### Cited Findings
- Owner: ISW, a 501(c)(3) in Washington DC founded 2007 by Kimberly Kagan. Funders have included General Dynamics, Raytheon, CACI and DynCorp per a 2015 journal article cited on the page — [Wikipedia ISW](https://en.wikipedia.org/wiki/Institute_for_the_Study_of_War) (READ; the page text was only 100k of 179k characters read). Critical Threats Project is a related project; not covered by the Wikipedia text I read.
- Bias criticism: described as "hawkish" by Politico, Time, Wired, Vox and The Guardian; "neoconservative" by several writers — same Wikipedia page.
- Maps: Daily Russian Offensive Campaign Assessments with maps since Feb 2022; the interactive map "is updated daily alongside the static maps" and the time-lapse archive monthly; desktop recommended over phone — [search summary of criticalthreats.org pages](https://www.criticalthreats.org/analysis/ukraine-invasion-updates-ctp) (SNIPPET). Latest assessment found: 1 Aug 2026 report (SNIPPET); I could not read the newest-day map on 2026-10-29 (NOT READ).
- Method: map shows "assessed" Russian control and separates it from "claimed" or advancing areas; built from official statements, social media and geolocated media — [ukraine-war-analytics.com](https://ukraine-war-analytics.com/analysis/frontline-mapping-methods.html) (READ; 19 Feb 2026). Same guide: conservative, slower to show Ukrainian gains, daily latency; critics see a pessimistic bias.
- Tooling: ArcGIS StoryMaps used for campaign-specific interactive maps (e.g. Kursk) — [ArcGIS story](https://storymaps.arcgis.com/stories/83a2f24901c941d581c0c523ecd2619b) (SNIPPET). The main interactive map's platform was not confirmed.
- Integrity incident: 404 Media reported (Nov 2025) that someone at ISW altered a map to show Russia taking Myrnohrad by 15 Nov 2025, which affected a Polymarket bet; the edit was removed next day and ISW said it was unauthorised — Wikipedia ISW (READ).
- Uncertainty: assessed vs claimed zones and per-change citations; no numeric confidence (ukraine-war-analytics.com notes most maps show a crisp boundary).
- Access/licence: free to view; no accounts known; republishing terms NOT READ. API/open data: not found (the guide says licensing for these maps is not addressed). Alerts: email/subscription newsletters are likely; NOT READ.
- Languages: English (UNVERIFIED). Mobile: desktop recommended for interactive map (SNIPPET).

**Strengths:** analyst methodology, daily written assessment with sources, high media pick-up, explicit assessed-vs-claimed split. **Weaknesses:** perceived bias (hawkish, conservative on Ukrainian gains), one-day latency, no data download in what I found, a map tamper incident tied to prediction-market betting.
**Legal/ToS:** unknown; their reports carry copyright notices I could not read.

### Inferences
- What a new project could do better or must not copy (inference): Copy "assessed vs claimed" visual semantics and per-change citations; do not publish a single crisp boundary with no confidence; add edit logs and change history so a tampering claim could be disproved. Defcon is global and quantitative; ISW is a single-war territorial product, so they are complements, not substitutes.

### Gaps
- Interactive map UI, tooling, terms, current latest date, Critical Threats Project (Iran/Middle East) map details: NOT READ (403).

---

## 4. DeepStateMap (Ukraine front line)

### Takeaway
DeepState is a Ukrainian volunteer-plus-staff project with a continuous front-line polygon, mostly donation-funded, openly pro-Ukraine, working with the Ukrainian military, and banned in Russia. It is the strongest "front line truth" product but is not neutral and its map site did not render for me.

### Cited Findings
- Origin: started as a Telegram channel (Feb 2020 per Kyiv Post); map launched 24 Feb 2022; founders Roman Pohorilyi and Ruslan Mykula (Kyiv Post) — NPR coverage spells the second founder as Vladyslav Mykula; sources disagree — [Kyiv Post, 27 Jul 2025](https://www.kyivpost.com/post/57024) (READ); [NPR syndication](https://www.wfae.org/2025-02-10/ukrainians-are-closely-following-a-homegrown-map-of-the-shifting-front-line) (SNIPPET).
- Funding: mostly donations, plus ads on the Telegram channel and merchandise; described as patriotic rather than commercial (Kyiv Post).
- Team: 100+ paid staff and volunteers, secret Kyiv location; Il Giornale says about 100 volunteers with 13 full-time analysts (SNIPPET, conflicting) (Kyiv Post; [Il Giornale](https://www.ilgiornale.it/news/guerra/mappa-ucraina-che-svela-vera-linea-fronte-cos-smascheriamo-2559906.html)).
- Sources and verification: photo, video and message review using geolocation; changes go on the map only after verification; the Ukrainian military provides most source material; Defence Ministry signed a data-exchange memorandum in March 2024 — Kyiv Post; [Ukrainska Pravda, 13 Mar 2024](https://www.pravda.com.ua/eng/news/2024/03/13/7446263/) (SNIPPET). Model: human-verified, with military input (not crowd-edited).
- Map policy and neutrality: red = Russian-controlled, green = regained, blue = regained in the past two weeks; shows enemy positions only, no Ukrainian unit positions; "we would rather close down the project" than publish lies (Kyiv Post). Openly not neutral and delays some sensitive details (NPR snippet). Russia officially bans the map as "undermining Russian sovereignty" (Kyiv Post).
- Latency: multiple times per day for active sectors; more responsive than ISW but with revisions — [ukraine-war-analytics.com](https://ukraine-war-analytics.com/analysis/frontline-mapping-methods.html) (READ). Newest update on 2026-10-29: NOT READ (site returned a loader).
- Languages: Ukrainian; English launched April 2025 with German and Spanish planned; never Russian (Kyiv Post). Site shell offers offline mode (READ today).
- Apps: free Android and iOS app (developer Heorhii Karpenko per snippet); iOS listing mentions NASA FIRMS fire points — [itc.ua](https://itc.ua/ua/novini/rozrobnyky-mapy-deepstatemap-vypustyly-mobilnyj-dodatok-ukrayinskyj-teatr-voyennyh-dij-u-smartfoni/amp/) (SNIPPET, Ukrainian).
- API/export: a free API was given for humanitarian/military use; after misuse, stricter controls with individual client keys; Nov 2025 DeepState publicly disavowed a betting service that embedded its map without permission — [DOU](https://dou.ua/lenta/news/deepstate-map-betting-on-war/) and [ITC](https://itc.ua/ua/novini/stavky-na-vijnu-mapu-bojovyh-dij-deepstate-bez-dozvolu-zapustyly-na-bukmekerski-sajty/amp/) (SNIPPET; originals not readable).
- Uncertainty shown: crisp boundary, a recent-gain colour; no confidence values (ukraine-war-analytics.com). Open-source: not found. Licence: not found.
- Strengths: fast, evidence-based polygon, wide Ukrainian public and military adoption, mobile app. Weaknesses: partisan, higher short-term revisions, military-controlled sensitivity delays, API misuse. Legal/ToS risk: embedding without permission has been publicly denounced.

### Inferences
- What a new project could do better or must not copy (inference): Do not copy partisan colour framing if Defcon wants neutrality; do copy the "recently changed" cue. Defcon should state an anti-misuse and no-betting-embed stance in its licence notes, since both ISW and DeepState maps were used for prediction-market bets.

### Gaps
- Official site content, terms, update time today, formal licensing: NOT READ.

---

## 5. Global Incident Map and similar free incident aggregators

### Takeaway
Global Incident Map (publisher Morgan Clements, TerroristWarning.com) is an old, human-curated, news-sourced incident map now selling data to government and corporate clients; current free/ad/paywall status could not be confirmed.

### Cited Findings
- Map conceived and designed by Morgan Clements, publisher of TerroristWarning.com; news items are located, reviewed and manually entered; one source cites 20 categories and a 310-second update cycle — [BeSpacific](https://www.bespacific.com/?p=14730), [MERLOT](https://www.merlot.org/merlot/viewMaterial.htm?id=298039) (SNIPPET; dates unknown).
- A 2008 post and a 2017 article call it subscription-based; MERLOT calls it free (conflict, SNIPPET). A 2007 mailing-list post called it lead-generation for other commercial sites (single opinion).
- Esri Marketplace (2023): near-real-time human-curated incidents (terrorism, disease outbreaks, kidnappings for ransom), mapped since 2006, sold to government, military, intelligence, law enforcement and corporate clients — [Esri listing](https://esri.com/en-us/arcgis-marketplace/listing/products/9835beece534459dbf2a3f80942b1cdc) (SNIPPET).
- On 2026-10-29 the site redirected to a tollbit page that returned HTTP 402 Payment Required to my fetcher, which suggests AI/bot access is metered; the live UI was NOT READ.
- Other free aggregators found: CFR Global Conflict Tracker lists 27 conflicts with filters for type, status (worsening/improving/unchanging/developing) and US impact; no methodology, update dates or licence visible on the page — [CFR](https://www.cfr.org/global-conflict-tracker) (READ 2026-10-29).
- Strengths: long tail of incident types (disease, kidnapping), human curation. Weaknesses: opaque ownership, unclear pricing, dated UX (UNVERIFIED, no screenshot), no open data.

### Inferences
- What a new project could do better or must not copy (inference): Do not copy a news-incident feed with hidden provenance. A Defcon incident layer needs per-record source URL, coder, date and uncertainty. Opportunity: CFR's tracker has no map, dates or method, so Defcon's Fatality/Risk Index with a published method is a clear step up.

### Gaps
- Live pricing, ads, terms, newest item for Global Incident Map: NOT READ.

---

## 6. Additional competitors and look-alikes (discovery)

Ranking: five GitHub projects by stars, plus ACLED, Crisis24, CFR and the conflict observatories. GitHub figures from `gh api` / `gh search` on 2026-10-29.

### Takeaway
The open-source "world monitor" space exploded in 2026: five repos with 11k to 90k stars are now direct look-alikes, all AGPL/MIT, all breadth-first (flights, ships, cameras, markets) and AI-flavoured. None found publishes a validated conflict score. ACLED and UCDP remain the evidence standard.

### Cited Findings: top 8 list
| # | Name | URL | Type | Stars | Licence | Last push | One line |
|---|---|---|---|---|---|---|---|
| A | koala73/worldmonitor | https://github.com/koala73/worldmonitor | OSS + SaaS | 89,739 | AGPL-3.0 | 2026-10-29 | profiled above |
| B | bilawalsidhu/gods-eye-view (formerly WorldView) | https://github.com/bilawalsidhu/gods-eye-view | OSS | 61,017 | MIT code (third-party data not MIT) | 2026-10-29 | profile below |
| C | calesthio/Crucix | https://github.com/calesthio/Crucix | OSS | 12,153 | AGPL-3.0 | repo push 2026-05-20 (stale 5 months) | profile below |
| D | BigBodyCobain/Shadowbroker | https://github.com/BigBodyCobain/Shadowbroker | OSS | 11,400 | AGPL-3.0 | 2026-10-29 | profile below |
| E | simplifaisoul/osiris | https://github.com/simplifaisoul/osiris | OSS | 11,394 | MIT | 2026-10-28 | one-line below |
| F | ACLED (Conflict Index, Explorer) | https://acleddata.com | Data org | n/a | proprietary EULA | n/a | profile below |
| G | Crisis24 Horizon | https://www.crisis24.com | Commercial | n/a | client licence | n/a | one-line below |
| H | CFR Global Conflict Tracker | https://www.cfr.org/global-conflict-tracker | Think tank | n/a | not stated | n/a | in section 5 |
| I | Monitor the Situation | https://www.monitor-the-situation.com | Web app | n/a | not stated | n/a | one-line below |

Also seen but not profiled: small "global situational awareness" repos (WorldMirror 2 stars, DoomDex 1) and many forks of monitor-the-situation-dashboard (AGPL, 0-1 stars) — `gh search repos` 2026-10-29. Not found / not checked: Bellingcat tools (not researched in this run), Windy (not researched), Flashpoint consumer view (nothing consumer-facing found), Conflict Observatory (see below).

### Profile B: God's Eye View (bilawalsidhu/gods-eye-view)
- Owner: Bilawal Sidhu (media creator); "5M+ on YouTube, 25M+ across socials", "#1 on GitHub Trending Aug 2026", Product Hunt #8 of the day — [README](https://github.com/bilawalsidhu/gods-eye-view) (READ; self-reported). Funding model: not stated (creator content). Pricing: free, "start without API keys".
- Scope: photorealistic 3D globe with live aircraft, ships, satellites, earthquakes, traffic, public cameras, voice-controlled AI agent. Conflict coverage is minor: no conflict deaths or risk score mentioned in the README top section (READ part only).
- Licence: MIT for code; third-party data and bundled datasets are not MIT — [LICENSE](https://github.com/bilawalsidhu/gods-eye-view) (READ). GitHub reports "NOASSERTION" because of the extra note. Stars 61,017, forks 11,920, last push 2026-10-29.
- Caveats stated: traffic simulated from aggregate data; CCTV camera poses and rocket trajectories are coarse estimates (README).
- Inference: shows that spectacle (3D globe, voice) drives virality; a custom 3D globe alone is not a moat.

### Profile C: Crucix (calesthio/Crucix)
- "27 sources, one command, zero cloud", refreshes every 15 min, Telegram/Discord multi-tier alerts, LLM assistant and "trade ideas", Node 22, 1 dependency, AGPL-3.0, 12,153 stars, 1,866 forks, last push 2026-05-20 — [README](https://github.com/calesthio/Crucix) (READ). Live demo crucix.live (not opened).
- Weakness: stalled for five months by last-push date; trade-idea generation is a financial-advice-adjacent feature. README warns that no official token exists, so impersonation tokens exist.
- Inference: its alert-first design (push to Telegram) is a feature Defcon lacks as a static site; Defcon's RSS/JSON feeds could cover it.

### Profile D: ShadowBroker (BigBodyCobain/Shadowbroker)
- "60+ live intelligence feeds", 40+ layers, Next.js + MapLibre + FastAPI, Telegram OSINT geoparsed onto the map, recon toolkit, Shodan connector, SAR change detection, dark-ops visual modes; "no accounts, product telemetry, or analytics"; self-hosted; AGPL-3.0; 11,400 stars, 1,810 forks; created 2026-03-05, last commit 2026-10-27 — [README](https://github.com/BigBodyCobain/Shadowbroker) and `gh api` (READ).
- Risk: tracks private jets of named individuals, CCTV and a recon toolkit, which are privacy and legal exposure that a humanitarian-style monitor should not copy (inference).
- Self-hosted only, so no public hosted instance read.

### Profile F: ACLED (Armed Conflict Location & Event Data)
- Conflict Index scores "every country and territory" on four indicators (deadliness, danger to civilians, geographic diffusion, armed-group fragmentation) and ranks the top 50 into extreme/high/turbulent; edition data window 1 Dec 2024 to 28 Nov 2025; cadence and validation not stated on the page — [ACLED Conflict Index](https://acleddata.com/conflict-index/) (READ).
- Access: tiers Open, Research, Partner, Enterprise; Open gets aggregated real-time data (Explorer, Conflict Index, Ukraine Conflict Monitor); API from Research; weekly disaggregated data at Partner; tier set by email domain (gmail gets Open); no prices published; ACLED may limit organisations that build substitutes or monetise products on its data — [myACLED FAQ](https://acleddata.com/myacled-faqs) (READ). Event data from 1997 (World Monitor comparison page, competitor-authored). Terms are the EULA, Content Usage Terms and Attribution Policy — [terms index](https://acleddata.com/terms-of-use/) (READ; details NOT READ).
- Strength: academic gold standard and the primary source World Monitor's CII wants but cannot access. Inference: Defcon's UCDP-based, open-licensed coding is a free alternative to ACLED's gated, restricted-reuse model, and ACLED terms prohibit "effective substitutes" so Defcon must not ingest ACLED event data.

### One-line entries
- **Osiris** (simplifaisoul/osiris, MIT, 11,394 stars): flights, CCTV, earthquakes, conflict zones, 24/7 news in a MapLibre UI with a Patreon link; its GitHub description string includes a crypto token address ending in "pump", a promotional red flag — `gh api` + README (READ).
- **Crisis24 Horizon**: commercial risk platform; the app is free to download but requires a company with a current Horizon licence; claims 200+ countries, 800+ provinces, 400+ cities — [App listing via search summary](https://www.reworked.co/the-wire/crisis24-unveils-crisis24-horizon-revolutionizing-risk-management-with-ai-powered-intelligence-and-global-expert-analysis/) (SNIPPET). Not a free consumer view.
- **Monitor the Situation** (monitor-the-situation.com): global events ranked by severity and confidence, military/VIP aircraft, maritime, GPS interference; creators not named on the page (AFP says co-created by an a16z staff member); open-source status not stated — [site](https://www.monitor-the-situation.com) (READ), [AFP via Philstar](https://www.philstar.com/lifestyle/gadgets/2026/03/16/2514729/gods-view-rise-ai-war-dashboards).
- **Ukraine Conflict Observatory** (Yale HRL / US State Dept): funding was cut in 2025 and it shut down; data reportedly transferred to Ukraine and the State Department — [CNN syndication](https://krdo.com/news/2025/03/19/researchers-have-lost-access-to-evidence-of-alleged-russian-war-crimes-following-trump-admin-funding-cut/) (SNIPPET). Shows the funding-fragility risk of grant-funded monitors.
- **CFR Global Conflict Tracker**: see section 5.

### Inferences
- Defcon's lane is "evidence-grade, small, validated, ethical". The viral repos win on spectacle and breadth; none claims a published backtest. Risks to avoid copying: person-tracking, crypto-token adjacency, trade ideas, AI forecasts without validation.
- Funding fragility (Conflict Observatory) argues for keeping Defcon static, cheap and mirrorable.

### Gaps
- Not researched in this run: Bellingcat tools, Windy, Flashpoint consumer product, GDELT-based dashboards, Cloudflare Radar, Polymarket's own maps. Crucix live demo and Shadowbroker UI not opened.
- Star counts are as of 2026-10-29 from the GitHub API; stars can be inflated by trending and crypto promotion, and I did not audit them.

---

## Cross-cutting findings for scoring

### Takeaway
No competitor read publishes a validated conflict risk score or per-event uncertainty ranges; the closest are World Monitor (open formula, no validation, scorecard withdrawn) and ACLED (rigorous but gated). Several leaders are bot-walled, so an "easy to reuse" static site is itself a differentiator.

### Cited Findings
- Public maps usually show one crisp boundary with no uncertainty — [ukraine-war-analytics.com](https://ukraine-war-analytics.com/analysis/frontline-mapping-methods.html) (READ).
- Prediction markets have started to use conflict maps as resolution evidence (ISW Myrnohrad edit, Nov 2025; DeepState betting site, Nov 2025) — Wikipedia ISW; DOU/ITC (SNIPPET). Integrity and tamper-evidence matter.
- AI dashboards face a reliability critique in mainstream press — [AFP via Philstar, 16 Mar 2026](https://www.philstar.com/lifestyle/gadgets/2026/03/16/2514729/gods-view-rise-ai-war-dashboards).
- World Monitor markets itself against both Liveuamap and ACLED with its own comparison pages (competitor-authored, treat as biased) — [vs Liveuamap](https://www.worldmonitor.app/compare/worldmonitor-vs-liveuamap/), [vs ACLED](https://www.worldmonitor.app/compare/worldmonitor-vs-acled/).

### Inferences
- Defcon's most defensible claims: validated risk index (published backtest), human-coded deaths with ranges, open data and licence, no tracking, official-India map. Weakest areas to be honest about: 3-hour latency, no real-time event feed, no alerts, no mobile app (all relative to the competitors above).

### Gaps
- No adoption numbers for Liveuamap, ISW maps, DeepState maps or Global Incident Map were found; traffic analytics (Similarweb) was not fetched.
