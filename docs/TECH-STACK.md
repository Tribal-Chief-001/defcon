# Tech stack

Versions actually installed (2026-10-18, from `node_modules`). Choices D-006 (custom Three.js globe) and the rest are recorded in `DECISIONS.md`.

| Layer | Package | Version |
|-------|---------|---------|
| App | react / react-dom | 19.3.1 |
| Build | vite (with `@vitejs/plugin-react`, `@tailwindcss/vite`) | 8.3.4 |
| Language | typescript (strict) | 7.0.2 |
| Styling | tailwindcss | 4.3.3 |
| Globe | three (own renderer, no map library) | 0.186.1 |
| State | zustand (installed, used from Plan 2) | 5.0.15 |
| Geo | d3-geo (tests, helpers) | 3.1.1 |
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
| `npm run serve:dist` | serve `dist/` on :4173 with the `vercel.json` headers (CSP check) |
| `npm run ci:scan` | secret scan of tracked files |
| `npm run data:validate` | gate for a built event snapshot |
| `npm run map:fetch` | download and verify pinned Natural Earth files (`-- --accept-new` re-pins) |
| `npm run map:build` | build borders (two detail levels), country list, capitals into `public/data/` |
| `npm run data:ucdp` | download and pin UCDP GED 26.1 + candidate CSVs (`-- --accept-new` re-pins) |
| `npm run data:gdelt` | cache GDELT 2.0 events (`-- --days N`, default 7) |
| `npm run data:build` | merge sources, write `public/data/events/` snapshots and detail shards |
| `npm run data:refresh` | newest 2 days of GDELT, then build |
| `npm run data:wb` / `data:factbook` / `data:memberships` | fetch dossier sources into `data/raw/` (gitignored; memberships into `data/relations/`) |
| `npm run data:dossiers` | build `public/data/dossiers/` (committed) |
| `npm run map:pin-india` | re-pin India's outline hash (owner-approved ledger entry first) |

## Measured (2026-10-18)

- JS gzip total **224.8 KB** (2026-10-18, after Plan 4; was 216.2 KB after Plan 3) (budget 250 KB). Borders gzip: low **158 KB** (budget 300 KB), high **775 KB** (budget 1 MB). Capitals 15 KB. Budgets are gzip transfer size.
- Globe in the in-app browser on Intel UHD (CML GT2), 465x868, DPR 1: **60.2 fps, worst frame 16.8 ms** over 3 s. Not yet measured at full-screen desktop size or on HiDPI.
- Dev only: press the backtick key to show a frame-time overlay (`src/dev/`); it is tree-shaken from production builds.
- Machine rule: run one vitest/vite/build process at a time (7.4 GB RAM).
- Plan 3 sizes: dossier index 9.1 KB gzip (budget 40 KB); 248 dossiers, largest ZAF 4.2 KB raw (budget 6 KB). With 35 capital labels on screen the globe held 60 fps (same in-app browser, 474 px wide).
- Plan 4: relations.json 1.1 KB gzip (budget 8 KB). In the in-app browser (Intel UHD, 474 px) with grain, terminator, arcs, reticle, pulse and 35 labels active: 60 fps average over 5 s, worst frame 33 ms (one drop); 60 fps with 180 synthetic pointer moves a second and during Play.
- Dev dependency `axe-core` 4.14.0 (MPL-2.0, used only in tests; not shipped) for `tests/a11y/axe.test.tsx`: jsdom runs every rule except colour contrast, which `tests/a11y/contrast.test.ts` checks on the design tokens.
