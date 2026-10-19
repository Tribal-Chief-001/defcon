# Open data: the static API of Defcon

Defcon has no server. Everything the site shows comes from static files under `/data/` that you may download and reuse (with the licences below). The same files are what the site reads, so what you download is what you see. The War room and the Index board also have **Download CSV** buttons (conflicts, and the indices of every country), built in your browser from these files.

Base URL: `https://defcon-roan.vercel.app/data/` (the files are in `public/data/` of the repository).

| File | What it holds | Updated | Source and licence |
|---|---|---|---|
| `conflicts.json` | listed conflicts: deaths with low-high ranges for 30, 90 and 365 days, weekly deaths (also by kind), trend, countries, geography, latest events; the world overview | by hand after a UCDP release (`npm run data:conflicts`) | UCDP GED and Candidate, CC BY 4.0 |
| `indices.json` | Fatality Index and Instability Index per country, model metadata, backtest (by split and by year), calibration | by hand (`npm run data:indices`) | derived from UCDP and World Bank (CC BY 4.0) |
| `signals.json` | fires near conflict areas, GDACS disaster alerts, explosion-type seismic events, each source with its licence and attribution | every 3 hours at ingest | NASA FIRMS (open, acknowledgement), GDACS (CC BY 4.0), USGS (public domain) |
| `displacement.json` | UNHCR figures by country (refugees, asylum-seekers, people displaced inside, hosted) for the latest year | by hand (`npm run data:displacement`) | UNHCR Refugee Population Statistics Database, CC BY 4.0 |
| `timeline.json` | the sourced key-events timeline (hand-curated, with sources and a checked date) | by hand | facts in our own words, each entry links its sources |
| `events/recent.bin`, `events/archive.bin`, `events/*.meta.json` | the event snapshot (binary struct-of-arrays) and its metadata | every 3 hours at ingest | UCDP (CC BY 4.0), GDELT (cite the GDELT Project) |
| `countries.json`, `dossiers/*.json`, `relations.json`, `capitals.json`, `borders.*.topo.json` | countries, dossiers, alliances and disputes, capitals, borders (India-official Natural Earth data) | by hand | Natural Earth (public domain), World Bank (CC BY 4.0), CIA World Factbook (public domain), UN and NATO lists |

## Rules of the road
- **Attribution:** keep the source and licence of each file (the `sources` fields and the About page list them). The data files are not under the MIT licence of the code.
- **Dates:** UCDP windows end at the data end date written in the file (`dataEnd`), never at today; `generated` is when the file was built.
- **Estimates:** deaths are UCDP estimates with ranges; indices are model output with intervals and a published backtest (`docs/INDEX-BACKTEST.md`); signals are context, never proof of an attack.
- **Stability:** the shapes are described by the TypeScript types in `src/*/types.ts` (conflicts, indices, signals, displacement, timeline). A breaking change is recorded in `docs/DECISIONS.md`.
- **Politeness:** the files are static and cacheable; please cache them rather than polling.
- **Not endorsed:** UNHCR, USGS, NASA, GDACS, UCDP and the World Bank do not endorse this site or your use of the data.

## CSV exports
- `defcon-conflicts-<data end>.csv`: id, name, kinds, trend, deaths (best, low, high) for 30, 90 and 365 days, event counts, last event, provisional share, countries, data end.
- `defcon-indices-<data end>.csv`: country, Fatality Index with its range, band, deaths, per 100,000, rank, trend, the two probabilities with their 90% intervals, momentum, confidence; the risk columns are empty (never 0) for a country that is not modelled.
- Text that a spreadsheet could read as a formula (starting with `=`, `+`, `-`, `@`) is written with a leading apostrophe; the files start with a UTF-8 byte-order mark.

## Share links
`#c=IND` a country, `#war` or `#war=<conflict id>` the War room, `#about` the About page; add `&t=<unix seconds>` (or `#t=<unix seconds>` alone) to put the time-travel playhead at that moment (within the last 365 days).
