# Tech stack

Versions actually installed (2026-10-18, from `node_modules`). Choices D-006 (custom Three.js globe) and the rest are recorded in `DECISIONS.md`.

| Layer | Package | Version |
|-------|---------|---------|
| App | react / react-dom | 19.3.1 |
| Build | vite (with `@vitejs/plugin-react`, `@tailwindcss/vite`) | 8.3.4 |
| Language | typescript (strict) | 7.0.2 |
| Styling | tailwindcss | 4.3.3 |
| Globe | three (own renderer, no map library) |  (range) |
| State | zustand (installed, used from Plan 2) | 5.0.15 |
| Geo | d3-geo (tests, helpers) |  (range) |
| Map pipeline | topojson-client 3.1.0, topojson-server 3.0.1, topojson-simplify 3.0.3, shapefile 0.6.6, @turf/union + difference 7.4.0, tsx 4.23.15 | |
| Tests | vitest 5.0.5, jsdom 30.1.3, @testing-library/react 16.3.3 | |
| Fonts | @fontsource Syne 5.3.0, Space Grotesk, JetBrains Mono | self-hosted |

## Commands

| Command | Does |
|---------|------|
| `npm run dev` | Vite dev server |
| `npm test` | `vitest run` (one run, never watch) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run build` | typecheck + production build |
| `npm run check:budgets` | gzip budgets (after a build) |
| `npm run map:fetch` | download and verify pinned Natural Earth files (`-- --accept-new` re-pins) |
| `npm run map:build` | build borders (two detail levels), country list, capitals into `public/data/` |
| `npm run map:pin-india` | re-pin India's outline hash (owner-approved ledger entry first) |

## Measured (2026-10-18)

- JS gzip total **204.2 KB** (budget 250 KB). Borders gzip: low **158 KB** (budget 300 KB), high **775 KB** (budget 1 MB). Capitals 15 KB. Budgets are gzip transfer size.
- Globe in the in-app browser on Intel UHD (CML GT2), 465x868, DPR 1: **60.2 fps, worst frame 16.8 ms** over 3 s. Not yet measured at full-screen desktop size or on HiDPI.
- Dev only: press the backtick key to show a frame-time overlay (`src/dev/`); it is tree-shaken from production builds.
- Machine rule: run one vitest/vite/build process at a time (7.4 GB RAM).
