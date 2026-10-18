# Brainstorm v1.1: what we are deciding to build

Status: **living document, written 2026-10-18 during the v1.1 brainstorm. Nothing here is built yet.**
This is the decision record that sits between the research and the plans. It answers three questions: what do we want v1.1 to be, what did we learn, and what is still open.

Read with: [RESEARCH-v1.1.md](RESEARCH-v1.1.md) (landscape, data sources, ACLED terms, first priority list), [INSTABILITY-INDEX.md](INSTABILITY-INDEX.md) (index design spec), [DECISIONS.md](DECISIONS.md) (D-001..D-054, what is already settled).

---

## 1. Where we are

- v1.0.0 is live (https://defcon-roan.vercel.app), the repo is public (MIT code licence), CI ingests fresh events every 3 h and redeploys. Plans 1-7 are merged (globe, events, dossiers, Country Dive, performance, deploy, UI polish).
- v1.1 started with research (competitors, open-source world monitors, OSINT sources, gaps) and a priority list.
- The owner liked World Monitor's Country Instability Index and asked for it to be built, but better: trained, backtested, honest about uncertainty.
- The owner also had a Gemini deep-research document written (`osint_gods_eye_dashboard_sources_blueprint.md`, 27 KB, untracked). Section 3 below records what we took from it and what we did not.

## 2. What v1.1 should be (the one-sentence direction)

**Defcon becomes the globe that shows its evidence**: every score says how it was computed and how sure it is, every event can show what independent signals back it up, and nothing is invented to look impressive.

That is the differentiator against World Monitor (breadth, editorial weights, 31 countries, no backtest) and against commercial tools (closed data, closed scoring).

## 3. The Gemini document: what we took and what we did not

Reading result, 2026-10-18. Contains no secrets. Contains useful source discovery and several things we will not do.

### Taken (candidates, each still needs a licence and endpoint check)

| Signal | Why it fits | Fits our static pipeline? |
|---|---|---|
| Internet outages: IODA, Cloudflare Radar, OONI | Blackouts and blocking go with protest and crackdown; a real independent signal, new to our research | Yes, build-time fetch |
| NASA FIRMS thermal hotspots | Corroborates strikes and large fires; needs a free MAP_KEY the owner creates | Yes, every 3 h |
| USGS events typed `explosion`, EMSC | Seismic ground truth for big blasts | Yes |
| GDACS, NASA EONET | Natural-hazard context; also lets us filter wildfires out of strike detection | Yes |
| GPSJAM daily jamming hexes | Electronic-warfare layer, daily static file | Yes |
| IMF PortWatch chokepoint transits | Red Sea / Hormuz / Suez traffic drops | Yes |
| TeleGeography submarine cables | Beautiful globe layer | Yes (licence check) |

### Not taken, and why

- **ACLED as described.** The document says free registration, OAuth API, JSON. The ACLED terms we read on 2026-10-18 say the free Open level gives aggregates only, no API, and the EULA forbids per-event republishing and dashboard use. **Closed 2026-10-18:** the owner's free (gmail) myACLED account is Open level, the API returned "Access denied", and the FAQ lists the API only for Research and above. ACLED is out of v1.1; no email needed unless the owner wants a Research licence.
- **"Triangulation Score" with fixed points (+25/+30/+35/+20).** The points are arbitrary and sum to 110 on a 0-100 scale. It repeats the editorial-weights flaw we criticise in World Monitor. We show corroborating evidence as evidence (which sources, how far, how long after), not as an invented number.
- **ToS and legal line-crossers:** scraping Liveuamap (paid product), DeepStateMap internal endpoints, bypassing the `oref.org.il` geo-block with a proxy, a burner Telegram account listening to 100+ channels, scraping Carnegie's tracker. Not doing any of these.
- **The architecture section** (MapLibre/Deck.gl, Redis, WebSocket/SSE backend). Our globe is custom Three.js and the site is static and free to run. Live aircraft, ships and sirens need a server and are a separate v2 decision, not v1.1.
- **Live streams and extras:** ADS-B, AIS, sirens, Windy webcams, OpenMHz. Out of scope for v1.1 (v2 if a server ever happens).

### Unverified claims in that document (do not repeat as fact)

- "80%+ of frontline video breaks on Telegram first" (no source).
- World Monitor "CII v8", Ollama, Tauri, MCP server. We verified only the repo and about 88.7k stars.
- The repos `osint-worldview`, `osiris`, `IRONSIGHT`: not reviewed. Do not clone or run unreviewed.
- Crowd Counting Consortium GitHub link looks unofficial (US only anyway).
- TeleGeography cable licence, adsb.fi and Global Fishing Watch non-commercial terms, ReliefWeb appname approval, GPSJAM and PortWatch reuse terms: each must be read before we depend on it.

## 4. Revised priority list (proposal, owner to confirm)

Changes from the list in RESEARCH-v1.1 section 5b: **item 3 is new** (Signals layer); the rest shift down by one. Nothing was removed.

| # | Item | Notes |
|---|---|---|
| ~~1~~ | ~~ACLED: ask, aggregates only~~ | **Closed 2026-10-18** (Open level has no API; EULA limits display). Everyone below moves up one. |
| 2 | Defcon Instability Index | Flagship. Risk (trained, backtested), Momentum, Activity now, Confidence. Add outage signals as candidate features. |
| 3 | **Signals layer** (new) | Outages, FIRMS, USGS explosions, GDACS/EONET, GPSJAM, PortWatch. Licence check first; build-time only. |
| 4 | Newer human-coded UCDP candidate releases | Shrinks the "data ends 31 Aug" gap. |
| 5 | Evidence trail | Per event: sources, coding, and the Signals-layer corroboration. |
| 6 | Open exports / static API | |
| 7 | Moment permalinks and share | |
| 8 | "How computed" popovers and fairer hotspots | |
| 9 | Human-cost layer (UNHCR) | |
| 10 | South Asia lens | India-official map rules stay mandatory. |
| 11 | Indicators desk | |
| 12 | Radius / watchlist alerts | |
| 13 | Story mode | |

## 5. Guardrails that every v1.1 item must respect

- Honest data: every number says what it counts and its window; auto-coded and human-coded are never mixed up; no score without its confidence; no invented weights.
- Static and free: build-time ingestion in the 3-hourly workflow, no always-on server, no paid service, no new account created by us.
- Licences first: read the terms of every source before code; keep per-source attribution; no ACLED per-event data in git.
- India-official map and its guard tests stay green.
- Performance: 60 fps and the 250 KB gzip JS budget (232 KB now). New layers load lazily.
- Naming: always "not the official US DEFCON level".
- Process: plan, TDD, ledger, fresh Sonnet review of the whole branch, one fix pass, merge, rich ledger commits. One heavy process at a time on this machine.

## 6. Open decisions for the owner

1. ~~Index name~~ **Decided 2026-10-18 (owner delegated: "whatever is right"): Violence Risk Index (VRI).** It names what the model predicts (the chance of organised violence ahead). "Instability" is vague, "Fatality Index" would claim we count deaths. File names stay `INSTABILITY-INDEX.md` until the build plan renames them. Cost if wrong: a rename.
2. ~~First index scope~~ **Ruling 2026-10-18: Risk + Momentum first; "Activity now" is the existing tension index, shown beside it, not rebuilt.** Cost if wrong: Activity becomes a later add-on.
3. Signals layer: which signals first? Suggested order: outages (IODA/OONI), then FIRMS, then GPSJAM/PortWatch.
4. ~~ACLED~~ closed 2026-10-18 (see section 4).
5. UCDP candidate releases (#4) in parallel with the index? Needs the owner's yes.
6. The Gemini file: keep it out of git (`.gitignore`) or commit with a disclaimer header. This document and section 3 already carry what is useful from it.

## 7. Next steps

**Done 2026-10-18:** licence check ([LICENCE-CHECK-v1.1.md](LICENCE-CHECK-v1.1.md)) and the first VRI study, a persistence baseline on UCDP GED ([VRI-BASELINE-STUDY.md](VRI-BASELINE-STUDY.md)). Finding: "violence continues" is almost pure persistence (AUC 0.97), so the headline target must be rise/onset; the sensitivity study and structural features come next.

Still to do:

1. Licence and endpoint check for the Signals-layer sources and the Instability Index inputs (World Bank WGI, UNHCR, V-Dem). Output: a table in DATA-SOURCES with licence, attribution, rate limits, last checked date.
2. Index: country-month feature table and a persistence baseline, per INSTABILITY-INDEX.md, before any UI.
3. Write the plan(s) for the confirmed items (writing-plans), then execute per the standing protocol.

## 8. What is NOT verified in this document

No endpoint, licence or rate limit in section 3 was tested; they come from reading the Gemini document and our earlier research. The revised priority order is a proposal, not an owner decision.

## 9. War Tracker (owner request, 2026-10-18; proposal, nothing built)

**Ask:** current-conflicts view with a timeline for US/Israel-Iran, Russia-Ukraine, Israel-Gaza/Palestine and the wider Middle East, with the latest attacks, strikes and bombings, verified, with solid metrics.

**What we found while checking (web search 2026-10-18, secondary sources, not yet verified against primary ones):** the picture changed after the assistant's knowledge cutoff, so nothing may be written from memory. Reports describe a US/Israel-Iran war from 28 Feb 2026, a ceasefire announced 7 Apr and renewed Israel-Iran clashes on 7 Jun; a Lebanon war with escalating Israeli strikes in early October; a Gaza truce (from 10 Oct 2025) that is fragile and stalled; Russia-Ukraine continuing with drone/missile strikes. Search results were a mix of reliable and low-quality pages, and nothing after about 6 Oct could be confirmed.

**What our own data already holds (UCDP candidate, human-coded, ends 2026-08-31):** Russia-Ukraine (57,553 deaths, 2,140 events in 2026 files), Iran-Israel/USA (3,624 deaths, 80 events), Government of Iran vs civilians (19,893 deaths, 35 events), Israel-Southern Lebanon (6,668 deaths, 508 events), Israel-Palestine (1,034 deaths, 545 events). UCDP `best` numbers, with `low`/`high` ranges available.

**Proposed design (two layers, strict about what is verified):**
1. **Data layer (automatic, no claims from memory):** a Conflicts list built from UCDP conflict/dyad names with per-conflict deaths (best with low-high), events, last event, weekly timeline, and latest events with their source names; September-October shown from GDELT only and labelled auto-coded.
2. **Curated key-events timeline (manual, sourced):** each entry has a date, one line and at least two independent sources (wire service, UN/ReliefWeb, ISW) with links; status confirmed / reported / disputed; every entry shows when it was last checked. Anything we cannot source does not go in.
3. **Metrics:** conflict intensity (deaths per 30 days with range, trend against the previous 90 days), and the VRI once the study supports it. No metric without its definition and uncertainty.

**Risks:** staleness (a hand-curated timeline ages; show "last checked"), the casualty-count politics of Gaza and Iran (show UCDP ranges and say who counts), single-source claims, and not presenting as live.
