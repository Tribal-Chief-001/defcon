# Defcon

A real-time 3D world monitor of armed conflict and civil unrest, and a frontend design showcase: true-black, hairline, sonar-lit globe; every border drawn from **India's official map**; every event labelled human-coded or auto-coded; missing data shown as missing.

Status: Plans 1 (map and globe core) and 2 (events and live data) are done; Plans 3-6 (dossiers and navigation, signature interactions, data pipeline and hosting, hardening and launch) are in progress. See [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Quick start

```bash
nvm use            # Node 22
npm ci
npm run dev        # http://localhost:5173
```

The map data is committed. Event data is generated (not committed):

```bash
npm run data:ucdp            # UCDP GED 26.1 + candidate CSVs (about 50 MB download, pinned by SHA-256)
npm run data:gdelt -- --days 7   # GDELT 2.0 events, 15-minute files
npm run data:build           # merge, dedupe, write public/data/events/
```

Without event data the app shows the globe with a "NO DATA" label.

## Checks

```bash
npm run typecheck && npm test && npm run build && npm run check:budgets
```

CI runs the same on every push (`.github/workflows/ci.yml`). All commands: [`docs/TECH-STACK.md`](docs/TECH-STACK.md).

## Principles

- **India's official map.** Borders come from Natural Earth's India point-of-view data, guarded by tests and cross-checked against the Survey of India's political map ([`docs/MAP-POLICY.md`](docs/MAP-POLICY.md)).
- **Honest data.** Sources, age and confidence are always shown; auto-coded events never claim high severity; a "tension index" is only shown when it is comparable ([`docs/TENSION-INDEX.md`](docs/TENSION-INDEX.md)).
- **Docs are the ledger.** Every decision is in [`docs/DECISIONS.md`](docs/DECISIONS.md); designs and plans are in `docs/superpowers/`.

## Data sources and attribution

Natural Earth (public domain); UCDP (CC BY 4.0, cite the publications listed in [`docs/DATA-SOURCES.md`](docs/DATA-SOURCES.md)); GDELT (free, cite the GDELT Project, https://www.gdeltproject.org); the Survey of India political map is used only for a cross-check and is not redistributed.

## Deploying

See [`docs/DEPLOY.md`](docs/DEPLOY.md) (Vercel).

## Licence

No licence has been chosen yet: all rights reserved by the owner until one is added.
