# Defcon leads on honesty, trails on reach

On a 35-parameter rubric scored from five research notes read on 2026-10-29, Defcon scores **68.6 out of 100**, essentially tied with the academic standard UCDP (**68.0**) and ahead of World Monitor (**61.4**), the ViEWS forecasting system (**61.4**), ACLED (**55.6**), Crisis Group's CrisisWatch (**44.8**), Liveuamap (**43.0**) and the CFR Global Conflict Tracker (**39.2**). The lead over UCDP is 0.6 points, which is inside the scoring noise: Defcon ranks first under two of six weightings, second under three, and third under a "mass-market reader" weighting where freshness, adoption and languages count most, and there World Monitor wins (66.8 against 61.1). The closest competitors are not the ones a layperson would guess: the 61,017-star 3D-globe repository ([God's Eye View](https://github.com/bilawalsidhu/gods-eye-view)) and the paid alert platforms are not conflict monitors, while the real alternatives are UCDP's free viewer (which is also Defcon's own data source), World Monitor, ACLED and ViEWS. Defcon's genuine edge is a combination no other product in the set offers: a human-coded versus auto-coded flag on every event, death ranges, a published and regenerated backtest, MIT-licensed code, no account and no tracking. Its weaknesses are the ones a visitor notices first: the newest human-coded event is dated **2026-08-31, 59 days old**, UCDP has already published the next monthly file (26.0.9) and Defcon has not ingested it, the globe has a **49-day hole** in its events, and the project has **0 stars, one maintainer and no outside review**. The five moves that matter most are: ingest the new UCDP file and announce every data gap on screen; automate the refresh chain; turn the self-published backtest into a pre-registered forward test with extra baselines, wider honest intervals and an outside reviewer; launch only after those are done, with embeds, feeds and a data package that let others spread it; and verify accessibility and phones on real devices.

## Executive summary

**Who the real competitors are.** Ranked by the rubric (baseline weights; ties broken by average rank across weightings), with the job each does for the same user:

| Rank | Product | Score | Why it is a real alternative |
|---|---|---|---|
| 1 | UCDP (Uppsala Conflict Data Program) | 68.0 | Free, no-login viewer with human-coded deaths and low/best/high ranges under CC BY 4.0. Defcon's own upstream source, and the closest in data philosophy. |
| 2 | World Monitor (open source plus paid tiers) | 61.4 | The only look-alike with mass reach: 89,739 GitHub stars, 59 layers, a 31-country instability score with an open formula but no validation. |
| 3 | ViEWS (Uppsala and PRIO) | 61.4 | The benchmark Defcon's risk index must be measured against: open, learned, validated, 1 to 36 months ahead. |
| 4 | ACLED | 55.6 | Richest weekly event data, but behind a login with no free API and a licence that bars reuse. |
| 5 | CrisisWatch (International Crisis Group) | 44.8 | Expert monthly tracker of 70+ situations with early-warning flags; the closest in spirit to Defcon's sourced timeline. |
| 6 | Liveuamap | 43.0 | The best-known consumer conflict map; fast pins with source links, ads, paid history and API. |
| 7 | CFR Global Conflict Tracker | 39.2 | A free curated view of 27 conflicts with analyst status labels; no numbers. |
| 8th row | **Defcon** | **68.6** | Same rubric, same analyst. |

**Where Defcon wins.** Per-event human/auto labelling with a hard severity cap; death ranges and 90% intervals; a backtest with year-by-year results and calibration that is regenerated and guarded by a test; MIT code with documented data licences; a content-security policy that forbids third-party requests; zero running cost; an India-official map protected by tests; an evidence trail that shows nearby fires, explosions and disaster alerts as context.

**Where Defcon loses.** Freshness of the human-coded layer (lowest of all eight on the freshness group); adoption (0 stars, no outside use); sustainability (one maintainer, 151 commits in two days, no human code review); languages (English only); alerts when no tab is open (none); embeds (blocked by design); real-device and screen-reader verification (none); scale and independent evaluation of the risk model compared with ViEWS.

**The five most important moves** (details in the roadmap):

1. Ingest UCDP 26.0.9 now, rebuild the indices, and show every data gap on the globe so that silence is never read as calm.
2. Replace manual refreshes with an unattended pipeline that opens a pull request within days of each UCDP release.
3. Make the risk model checkable: add the empirical-history and last-value baselines, publish a pre-registered forward ledger, widen the intervals with conformal methods, and invite an outside review.
4. Launch for adoption only after moves 1 to 3, and ship what lets others spread it: embeds, RSS feeds, a versioned data package.
5. Verify on real phones, other browsers and a real screen reader, then add offline support and a second language.

## Method: 35 parameters, one analyst's judgement, six weightings

**What the scores are, and are not.** Every score below is the analyst's judgement made from five research notes, not a measurement. The writer of this report opened no website; each number traces to a sentence in a note, listed in the evidence sections. The notes were written on 2026-10-29 (today) by separate researchers, so every "newest data" fact is a one-day snapshot that will drift. Each score is a whole number from 0 to 5 and carries a confidence tag: **H** (HIGH) means the evidence was read, **M** (MEDIUM) means it was partly read, **L** (LOW) means it is mostly NOT READ or comes from a search snippet. A competitor's own marketing numbers (stars, users, analyst counts) are used only for scale and adoption and are tagged accordingly.

Five scoring rules move the numbers, so they are stated up front. First, a feature counts at the level a visitor gets **without paying**: World Monitor's CSV export exists but sits in a paid tier, so it earns only part credit. Second, a product with no forecast or risk product scores 0 on the three forecasting parameters (P14 to P16); UCDP earns 0 there by design, which is why ViEWS scores high and UCDP is ranked on other strengths. Third, "not found" in a note scores low but is tagged L, because a missing line in a note is not proof that the feature is missing from the product; accessibility (P23) is the clearest case, where all seven competitors score 0 L because no note found an accessibility statement. Fourth, a login wall counts against a product's visibility (ACLED's Explorer showed an anonymous visitor only a registration prompt). Fifth, and most important for fairness: **Defcon was scored from its full repository and live measurements, the competitors from public pages**. That gives Defcon more H scores (32 of 35 against 0 to 15 for competitors) and probably flatters it on transparency, testing and accessibility. Two checks below compensate for this.

**The rubric.** Thirty-five parameters in 19 groups; the weights add to 100. The 0, 3 and 5 columns say what each score means (1, 2 and 4 are in between).

| # | Group | Parameter | Wt | 0 means | 3 means | 5 means |
|---|---|---|---|---|---|---|
| P1 | Data coverage and depth | Geographic breadth | 2 | one country or theatre | dozens of countries or a selected set | every country, worldwide |
| P2 | Data coverage and depth | Event-level detail | 4 | narrative only, no events | dated, placed events with limited precision, or aggregates only | every event with date, place precision, actors, source and fatality fields |
| P3 | Data coverage and depth | Event-type breadth | 2 | one type | several violence types | violence, protest/riot and non-lethal events plus context |
| P4 | Data coverage and depth | Historical depth the user can reach | 2 | none | a few years | decades |
| P5 | Freshness and latency | Age of newest data on 2026-10-29 | 5 | over a year, or unknown | about a month | hours or less |
| P6 | Freshness and latency | Update cadence and reliability | 3 | none or ad hoc | scheduled but loose or partly manual | automated, stated, monitored, kept |
| P7 | Provenance and verification | Per-record source transparency | 3 | none | sources named only in aggregate | every record links its sources |
| P8 | Provenance and verification | Verification and human review | 5 | none, or not stated | mixed or limited review | documented expert human coding with rules |
| P9 | Provenance and verification | Human vs automated labelling | 2 | not stated | stated at product level | flagged on every record and enforced |
| P10 | Uncertainty communication | Uncertainty on counts | 4 | none | caveats or flags only | ranges or intervals on every figure |
| P11 | Uncertainty communication | Honesty about gaps, staleness, provisional data | 3 | hides them | shows an as-of date | shows as-of, gaps, provisional status; silence never read as calm |
| P12 | Methodology transparency | Published method and codebook | 3 | none | prose description | formulas or codebook plus code, reproducible |
| P13 | Methodology transparency | Versioning, consistency, change history | 2 | none | dated versions or edits | immutable versioned releases, change log, consistent docs |
| P14 | Forecasting and risk validation | Risk or forecast product with a clear target | 2 | none | a score or flag with an unclear target | forecast with defined target, horizon and units |
| P15 | Forecasting and risk validation | Published validation and baselines | 5 | none | metrics exist but by own authors, weak baselines or no untouched hold-out | independent true-future test, baselines, calibration |
| P16 | Forecasting and risk validation | Per-country explanation of the score | 2 | none | indicator tables or narrative | per-country attribution of the score |
| P17 | Visual product and UX | Map or globe quality | 3 | none | solid 2D map with filters | distinctive, fast, layered map |
| P18 | Visual product and UX | Search, filter, drill-down | 2 | none | basic filters | search palette, country pages, filters, event drill-down |
| P19 | Visual product and UX | Mobile and responsive | 2 | desktop only | responsive web | native app or PWA verified on real devices |
| P20 | Time travel and history | Time travel and playback | 2 | none | date filters or limited archive | scrubber, playback and permalinks |
| P21 | Alerting and personalisation | Alerts and watchlists without payment | 3 | none | limited (tab open, or e-mail digest) | push, e-mail or webhook, free |
| P22 | Collaboration and sharing | Sharing, embeds, annotation | 2 | none | share links | links plus embeds or widgets plus annotation |
| P23 | Accessibility and languages | Accessibility evidence | 2 | none found | some tests or claims | audited, real assistive-tech tested, statement |
| P24 | Accessibility and languages | Languages | 2 | one | several | many, including right-to-left |
| P25 | Performance and privacy | Privacy, tracking, ads | 2 | heavy ads or tracking | analytics but no ads | no tracking, no ads, enforced |
| P26 | Performance and privacy | Performance and availability | 2 | often fails or walled | works | fast, static, tested |
| P27 | API, exports and open data | API, bulk download, export, integrations | 4 | none | limited or registration-gated | free API, bulk files and exports |
| P28 | Licensing and openness | Data licence and reuse rights | 4 | reuse barred | per-dataset or restricted | open licence with redistribution |
| P29 | Licensing and openness | Code openness | 2 | closed | partial | open source, permissive |
| P30 | Cost and access | Cost and access barrier | 5 | enterprise only | free with an account or limits | free, no account, full features |
| P31 | Reliability and maintenance | Maintenance and sustainability | 3 | abandoned | active, single funder or maintainer | active, several funders, a team |
| P32 | Adoption and credibility | Adoption and reach | 3 | none | some credible evidence | large and independently measured |
| P33 | Adoption and credibility | Institutional credibility and scrutiny | 3 | none | credible but untested | peer reviewed, replicated, critiques answered |
| P34 | Neutrality and legal risk | Neutrality, map policy, misuse safeguards | 3 | undeclared | declared stance | declared rules plus tests plus a misuse stance |
| P35 | Extra metrics the notes surfaced | Context signals and human-cost layer | 2 | none | one extra layer | several corroborating signals plus displacement, labelled as context |

**Why the weights look like this.** The user's core job is "show me, honestly and currently, where people are dying and where it may get worse". Four parameters therefore carry the largest single weight of 5: age of the newest data (P5), verification and human review (P8), published validation (P15) and cost and access barrier (P30). The next tier (3 to 4) holds the things that decide whether a number can be checked or reused: event-level detail (P2), uncertainty on counts (P10), API and exports (P27), licence rights (P28), source transparency (P7), gap honesty (P11), method (P12), map quality (P17), alerts (P21), maintenance (P31), adoption (P32), credibility (P33) and neutrality (P34). Nice-to-have capabilities (languages, embeds, time travel, mobile) get 2. The group totals are below, next to three alternative weightings. The alternatives were built by multiplying each group's weight and rescaling to 100: the **research user** multiplies coverage, uncertainty, methodology, forecasting, API and licensing by 1.5 and freshness, visuals, alerts and privacy by 0.5 or less; the **journalist or OSINT user** doubles freshness, alerts and sharing, multiplies provenance, visuals, time travel and context signals by 1.5 and cuts forecasting to 0.3; the **mass-market reader** multiplies adoption by 2.5, freshness, visuals, alerts, accessibility and languages by 2, and cuts methodology, forecasting and licensing to 0.4.

| Group | Parameters | Baseline weight | Research | Journalist/OSINT | Mass-market |
|---|---|---|---|---|---|
| Data coverage and depth | P1, P2, P3, P4 | 10.0 | 13.9 | 10.1 | 8.6 |
| Freshness and latency | P5, P6 | 8.0 | 3.7 | 13.5 | 13.7 |
| Provenance and verification | P7, P8, P9 | 10.0 | 11.1 | 12.6 | 6.9 |
| Uncertainty communication | P10, P11 | 7.0 | 9.7 | 5.9 | 4.2 |
| Methodology transparency | P12, P13 | 5.0 | 6.9 | 3.0 | 1.7 |
| Forecasting and risk validation | P14, P15, P16 | 9.0 | 12.5 | 2.3 | 3.1 |
| Visual product and UX | P17, P18, P19 | 7.0 | 3.2 | 8.9 | 12.0 |
| Time travel and history | P20 | 2.0 | 1.9 | 2.5 | 1.7 |
| Alerting and personalisation | P21 | 3.0 | 0.8 | 5.1 | 5.1 |
| Collaboration and sharing | P22 | 2.0 | 0.9 | 3.4 | 2.6 |
| Accessibility and languages | P23, P24 | 4.0 | 1.9 | 3.4 | 6.9 |
| Performance and privacy | P25, P26 | 4.0 | 1.9 | 3.4 | 4.1 |
| API, exports and open data | P27 | 4.0 | 5.6 | 3.4 | 1.7 |
| Licensing and openness | P28, P29 | 6.0 | 8.3 | 5.1 | 2.1 |
| Cost and access | P30 | 5.0 | 4.6 | 4.2 | 6.4 |
| Reliability and maintenance | P31 | 3.0 | 2.8 | 2.5 | 2.6 |
| Adoption and credibility | P32, P33 | 6.0 | 6.7 | 5.1 | 12.9 |
| Neutrality and legal risk | P34 | 3.0 | 2.8 | 3.3 | 2.1 |
| Extra metrics the notes surfaced | P35 | 2.0 | 0.9 | 2.5 | 1.7 |
| **Total** | 35 parameters | **100.0** | **100.0** | **100.0** | **100.0** |

**Honesty about how the numbers were made.** The baseline weights were fixed before any total was computed and none was changed afterwards. After the first run I re-checked the cells that most helped and most hurt Defcon: World Monitor's verification score went from 1 to 2 (the notes say some inputs are human-reviewed), and the confidence on two Defcon cells (gap honesty, performance) went from H to M because the notes mark the gap announcement and real-device speed as unverified. The mass-market weighting was **added after** the first three weightings turned out to favour Defcon's strengths; it is the one that does not.

**Sensitivity: does the ranking survive other weightings?** Scores out of 100, with rank among the eight in brackets. The last column gives every competitor the benefit of the doubt by adding 1 point to each of its LOW-confidence scores, which tests the evidence-asymmetry problem. Ties (World Monitor and ViEWS are both 61.4 on the baseline) are broken by average rank across the weightings.

| Product | Baseline | Research user | Journalist/OSINT | Mass-market reader | All 35 equal | Baseline + benefit of doubt (+1 on every LOW competitor score) |
|---|---|---|---|---|---|---|
| World Monitor | 61.4 (#3) | 58.0 (#4) | 65.1 (#3) | 66.8 (#2) | 63.4 (#3) | 62.2 (#4) |
| ACLED | 55.6 (#5) | 57.0 (#5) | 57.7 (#4) | 57.7 (#4) | 55.4 (#5) | 62.0 (#5) |
| UCDP | 68.0 (#2) | 71.1 (#1) | 70.7 (#1) | 68.3 (#1) | 64.0 (#2) | 71.6 (#1) |
| Liveuamap | 43.0 (#7) | 38.9 (#7) | 49.5 (#6) | 52.0 (#6) | 42.3 (#7) | 53.4 (#6) |
| ViEWS | 61.4 (#4) | 66.7 (#3) | 56.5 (#5) | 56.1 (#5) | 57.1 (#4) | 67.2 (#3) |
| CrisisWatch | 44.8 (#6) | 42.1 (#6) | 48.5 (#7) | 51.1 (#7) | 45.7 (#6) | 52.6 (#7) |
| CFR Tracker | 39.2 (#8) | 36.2 (#8) | 41.2 (#8) | 44.0 (#8) | 38.3 (#8) | 43.4 (#8) |
| **Defcon** | 68.6 (#1) | 70.5 (#2) | 67.2 (#2) | 61.1 (#3) | 70.3 (#1) | 68.6 (#2) |

Reading it: UCDP is first or second under every weighting, and ahead of Defcon in four of six. Defcon is in the top three under every weighting, first under two, and ahead of World Monitor in five of six; World Monitor beats it only when adoption, freshness, polish and languages dominate (66.8 against 61.1). ViEWS climbs to third when the user is a researcher (66.7) and drops to fifth for journalists and mass-market readers, because it is a data service rather than a product. ACLED holds fourth or fifth throughout. Liveuamap, CrisisWatch and the CFR tracker occupy the bottom three, and the CFR tracker is last in all six. Defcon's confidence band (shown in the master table: scores move by 0 for H, 0.5 for M and 1 for L cells) is narrow, 67.8 to 69.4, because nearly all its cells are H. World Monitor's band, 55.3 to 67.3, tops out below Defcon's floor on the baseline. UCDP's band, 61.6 to 74.1, contains Defcon's whole range, so **the honest reading is a three-way top tier of UCDP, Defcon and, in some views, ViEWS or World Monitor, not a winner**.

## Choosing the top 7: a pool of nearly 40 candidates, three tests, and some surprises

**The inclusion test.** A candidate had to pass three tests. **T1, same job for the same user:** it answers "what is happening, how deadly, how risky" for a general or semi-professional reader without a sales call, or (for a benchmark) it answers the same risk question with a published method. **T2, popularity or credibility:** large public reach (stars, visits), citation by the UN or major press, or peer-reviewed standing. **T3, evidence quality:** the notes read enough of the product to score a meaningful share of the 35 parameters at M or H confidence. The seven winners have 20 or more M/H cells each except Liveuamap (16, and only one H), which is in on T2 alone and is flagged as the weakest-evidenced entry. The cut is by the tests, not by rubric score.

**The ranked seven, split by kind.** *Direct look-alikes* (a user could pick them instead of Defcon today): World Monitor, Liveuamap, the UCDP web viewer, ACLED's Explorer, the CFR tracker and CrisisWatch. *Benchmark the product must be measured against:* ViEWS (and, inside ACLED, its CAST forecast). The single overall order is the baseline rubric order: UCDP, World Monitor, ViEWS, ACLED, CrisisWatch, Liveuamap, CFR. UCDP is included even though Defcon ingests its data: the UCDP viewer is a free, no-login map with the same death ranges, so a visitor really can choose it instead ([UCDP](https://ucdp.uu.se/)). The dataset is upstream; the product is a rival.

**Why each of the seven is in.**

| Pick | Test T1 (same job) | Test T2 (reach or credibility) | Test T3 (evidence) |
|---|---|---|---|
| UCDP | Free viewer of human-coded deaths with ranges, no account | Academic standard; Our World in Data builds charts on it | 15 H cells; codebook and downloads read |
| World Monitor | Free no-signup world dashboard with a country instability score | 89,739 stars, 13,820 forks ([GitHub](https://github.com/koala73/worldmonitor)); 4.4 million visits by March 2026 ([AFP](https://www.philstar.com/lifestyle/gadgets/2026/03/16/2514729/gods-view-rise-ai-war-dashboards)) | Homepage, methodology, pricing and live dashboard read |
| ViEWS | Answers "will violence rise" with a published, validated method | Peer-reviewed, 13 institutions in its challenge | Paper and site read; some pages NOT READ |
| ACLED | Event map and forecasts of political violence | Source cited by other dashboards, academic critique literature | Methodology pages read; Explorer behind login |
| CrisisWatch | Monthly "what is getting worse" tracker with alerts | 20-year archive since 2003 | Read via an alternate route; main site bot-walled |
| Liveuamap | The best-known consumer conflict map | Cited by the UN, MSF, NZZ and The Guardian per Wikipedia | Mostly NOT READ (bot wall); secondary sources |
| CFR tracker | Free curated overview of 27 conflicts | Established think tank | HTML and methodology read; rendered map NOT READ |

**Why notable others are out.** Each exclusion is named so the owner can overrule it.

| Candidate (kind) | Why out | What to take from it |
|---|---|---|
| GDELT (open news-event database) | Upstream source Defcon already ingests; a feed, not a destination; its own viewers (GEO API, Analysis Service) were not read live. **First reserve.** | Machine-coded events must stay labelled auto-coded and never become casualty counts |
| ReliefWeb and HDX/HAPI (OCHA hubs) | Upstream data hubs; complementary, free, editorial or dataset catalogues, not event maps | Per-dataset licences mean redistributing HDX layers needs attribution checks |
| God's Eye View (61,017 stars), Crucix (12,153), ShadowBroker (11,400), Osiris (11,394), Monitor the Situation | Same style (globe, feeds) but not conflict monitors: God's Eye View's README shows no conflict deaths or risk score; evidence is README-only; person-tracking, crypto-token and trade-idea red flags | Spectacle drives virality, so a custom 3D globe is not a moat; alert-first design (Crucix) is worth borrowing as feeds |
| Dataminr, Crisis24 Horizon, Seerist/Control Risks, Janes, Everbridge VCC, Flashpoint | Commercial, quote-only, enterprise or government buyers; no free public view; different job (assets, people, defence data) | Crisis24 publishes no free public alert map, which is a gap a free map fills |
| RANE Worldview | $320 a year analysis subscription; articles, no map or data | What journalists buy for narrative context |
| Early Warning Project, INFORM Risk and Severity, EU JRC GCRI, Fragile States Index, Global Peace Index, Conflict Forecast, PITF | Risk indices and forecasting systems; not like-for-like dashboards. ViEWS is the one open, learned, validated system that matches Defcon's design at scale, so it stands in as the benchmark; the Early Warning Project is a close cousin but covers mass killing only, annually | EWP's honest base-rate explanation; INFORM Severity's cross-check of Risk against Severity |
| ISW and Critical Threats maps, DeepStateMap | Single-war territorial products; pages were bot-blocked or a loader, so evidence is too thin | "Assessed versus claimed" cue; tamper-evident change history |
| Global Incident Map | Old human-curated incident map; live site returned HTTP 402, UI NOT READ | Do not copy a feed with hidden provenance |
| Flightradar24, ADS-B Exchange, Copernicus Browser, NASA Worldview | Adjacent verification tools, not event databases | Cheap, credible link-outs from an event card |
| Ukraine Conflict Observatory | Shut down in 2025 when funding was cut | Funding fragility: stay static, cheap, mirrorable |

**The closest competitors are not the ones a layperson would guess.** A layperson would name Dataminr, Liveuamap and the viral 3D-globe repositories. Dataminr and its peers sell by quote to governments and newsrooms. The most-starred globe, God's Eye View, tracks aircraft, ships and cameras and has minor conflict coverage. The nearest rivals for Defcon's actual job are quieter: UCDP's free map, which already offers what Defcon calls its core differentiator (ranges), and ViEWS, which already publishes the validation Defcon's risk index is trying to earn. The most dangerous rival for attention is World Monitor, because it is free, fast, polished and enormous, and every visitor will ask "why not just use that?"

## The master comparison: Defcon wins on method and openness, loses on freshness and reach

**Table 1: every parameter, every product.** Each cell is "score confidence" (for example "4 M"). Columns: WM = World Monitor, LUM = Liveuamap, CW = CrisisWatch, CFR = CFR Global Conflict Tracker. The last three rows give the weighted total, a score band if M and L cells could be off by 0.5 and 1 point, and how many cells are H/M/L.

| # | Parameter | Wt | WM | ACLED | UCDP | LUM | ViEWS | CW | CFR | **Defcon** |
|---|---|---|---|---|---|---|---|---|---|---|
| P1 | Geographic breadth | 2 | 4 M | 5 M | 5 H | 3 M | 5 H | 4 M | 2 H | 4 H |
| P2 | Event-level detail | 4 | 2 M | 4 M | 5 H | 3 L | 1 H | 1 M | 1 H | 4 H |
| P3 | Event-type breadth | 2 | 5 M | 5 H | 3 H | 4 L | 1 H | 3 M | 2 H | 4 H |
| P4 | Historical depth the user can reach | 2 | 2 M | 4 L | 5 H | 3 L | 2 L | 4 M | 1 M | 3 H |
| P5 | Age of newest data on 2026-10-29 | 5 | 4 M | 4 L | 3 M | 4 L | 3 H | 3 M | 3 M | 2 H |
| P6 | Update cadence and reliability | 3 | 4 M | 5 H | 4 M | 3 L | 3 H | 4 M | 3 H | 3 H |
| P7 | Per-record source transparency | 3 | 3 M | 3 M | 4 M | 4 M | 2 M | 2 L | 2 M | 4 H |
| P8 | Verification and human review | 5 | 2 M | 4 M | 5 M | 3 M | 4 M | 3 M | 3 M | 3 H |
| P9 | Human vs automated labelling | 2 | 3 M | 3 M | 4 M | 2 L | 4 M | 3 L | 3 H | 5 H |
| P10 | Uncertainty on counts | 4 | 2 H | 2 H | 5 H | 0 M | 4 M | 0 M | 1 H | 4 H |
| P11 | Honesty about gaps, staleness, provisional data | 3 | 4 M | 3 M | 3 M | 1 L | 3 M | 2 L | 3 H | 4 M |
| P12 | Published method and codebook | 3 | 5 H | 4 M | 5 H | 1 L | 4 H | 2 L | 3 H | 5 H |
| P13 | Versioning, consistency, change history | 2 | 3 H | 3 M | 5 H | 1 L | 3 H | 3 M | 2 H | 4 H |
| P14 | Risk or forecast product with a clear target | 2 | 2 H | 4 H | 0 H | 0 M | 5 H | 3 M | 2 M | 4 H |
| P15 | Published validation and baselines | 5 | 0 H | 1 M | 0 H | 0 M | 5 H | 0 M | 0 H | 3 H |
| P16 | Per-country explanation of the score | 2 | 3 M | 3 M | 0 H | 0 M | 2 M | 2 L | 2 M | 4 H |
| P17 | Map or globe quality | 3 | 4 H | 2 L | 3 H | 3 L | 2 L | 2 L | 1 L | 4 M |
| P18 | Search, filter, drill-down | 2 | 5 M | 3 L | 4 H | 3 L | 2 L | 3 M | 3 H | 5 H |
| P19 | Mobile and responsive | 2 | 4 M | 2 L | 2 L | 4 M | 2 L | 2 L | 2 L | 3 H |
| P20 | Time travel and playback | 2 | 2 M | 3 L | 3 M | 3 L | 2 L | 3 M | 0 M | 5 H |
| P21 | Alerts and watchlists without payment | 3 | 4 M | 1 M | 2 L | 2 L | 0 L | 3 M | 2 L | 2 H |
| P22 | Sharing, embeds, annotation | 2 | 3 M | 2 L | 2 L | 2 L | 1 L | 3 M | 1 L | 3 H |
| P23 | Accessibility evidence | 2 | 0 L | 0 L | 0 L | 0 L | 0 L | 0 L | 0 L | 3 H |
| P24 | Languages | 2 | 4 M | 1 L | 1 L | 2 L | 1 L | 1 L | 1 L | 1 H |
| P25 | Privacy, tracking, ads | 2 | 3 L | 2 M | 3 L | 1 H | 3 L | 2 L | 3 L | 5 H |
| P26 | Performance and availability | 2 | 3 M | 3 L | 3 M | 2 M | 3 L | 2 M | 4 L | 4 M |
| P27 | API, bulk download, export, integrations | 4 | 3 H | 2 H | 4 H | 1 L | 5 H | 1 M | 0 M | 3 H |
| P28 | Data licence and reuse rights | 4 | 2 M | 1 H | 5 H | 1 L | 3 H | 1 L | 0 H | 4 H |
| P29 | Code openness | 2 | 4 H | 0 M | 0 L | 0 M | 3 H | 0 M | 0 M | 5 H |
| P30 | Cost and access barrier | 5 | 4 H | 2 H | 5 H | 3 M | 5 M | 4 M | 5 H | 5 H |
| P31 | Maintenance and sustainability | 3 | 4 H | 4 M | 5 M | 3 M | 4 H | 4 M | 4 M | 2 H |
| P32 | Adoption and reach | 3 | 5 H | 4 L | 4 M | 4 M | 3 M | 3 L | 2 L | 0 H |
| P33 | Institutional credibility and scrutiny | 3 | 2 H | 4 M | 5 M | 3 M | 5 H | 4 L | 3 M | 1 H |
| P34 | Neutrality, map policy, misuse safeguards | 3 | 2 M | 3 L | 4 L | 3 M | 4 L | 2 L | 2 H | 3 H |
| P35 | Context signals and human-cost layer | 2 | 5 M | 1 L | 1 M | 2 L | 1 L | 1 L | 1 M | 5 H |
| | **Weighted total (0-100)** | 100 | **61.4** | **55.6** | **68.0** | **43.0** | **61.4** | **44.8** | **39.2** | **68.6** |
| | Score band if M/L scores move by 0.5/1 | | 55-67 | 45-66 | 62-74 | 30-58 | 54-69 | 32-59 | 33-47 | 68-69 |
| | Confidence mix H/M/L | | 12/21/2 | 7/15/13 | 15/12/8 | 1/15/19 | 14/8/13 | 0/20/15 | 14/12/9 | 32/3/0 |

**Evidence for Table 1** (note file, then section; "P" numbers are the parameters). Notes: `EDP` = event_data_platforms.md, `LOD` = live_osint_dashboards.md, `RIF` = risk_indices_forecasting.md, `CFP` = commercial_and_free_platforms.md, `SELF` = defcon_self_profile.md.

- **World Monitor.** P1 to P4 and P35: LOD section 2 "Coverage", "Event model and geo precision", "Country Instability Index"; P5 and P6: LOD section 2 "Latency", "Data sources, provenance" (lag labels); P7 to P9: LOD section 2 "Data sources, provenance, human vs automated", "Verification and editorial policy"; P10, P11: LOD section 2 "Uncertainty shown to users"; P12, P13: LOD section 2 "CII methodology" and the Gaps list (170 against 196, v8 against v14); P14 to P16: LOD section 2 "Alerting, forecasting" and "Uncertainty" (accuracy page withdrawn); P17 to P20, P22: LOD section 2 "Visual product (seen live)"; P21: LOD section 2 "Alerting, forecasting"; P23: LOD section 2 "Visual product" (accessibility NOT READ); P24, P32: LOD section 2 "Languages and adoption"; P25: LOD section 2 "Accounts, paywalls, ads, tracking, privacy"; P26: LOD section 2 "Latency" (CACHED, 7/40 sources); P27: "API, export, open data"; P28 to P30: "Licence and pricing", "Open-source status"; P31: "Open-source status", "Owner and funding"; P33: "Verification and editorial policy" (AFP); P34: "Neutrality / map policy", "Legal/ToS risk".
- **ACLED.** P1, P3: EDP section 1 "What it measures and coverage"; P2, P10: "Event granularity"; P4: EDP section 1 (coverage NOT READ) and LOD section 6 profile F (1997, competitor-authored); P5, P6: "Update frequency and latency"; P7 to P9: "Sources, provenance, human vs automated"; P11: "Update frequency" and "Visual product" (Conflict Index window); P12, P13: "Methodology transparency", "API" (Deleted endpoint); P14 to P16: "Forecasting and risk metrics" and RIF section 3 (CAST); P15: RIF section 3 "Validation"; P17 to P20, P22 to P24: "Visual product", "Accessibility"; P21, P30: "Alerting, personalisation, accounts", "Pricing and tiers"; P25: "Visual product" (cookie banner); P27: "API, bulk download, export"; P28, P34: "Licence and terms", "Legal or neutrality risks"; P29: "Open source"; P31: "Owner and funding"; P32: "Adoption signals"; P33: "Documented weaknesses and criticisms".
- **UCDP.** EDP section 2: P1, P3, P4: "What it measures and coverage"; P2, P10: "Event granularity and uncertainty"; P5, P6, P11: "Update frequency and latency"; P7 to P9: "Sources and human vs automated"; P12, P13: "Methodology transparency"; P14 to P16: "Forecasting (ViEWS)" (none in UCDP itself); P17 to P20: "Visual product"; P21: "Alerting and accounts"; P27: "API, bulk, export"; P28: "Licence and terms"; P29: "Open source"; P30: "Pricing"; P31: "Owner and funding"; P32 to P34: "Adoption signals", "Documented strengths", "Documented weaknesses", "Legal or neutrality risks".
- **Liveuamap.** LOD section 1: P1, P3: "Coverage"; P2, P4, P5: "Latency, event model, geo precision"; P7, P8: "Data sources, provenance, verification"; P10: "Uncertainty shown to users"; P12, P34: "Editorial and neutrality"; P17 to P20, P23, P24: "Visual product, accessibility" and "Alerting, forecasting, languages, adoption"; P19, P25: "Accounts, paywalls, ads, tracking" (App Store privacy labels); P27 to P28: "API, licence, pricing"; P30: same; P31: "Owner and funding"; P32, P33: "Alerting, forecasting, languages, adoption", "Editorial and neutrality". Cross-check: CFP section 6a.
- **ViEWS.** RIF section 1: P1: "Target and unit"; P5, P6, P11, P13: "Cadence and timeliness", the early-warning-system snapshot bullet; P12, P29: "Model class", "Transparency"; P14, P15: "Published validation", "Out-of-sample design", the 2023/24 challenge bullets; P16: "Explainability to end users"; P27, P28, P30: "Access"; P31: "Owner and funding"; P33: "Independent critique/complement"; also EDP section 2 "Forecasting (ViEWS)" and "Open source" (repo stars, MIT) and the RIF "Method comparison table".
- **CrisisWatch.** EDP section 5: P1, P4: "What it measures and coverage"; P5, P6, P11: "Update frequency and latency"; P2, P10: "Event granularity"; P7, P8, P9: "Provenance, human vs automated"; P12: "Methodology transparency"; P14: "Forecasting"; P17, P18, P20, P22: "Visual product"; P21: "Pricing, alerting, accounts"; P26: "Read-method notes" (Cloudflare) and "Visual product" ("Loading Map"); P27, P28: "API, bulk, export", "Licence and terms"; P31, P34: "Owner and funding", "Legal or neutrality risks".
- **CFR tracker.** EDP section 4: P1, P3: "What it measures and coverage"; P2, P10: "Event granularity"; P5, P6, P11, P13: "Update frequency"; P7 to P9, P12: "Sources, human vs automated", "Methodology transparency"; P14: "Forecasting"; P17, P18: "Visual product"; P27, P28: "API", "Licence and terms"; P30: "Pricing / open source / alerts"; P31 to P34: "Owner and funding", "Adoption", "Legal or neutrality risks". Also LOD section 5 bullet "Other free aggregators".
- **Defcon.** SELF: P1, P4: "Coverage"; P2, P3: "Event model and geo precision", "Data sources and provenance"; P5, P6: "Update latency"; P7 to P9: "Data sources and provenance", "Event model"; P10, P11: "Uncertainty shown to users"; P12, P13: "Methodology transparency"; P14, P15: "Forecasting or risk"; P16: "Forecasting or risk" and "Uncertainty"; P17 to P20: "Visual product"; P19: "Visual product" (mobile); P21: "Alerting and personalisation"; P22: "API, exports" (share links, no embed); P23: "Accessibility"; P24: "Coverage" (languages); P25: "Privacy, accounts, tracking, security headers"; P26: "Performance and size"; P27: "API, exports, open data"; P28 to P29: "Owner, funding, licence", "Open-source status"; P30: "Pricing"; P31: "Owner, funding, licence", weakness 16; P32: "Adoption signals"; P33: "Testing and quality assurance" (AI reviewers), "Methodology transparency" (no independent review); P34: "Governance and neutrality"; P35: "Strengths" (evidence trail, signals), "Data sources".

**Table 2: compact version, points earned per group.** Read each cell against the group maximum shown in the first column. This is the table to scan.

| Group (max points) | WM | ACLED | UCDP | LUM | ViEWS | CW | CFR | **Defcon** |
|---|---|---|---|---|---|---|---|---|
| Data coverage and depth (10) | 6.0 | 8.8 | 9.2 | 6.4 | 4.0 | 5.2 | 2.8 | 7.6 |
| Freshness and latency (8) | 6.4 | 7.0 | 5.4 | 5.8 | 4.8 | 5.4 | 4.8 | 3.8 |
| Provenance and verification (10) | 5.0 | 7.0 | 9.0 | 6.2 | 6.8 | 5.4 | 5.4 | 7.4 |
| Uncertainty communication (7) | 4.0 | 3.4 | 5.8 | 0.6 | 5.0 | 1.2 | 2.6 | 5.6 |
| Methodology transparency (5) | 4.2 | 3.6 | 5.0 | 1.0 | 3.6 | 2.4 | 2.6 | 4.6 |
| Forecasting and risk validation (9) | 2.0 | 3.8 | 0.0 | 0.0 | 7.8 | 2.0 | 1.6 | 6.2 |
| Visual product and UX (7) | 6.0 | 3.2 | 4.2 | 4.6 | 2.8 | 3.2 | 2.6 | 5.6 |
| Time travel and history (2) | 0.8 | 1.2 | 1.2 | 1.2 | 0.8 | 1.2 | 0.0 | 2.0 |
| Alerting and personalisation (3) | 2.4 | 0.6 | 1.2 | 1.2 | 0.0 | 1.8 | 1.2 | 1.2 |
| Collaboration and sharing (2) | 1.2 | 0.8 | 0.8 | 0.8 | 0.4 | 1.2 | 0.4 | 1.2 |
| Accessibility and languages (4) | 1.6 | 0.4 | 0.4 | 0.8 | 0.4 | 0.4 | 0.4 | 1.6 |
| Performance and privacy (4) | 2.4 | 2.0 | 2.4 | 1.2 | 2.4 | 1.6 | 2.8 | 3.6 |
| API, exports and open data (4) | 2.4 | 1.6 | 3.2 | 0.8 | 4.0 | 0.8 | 0.0 | 2.4 |
| Licensing and openness (6) | 3.2 | 0.8 | 4.0 | 0.8 | 3.6 | 0.8 | 0.0 | 5.2 |
| Cost and access (5) | 4.0 | 2.0 | 5.0 | 3.0 | 5.0 | 4.0 | 5.0 | 5.0 |
| Reliability and maintenance (3) | 2.4 | 2.4 | 3.0 | 1.8 | 2.4 | 2.4 | 2.4 | 1.2 |
| Adoption and credibility (6) | 4.2 | 4.8 | 5.4 | 4.2 | 4.8 | 4.2 | 3.0 | 0.6 |
| Neutrality and legal risk (3) | 1.2 | 1.8 | 2.4 | 1.8 | 2.4 | 1.2 | 1.2 | 1.8 |
| Extra metrics the notes surfaced (2) | 2.0 | 0.4 | 0.4 | 0.8 | 0.4 | 0.4 | 0.4 | 2.0 |
| **Total (100)** | **61.4** | **55.6** | **68.0** | **43.0** | **61.4** | **44.8** | **39.2** | **68.6** |

**What the compact table says.** Defcon's group scores fall into three bands. It is **first or joint first** in licensing and openness (5.2 of 6, the highest), privacy and performance (3.6 of 4), time travel (2.0 of 2), context signals (2.0 of 2, shared with World Monitor) and cost and access (5.0 of 5, shared with UCDP, ViEWS and the CFR tracker), and second in methodology transparency (4.6 of 5, behind UCDP's 5.0). It is **second tier** on coverage (7.6 of 10 against UCDP 9.2 and ACLED 8.8), provenance (7.4 of 10 against UCDP 9.0), uncertainty (5.6 of 7 against UCDP 5.8), forecasting (6.2 of 9 against ViEWS 7.8) and visual product (5.6 of 7 against World Monitor 6.0). It is **last or nearly last** on freshness (3.8 of 8, the lowest of all eight), adoption and credibility (0.6 of 6, the lowest), and reliability and maintenance (1.2 of 3, the lowest). The shape is the signature of a project that is very strong on how it works and untested on whether anyone depends on it.

Two score patterns deserve a plain explanation. First, the competitors score 0 on accessibility only because no note found evidence, and that is the largest single asymmetry in Defcon's favour (3 against 0, worth 1.2 points of the total). Second, UCDP's 0 on forecasting (9 points of the rubric) is the main reason it does not run away with the ranking; under the journalist weighting, where forecasting counts for 2.3 points, it leads Defcon by 3.6.

**Table 3: hard facts, part A (money, licence, openness, accounts, tracking).** All facts as of the read date 2026-10-29. "Not read" means the note could not read it.

| Product | Price | Licence | Open source | Account needed | Ads and tracking |
|---|---|---|---|---|---|
| World Monitor | Free tier $0. Pro $39.99 a month or $359.99 a year; Pro Business $49.99 a month; API Starter $99.99; API Business $299.99; Enterprise custom ([pricing](https://www.worldmonitor.app/pricing.md)) | Code AGPL-3.0, commercial licence offered; some upstream data non-commercial ([GitHub](https://github.com/koala73/worldmonitor)) | Yes: 89,739 stars, 13,820 forks, last push 2026-10-29 | Dashboard: no. Free MCP calls need a free account; "Sign In" and "Upgrade to Pro" were visible | No ads reported (snippet); privacy policy not read |
| ACLED | Open tier free; higher tiers "contact ACLED", no prices published ([myACLED FAQ](https://acleddata.com/myacled-faqs)) | Proprietary EULA: non-commercial, no redistribution, no competing products, AI use restricted ([EULA](https://acleddata.com/eula)) | No official repository found | Yes for Explorer and CAST; tier set by e-mail domain (Gmail gets Open) | Cookie banner with a Decline button; tracking not read |
| UCDP | Free | CC BY 4.0 for all datasets ([downloads](https://ucdp.uu.se/downloads/)) | Site code not found; related ViEWS repositories are MIT | No for web app and downloads; the API needs a token requested by e-mail ([API docs](https://ucdp.uu.se/apidocs/)) | None seen; policy not read |
| Liveuamap | Web free with ads. iOS app (Australian store) $2.99 a month or $14.99 half-year; API $150 a month (200 requests a day) and from $1,000 a month, as read by a competitor, unverified ([App Store](https://apps.apple.com/au/app/liveuamap/id1003808504)) | Terms not read; no open data | None found | Not for the web map (app: not read) | Ads; privacy labels list device ID for ads, precise and coarse location, e-mail, crash data; app rated 2.5 of 5 from 16 ratings |
| ViEWS | Free | Data: no licence named on the site. Pipeline repository CC BY-NC-SA 4.0 ([README](https://github.com/prio-data/views_pipeline/blob/main/README.md)); three other repositories MIT | Yes, with 2 to 5 stars each | No | None seen; not stated |
| CrisisWatch | Free to read; a Subscribe link exists, terms not read | Terms not read | None found | No, to read | Bot challenge (Cloudflare); tracking not read |
| CFR tracker | Free to read | CFR owns the content: no selling, modifying or public reproduction ([terms](https://www.cfr.org/terms-use)) | No | No | Not read |
| **Defcon** | Free, no ads | MIT code. Data files keep upstream licences: CC BY 4.0 (UCDP, World Bank, UNHCR, GDACS), public domain (Natural Earth, USGS), GDELT "cite the GDELT Project", FIRMS acknowledgement | Yes, public, v1.0.0, **0 stars** | No | No cookies, analytics or third-party requests; enforced by `connect-src 'self'` |

**Table 4: hard facts, part B (data, cadence, coverage, API).**

| Product | Newest data on 2026-10-29 | Update cadence | Countries or scope | API and exports |
|---|---|---|---|---|
| World Monitor | Homepage newest news item 25 Oct 2026; in the reader's session the instability panel showed "CACHED" and "7/40 sources" | Free tier "typically every 5-15 minutes" | Instability score for 31 countries; resilience for 196 (homepage elsewhere says 170); 59 layers | REST, MCP (99 tools), SDKs; CSV/JSON/PDF export only in Pro Business and above |
| ACLED | Not visible (login wall). Public Conflict Index newest date 11 Dec 2025 (data to 28 Nov 2025) | Weekly files by region, expedited Thursday upload, daily for select places; CAST weekly or monthly (notes conflict) | Conflict Index scores every country and territory | API only from the Research tier (institutional e-mail), up to 5,000 events a call; Open has none |
| UCDP | Candidate file 26.0.9 (September 2026) covers January to September 2026; newest event date not read; final GED 26.1 ends 2025-12-31 | Candidate monthly; final yearly | Global; GED 1989 to 2025; an event needs at least one death | Free API with e-mail token (3 to 5 working days, 5,000 requests a day); CSV and Excel bulk |
| Liveuamap | Not read (bot wall) | "Real-time" per a third-party guide; unmeasured | Ukraine/Russia, Syria, Yemen, Arab-Israeli conflict and others | Paid only |
| ViEWS | Forecasts for Sep 2026 to Aug 2029 posted 30 Sep 2026, 29 days old; input data to Aug 2026 | "Monthly" in the text; notices dated 30 Jun and 30 Sep | Worldwide country-month; 0.5 degree grid for Africa and the Middle East; 1 to 36 months | CSV, JSON codebook, REST API, free |
| CrisisWatch | "September trends and October alerts" edition; publication date not read | Monthly; archive since 2003 | 70+ monitored plus 50+ on standby | PDF and print only |
| CFR tracker | India-Pakistan entry "Last updated October 28, 2026"; other entries not read | Each conflict reviewed at least quarterly | 27 conflicts | None |
| **Defcon** | Auto-coded: 2026-10-29 00:45 UTC (9.2 hours old). Human-coded: **2026-08-31 (59.4 days old)**. No events on the globe from 2026-09-01 to 2026-10-18 | Cron every 3 hours; observed gaps 2.4 to 8.6 hours; conflicts, indices, timeline, displacement refreshed by hand | 248 dossiers; events in 165 countries (recent) and 84 (archive); indices for 130; 104 conflicts | Static JSON with open CORS and browser-built CSV; no versioned API, schema, GeoJSON or per-event export |

**Evidence for Tables 3 and 4.** World Monitor: LOD section 2 "Licence and pricing", "Open-source status", "Accounts, paywalls", "Latency", "API, export, open data", "Languages and adoption". ACLED: EDP section 1 "API, bulk download, export", "Licence and terms", "Pricing and tiers", "Update frequency and latency", "Visual product" (Conflict Index date), "Alerting, personalisation, accounts". UCDP: EDP section 2 "Update frequency and latency", "API, bulk, export", "Licence and terms", "Pricing", "Open source". Liveuamap: LOD section 1 "Accounts, paywalls, ads, tracking", "API, licence, pricing", "Latency, event model, geo precision", "Coverage"; CFP section 6a. ViEWS: RIF section 1 "Cadence and timeliness", "Access", "Transparency"; EDP section 2 "Open source". CrisisWatch: EDP section 5 "Update frequency and latency", "What it measures and coverage", "API, bulk, export", "Licence and terms". CFR: EDP section 4 "What it measures and coverage", "Update frequency", "Licence and terms". Defcon: SELF "Owner, funding, licence", "Update latency", "Coverage", "API, exports, open data", "Privacy, accounts, tracking", "Open-source status", "Pricing".

## Seven profiles: what each does better, what makes it special, and what to learn

Each profile answers the same questions in the same order. Claims come only from the notes; where a note could not read something, the profile says so.

### 1. UCDP (Uppsala Conflict Data Program): the academic standard that Defcon stands on

**What it is and who uses it.** A research programme at Uppsala University's Department of Peace and Conflict Research, started in the mid-1980s and funded mainly by Swedish research bodies, with 10 to 15 staff ([UCDP background](https://uu.se/en/department/peace-and-conflict-research/research/ucdp/about-ucdp/ucdp-background)). Its Georeferenced Event Dataset (GED, version 26.1) covers 1989-01-01 to 2025-12-31, and monthly "Candidate" files add provisional 2026 events ([GED codebook](https://ucdp.uu.se/downloads/ged/ged261.pdf)). Our World in Data builds charts on it, and Defcon itself is built on it.

**Real strengths.** Every dataset is CC BY 4.0, "free to use and redistribute" with citation ([downloads](https://ucdp.uu.se/downloads/)). Every event carries best, low and high fatality estimates, deaths by side and civilians, and precision codes for place, date and clarity. API calls name a version and return the same data "indefinitely" ([API docs](https://ucdp.uu.se/apidocs/)). The web map needs no login and shows a conflicts-by-year chart, a country-in-conflict view and a fatalities view.

**Weaknesses and criticisms.** Counting is "highly conservative": the threshold excludes events by "unidentified armed groups" that ACLED records ([EUAA note](https://www.euaa.europa.eu/coi-report-afghanistan-country-focus/sources-security-incidents), snippet). A 2026 coder-survey paper argues UCDP probably undercounts deaths (snippet, unverified). Final data lags about a year, Candidate data is provisional, and the API now needs a manually issued token. In the pages the notes read, the viewer shows no risk score, and no accessibility statement was found.

**USP and what is special.** Low/best/high estimates on every event, stable definitions built for comparison across decades, and a sibling forecasting system (ViEWS). It is the only product in the set that publishes a range for each death count.

**What Defcon does better.** A 3D globe with a time scrubber, 248 country dossiers, a Fatality Index and a Violence Risk Index with a backtest, signals (fires, explosions, disaster alerts), displacement, a sourced timeline, a watchlist and browser exports, plus an auto-coded layer for the days before UCDP publishes. It also explains ranges to lay readers.

**What Defcon does worse.** History (events for 365 days against 37 years), definitions backed by a team and decades of citation, and independence from any one funder. Its human-coded layer can never be fresher than UCDP's release and is currently one release behind.

**Learn, and do not copy.** Learn versioned, immutable releases, written definitions and release notes. Do not copy the annual lag for final data or the manual token barrier. Treat dependence as a risk: if UCDP changes its licence or access, Defcon's human-coded layer stops.

### 2. World Monitor: the look-alike with mass reach and no validation

**What it is and who uses it.** A free, no-signup dashboard and open-source repository (AGPL-3.0) created in January 2026 by Elie Habib, with **89,739 stars and 13,820 forks** by 2026-10-29 ([GitHub](https://github.com/koala73/worldmonitor)). It claims 59 map layers, 468 feeds and 28 languages ([homepage](https://www.worldmonitor.app)), "2M+ users" (self-reported), and AFP reported 4.4 million visits by March 2026 ([AFP](https://www.philstar.com/lifestyle/gadgets/2026/03/16/2514729/gods-view-rise-ai-war-dashboards)). Revenue comes from Pro, API and enterprise tiers ([pricing](https://www.worldmonitor.app/pricing.md)).

**Real strengths.** Its Country Instability Index methodology is published down to the formula and version (v14, 2026-10-21), and it states its own limits unusually plainly: the weights are "editorial, not empirical" and the score is "a triage tool, not a forecast" ([CII methodology](https://www.worldmonitor.app/docs/methodology/cii-risk-scores.md)). Missing data is "shown as unavailable rather than zero", and sources carry freshness labels ([data sources](https://www.worldmonitor.app/docs/data-sources)). It adds a REST API, an MCP server, SDKs, workspaces, a Cmd-K search and free-tier watchlists and breaking alerts.

**Weaknesses and criticisms.** The score covers only **31 countries**, has no backtest, and ACLED data is not accessible, so GDELT media signals carry much of the conflict term. Its AI forecast scorecard is withdrawn: an audit open since 2026-10-07 found three scoring errors, and **11 of 17 resolved forecasts were void** ([accuracy page](https://www.worldmonitor.app/accuracy)). AFP and experts flagged hallucination risk and unconfirmed pins. Its own pages disagree (170 against 196 countries; methodology v8 against v14). In the reader's session the instability panel ran on cache with 7 of 40 sources, CSV export is paid, and the free tier limits dashboard tabs to three.

**USP and what is special.** Breadth plus price plus momentum: 59 layers, most of them free, a stream of daily pushes, and a public "accuracy" page, which is rare even if it currently shows a failure.

**What Defcon does better.** Depth and checkability: human-coded deaths with ranges, a published backtest against a stated baseline, MIT rather than AGPL, no account tiers or upsell, free exports, no tracking, and an India-official map (World Monitor's border policy was NOT READ).

**What Defcon does worse.** Freshness (5 to 15 minutes claimed against 3 hours nominal), breadth of layers, languages, API and MCP ecosystem, alerts, a polished multi-workspace product, and above all reach and momentum.

**Learn, and do not copy.** Learn the formula page with version numbers and a changelog, per-source lag labels and "unavailable, not zero". Do not copy a score of unknown validity, an AI forecast panel without a working scorecard, or domain-mixing (markets, data centres) inside a conflict score. Never copy its code: the AGPL network clause would oblige Defcon to release anything derived from it ([GitHub licence](https://github.com/koala73/worldmonitor)). Defcon must have a ready answer to "why not just use World Monitor?": depth, validation and neutrality, not layer count.

### 3. ViEWS (Violence and Impacts Early-Warning System): the benchmark for the risk index

**What it is and who uses it.** A forecasting system co-hosted by Uppsala University and PRIO, with funders including the European Research Council, UN ESCWA, the UK FCDO and UNHCR. It publishes worldwide country-month forecasts and 0.5 degree grid forecasts for Africa and the Middle East, 1 to 36 months ahead; the latest release, Sep 2026 to Aug 2029, was posted 30 Sep 2026 ([ViEWS](https://viewsforecasting.org/)). Users are researchers and humanitarian planners; thirteen institutions took part in its 2023/24 prediction challenge ([PRIO](https://www.prio.org/news/3602)).

**Real strengths.** Peer-reviewed validation: on the 2015 to 2017 country-month test, the 2019 ensemble reached AUROC 0.9555, average precision 0.869 and Brier 0.0932, against a baseline AUROC of 0.8238 ([Hegre et al. 2019](https://kops.uni-konstanz.de/server/api/core/bitstreams/197041e4-3a22-46b3-8ac4-1d0f6c75b916/content)). Its challenges use true-future windows, an independent scoring committee and full probability distributions scored by CRPS ([arXiv](https://arxiv.org/abs/2407.11045)). Data, a JSON codebook and a REST API are free.

**Weaknesses and criticisms.** The strongest evidence is also a warning: in the interim challenge results of 26 Feb 2025, the organisers' simple "conflictology" baseline led every contestant model ([PRIO](https://www.prio.org/news/3602)). A critique finds forecasts hover near the mean and miss surges and declines ([JPR 2025](https://academic.oup.com/jpr/article/62/6/2052/8435458)). The pipeline repository is CC BY-NC-SA and "not yet ready for operational use" ([README](https://github.com/prio-data/views_pipeline/blob/main/README.md)); parts of the site are stale (a June 2025 dashboard snapshot); the text says monthly while notices are dated 30 Jun and 30 Sep. Final 2023/24 scores were NOT READ.

**USP and what is special.** Scale, an ensemble, full probabilistic output, a 36-month horizon, and open competitions that crowdsource improvement. It is a data service, not a consumer product.

**What Defcon does better.** Legible binary targets ("at least 25 deaths in the next three months", "sharp rise"), a per-country "why this score", 90% intervals and calibration bins shown to ordinary readers, MIT code, and a live product around the numbers. **What Defcon does worse.** Scale (130 countries, 3 months, no grid), an independent true-future evaluation, peer review, and an ensemble. Defcon's backtest is by its own authors on features chosen after seeing 2021 to 2025.

**Learn, and do not copy.** Learn to publish an empirical-history baseline and a last-value baseline beside every model, to report average precision and Brier alongside AUC, and to score on true-future windows. ViEWS's 0.9555 AUROC is dominated by persistence (the history theme alone gives 0.9442), so it is not comparable with Defcon's 0.8455 for the harder "rise" target; Defcon's like-for-like figure is the "continue" AUC of 0.9831 against a persistence baseline of 0.9718. Do not copy long-horizon claims Defcon cannot support, a non-commercial code licence, or stale sub-pages.

### 4. ACLED: the richest event data, behind a wall

**What it is and who uses it.** A US non-profit publishing weekly, human-coded political-violence, protest and strategic-development events, plus a Conflict Index and the CAST forecast ([about](https://acleddata.com/about-acled)). Owner-published user numbers were not found; World Monitor and other dashboards say they use it.

**Real strengths.** A broad event definition with no fatality threshold, a published weekly schedule (Monday and Tuesday by region, an expedited Thursday upload, daily data for select places) ([update schedule](https://acleddata.com/use-access/when-are-acled-data-updated)), and CAST, a gradient-boosted forecast of event counts by type six four-week periods ahead with intervals from rolling cross-validation ([CAST methodology](https://acleddata.com/methodology/cast-methodology)).

**Weaknesses and criticisms.** The free Open tier has **no API and no event-level data**; the Explorer shows an anonymous visitor only a registration prompt ([Explorer](https://acleddata.com/platform/explorer)). The EULA allows non-commercial internal use only, requires external material to be "transformative", forbids scraping and bars competing products ([EULA](https://acleddata.com/eula)). Fatalities are one number per event with vague words coded as 10 or 12, and ACLED itself says they may be undercounted ([fatalities methodology](https://acleddata.com/methodology/fatalities)). It publishes no AUC, Brier or calibration that the notes could find, and the page says accuracy metrics exist but gives none. Critics note uneven quality control and media-source reliance (snippets).

**USP and what is special.** A weekly, human-coded stream that includes non-lethal events, with a forecast attached.

**What Defcon does better.** No login, a visible "newest data" date, ranges instead of single numbers, open code and open data, and published validation. **What Defcon does worse.** Event breadth (protests and riots are only auto-coded in Defcon), weekly human-coded freshness, subnational forecasts, and institutional trust.

**Learn, and do not copy.** Learn the explicit schedule per region and the conformal-style low/high scenarios. Do not ingest ACLED event data or call its API: the EULA bars redistribution and competing datasets, and the Open tier has no API. Link out to it with attribution, and say plainly that Defcon uses UCDP.

### 5. CrisisWatch (International Crisis Group): the expert monthly tracker

**What it is and who uses it.** A monthly, analyst-written tracker of "over 70 conflicts and crises" plus standby monitoring of more than 50, with trend arrows, "Risk Alert" and "Resolution Opportunity" flags, a searchable archive back to 2003, and a companion "On the Horizon" outlook for three to six months ([CrisisWatch](https://www.crisisgroup.org/ku/crisiswatch)). The edition seen on 2026-10-29 reported five situations worsening in September (Afghanistan, Ethiopia, Pakistan, Saudi Arabia, Yemen) and seven risk alerts for October. The notes do not state who uses it; PDF, print and e-mail subscription point to professional readers (inference).

**Real strengths.** Named expert analysis, more than 20 years of archive, early-warning and positive "resolution opportunity" flags, share, print and PDF delivery.

**Weaknesses and criticisms.** The main site sits behind a Cloudflare challenge (HTTP 403 to automated fetches), so the map showed only "Loading Map" in the reader's capture. It is monthly and qualitative: no counts, no coordinates, no export, no published accuracy. Its sourcing criteria and methodology text were NOT READ. The notes describe the owner as an advocacy-leaning think tank with government and foundation donors, based on older funding mixes.

**USP and what is special.** Expert risk alerts and the "resolution opportunity" idea, with a 2003 archive.

**What Defcon does better.** Numbers, daily-scale freshness, open licence and export, and no bot wall. **What Defcon does worse.** Expert judgement, narrative depth, a long archive and curated early warning.

**Learn, and do not copy.** Learn positive-change flags and a legend for trend colours. Do not copy unquantified arrows with no stated criteria.

### 6. Liveuamap: the best-known consumer conflict map

**What it is and who uses it.** An event-pin news map founded in 2014, now with mobile apps, ad-funded with a paid tier and paid API. Wikipedia lists the UN, MSF, NZZ and The Guardian among its users ([Wikipedia](https://en.wikipedia.org/wiki/Liveuamap)). The site and its terms were bot-walled, so most detail is second-hand.

**Real strengths.** The longest-running brand; an event appears only after at least two members confirm it; each pin has a source link; many regional maps and a dated archive; Media Bias/Fact Check rates it "Least Biased" and "Mostly Factual" ([MBFC](https://mediabiasfactcheck.com/live-universal-awareness-map-bias/)). A third-party guide describes updates as real time (unmeasured).

**Weaknesses and criticisms.** MBFC and a mapping guide say it relies heavily on unverified sources ([guide](https://ukraine-war-analytics.com/analysis/frontline-mapping-methods.html)); no uncertainty range or confidence is shown in any source; ownership is opaque; the iOS app is rated 2.5 of 5 from 16 ratings in the Australian store, with intrusive ads and device-ID and location tracking in its privacy labels ([App Store](https://apps.apple.com/au/app/liveuamap/id1003808504)). History and the API are paid (prices as read by a competitor, unverified).

**USP and what is special.** Minute-level social-media pins with human confirmation, on a brand people already know.

**What Defcon does better.** Stated uncertainty, a public method, open exports, no ads or tracking, quantified severity. **What Defcon does worse.** Latency (minutes against a 3-hour build), breadth of minor incidents, native apps and brand familiarity.

**Learn, and do not copy.** Learn the two-person confirmation rule as a model for the timeline. Do not copy ad funding or opaque ownership. Never claim to be live; say "updated every 3 hours" and mean it.

### 7. CFR Global Conflict Tracker: the quick curated overview

**What it is and who uses it.** A Council on Foreign Relations tracker of **27 conflicts** with filters for type, status (worsening, improving, unchanging, developing) and "impact on the U.S." (high, medium, low), produced by its Wachenheim Center ([tracker](https://www.cfr.org/global-conflict-tracker), [methodology](https://www.cfr.org/global-conflict-tracker/methodology)). Owner-published usage figures were not found.

**Real strengths.** Readable analyst context, a "Last Reviewed" date on each entry (the India-Pakistan entry read "Last updated: October 28, 2026"), a public methodology, and a clear statement that status labels are "analytical judgments rather than legal determinations".

**Weaknesses and criticisms.** No data, no counts, no ranges, no API; at least quarterly review; a deliberately US-centric lens; CFR's terms forbid reproducing or modifying its content ([terms](https://www.cfr.org/terms-use)). Whether its map exists and how it draws Kashmir were NOT READ.

**USP and what is special.** A built-in "impact on the U.S." rating, aimed at policy readers.

**What Defcon does better.** Numbers with sources, an open licence, downloads, a map and a model. **What Defcon does worse.** Concise editorial summaries for a reader who wants "what matters" in one list.

**Learn, and do not copy.** Learn the visible "last reviewed" date on every entry, which Defcon's timeline already half does. Do not copy an unexplained impact score or all-subjective status labels with no tested method.

## Defcon's verified advantages are real; its gaps are specific and urgent

### What is genuinely different and better, with the proof

The self-profile checked each item below against code, documents or the live site on 2026-10-29. Where a competitor claim is mentioned, it comes from the competitor notes. The wording matters: these are advantages in the **combination** offered. The notes do not support saying that no competitor does any one of them.

| Advantage | Proof in the notes | Honest caveat |
|---|---|---|
| Every event carries a human-coded or auto-coded flag, and auto-coded events can never exceed severity 3 | Live snapshot decode: 0 of 11,629 recent events human-coded, 17,273 of 17,273 archive events human-coded; maximum auto severity 3; 359 human events at severity 4 or 5 (SELF "Data sources and provenance", "Strengths"; docs/SEVERITY.md) | Today the whole recent window is auto-coded, so the flag mostly reports a weakness |
| Death counts shown with low-high ranges, and risk with 90% intervals | `RangeBar` whiskers for 30, 90 and 365 days (D-055); 100-replicate cluster bootstrap in indices.json (SELF "Uncertainty shown to users") | UCDP already supplies the ranges; the intervals cover training uncertainty only; a range can collapse to 13,280-13,280 when UCDP's high equals best |
| A published, regenerated backtest with year-by-year results and a calibration table, guarded by a test | docs/INDEX-BACKTEST.md: "rise" AUC 0.8455 against 0.7424 for recent deaths alone, average precision 0.2333 on a 5.1% base rate; "continue" AUC 0.9831 against 0.9718; rolling yearly "rise" AUC 0.80 to 0.92, above baseline every year; tail bucket predicted 37.6%, observed 34.6%; the first model's overconfidence (predicted 62%, observed 38%) is recorded (SELF "Forecasting or risk") | Own authors, features chosen after seeing 2021 to 2025, no untouched hold-out, no outside review, and "continue" is mostly persistence |
| Among the dashboards in the set, no other publishes a validated conflict risk score | World Monitor's own page says its weights are "editorial, not empirical" and its scorecard is withdrawn; ACLED publishes no AUC or Brier that the notes could find (LOD "Cross-cutting findings"; EDP section 1) | ViEWS does publish validation, but as a data service and for a different target |
| MIT code with documented data licences, and exports with a formula-injection guard | LICENSE, docs/OPEN-DATA.md, `src/exports/csv.ts` (SELF "Owner, funding, licence", "API, exports") | No single data-licence file; data files mostly lack licence headers; timeline licence unstated |
| No account, no cookies, no analytics, no third-party requests, enforced by the browser | Live headers: `default-src 'self'`, `connect-src 'self'`, `frame-ancestors 'none'`, HSTS, COOP, CORP (SELF "Privacy"); contrasts with Liveuamap's ad-ID tracking labels | The About page omits the watchlist's local-storage key |
| India-official map by policy, guarded by tests and an outline hash | docs/MAP-POLICY.md; tests/map/ (SELF "Governance and neutrality") | A political choice others may contest; cross-check is a 4 km registration, "not proven identical" |
| Provenance discipline and self-correction | SHA-256 pins for UCDP and Natural Earth; per-source licence tables; D-027 reverses the project's own wrong Shaksgam claim (SELF "Strengths") | Reproduction needs re-downloading gitignored raw inputs |
| Evidence trail and context signals, always labelled as context | Event card lists fires within 40 km and 2 days, explosion-type quakes within 100 km and 3 hours, disaster alerts within 300 km and 7 days (D-063); UNHCR displacement shown as people, not deaths | Fires are mostly vegetation fires; no corroboration score by design |
| A small bundle and zero running cost | JS 269,820 B gzip total, 245,856 B initial; static files on Vercel Hobby and GitHub Actions (SELF "Performance and size") | Headroom is about 4 to 5 KB; 60 fps measured only in a 465 px in-app pane |
| Time-travel permalinks and a playable scrubber | `&t=<unix>` links; Play replays a week in 14 s (D-043, D-063) | Capped at 365 days |

### The harsh, specific gaps

The self-profile lists 23 weaknesses; the ones that most change a visitor's trust or the rubric score are below, in order of urgency.

1. **The human-coded layer is 59 days stale, and UCDP has already published the next file.** The newest UCDP event in the live site is 2026-08-31, and `GEDEvent_v26_0_9.csv` returns HTTP 200 while the pinned manifest ends at 26.0.8. This is the **single most urgent fix**. The monthly alert workflow that is meant to catch this has never run; its first scheduled run is 2026-11-05.
2. **The globe has a 49-day hole.** Archive events end 2026-08-31 and recent events start 2026-10-19, so 2026-09-01 to 2026-10-18 has none. Every event in the recent window (11,629) is auto-coded, which makes the tension index non-comparable and leaves the Pulse Border lime for now. The README promises "a gap is never a sign of calm", but the gap is announced only by a legend and a pill (inference; the legend code was not inspected).
3. **"Every 3 hours" is a target, not a guarantee.** The last 20 successful scheduled runs were 2.4 to 8.6 hours apart and the snapshot was 8.9 hours old at read time. Conflicts, indices, timeline, displacement and dossiers are refreshed by hand; indices are not in CI.
4. **Zero adoption and one maintainer.** 0 stars, 0 forks, 0 watchers; 151 commits by one account over 2026-10-18 and 2026-10-19; AI-assisted authorship and AI reviewers, no human code review; the last human commit was 2026-10-19; two Dependabot pull requests have been open since 2026-10-25. There is no analytics by design, so reach cannot even be measured.
5. **The risk model has had no outside look.** Intervals ignore model error; features were tuned after seeing 2021 to 2025; the "rise" average precision is 0.2333, so many high-ranked months will be false alarms; the index covers 130 of 248 countries; and there is no empirical-history baseline, which is the benchmark that beat every entrant in the ViEWS challenge interim results.
6. **Nothing verified on real hardware.** No real phone, no Safari or Firefox pass, no real screen reader, no slow-device test of the quality governor, no end-to-end browser test, and axe runs in jsdom with the colour-contrast rule off. No tablet layout.
7. **Event coverage is narrow where it matters for protest.** Protests and riots are GDELT-only and auto-coded; GDELT is noisy and US-centric, so the Hotspots rail ranks the US and UK first; unrest is not in the risk index.
8. **The timeline is thin and AI-written.** 46 entries in four theatres, latest 2026-10-16, no Sudan, Yemen/Red Sea, Myanmar or Sahel, no Reuters, AP, BBC or Guardian, and no human newsroom check.
9. **Capabilities missing against rivals.** No alerts when no tab is open, no embeds (iframes are blocked by design), English only with `en-US` formatting hard-coded, no service worker so no offline use, no per-event export or GeoJSON, no `#e=` event links, 365 days of event history.
10. **Housekeeping debt.** Several docs are stale (ROADMAP.md still says the repo is private and plans are pending); the budget script passes silently when `dist/` is missing; no robots.txt, sitemap or security contact; Factbook-derived fields are archived (data date 2026-01-22).

## The roadmap: fresh data first, checkable claims second, reach third

**What "state of the art" means here.** For a free, one-maintainer, static conflict monitor it does not mean matching Dataminr's sub-minute detection or ViEWS's 36-month ensembles; the notes show both need teams and paid feeds. It means five things a rival cannot easily copy: human-coded data no more than about 45 to 60 days old and visibly labelled; a risk model whose claims are checked forward in time and by an outsider; open, versioned, reusable data; accessibility and phones that are verified rather than assumed; and a few independent users who rely on it. Every item below is aimed at one of these.

**Constraints every item respects.** Free hosting only (GitHub Actions and Vercel Hobby, with Hobby's 100 deployments a day noted in D-047). No account or token is created by the maintainer, so automation uses only the built-in `GITHUB_TOKEN`, and UCDP data comes from its public CSV files, not the token-gated API (D-028). The machine has 7.4 GB of RAM, so any heavy job (a model rebuild, a browser test run) runs alone, and the project's own parallelism rules apply. One maintainer, so each item has a size, and "L" items are ongoing. The India-official map and its guard tests stay mandatory, including on any embed route. Wording stays "risk estimate", never "will", and the product never claims to be the official US DEFCON level. Effort scale: **S** = up to two days; **M** = one to three weeks; **L** = more than a month, part-time.

**Where the roadmap comes from in the repo.** The open items below are the ones the project itself deferred: UCDP candidate ingestion and the "human-coded 0%" note (BACKLOG Plan 2 and Plan 7), unattended refresh and a conformal or walk-forward interval (Plan 11 deferred), the real-device and screen-reader pass (Plan 6 and Plan 13 still open), more timeline theatres and better sources (Plan 9 deferred), fairer hotspots (Plan 7), `#e=` links and tab-synchronised watchlists (Plan 14 and 15 deferred), and the two v1.1 items with no plan, the Indicators desk and Story mode (BACKLOG Plan 14 and 15 deferred; BRAINSTORM-v1.1 sections 4 and 9). Those two are deliberately not scheduled here, because neither closes a gap this analysis found; revisit them after the launch (X5) if real users ask. Some repo documents are stale: ROADMAP.md still describes a private repository and unmerged plans, and the self-profile's list B names further mismatches. The self-profile and the live site win where they disagree.

### Now: 0 to 30 days (make the product current, honest and findable)

| ID | What | Why (finding and evidence) | Effort and impact | Risk and dependencies | Licence or terms gate | Acceptance test or KPI |
|---|---|---|---|---|---|---|
| N1 | Ingest UCDP Candidate 26.0.9, then every later monthly file; rebuild conflicts.json and indices.json; re-run the backtest | Newest human-coded event is 2026-08-31, 59 days old; 26.0.9 answers HTTP 200 and the manifest ends at 26.0.8 (SELF "Update latency"; weakness 1). The "human-coded" share reads 0% (BACKLOG Plan 7) | S. High | UCDP revises candidate files so pins can mismatch; indices may shift and need the usual review | UCDP CC BY 4.0: keep attribution and cite the Candidate release; no token needed | `dataEnd` in both files at or after 2026-09-30; the backtest page regenerated and the guard test green; human-coded share of the last 30 days above 0%; ingest within 7 days of each release |
| N2 | Announce every gap on screen: a line in the legend and pill such as "No human-coded events after DATE; auto-coded only since DATE"; optionally backfill GDELT for the rest of the hole, labelled auto-coded | The 2026-09-01 to 2026-10-18 hole (49 days) is not announced beyond a legend and pill; the README says a gap is never calm (SELF weakness 2, "Risks") | S for the banner, M for backfill. High | A GDELT backfill is noisy and US-centric, so the severity cap of 3 stays | GDELT: cite the GDELT Project | A unit test fails the build when a gap longer than 7 days is not announced; checked by eye at 375 px and 1440 px |
| N3 | Prove the monthly alert: run `data-updates.yml` by hand and confirm the e-mail; merge the two Dependabot pull requests; fix stale docs (ROADMAP.md, TECH-STACK sizes, the About page's privacy text that omits the watchlist key) | The alert has never fired; first scheduled run is 2026-11-05; list B items 1, 2, 5 and 6 in the self-profile | S. Medium | Low | None | Alert run visible in Actions with a received e-mail; list B items closed; docs match the `dist/` measurements |
| N4 | Project hygiene: CONTRIBUTING, CODE_OF_CONDUCT, issue templates including "report a data error", SECURITY.md and security.txt, robots.txt and sitemap, CITATION.cff, a DATA-LICENCES file and a licence header in each public JSON | 0 stars and no contribution path; data files lack licence headers; robots and sitemap return 404 (SELF "Open-source status", weakness 22, "Risks") | S. Medium | Low | Licence text per source as recorded in docs/LICENCE-CHECK-v1.1.md | A CI test checks that every public data file carries source and licence; the community files exist |
| N5 | Make the budget check fail closed and create JavaScript headroom | `check-budgets` passes silently without `dist/`; initial JS 245,856 B against 250,000 B (about 4.1 KB spare) (SELF weakness 21) | S. Medium | Low | None | Script exits non-zero when `dist/` is missing; initial JS at least 10 KB under budget |
| N6 | Add the baselines that decide whether the model adds anything: an empirical-history baseline (the country's own last 12 months) and a last-value baseline, plus average precision and Brier beside AUC for both targets | In the ViEWS challenge the organisers' empirical-history "conflictology" benchmark led every entrant at the interim stage ([PRIO](https://www.prio.org/news/3602)); Defcon's "continue" AUC 0.9831 against persistence 0.9718 is mostly persistence (RIF "Inferences") | S to M. High | Result may show the model wins by less than claimed; publish it anyway | None | INDEX-BACKTEST.md shows three baselines per target and states plainly where the model does not beat one |

### Next: 1 to 3 months (make the claims checkable, open and reachable)

| ID | What | Why (finding and evidence) | Effort and impact | Risk and dependencies | Licence or terms gate | Acceptance test or KPI |
|---|---|---|---|---|---|---|
| X1 | Unattended refresh pipeline: a scheduled job checks for a new UCDP file, re-pins it, rebuilds conflicts, indices and backtest, runs the guard tests and opens a pull request for a human to merge; move the indices into CI | Refresh is by hand; the monthly alert only tells the owner (BACKLOG Plan 11 and Plan 12 deferred; D-060). Needs the repository setting that lets Actions create pull requests | M. High | Auto-published model drift (so a human merges); Actions minutes; a model rebuild takes about 3 minutes and runs on Actions, not the laptop | Built-in `GITHUB_TOKEN` only; UCDP CC BY 4.0 | A pull request appears within 7 days of a UCDP release with no manual command; three consecutive releases handled; median release-to-live time 10 days or less |
| X2 | Pre-registered forward evaluation: tag the model and freeze features and code; append each month's predictions to a hash-chained file in git; score them when UCDP data for the target window lands; publish results good or bad | Features were chosen after seeing 2021 to 2025, so there is no untouched final test period (BACKLOG Plan 11); ViEWS scores on true-future windows with an independent committee (RIF section 1) | M. High | Few "rise" events (380 positives in the current test) mean wide uncertainty; the results may be poor | None; depends on X1 for timely scoring | First scored cohort published at least 3 months after the freeze, with AUC, average precision, Brier and calibration against three baselines; anyone can verify the hash chain with a script |
| X3 | Intervals that cover model error: conformal or walk-forward intervals on both probabilities | Current 90% intervals cover training uncertainty only (BACKLOG Plan 11; INDEX-BACKTEST); ACLED's CAST uses conformal-inspired residual intervals ([CAST](https://acleddata.com/methodology/cast-methodology)) | M. Medium | Wider intervals look less impressive; that is the point | None | Observed coverage on the rolling-origin years between 85% and 95% for a nominal 90% |
| X4 | Independent review: ask at least two people who work on conflict forecasting to read INDEX-BACKTEST.md, the code and the ledger; publish each review, or the fact that nobody replied | Credibility scores 1 of 5 because reviewers so far are AI sub-agents (SELF "Testing"); "no independent review" is a listed gap (BACKLOG Plan 11) | S to ask, slow to answer. High | No reply; critical findings (a feature, not a bug) | Ask, do not pay; no account | At least one written outside review linked from the About page within 90 days |
| X5 | Launch, only after N1 to N4 and X1 are live: a short honest write-up ("what we measure, what we cannot"), a public comparison page based on this report's rubric, and posts from the owner's existing accounts in OSINT, open-data and data-visualisation communities; ask the UCDP and ViEWS maintainers for feedback | Adoption is 0 of 5 (0 stars, 0 forks); World Monitor's 89,739 stars show the demand exists; with no analytics, GitHub is the only metric | M. High | A stale or broken first impression; a hostile comparison with World Monitor, so every claim must be checkable; one maintainer cannot moderate heavy attention | No new accounts; never claim "real time" or the official DEFCON level | Targets after 90 days (my proposal): 100 or more stars, 5 or more outside issues or pull requests, 3 or more independent mentions, measured with GitHub traffic and referrers |
| X6 | Add UCDP's Violent Political Protest dataset (2011 to 2025) as a human-coded protest layer | Protests and riots are GDELT-only and auto-coded (SELF weakness 5; D-029); the UCDP downloads page lists "Violent Political Protest (VPP GED 2011-2025)" ([UCDP downloads](https://ucdp.uu.se/downloads/)) | M. Medium | It covers violent protest only, so labels must not imply all protest; UCDP version lag | UCDP CC BY 4.0, cite the dataset; do not ingest ACLED | Human-coded protest events appear with the human flag; the legend says "violent political protest only"; severity rules unchanged |
| X7 | Fairer hotspots: rank by human-coded deaths first, or normalise GDELT by each country's media volume, and publish the method | Hotspots rank the US and UK first because GDELT over-reports them (BACKLOG Plan 7; SELF weakness 4) | M. Medium | The method is contestable; record it in DECISIONS | None | The US and UK leave the top three unless human-coded data supports them; a method page exists |
| X8 | Timeline growth: add Sudan, Yemen and the Red Sea, Myanmar and the Sahel; have a human read Reuters, AP, BBC and Guardian pages; set a monthly routine | 46 entries in four theatres, latest 2026-10-16, no Reuters, AP, BBC or Guardian (BACKLOG Plan 9; D-057); CrisisWatch tracks 70+ situations | L, ongoing. Medium | AI-written errors, time, and selection bias in which theatres are shown | Own words, links to sources, no copying of articles | At least 8 theatres; every entry has two outlets from different organisations; no theatre older than 30 days; validator green |
| X9 | Real-device and assistive-technology pass: the owner's phone, Firefox, Safari (a borrowed device or volunteer), a real screen reader (Orca on Linux Mint; NVDA and VoiceOver through volunteers), contrast over live globe imagery, tab order, a keyboard route to events; add one Playwright end-to-end suite with axe on the rendered page and the colour-contrast rule on; publish an accessibility statement with known issues | None of this is verified (docs/LAUNCH.md section 4; BACKLOG Plan 6); axe in jsdom cannot test layout or contrast; no end-to-end framework in `package.json` | M to L. High | Browser test tooling is heavy on 7.4 GB RAM, so run it alone with no build in parallel; findings may force layout changes | Free tools only | Every item in LAUNCH.md section 4 ticked with a date; statement published; the end-to-end and axe job green; zero serious axe violations on the rendered main views |
| X10 | Data package and API v1: JSON Schema for every file, stable `/data/v1/` paths, GeoJSON for conflicts and events, per-event CSV, `#e=<event id>` share links, and a versioned zip with checksums attached to each GitHub release by Actions | The static files are the API but have no schema, no versioning, no GeoJSON and no per-event export (SELF "API, exports"; BACKLOG Plan 14 and 15); UCDP's immutable versioned releases are the model | M. High | Freezes the format (breaking changes need v2); per-event export multiplies licence duties | Each file keeps its upstream licence; cite GDELT; never include CC BY-SA or non-commercial data (V-Dem, Cloudflare Radar, OONI) or any ACLED event data | Schema validation test in CI; one documented example script consumes v1; release zips verify against their checksums |
| X11 | Alerts that need no server: static RSS, Atom and JSON Feed files per country and per conflict (severe new events, index band changes, "data updated") built at ingest; make the watchlist sync across tabs with a `storage` listener | Alerts work only with a tab open; e-mail and push need a server or token (BACKLOG Plan 14 and 15; SELF "Alerting"); Crucix's alert-first design shows the demand ([README](https://github.com/calesthio/Crucix)) | M. Medium | Feed noise; feeds must keep "risk estimate" wording and the data-as-of date | No bot tokens, no push keys, no new accounts | Feeds validate and show up in a standard reader; a band change appears within one ingest cycle; two tabs no longer overwrite each other's watchlist |

### Later: 3 to 12 months (earn state-of-the-art status)

| ID | What | Why (finding and evidence) | Effort and impact | Risk and dependencies | Licence or terms gate | Acceptance test or KPI |
|---|---|---|---|---|---|---|
| L1 | Forecasting upgrades benchmarked ViEWS-style: 6- and 12-month horizons; distributions for death counts scored with CRPS (a proper score for whole forecasts); a local comparison with ViEWS's published country-month forecasts on the same UCDP outcomes | ViEWS forecasts 1 to 36 months and scores with CRPS; Defcon stops at 3 months; a pattern-matching "Shape finder" captures escalation better than ViEWS alone ([JPR](https://academic.oup.com/jpr/article/62/6/2052/8435458)) | L. High | A one-person model will not match ViEWS's scale; overreach damages the honesty brand | ViEWS data licence is not named, so compare locally and do not republish; its pipeline code is CC BY-NC-SA, so do not copy it | A public table with Defcon, ViEWS and three baselines on the same months; every claim limited to what the table shows |
| L2 | Methodology preprint (short): the "rise" target, the persistence problem, the baselines, the ledger | No peer-reviewed or citable description exists; ViEWS has JPR papers (RIF section 1) | M. High for credibility | Reviewers may disagree; needs X2 results to be worth reading | Posting to a preprint server may need an account: if the owner has none, publish the PDF in a GitHub release and ask a collaborator to post it | PDF with DOI or stable URL cited in README and CITATION.cff; at least one external citation or comment within a year |
| L3 | Embeds and widgets on dedicated routes: a country gauge, a conflict card, a sparkline; each shows attribution and an "as of" date, with no tracking | Iframes are blocked everywhere (`frame-ancestors 'none'`); ISW and DeepState maps were reused for prediction-market bets without permission, so reuse needs rules (LOD sections 3 and 4) | M. High | CSP regression; misuse (betting, misleading crops) | `frame-ancestors` relaxed only on `/embed/*`; a short reuse notice that the numbers are not for market resolution or presenting without the warnings | A CSP test proves the main app still denies framing; an embed renders on a test page with its as-of date visible; the India map guard tests pass on embeds |
| L4 | Offline support and performance: a service worker that caches the app shell and the last snapshot with a clear "offline, data as of ..." banner; move grain rebuilds to a worker; an in-app quality setting; cache rules for conflicts.json and indices.json | Manifest exists but no service worker; frame rate measured only at about 465 px; conflicts and indices come back `max-age=0` (SELF "Performance", "API"); JS headroom 4 to 5 KB | M. Medium | A stale cache could show old data as if current, which breaks the core honesty rule, so versioned caches and a visible timestamp are mandatory | None | Offline load in airplane mode shows the banner with the snapshot time; Lighthouse installable check passes; median 55 or more frames per second at 1920 by 1080 on the owner's laptop; initial JS under budget with 10 KB spare |
| L5 | Internationalisation: extract strings, switch from hard-coded `en-US` to `Intl` formatting, ship Hindi first, then Spanish, French, Arabic (right-to-left) and Portuguese as lazy bundles, with native-speaker review of the "risk estimate" wording | English only (SELF weakness 14); World Monitor claims 28 languages | L. Medium | Wording drift in sensitive phrases; budget; volunteers needed | Translators credited; no machine translation of safety wording without review | Two languages shipped including one right-to-left; the default load size unchanged; reviewers sign off on the disclaimer text |
| L6 | Longer history and verification links: a pre-aggregated UCDP 1989 to 2025 browser, and per-event link-outs to Copernicus Browser and NASA Worldview for satellite checks | UI history stops at 365 days while GED covers 1989 to 2025 (SELF weakness 6); the commercial note calls linking to free imagery viewers cheap and credible (CFP section 6c) | M to L. Medium | Payload size; link-outs to tools that need accounts (Copernicus) | CC BY 4.0 for data; links only | A decade-range chart for any conflict; the event card links to imagery for the event date and place |
| L7 | Corrections and annotations without accounts: a "report an error" issue form, shareable annotated views encoded in the link, local notes with export and import, and a reviewed `annotations.json` accepted by pull request | No annotation or collaboration code exists (SELF "Alerting and personalisation"); accountless collaboration is the project's constraint | M. Medium | Moderation load on one maintainer; defamation or neutrality risk in public annotations | Contributors license their text CC BY 4.0 | A correction submitted through the form reaches a data fix within 14 days; an annotated link opens identically on another device |
| L8 | Sustainability and governance: a second maintainer or reviewer, a runbook, a static mirror on a second free host, branch protection and two-factor requirements, a funding plan | One maintainer holds the repo, the only scheduler and the Vercel token (SELF "Risks"); the Ukraine Conflict Observatory shut down when funding stopped (LOD section 6) | M, ongoing. High | Finding trusted people; funding sources are not covered by the notes and must be researched | Funders must not compromise neutrality or add tracking | A second person can run the refresh from the runbook; the site is reachable from a mirror; a documented plan for what happens if the owner stops |

### Moonshots (high effort, uncertain, high upside)

| ID | What | Why | Risk and gate | KPI |
|---|---|---|---|---|
| M1 | A public pre-registered forecast league: invite others, including a ViEWS-style entry, to forecast the same targets, scored by an independent party on true-future windows | The ViEWS challenges show that open competition improves models and that simple baselines are hard to beat | Needs outside partners; prediction data governance | One external group submits forecasts and the first league report is published |
| M2 | A news-text onset signal: test whether GDELT-derived tone or themes help in quiet countries, the case history-only models cannot see | Defcon states onset is not forecastable from its inputs; Conflict Forecast's text-based approach targets exactly that case (RIF section 8a) | Heavy compute on a 7.4 GB machine, so run on Actions; GDELT noise; claim only if it beats the baselines on the forward ledger | A forward-ledger result, positive or negative, published |
| M3 | Subnational risk for a few well-located conflicts | CAST works at admin-1; but Russia-Ukraine has only 12% of deaths located (D-058) | Only possible where UCDP location is precise; honesty about coverage | A pilot for two conflicts with located share above an agreed threshold |
| M4 | An independent "evidence-grade conflict commons": signed monthly data releases, a small review board, several maintainers | Funding and maintainer fragility is the main long-term risk in the set | Governance overhead; neutrality | Three organisations mirror or cite the releases |

### Things NOT to do

Do not ingest ACLED event data, call its API or scrape it: the EULA bars redistribution and competing datasets, and the Open tier has no API ([EULA](https://acleddata.com/eula)); link out with attribution instead. Do not scrape Liveuamap, DeepStateMap, ISW, Telegram or any bot-walled site (BRAINSTORM-v1.1 section 3). Do not add an AI forecast or AI briefing panel without a working scorecard: World Monitor's was withdrawn with 11 of 17 forecasts void. Do not blend indices into one headline score with invented weights, which the project itself rejected as the "Triangulation Score" flaw. Do not copy any AGPL code, including World Monitor's. Do not track people, add trade ideas or sit next to crypto tokens (ShadowBroker, Crucix, Osiris). Do not say "live" or "real time" while the cadence is 3 hours with gaps up to 8.6. Do not present the Violence Risk Index as an outbreak or onset forecast. Do not mix CC BY-SA or non-commercial data into MIT and CC BY exports. Do not use partisan colour framing or a single crisp front-line boundary without a confidence cue. Do not allow framing of the main app, add accounts, ads or analytics, or buy always-on servers. Do not publish "100% production ready" claims; the owner's rule is to verify before claiming.

### Target scorecard: what the roadmap should be worth

Using the same rubric and the same judgement, this paragraph gives the **targets** (not predictions) for Defcon's total if each phase lands. Moving only the parameters named, the baseline total of 68.6 would become about **71.2 after Now** (P5 to 3, P6 to 4, P11 to 5, P13 to 5), **78.8 after Next** (adding P2 to 5, P3 to 5, P4 to 4, P10 to 5, P15 to 4, P19 to 4, P21 to 3, P22 to 4, P23 to 4, P24 to 3, P27 to 5) and **84.2 after Later** (adding P14 to 5, P15 to 5, P26 to 5, P31 to 3, P32 to 3, P33 to 3). The largest single gains come from independent validation (P15, worth 2.0 points), adoption (P32, 1.8), the API and data package (P27, 1.6) and credibility (P33, 1.2); freshness (P5) is worth only 1.0 because the best realistic UCDP-based lag is still several weeks. Even at 84, Defcon would still trail ViEWS on scale and independent evaluation and trail World Monitor on raw reach; the claim is "best evidence-grade free monitor", not "biggest".

## Limits and honesty: what was not read, and how much it could move the scores

**This is a desk synthesis of notes, not fresh research.** The writer read five notes and four Defcon documents (BACKLOG, ROADMAP, BRAINSTORM-v1.1, DECISIONS) and opened no website, ran no code and rebuilt no data. Every score is judgement. Weights are choices, not facts. The seven were selected by a stated test, not found by a complete search of the market; a competitor the researchers never looked at (Bellingcat tools, Windy, Flashpoint's consumer view, Cloudflare Radar, Polymarket maps, MarineTraffic, Maplecroft) cannot appear. Every "newest data" fact is a one-day snapshot from 2026-10-29 and will change.

**The biggest bias is evidence asymmetry in Defcon's favour.** Defcon was scored from its repository, tests and live files (32 H cells), while the seven competitors average about 9 H cells each and Liveuamap and CrisisWatch have almost none. A "not found" in a competitor note became a low, LOW-tagged score, so the competitors may be better than shown on accessibility, languages, privacy, history and alerts. The benefit-of-the-doubt column in the sensitivity table (+1 on each LOW competitor score) moves Defcon from first to second under the baseline and does not change its top-three position, but it cannot remove the asymmetry. A follow-up should score a competitor only after reading its live product, and should re-score Defcon with someone who has not read its code.

**Items NOT READ or UNVERIFIED that affect a score, and what a follow-up needs to read.**

| Product | Not read or unverified | Scores it touches | What a follow-up should read |
|---|---|---|---|
| World Monitor | India, Kashmir and disputed-border handling; accessibility; privacy policy; performance numbers; whether live conflict scores use ACLED (the page says unavailable, other pages list it); 170 against 196 countries; "2M+ users" is self-reported; ACLED and Polymarket claims are vendor marketing | P17, P19, P23, P25, P26, P34 | The live dashboard on a normal browser, its privacy policy, an accessibility check, a border check for Kashmir |
| ACLED | Newest event date and the Explorer (login wall); coverage start years and country count; codebook; Content Usage Terms and Attribution Policy; enterprise price; published CAST accuracy numbers; the June 2025 CAST report URL returned 404 and no 2026 CAST edition was found; the cadence of CAST (weekly or monthly) | P2, P4, P5, P17 to P20, P23, P24, P27, P28 | A free-tier walk-through of Explorer; the codebook; the CAST accuracy tab |
| UCDP | Newest Candidate event date (token needed); source-type section of the codebook; globe, mobile, embeds; accessibility; e-mail alert details; whether the token began in February 2026 (single snippet); critiques (Vesco et al., Eck) are snippets | P5, P7, P8, P17, P19, P21, P23 | A token-based query for the newest event date; the codebook's source section |
| Liveuamap | Everything first-hand: homepage, newest event timestamp, UI, terms, accessibility, current ownership. Prices and API rates come from a competitor's page or an aggregator; a "volunteer-run nonprofit" description conflicts with the ad-funded LLC | Most of its 35 scores (19 are LOW, 1 is HIGH) | A manual browser visit and the terms page |
| ViEWS | Final 2023/24 challenge scores (site returned HTTP 502); whether operational CSVs carry intervals; dashboard explanations; why notices are dated 30 Jun and 30 Sep when the text says monthly; "fatalities002" against "fatalities003" naming; data licence | P10, P13, P16, P28 | The JPR final-results paper and the data page's codebook |
| CrisisWatch | Main site behind Cloudflare; terms, accessibility, About and "Using CrisisWatch" text; edition date; rendered map; current funding split (older mixes only) | P7, P12, P17, P23, P28, P34 | The About text and terms, read by a person in a normal browser |
| CFR tracker | Rendered map, mobile, embeds; accessibility; funding amounts; independent critiques; how its map draws Kashmir | P17, P19, P20, P23, P34 | A rendered visit, including the Kashmir depiction |
| Defcon | Real devices, Safari and Firefox, a screen reader; contrast over the live globe; the 60 fps claim beyond a 465 px pane; whether the globe announces the 49-day gap beyond a legend (legend code not inspected); timeline accuracy (not re-read); the exact test count; whether the Vercel Hobby plan's terms allow this use (not read); adoption beyond GitHub (no web search was done) | P11, P17, P19, P23, P26, P32 | A hands-on session on a phone and with a screen reader; a web search for mentions |

**Contradictions inside the notes, left unresolved.** ViEWS says forecasts are released monthly, but its notices are dated 30 Jun and 30 Sep. ACLED's CAST cadence is weekly on one page and monthly on another. World Monitor counts 170 and 196 countries for the same product, and v8 and v14 of its methodology both appear. The Defcon docs say the UCDP lag is "about six weeks" while the measured lag is 59 days, and ROADMAP.md, TECH-STACK.md and parts of DATA-SOURCES.md are stale. The Early Warning Project's description of its test design is ambiguous. Where notes disagreed, this report used the live measurement or the more cautious reading.

**Evidence quality tiers used in the notes.** Facts from search snippets are marked in the text as snippets or unverified: critiques of UCDP and ACLED, GDELT noise studies, the Liveuamap prices, the ViEWS 2026 headline projections. Competitor-authored pages (World Monitor's comparison pages) were used only for facts that no neutral page contradicts, and never to score a competitor's quality. Star counts were not audited and can be inflated by trending and promotion. Nothing about a competitor in this report goes beyond what the notes say.

**What this report did not verify about Defcon.** The 59.4-day lag, the 49-day hole, the 20-run cadence and the backtest numbers come from the self-profile's own measurements. UCDP's 26.0.9 file was confirmed to exist by an HTTP HEAD request, not by opening it, so its contents, completeness and licence terms are untested. The roadmap's effort sizes are the analyst's estimates for one part-time maintainer, and the target scores in the last roadmap section are projections of the same judgement.

## Conclusion

The ranking is less interesting than what it exposes. The thing most likely to make Defcon matter is not its globe: the 61,017-star God's Eye View shows that spectacle is cheap and does not make a conflict monitor. It is the narrow lane no rival occupies cleanly: a free, no-login product that says which numbers are human-coded, shows ranges, and publishes how well its risk estimates worked. World Monitor's withdrawn accuracy scorecard (11 of 17 resolved forecasts void) and its own admission that the weights are "editorial, not empirical" show that rivals are already being judged on exactly this, and that a public, honest, working scorecard is both rare and demanded.

That lane is perishable, and Defcon currently stands in it on a thin base. It sits on one upstream source whose latest release it has not ingested, on one maintainer, and on a backtest that nobody outside the project has checked. The decisive lesson from ViEWS is humbling: the organisers' plain empirical-history baseline led every entrant at the interim stage, so any claim that Defcon's model adds value is only as good as its published comparison with that baseline and its forward record. The first month of the roadmap is therefore not cosmetic: fresh data, loud gaps, baselines and a pre-registered ledger convert Defcon from a well-documented showcase into something an outsider can check, and only then does a launch help rather than hurt.

## Appendix A: Glossary

Each term is defined once, in plain English.

- **ACLED (Armed Conflict Location and Event Data):** a US non-profit that publishes weekly, human-coded events of political violence, protest and related developments.
- **AGPL-3.0:** an open-source licence that requires anyone who runs modified code as a network service to publish their source. MIT is far more permissive.
- **AUC (area under the curve):** a score from 0.5 (no better than a coin) to 1.0 (perfect) for how well a model ranks cases that happened above cases that did not.
- **Average precision (AUPR):** a score that rewards a model for putting real cases near the top of its list, and is much more demanding than AUC when real cases are rare.
- **Base rate:** how often something happens in the data at all. A "rise" happens in about 5.1% of Defcon's test country-months, so a model that always says "no" is right 94.9% of the time.
- **Baseline:** a simple method a model must beat to prove it adds value. "Persistence" assumes next quarter looks like the last; "empirical history" uses the country's own past distribution.
- **Bootstrap (cluster bootstrap):** refitting a model many times on resampled data to see how much its answer wobbles. Defcon's 90% intervals come from 100 refits.
- **Brier score:** the average squared error of probability forecasts; lower is better. "Brier skill" compares it with a baseline.
- **Calibration:** whether "30% risk" really happens about 30% of the time.
- **CAST:** ACLED's forecast of event counts by type for six four-week periods ahead.
- **CC BY 4.0, CC BY-SA, CC BY-NC:** Creative Commons licences. BY means reuse with credit; SA means derivative works must carry the same licence; NC means no commercial use. Mixing SA or NC data into MIT and CC BY exports would create licence conflicts.
- **CIA World Factbook:** a US government country reference, discontinued on 2026-02-04, still used by Defcon as an archived mirror.
- **Conformal interval:** a way to build a prediction interval from a model's past errors, so it covers model mistakes and not only data noise.
- **CORS:** a browser rule that decides which websites may fetch a file. Defcon's data files allow any site.
- **CRPS:** a score for whole probability distributions of a quantity such as death counts; lower is better.
- **CSP (content-security policy):** a browser header that lists exactly which resources a page may load; Defcon's forbids third-party requests.
- **Defcon (the project):** this open-source world conflict monitor. It is not the official US DEFCON alert level.
- **Fatality Index:** Defcon's 0 to 100 log-scale measure of deaths in the last 90 days (observed, not a forecast).
- **FIRMS, GDACS, USGS:** NASA's fire detections, the UN-backed global disaster alert system, and the US earthquake agency; Defcon shows them as context beside events.
- **GDELT:** a free, machine-coded database of news-derived events, updated every 15 minutes; fast, but noisy and without verified casualty counts.
- **GED and Candidate (UCDP):** the Georeferenced Event Dataset is UCDP's final yearly release; Candidate files are monthly provisional additions.
- **Hash chain:** a log where each entry contains a fingerprint of the previous one, so later edits are detectable.
- **i18n:** internationalisation, making software work in many languages.
- **MCP:** a standard that lets AI assistants call a tool or data source.
- **MIT licence:** a short permissive code licence.
- **OSINT:** open-source intelligence, using public information.
- **PWA and service worker:** a website that can be installed and can work offline because a background script caches its files.
- **Precision flags (where_prec, date_prec):** UCDP codes that say how exactly an event's place and date are known.
- **Ridge logistic model:** a basic probability model with a penalty that keeps its coefficients modest.
- **RSS and Atom:** simple public feed formats that readers poll, so alerts need no server of your own.
- **UCDP:** the Uppsala Conflict Data Program.
- **UNHCR:** the UN refugee agency; Defcon uses its displacement data.
- **ViEWS:** the Violence and Impacts Early-Warning System run by Uppsala and PRIO.
- **Violence Risk Index (VRI):** Defcon's two probabilities per country: at least 25 deaths in the next three months, and a sharp rise (at least 25 and at least double the previous three months). The product also calls it the Instability Index; docs use both names.
- **WCAG, axe, jsdom:** the web accessibility standard, a tool that checks pages against it, and a simulated browser that cannot test layout or contrast.
- **WGI:** the World Bank's Worldwide Governance Indicators, a model input.

## Appendix B: Sources by note file

All were read by the note authors on 2026-10-29 unless the note says otherwise; "snippet" means a search-result summary only.

**event_data_platforms.md.** ACLED: [about](https://acleddata.com/about-acled), [API](https://acleddata.com/api-documentation/getting-started), [update schedule](https://acleddata.com/use-access/when-are-acled-data-updated), [fatalities methodology](https://acleddata.com/methodology/fatalities), [CAST methodology](https://acleddata.com/methodology/cast-methodology), [Conflict Index](https://acleddata.com/conflict-index/), [about the index](https://acleddata.com/general-guide/about-conflict-index), [myACLED FAQ](https://acleddata.com/myacled-faqs), [terms](https://acleddata.com/terms-of-use/), [EULA](https://acleddata.com/eula), [Explorer](https://acleddata.com/platform/explorer). UCDP: [background](https://uu.se/en/department/peace-and-conflict-research/research/ucdp/about-ucdp/ucdp-background), [GED codebook v26.1](https://ucdp.uu.se/downloads/ged/ged261.pdf), [downloads](https://ucdp.uu.se/downloads/), [API docs](https://ucdp.uu.se/apidocs/), [web app](https://ucdp.uu.se/), [ViEWS](https://viewsforecasting.org/). GDELT: [about](https://www.gdeltproject.org/about.html), [data](https://www.gdeltproject.org/data.html), [lastupdate.txt](https://data.gdeltproject.org/gdeltv2/lastupdate.txt), [GEO 2.0 API post](https://blog.gdeltproject.org/gdelt-geo-2-0-api-debuts/). CFR: [tracker](https://www.cfr.org/global-conflict-tracker), [methodology](https://www.cfr.org/global-conflict-tracker/methodology), [India-Pakistan entry](https://www.cfr.org/global-conflict-tracker/conflict/conflict-between-india-and-pakistan), [terms](https://www.cfr.org/terms-use). CrisisWatch: [tracker page](https://www.crisisgroup.org/ku/crisiswatch). Critiques (snippets): [EUAA](https://www.euaa.europa.eu/coi-report-afghanistan-country-focus/sources-security-incidents), [ALNAP](https://library.alnap.org/node/64946), [PRIO publication](https://www.prio.org/publications/14755), [armedconflicts.org](https://armedconflicts.org/where-acled-and-ucdp-disagree.html).

**live_osint_dashboards.md.** Liveuamap: [Wikipedia](https://en.wikipedia.org/wiki/Liveuamap), [MBFC](https://mediabiasfactcheck.com/live-universal-awareness-map-bias/), [App Store](https://apps.apple.com/au/app/liveuamap/id1003808504), [mapping-methods guide](https://ukraine-war-analytics.com/analysis/frontline-mapping-methods.html). World Monitor: [homepage](https://www.worldmonitor.app), [CII methodology](https://www.worldmonitor.app/docs/methodology/cii-risk-scores.md), [CII blog](https://www.worldmonitor.app/blog/posts/country-instability-index-methodology-explained/), [data sources](https://www.worldmonitor.app/docs/data-sources), [accuracy](https://www.worldmonitor.app/accuracy), [pricing](https://www.worldmonitor.app/pricing.md), [GitHub](https://github.com/koala73/worldmonitor), [AFP via Philstar](https://www.philstar.com/lifestyle/gadgets/2026/03/16/2514729/gods-view-rise-ai-war-dashboards). ISW, DeepState and others: [Wikipedia ISW](https://en.wikipedia.org/wiki/Institute_for_the_Study_of_War), [Kyiv Post on DeepState](https://www.kyivpost.com/post/57024). Open-source look-alikes: [God's Eye View](https://github.com/bilawalsidhu/gods-eye-view), [Crucix](https://github.com/calesthio/Crucix), [ShadowBroker](https://github.com/BigBodyCobain/Shadowbroker), [Osiris](https://github.com/simplifaisoul/osiris).

**risk_indices_forecasting.md.** ViEWS: [home](https://viewsforecasting.org/), [data](https://viewsforecasting.org/data/), [Hegre et al. 2019 full text](https://kops.uni-konstanz.de/server/api/core/bitstreams/197041e4-3a22-46b3-8ac4-1d0f6c75b916/content), [PRIO challenge news](https://www.prio.org/news/3602), [challenge paper](https://arxiv.org/abs/2407.11045), [JPR critique](https://academic.oup.com/jpr/article/62/6/2052/8435458), [pipeline README](https://github.com/prio-data/views_pipeline/blob/main/README.md), [OCHA Centre review](https://centre.humdata.org/assessing-the-technical-feasibility-of-conflict-prediction-for-anticipatory-action/). Others: [EU JRC AI-GCRI report](https://publications.jrc.ec.europa.eu/repository/bitstream/JRC118746/ai_gcri_technical_report.pdf), [Early Warning Project accuracy](https://earlywarningproject.ushmm.org/accuracy), [INFORM Severity methodology](https://www.acaps.org/fileadmin/Dataset/Methodology_files/Severity_Methodology_update-online_20260202.pdf), [Fragile States Index methodology](https://fragilestatesindex.org/methodology/), [Global Peace Index 2026](https://www.visionofhumanity.org/wp-content/uploads/2026/06/Global-Peace-Index-2026-Report.pdf), [Conflict Forecast](https://conflictforecast.org/).

**commercial_and_free_platforms.md.** [Dataminr products](https://www.dataminr.com/products), [UK Defence Journal on Janes](https://ukdefencejournal.org.uk/mod-to-award-intelligence-data-deal-to-janes/), [Crisis24 Horizon](https://www.crisis24.com/platforms/crisis24-horizon), [Seerist](https://www.seerist.com/), [RANE Worldview](https://worldview.ranenetwork.com/register), [Everbridge VCC](https://www.everbridge.com/product/visual-command-center/), [Flashpoint](https://www.flashpoint.io/), [ReliefWeb API](https://apidoc.reliefweb.int/), [HDX licences](https://docs.humdata.org/about/data-licenses), [NASA Worldview](https://www.earthdata.nasa.gov/data/tools/worldview), [Copernicus Browser docs](https://documentation.dataspace.copernicus.eu/Applications/Browser.html).

**defcon_self_profile.md and the four repository documents.** Live site [defcon-roan.vercel.app](https://defcon-roan.vercel.app) (headers and files measured by curl at 09:55 UTC on 2026-10-29); repository [Tribal-Chief-001/defcon](https://github.com/Tribal-Chief-001/defcon) at commit f7f9a0c; documents docs/BACKLOG.md, docs/ROADMAP.md, docs/BRAINSTORM-v1.1.md and docs/DECISIONS.md (D-001 to D-063); and, cited through the self-profile, docs/INDEX-BACKTEST.md, docs/DATA-SOURCES.md, docs/OPEN-DATA.md, docs/MAP-POLICY.md, docs/LAUNCH.md and docs/LICENCE-CHECK-v1.1.md.
