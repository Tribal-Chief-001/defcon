# Commercial/enterprise geopolitical-risk platforms and free or freemium situational-awareness tools, compared against Defcon

Read date for every URL below: 2026-10-29 unless stated otherwise. Method caveat: WebFetch returns a small-model summary of each page, not raw text, so a few fields are summary-level. Where a page returned 403/404 it is marked NOT READ. Facts taken only from a WebSearch result snippet are marked UNVERIFIED. No facts about 2026 events are taken from memory. Sections follow the requested product order; each product is one "key question" with the same fields. Field names: Owner/funding; Users; Coverage; Sources and human vs automated; Latency; Detection and verification; Uncertainty shown; Visual product; Accessibility; Alerting; Collaboration; API/integrations; Export; Licence/terms; Pricing; Free tier; Open status; Security/privacy; Scale claims; Strengths; Weaknesses; USP.

## 1. Dataminr (First Alert, Pulse, Dataminr for News)

### Takeaway
Dataminr is an AI-first, automated real-time event-detection service sold by quote to enterprise, government and newsroom buyers. It has no public price list, no free tier found and no documented human verification step. Independent commentary treats its alerts as leads, not confirmed facts.

### Cited Findings
- Owner/funding: private company. April 2025: further $100M from Fortress Investment Group and NightDragon as convertible debt. September 2025: a further convertible-debt round (Wikipedia gives $300M; one other source gives a different figure, so the amount is uncertain). October-November 2025: deal to acquire cyber-threat-intelligence firm ThreatConnect for about $290M (announcement and close dates differ by source). Last published valuation found: $4.1B in March 2021. 2025 revenue: not found (CB Insights shows $200M but the line is ambiguous) — [Wikipedia](https://en.wikipedia.org/wiki/Dataminr), [TechRepublic](https://www.techrepublic.com/article/news-dataminr-buys-threatconnect/), [StockAnalysis](https://stockanalysis.com/private/dataminr/) (search snippets only, UNVERIFIED).
- Target users: public sector (First Alert), corporate security and cyber risk (Pulse variants), newsrooms (Dataminr for News). The page claims 100+ US government agencies, 20+ international governments, two-thirds of the Fortune 50, and "over 1,500 newsrooms" — [Dataminr products](https://www.dataminr.com/products).
- Scale claims by owner: "1M public data sources", "more than 50 proprietary LLMs"; a $318 million US Department of War contract for First Alert Advanced is mentioned (a contract, not a price) — [Dataminr products](https://www.dataminr.com/products). A separate Dataminr document cites "more than 500,000" sources, so the source count differs by document — [Dataminr First Alert overview, search snippet, UNVERIFIED](https://www.dataminr.com/wp-content/uploads/2023/10/FA-Overview-International-FedCiv-SLG-English-2.pdf). The PDF itself could not be parsed (NOT READ).
- Sources and method: public data (social media, news, government advisories, sensors) processed by "multi-modal fusion AI", generative AI for descriptions and agentic AI for context. Whether human analysts review alerts before delivery: not stated on the page — [Dataminr products](https://www.dataminr.com/products).
- Alert delivery: email, mobile or web notifications, or morning/evening digest emails; each alert has a short summary — [Dataminr resources, search snippet, UNVERIFIED](https://www.dataminr.com/resources/insight/the-value-of-real-time-information-for-the-public-sector). Geofences, watchlists, mobile app details, languages: not found on pages read.
- Latency: marketed as "real-time"; no measured latency or published accuracy figure found.
- Pricing: no official price. Capterra shows a "$15,000" starting price but the unit (per user per month vs annual) is inconsistent across listings; G2 says "contact for pricing"; one Dataminr-for-News FAQ says newsroom contracts "typically run tens of thousands of dollars" and is itself unsourced — [Capterra via search](https://www.capterra.com/p/201153/Dataminr/) (page itself 403, NOT READ), [G2](https://www.g2.com/products/dataminr-pulse-for-corporate-security/pricing) (snippet), [MediaCopilot](https://mediacopilot.ai/can-you-trust-dataminr-with-your-breaking-news-workflow/). All UNVERIFIED except the MediaCopilot FAQ, which is an unsourced claim.
- Free tier: Capterra says a free trial exists; another aggregator says none (older page, August 2024). Conflicting, UNVERIFIED — [Capterra](https://www.capterra.com/p/201153/Dataminr/), [Zoftware](https://zoftwarehub.com/en-ae/products/dataminr/pricing).
- Security/privacy: Dataminr page links a Trust Services page but gives no controls. An independent review says public documentation gives little detail on data storage, encryption, access controls and retention — [Dataminr products](https://www.dataminr.com/products), [MediaCopilot, 3 Mar 2026](https://mediacopilot.ai/can-you-trust-dataminr-with-your-breaking-news-workflow/).
- Strengths (independent): helps editors cover many communities at once, buys time in fast-moving events, cross-references data types — [MediaCopilot](https://mediacopilot.ai/can-you-trust-dataminr-with-your-breaking-news-workflow/). Users on G2 praise speed, real-time alerts, quick setup — [G2 via search, UNVERIFIED](https://g2.com/products/dataminr/reviews?page=3).
- Weaknesses and customer criticism: G2 reviewers cite information overload and inefficient alerts (5 reviews), false positives (3), overwhelming interface (3), and cost; review counts are small — [G2 via search, UNVERIFIED](https://www.g2.com/products/dataminr/pricing). Independent article: alerts may mirror platform bias (low-activity communities under-represented, viral incidents over-emphasised), and verification burden sits with the user — [MediaCopilot](https://mediacopilot.ai/can-you-trust-dataminr-with-your-breaking-news-workflow/).
- Uncertainty/confidence shown, collaboration, export, API, accessibility, open status: NOT READ / not found on any page I could read (API is likely but not confirmed; Everbridge lists Dataminr as a partner feed, see section 4c).
- Distinctive USP: speed and breadth of automated detection across a claimed million public sources, with strong government and newsroom reference customers.

### Inferences
- What a free open project can credibly match: a transparent, human-coded event layer (UCDP deaths with ranges, a published backtest, a sourced timeline), downloadable CSVs, and a no-account, auditable method. Those are things Dataminr does not publish.
- What it cannot: sub-minute detection across social and sensor streams, a million-source ingestion pipeline, enterprise alert routing and SLA support. Matching Dataminr on speed would require paid compute and feeds.
- Dataminr's own public pages do not state accuracy or human verification, so a "verified, with stated uncertainty" posture is a fair point of difference rather than a speed contest.

### Gaps
- No official price, tiers or free-trial terms (sales-gated). Gartner Peer Insights page showed only a 4.5 rating in a snippet; cons not read.
- API, export, geofence, mobile-app and collaboration details not found. Product pages for First Alert and Pulse not individually read (the /products page was read; individual product pages not).
- Latency and accuracy: no owner-published numbers found.

## 2. Janes (Intara, conflict/country-risk/OSINT datasets)

### Takeaway
Janes is a defence-intelligence publisher and data vendor with expert-analysed, peer-reviewed datasets, sold to governments and defence users by quote. It is a reference database more than a live event feed, and the one hard price datapoint found is a UK MoD contract of up to GBP 17.5M over three years.

### Cited Findings
- Owner/funding: owned by Montagu Private Equity since 2019 (bought from IHS Markit; price "believed" $470M per a trade report, unconfirmed) — [Montagu](https://montagu.com/montagu-private-equity-to-acquire-janes-from-ihs-markit/) (search result, snippet only; UNVERIFIED for current ownership as no 2026 source was read). Janes also acquired RWR Advisory Group (date not read) — [Janes news](https://www.janes.com/defence-intelligence-insights/defence-news/janes-acquires-rwr-advisory-group) (snippet, UNVERIFIED).
- Target users: defence, government, intelligence. UK Ministry of Defence direct award via Defence Digital, "Enterprise Agreement Lite", up to GBP 17.5M, March 2026 to March 2029, for licences to Janes OSINT databases, taxonomies and analysis tools; MoD said Janes owns the IP and no reasonable alternative offers equivalent coverage — [UK Defence Journal, 9 Mar 2026](https://ukdefencejournal.org.uk/mod-to-award-intelligence-data-deal-to-janes/). Carahsoft and DLT reseller listings suggest US government sales — [Janes-Carahsoft](https://www.janes.com/about/company-updates/janes-and-carahsoft-partner-to-expand-access-to-validated-military-intelligence-across-us-government-agencies), [DLT](https://www.dlt.com/government-products/janes) (snippets, UNVERIFIED).
- Coverage and datasets: equipment/weapons/sensors; military capabilities; geoeconomic threat intelligence; country and CBRN profiles; defence budgets and forecasts; news, events and analysis — [Janes home](https://www.janes.com/).
- Method: experts collect from vetted on-the-ground and industry specialists, interviews and events, then analyse, validate, contextualise and peer review — [Janes home](https://www.janes.com/). So human-analysed, not automated.
- Delivery: data as a service in File GeoDB, Parquet, RDBMS, XML, property graph formats, plus API; Janes Intara is described as an API-accessible knowledge graph — [Janes home](https://www.janes.com/), [Intara case study](https://www.janes.com/intelligence-resources/case-studies/Janes-Intara-common-intelligence-picture-Russia-Ukraine) (snippet, UNVERIFIED). Janes partnered with Esri on a Conflict Observatory project documenting alleged war crimes in Ukraine — [Janes-Esri](https://www.janes.com/defence-intelligence-insights/defence-news/company%20updates/janes-partners-with-esri-for-conflict-observatory) (snippet, UNVERIFIED).
- Pricing: not published; "Book a demo" — [Janes home](https://www.janes.com/). Only datapoint is the MoD ceiling above (a contract ceiling, not a list price).
- Free tier: not found. Some "OSINT insights" articles are public (extent not read).
- Analyst headcount, source counts, latency, uncertainty display, alert channels, collaboration, security certifications, analyst reviews: not stated on the page read. The conflict/country-risk product pages (/products/conflict-and-country-risk) returned 404 (NOT READ).
- Strengths: the MoD itself describes it as "the only comprehensive unclassified dataset of technical intelligence on global military equipment" — [UK Defence Journal](https://ukdefencejournal.org.uk/mod-to-award-intelligence-data-deal-to-janes/) (that is the MoD's procurement-notice wording).
- Distinctive USP: deep, peer-reviewed military-capability and order-of-battle data with a long brand, and the data delivered in analyst-friendly formats (Parquet, graph, GeoDB).
- Weaknesses and customer criticisms: none found (no review-site coverage found).

### Inferences
- Credible overlap with Defcon is small: Janes is equipment and capability intelligence, Defcon is event and fatality monitoring. Janes is also not a live event tracker as far as the pages show.
- A free project cannot match expert peer-reviewed military databases or the on-the-ground source network. It can match open delivery formats (CSV, perhaps GeoJSON/Parquet) at no cost, which Janes gates behind contracts.

### Gaps
- No product page on conflict/country risk readable; no latency, coverage counts, price list, user reviews, or current ownership confirmation from a 2026 source.

## 3. Crisis24 (GardaWorld): Horizon and public alerts/map

### Takeaway
Crisis24 Horizon is an enterprise travel-risk, people-tracking and critical-event platform backed by 200+ in-house analysts plus AI detection. I found no free public alert feed or map; public content is limited to marketing reports such as the annual Global Risk Forecast. Pricing is not public.

### Cited Findings
- Owner/funding: part of GardaWorld. GardaWorld was acquired by Rhone et al. in 2017 and subject to a March 2025 recapitalisation valuing the group at C$14B with about 70 percent held by Crétier and managers, HPS/Oak Hill/One Investment Management/BC Partners holding minorities. GardaWorld completed the OnSolve acquisition on 31 July 2024 and is also integrating WorldAware — [Wikipedia GardaWorld](https://en.wikipedia.org/wiki/GardaWorld), [Simpson Thacher](https://www.stblaw.com/about-us/news/view/2024/07/22/garda-world-security-corporation-to-acquire-onsolve), [Business Travel Magazine](https://thebusinesstravelmag.com/worldaware-changes-hands/) (search snippets, UNVERIFIED in detail; Crisis24 ownership statement on its own page: footer shows GardaWorld copyright — [Crisis24](https://www.crisis24.com/)).
- Target users: Fortune 500 companies, universities, international NGOs; travel managers, security and duty-of-care teams — [Crisis24](https://www.crisis24.com/).
- Scale claims: "200+ analysts" on the home page; "230+ analysts backed by AI threat detection technology" and "1,400+" location profiles on the Horizon page. The two analyst counts differ between pages — [Crisis24](https://www.crisis24.com/), [Horizon](https://www.crisis24.com/platforms/crisis24-horizon).
- Method: human analysts plus AI detection; underlying data feeds are not named — [Horizon](https://www.crisis24.com/platforms/crisis24-horizon).
- Visual product: world map showing people and sites on one screen; Horizon Mobile app with GPS location-based alerts, threat-zone identification, check-ins, in-app messaging, hotline — [Horizon](https://www.crisis24.com/platforms/crisis24-horizon); also [Horizon Mobile overview PDF](https://files.crisis24.com/MarketingPages/wr/MarketingPages/HorizonMobileFeaturesOverview.pdf) (snippet, UNVERIFIED).
- Alerting: real-time risk alerts, 24/7; per-site vulnerability radius that notifies when a site may be at risk (page does not use the word "geofence"); mass notification and two-way messaging — [Horizon](https://www.crisis24.com/platforms/crisis24-horizon), [Crisis24](https://www.crisis24.com/).
- Collaboration/case management: critical event management module, direct requests to analysts through the platform — [Horizon](https://www.crisis24.com/platforms/crisis24-horizon).
- API/integrations: external feeds such as camera and alarm activity; travel-tool integrations (Concur app-centre listing, TravelPerk partnership); a developer API was not described — [Horizon](https://www.crisis24.com/platforms/crisis24-horizon), [Concur](https://www.concur.com/app-center/listings/5f4e9a5eb381ef00131fea11), [TravelPerk](https://travelperk.com/partnership/crisis-24) (snippets, UNVERIFIED).
- Free content: annual Global Risk Forecast with risk map (2026 edition); whether it is gated is not stated — [Crisis24 intelligence](https://www.crisis24.com/intelligence). An old "Overall security assessment rating map 2022" PDF existed via an AIG broker page, showing the product was historically distributed through insurers — [AIG PDF](https://orgn-aigno.dmp.aig.com/content/dam/aig/emea/norway/documents/brochures/crisis24-overall-security-assessment-rating-map-2022.pdf) (snippet, UNVERIFIED). No free anonymous alert map found.
- Pricing: none public. Security: Trust Portal and Privacy Center linked, no certifications stated on the page — [Horizon](https://www.crisis24.com/platforms/crisis24-horizon).
- Latency, uncertainty/confidence display, export formats, analyst-review ratings, customer criticisms: not found.
- Strengths: combines intelligence with duty-of-care actions (locate, message, evacuate); case study of traveller evacuation after an earthquake in Venezuela — [Horizon](https://www.crisis24.com/platforms/crisis24-horizon). Distinctive USP: intelligence tied to people and assets plus 24/7 human assistance.

### Inferences
- Different product category from Defcon: Crisis24 answers "where are my people and are they at risk"; Defcon answers "what is happening and how deadly". A free project can match a public map, timeline and exports, not asset tracking, messaging or 24/7 response.
- Notably, the vendor does not publish a free public alert map, so a free Defcon map fills a gap a journalist or NGO would otherwise face.

### Gaps
- Horizon pricing, API, alert latency, feeds, certifications and independent reviews not found.

## 4. Conflict-relevant enterprise platforms: (a) Control Risks / Seerist, (b) RANE / Stratfor Worldview, (c) Everbridge Visual Command Center. Flashpoint noted as a related but weaker fit.

Selection logic (inference): Seerist, RANE Worldview and Everbridge VCC are the three closest to geopolitical and conflict situational awareness for non-cyber users. Maplecroft is a country/ESG indices product, and Flashpoint is mostly cyber and fraud threat intelligence; neither was profiled in full.

### 4a. Control Risks / Seerist

#### Takeaway
Seerist is the software arm of Control Risks, selling verified-events feeds, pulse scores and an analyst-trained AI assistant to large organisations by demo/quote. Its distinctive claim is human analyst depth (200+ embedded Control Risks analysts) with 15-minute pulse refresh.

#### Cited Findings
- Owner: Control Risks Group Holdings Ltd is the legal entity on the Control Risks site; Seerist appears in its client login menu. Seerist's own page does not state its owner. Control Risks' ownership and funding: NOT stated on pages read — [Control Risks](https://www.controlrisks.com/), [Seerist](https://www.seerist.com/).
- Users: "400+ organizations" including NATO, the Department of War, ODNI, Takeda, Diageo; buyers are CROs, COOs, CSOs and intelligence leaders; use cases include executive travel, incident response, supply chain, horizon scanning — [Seerist](https://www.seerist.com/).
- Method: "200+ embedded Control Risks analysts", about "50,000 expert analyst hours per year"; content curated by analysts; named features: Verified Events, PulseAI, DiscoverAI, ExploreAI, AskAnna (analyst-trained AI assistant, answers described as cited and traceable) — [Seerist](https://www.seerist.com/).
- Alerting: verified breaking events sent to users; monitoring for assets such as a trip or site, with radius-based proximity checks — [Seerist](https://www.seerist.com/).
- Latency/scale claims: "15-minute pulse refresh"; the page showed live counters (9 verified events in the past 24 hours, 64 tracked pulse changes) at read time; "25% of the Fortune 100"; customer example monitoring 7,000+ hotel properties; 95% cut in report-production time claimed — [Seerist](https://www.seerist.com/).
- API: "API-first"; one large customer integrated it into its own platform — [Seerist](https://www.seerist.com/).
- Pricing: not listed, demo request. Security: Trust Center and Privacy Policy linked, no controls described — [Seerist](https://www.seerist.com/).
- Free content from Control Risks: podcast, geopolitical calendar, RiskMap annual (2027 edition "coming soon"), downloadable reports (e.g. Africa Risk-Reward Index 2026) — [Control Risks](https://www.controlrisks.com/).
- Map/globe, historical replay, filters, export formats, collaboration, confidence display, reviews and criticisms: not found / NOT READ (an earlier attempt at the Control Risks technology page returned 403).
- Strengths: human-verified events and a high-prestige analyst bench; AI layered on proprietary analysis. USP: verified events plus analyst-trained, citation-backed AI.

#### Inferences
- A free open project can match transparent methods and open downloads; it cannot match a 200-analyst desk, bespoke advisory, or attributed analyst forecasts. It could credibly counter "verified event" claims only by publishing its own source and uncertainty rules.

#### Gaps
- No pricing, map screenshots, reviews, ownership detail; claims are owner-only.

### 4b. RANE / Stratfor Worldview

#### Takeaway
RANE Worldview (the former Stratfor subscription) is a low-cost, article-style geopolitical analysis subscription with public prices, not a live map or API product. It is the one commercial product here with a clearly published individual price.

#### Cited Findings
- Owner: RANE (Risk Assistance Network + Exchange) operates Worldview; Stratfor history and ownership transition are on [Wikipedia](https://en.wikipedia.org/wiki/Stratfor) (search result only, UNVERIFIED). Funding: not found.
- Pricing: Worldview Basic $320 per year; Worldview Essential $1,600 per year billed annually (unlimited situation reports and proprietary analysis, forecast summaries, priority access to RANE expert events, sector-impact analysis); "Geopolitical Intelligence" tier is custom-priced. Checkout via Stripe — [RANE Worldview register](https://worldview.ranenetwork.com/register). Search results showed other figures ($199, $299, $399 per year) from pages of different dates, so only the register page above is treated as current; the others are UNVERIFIED and stale-looking — [RANE subscribe](https://www.ranenetwork.com:443/worldview-subscribe), [Milled/Stratfor](https://milled.com/stratfor/subscribe-for-199-plus-3-free-gifts-look-beyond-the-headlines-and-understand-the--QbGKymPthjwSnxzX). One search result mentions Basic includes up to ten situation reports and analyses a month (UNVERIFIED).
- Method/format: human-written analysis, forecasts and situation reports; no sources list, API, map, alerts, export or collaboration features found on the page read.
- Free tier, security posture, reviews, scale: not found.
- Strengths: affordable named-analyst geopolitical context; USP: long-form strategic forecasting at consumer price.

#### Inferences
- Not a direct feature competitor to a data globe, but it is what many analysts and journalists buy for narrative context. Defcon can supply quantified events and exports; it cannot supply forecasts written by named analysts or expert events.

#### Gaps
- No ownership/funding detail confirmed; no review-site data read; what Basic includes is not on the page read.

### 4c. Everbridge Visual Command Center (VCC)

#### Takeaway
VCC is a command-center map that overlays risk intelligence from many sources onto an organisation's assets, people and sites, sold by demo. It is built for corporate security operations centres, not for open analysis.

#### Cited Findings
- Owner: Everbridge. Thoma Bravo acquisition is from memory and not confirmed by anything read, so UNVERIFIED — see [Everbridge IR](https://ir.everbridge.com/news-releases/news-release-details/everbridge-launches-next-generation-its-critical-event) for older press (snippet).
- Data sources: "risk intelligence data from over 100 different sources" incl. National Weather Service, USGS, GDACS, Dataminr, International SOS, Everbridge's own 24x7 Global Intelligence Operations Center, traffic cameras, The Weather Company, Nixle law-enforcement data; a 2022 release claims 450+ integrations and 25,000+ risk data sources across the CEM platform — [VCC product page](https://www.everbridge.com/product/visual-command-center/), [2022 BusinessWire](https://www.businesswire.com/news/home/20220913005828/en/Everbridge-Integrates-Industry%E2%80%99s-Most-Comprehensive-External-Risk-Intelligence-Into-Organizations%E2%80%99-Physical-Command-Centers) (search snippet, UNVERIFIED).
- Visual product: Aerial Map and Grid Map; KML/KMZ layers can be added on the fly — [VCC](https://www.everbridge.com/product/visual-command-center/).
- Alerting: "Intelligent Alerting" links risk events to organisational assets; integrates with HR/asset systems, access control and mass notification; geofences not mentioned on the page — [VCC](https://www.everbridge.com/product/visual-command-center/).
- API: not described (developer hub link only). Pricing: request a demo. Security certifications: not mentioned on the page.
- Scale: "situational awareness on an unprecedented scale", no metric — [VCC](https://www.everbridge.com/product/visual-command-center/).
- Case study: Microsoft Global Security Operations Centers (2018 PDF) — [Everbridge](https://www.everbridge.com/wp-content/uploads/VCC-MSFT-GSOC-Case-Study-2018.pdf) (snippet, UNVERIFIED).
- Strengths: integration with real assets and mass notification; broad aggregated feeds; weaknesses and reviews: not found.

#### Inferences
- Defcon can credibly match open-feed layers (fires, disaster alerts like GDACS/USGS) because VCC itself lists such public feeds. It cannot match asset-linked alerting, access-control integration or a 24x7 intelligence centre.

#### Gaps
- Reviews, price, alert latency, uncertainty display, export formats, security attestations not found.

### 4d. Flashpoint (brief, lower relevance)
- Collection from open and dark web, forums; claims "over 3.6 petabytes" of intelligence; analysts prioritise against customer intelligence requirements; products include cyber, vulnerability and physical-security intelligence (executive protection, critical-event monitoring, extremist activity); API and an MCP server; pricing page linked but no figures; owner/funding and certifications not stated on the page — [Flashpoint](https://www.flashpoint.io/). A Forrester Wave "Customer Favorite" and 4.8/5 rating are owner-reported claims on that page.
- Inference: relevant only to the physical-security slice; little overlap with conflict casualty data.

## 5. Free "open" humanitarian data hubs: ReliefWeb (OCHA) and HDX (OCHA Centre for Humanitarian Data), including HDX HAPI

### Takeaway
ReliefWeb (editorial humanitarian content) and HDX (a shared dataset catalogue) are free, no-subscription, UN OCHA services with open APIs and clear usage rules. They are data and content hubs, not event-detection maps, and their conflict coverage is provided by partner datasets.

### Cited Findings
- Owner: both run by OCHA; HDX managed by the Centre for Humanitarian Data — [HDX terms](https://docs.humdata.org/about/hdx-terms-of-service) (search result, snippet). ReliefWeb about page: NOT READ (403). Funding: not found.
- ReliefWeb API: JSON over HTTPS; every request needs a pre-approved "appname" obtained by a short online form and email reply; read endpoints for reports, disasters, jobs, training, countries, sources; OpenAPI schema available; publishing needs API key; anyone may use the API; content may be owned by the original source so reuse must respect those rights; calls may be logged — [ReliefWeb API docs](https://apidoc.reliefweb.int/). Rate limits and API version: not on the page read (limits page NOT READ, 403).
- HDX licences allowed: CC BY-IGO, CC BY, CC BY-SA, ODbL, ODC-BY, PDDL, CC0, "Multiple Licenses", "Other"; no non-commercial-only option listed; "Other" refers to terms in the dataset description; default not stated — [HDX data licences](https://docs.humdata.org/about/data-licenses). So licence varies per dataset.
- HDX HAPI (standardised API): asks for at most about one request per second, 10,000 entries per call, and an app-identifier parameter; OCHA logs usage and uses Google Analytics, Mixpanel and Hotjar (no names or emails sent); disclaimer that data do not reflect OCHA or UN opinions — [HAPI terms](https://docs.humdata.org/about/hdx-terms-of-service/hapi-terms-of-service). HAPI licence terms were not on that page.
- HDX about page, dataset counts, data-grid quality process: NOT READ (403/404 on the pages tried).
- Update latency, uncertainty display, map/globe, alerts, collaboration, scale claims: not read. ReliefWeb's long-standing editorial curation of reports is widely known but not confirmed from a page I read, so treat as UNVERIFIED.
- Open status: open data/open API, free; code/data openness varies by dataset and publisher. Tracking: analytics tools used on HAPI, as above.

### Inferences
- Defcon should treat these as complementary upstream sources (as it already uses UNHCR displacement) rather than competitors. The credible match: open licences, CSV, API. The gap: HDX has breadth across thousands of publisher datasets and institutional trust; ReliefWeb has editorial coverage of response and disasters that Defcon cannot replicate.
- The mix of per-dataset licences means redistributing HDX-derived layers needs per-dataset attribution checks.

### Gaps
- ReliefWeb rate limit, editorial method, volumes; HDX dataset counts, quality checks and HAPI licence terms not read.

## 6. Other free or freemium global-awareness tools (chosen by relevance to conflict monitoring)

Selection (inference): Liveuamap (closest consumer conflict map), Flightradar24 and ADS-B Exchange (aviation OSINT), Copernicus Browser and NASA Worldview (free satellite imagery), GDELT (open event data). MarineTraffic pricing page returned 403 (NOT READ). Windy, Planet and Bellingcat's toolkit were not researched in this pass. Other researchers' files in this folder (event_data_platforms.md, live_osint_dashboards.md) may cover ACLED and similar.

### 6a. Liveuamap
#### Takeaway
Liveuamap is the best-known free, ad-funded conflict map, aggregating social and news reports. Ownership and verification are thinly documented; paid tiers exist for ad-free and API use.

#### Cited Findings
- Owner/funding: describes itself as a non-governmental organisation; revenue from advertising; founded 2014; no owner named by the Media Bias/Fact Check summary. App listings name Altwork LLC as developer, described as Ukraine-based — [MBFC](https://mediabiasfactcheck.com/live-universal-awareness-map-bias/), [app listing via search](https://mwm.ai/apps/liveuamap/1003808504) (UNVERIFIED). Liveuamap site itself: NOT READ (403).
- Method: aggregates news and social media reports onto maps; primary source often Twitter/X with links; some sources cannot be verified — [MBFC](https://mediabiasfactcheck.com/live-universal-awareness-map-bias/).
- Rating: MBFC "Least Biased", "Mostly Factual", credibility "High", no failed fact checks; page last updated 14 March 2025 — [MBFC](https://mediabiasfactcheck.com/live-universal-awareness-map-bias/).
- Pricing: in-app subscription $1.99 per month, $10.49 half-year (app-store listing, UNVERIFIED) — [mwm.ai](https://mwm.ai/apps/liveuamap/1003808504). API Pro $150 per month for 200 requests/day and Enterprise from $1,000 per month are reported by a competitor's comparison page (World Monitor), so treat as unverified competitor claims — [World Monitor](https://www.worldmonitor.app/compare/liveuamap-alternatives/).
- Weaknesses: app-store users complain about perceived bias, inaccurate information, instability, and non-functional premium subscriptions; an ArcGIS StoryMap argues claims of political neutrality are hard to prove — [mwm.ai](https://mwm.ai/apps/liveuamap/1003808504), [ArcGIS StoryMap](https://storymaps.arcgis.com/stories/165dcc7c8d0e44c399eb2e0abec60f7f) (snippets, UNVERIFIED).
- Strengths: wide recognition, fast social-sourced updates, mobile apps, fact-checkers use it as a source (per MBFC).
- Fields not found: latency numbers, uncertainty display, export formats, security posture.

#### Inferences
- Defcon can credibly beat it on sourcing transparency (every event sourced, uncertainty stated, deaths human-coded) and on no ads or accounts; it cannot match Liveuamap's real-time social aggregation or on-the-ground community of curators.

#### Gaps
- Official terms, privacy, coverage list, update speed.

### 6b. Flightradar24 and ADS-B Exchange
#### Takeaway
Flightradar24 is the dominant consumer flight tracker, freemium with short free history; ADS-B Exchange is a community-fed alternative with an enterprise data business. Both are aviation layers, not conflict event sources, but analysts use them to monitor airspace and military movements.

#### Cited Findings
- Flightradar24 pricing (July 2026 figures via a third-party review): Silver about $5.80 per month or $28.80 per year, 90 days history, 10 alerts; Gold about $10.60 per month or $78.80 per year, 365 days, 25 alerts; Business has 7-day trial, three years history, 60 alerts, price not confirmed; free plan allows one active flight alert. Prices vary by country, 2025 App Store figures differed — [tuapppara.com via search](https://tuapppara.com/aplicaciones/flightradar24/) (secondary, UNVERIFIED). Official pricing page NOT READ (403).
- ADS-B Exchange: no owner named on the page, but terms and privacy links point to jetnet.com; claims "over 25K active receivers" and "trusted by more than 11 million users"; enterprise subscriptions for live positions, live operations, daily positions, daily operations; community platform for individuals; historical data via S3; prices not on the page — [ADS-B Exchange](https://www.adsbexchange.com/).
- Fields not read: filtering policy for military/blocked aircraft, alert channels beyond flight alerts, security/privacy, export.

#### Inferences
- Defcon could embed or link aviation context but cannot replicate receiver networks. Not a feature competitor.

#### Gaps
- Official Flightradar24 prices and limits, ADS-B Exchange free-tier limits and licence, and ownership confirmation.

### 6c. Copernicus Browser (and Sentinel Hub EO Browser) and NASA Worldview
#### Takeaway
Both are free, public-sector satellite viewers that let a journalist verify damage, fires or build-ups with no payment. They are imagery tools, not event databases, and require analyst skill.

#### Cited Findings
- Copernicus Browser: hub to explore and download Copernicus Sentinel and contributing-mission data; free account required; collections include Sentinel-1, Sentinel-2 (L1C/L2A), Sentinel-3, Sentinel-5P, DEMs; tools include time series, timelapse (GIF/MP4), compare, 3D, image download; search returns 50 results at a time; visualisation requires zooming in — [CDSE docs](https://documentation.dataspace.copernicus.eu/Applications/Browser.html). Sentinel-2 revisit about 5 days at the equator and Sentinel Hub EO Browser commercial-use rules (paid Basic/Enterprise, consumption-priced) come from search snippets, UNVERIFIED — [Copernicus FAQ via search](https://www.copernicus.eu/en/node/1013), [Sentinel Hub forum](https://forum.sentinel-hub.com/t/sentinel-2-l2a-imagery/5252).
- NASA Worldview: "interactive interface for browsing full-resolution, global, daily satellite imagery"; 1,200+ visualised products; viewing needs no account, Earthdata Login needed for downloads and some tools; NASA data described as openly available without restriction; imagery served through GIBS, which developers can use; Snapshots can overlay active-fire detections — [NASA Earthdata](https://www.earthdata.nasa.gov/data/tools/worldview).
- Fields not read: exact latency (page says many products within hours), uncertainty, alerts, collaboration, privacy.

#### Inferences
- Defcon already uses fire signals; deeper imagery verification is out of scope for a free event map but linking out to these viewers is cheap and credible.

#### Gaps
- Official Sentinel Hub plan prices, Copernicus Browser terms and privacy, NASA GIBS rate limits.

### 6d. GDELT (open event database; its tools)
#### Takeaway
GDELT is a free, open, machine-coded global news event database refreshed every 15 minutes, widely used by researchers. It is automated, so noisier than human-coded data.

#### Cited Findings
- "100% free and open"; event and knowledge-graph streams refresh every 15 minutes; Event Database updated daily in BigQuery; monitors news in 100+ languages with 65 languages machine-translated in real time; sources are print, broadcast and web news plus other corpora and image processing with Google Vision; supported by Google Jigsaw, and the Global Conflict Dashboard receives US Institute of Peace support; tools include BigQuery, raw CSV downloads, and the GDELT Analysis Service (TimeMapper, Word Cloud, Network Visualizer) — [GDELT](https://www.gdeltproject.org/). Terms of use and accuracy statistics: NOT READ.
- World Monitor (an AGPL-3.0 open-source map, owner unnamed, self-reported) says it uses UCDP and GDELT for conflict data and aggregates published reports without verifying events — [World Monitor comparison page, competitor marketing, prices dated 5 Sep 2026 on page](https://www.worldmonitor.app/compare/liveuamap-alternatives/). This shows an open-source rival already occupies part of Defcon's space (flag for the report writer; other researchers may profile it).

#### Inferences
- Defcon's human-coded UCDP deaths with ranges and a published backtest are a differentiator against GDELT-based automation; GDELT's 15-minute freshness and multilingual breadth are something Defcon cannot match.

#### Gaps
- GDELT licence terms, error rates; MarineTraffic, Windy, Planet and Bellingcat's toolkit not researched.

## 7. Cross-cutting patterns for scoring (inference from the findings above)

### Takeaway
Enterprise vendors hide price, API and verification detail behind demos, and publish owner-claimed scale numbers. Free tools publish rules and terms but are narrower. Public information on uncertainty or confidence display is almost absent from every commercial product page read.

### Cited Findings
- Of seven commercial vendors (Dataminr, Janes, Crisis24, Seerist, RANE, Everbridge, Flashpoint), only RANE publishes list prices — see sections 1-4.
- Several vendor claims differ between their own pages (Crisis24 analyst counts 200+ vs 230+; Dataminr source counts 1M vs 500,000) — sections 1 and 3.
- Real analyst-sentiment data is thin: Dataminr's G2/Capterra review counts are small and duplicated per search summary; no reviews found for Janes, Crisis24, Seerist or Everbridge — sections 1-4.

### Inferences
- A scorer should treat vendor "verified", "real-time" and "AI" claims as unmeasured. Defcon's published backtest and documented ranges are rare among the products reviewed, because none of the pages read published equivalent accuracy or uncertainty figures (absence of evidence on public pages, not proof they do not exist internally).

### Gaps
- Not covered: Verisk Maplecroft, Planet, Windy, MarineTraffic, Bellingcat toolkit, Gartner Peer Insights details, ACLED. Many pages returned 403/404 (listed per product as NOT READ). All price points from aggregators are UNVERIFIED.
