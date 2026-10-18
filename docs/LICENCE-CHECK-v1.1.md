# Licence check for v1.1 sources (2026-10-18)

Purpose: before any code, find out which sources we may ingest for the Violence Risk Index (VRI) and the Signals layer. Our situation: MIT-licensed public repo, non-commercial, free hosting, build-time fetch every 3 h, small **derived** files may be committed.
Method: official terms pages read by fetch agents and, for JavaScript-only pages, in the built-in browser. Each row says what was actually read. **Nothing here is legal advice; where a page was not read, the row says NOT READ and nothing is assumed.**

## Verdict

| Verdict | Sources |
|---|---|
| **Usable now** (licence read, allows our use with credit) | UCDP GED + Candidate (CC BY 4.0); World Bank WGI (CC BY 4.0, six aggregate estimates only, see note); EMSC SeismicPortal (CC BY 4.0, no mirroring of the catalogue) |
| **Usable with a decision** | V-Dem (CC BY-SA 4.0: derived data files must be CC BY-SA); Cloudflare Radar (CC BY-NC 4.0 + needs an account token as a CI secret); OONI (CC BY-NC-SA 4.0, endpoint docs not read); GDACS (EC notice says CC BY 4.0 "unless otherwise indicated", not stated on GDACS pages) |
| **Licence not found / unread** (do not build yet) | IODA, IMF PortWatch, NASA FIRMS data policy, USGS (public domain expected, not confirmed), NASA EONET, UNHCR (see below) |
| **Blocked** | GPSJAM (no reuse terms; personal project; upstream is airplanes.live and ADS-B Exchange). Liveuamap, DeepStateMap, Telegram, oref.org.il: ToS, not pursued. ACLED: closed (RESEARCH-v1.1 section 5a). |

## Details

| Source | Licence and attribution | Key / limits | Notes and blockers |
|---|---|---|---|
| **UCDP GED 26.1 + Candidate** | CC BY 4.0. Cite Davies, Pettersson and Öberg (2026), doi 10.1093/jopres/xjag046, and Sundberg and Melander (2013); Candidate: Hegre et al. (2020). Pages read: ucdp.uu.se/downloads, /apidocs | Bulk CSV: no key. API: free token by email, 5,000 requests/day | Candidate is **monthly**, latest seen v26.0.8 (Aug 2026), direct CSV link, so item "newer human-coded data" needs no secret. We already use GED. |
| **World Bank WGI** | Dataset terms: CC BY 4.0 "unless specifically labeled otherwise". Cite "Worldwide Governance Indicators, 2026 Update, World Bank (www.govindicators.org), accessed <date>". Pages read: dataset terms, WGI home/FAQ/usage advisory | No key for downloads | **Do not commit the per-source files** (EIU, Gallup, PRS, S&P, WEF values are licensed for own use only). Commit only the six WGI aggregate estimates. A perceptions index with margins of error. Annual (Sept), 1996-2025 in the 2026 update. |
| **EMSC SeismicPortal** | CC BY 4.0. Credit: "EMSC-CSEM SeismicPortal, https://www.seismicportal.eu". Page read: terms.html, fdsn-wsevent.html | No key; max 20,000 events/request | Database mirroring needs written permission; small derived files are fine. |
| **V-Dem v16** | CC BY-SA 4.0. Cite Coppedge et al. 2026, doi 10.23696/vdemds26. Page read: v-dem.net dataset page | CSV download, no REST API | Derived files committed to the repo would be CC BY-SA 4.0 (label them; code stays MIT). Index values must not be compared across versions. |
| **Cloudflare Radar** | CC BY-NC 4.0 (stated on developers.cloudflare.com/radar). Attribution wording not given. Pages read: overview, get-started, outages, error codes | Free Cloudflare account + API token (we do not create it; owner would set a GitHub secret). No quota stated; HTTP 429 exists | NC limits any future commercial use. Traffic-anomaly endpoint and free-tier terms not read. |
| **OONI** | CC BY-NC-SA 4.0. Pages read: LICENSE.md, data policy, api.ooni.io | Docs say "modest request rate", not for batch; endpoint docs returned 429, **NOT READ** | ShareAlike on derived data files. Also check before relying on it. |
| **GDACS** | No licence on GDACS pages; EC legal notice (footer) says CC BY 4.0 "unless otherwise indicated". Pages read: terms, feed reference | No key for feeds | Ask GDACS to confirm, or treat attribution-only. Feeds: `xml/rss_24h.xml`; GeoJSON docs not read. |
| **NASA EONET v3** | None stated (disclaimer only). Pages read: docs, about, sources | No key stated | Aggregates third-party sources whose terms may apply. Low priority. |
| **NASA FIRMS** | **NOT READ** (data policy lives on earthdata.nasa.gov/data/projects/lance) | Free MAP_KEY by email; 5,000 transactions / 10 min; global within ~3 h; area endpoint `/api/area/csv/<key>/<source>/<area>/<days 1-5>` | Needs the owner to create the key. Read the citation page first. |
| **USGS earthquake feeds** | **NOT READ** (legal page returned empty / 404). Public domain is the usual position, **unconfirmed** | No key; feeds updated every minute | `type` field includes `explosion`, `quarry blast`, etc.; whether the "all" feeds carry them must be checked on a live feed. |
| **IODA (Georgia Tech)** | **No licence stated.** About page read in the browser: "open-source, trusted, granular measurement data", contact ioda-info@cc.gatech.edu. No terms/data policy found | API documented under Developers; limits not read | Ask by email, or read the Developers/API page for terms. |
| **IMF PortWatch** | **NOT READ.** About page read (no licence on it); the dataset "about" page rendered empty | ArcGIS FeatureServer | Read the dataset licence field in a normal browser or the IMF copyright page. |
| **UNHCR** | Website terms read: "personal use and educational purposes only", not for commercial use; **scraping by AI and substantial reproduction need written permission**. The Refugee Data Finder may carry its own licence (**NOT READ**; the copyright page 404s) | API open, no key apparent | Do not ingest until a data licence is found or UNHCR agrees in writing. Deferred. |
| **GPSJAM** | No licence or reuse terms found (gpsjam.org/about, /faq). Credits airplanes.live and ADS-B Exchange | none documented | Blocked. Could ask the author. |

## What this changes

1. The VRI can be built on **UCDP + GDELT (already ours) + World Bank (WDI already, WGI added) + V-Dem (CC BY-SA, label the derived file)**. No secret needed for any of these.
2. First Signals-layer candidates, in order: **USGS and EMSC seismic** (no key; confirm USGS terms), **GDACS** (confirm licence), then **Cloudflare Radar outages** (needs an owner-set token) and **FIRMS** (needs an owner-created key). IODA, PortWatch and GPSJAM wait for written terms.
3. Data licences differ from the MIT code licence. A `DATA-LICENCES` section in the README must list each source with its licence; CC BY-SA and CC BY-NC files must be labelled as such.
4. UNHCR (human-cost layer) moves later: needs permission.

## Not verified here

- Whether any source's actual endpoint works as documented (no data was fetched, only terms and docs).
- Model-training rights: none of the pages addresses them except ACLED's EULA.
- Several fetches were done by sub-agents (text summarised by a model); IODA, PortWatch and UNHCR pages I read myself in the browser.
- Read next in a normal browser: FIRMS citation page, USGS policies, PortWatch dataset licence, IODA API/terms, UNHCR Refugee Data Finder licence.
