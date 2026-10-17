# Data sources

Terms, attribution, cadence and verification dates for every dataset. Update in the same change as any source change.

## Natural Earth (map geometry and places)

| Item | Value |
|------|-------|
| Files | `ne_10m_admin_0_countries_ind` (India point-of-view), `ne_10m_populated_places_simple` |
| Version | 5.1.1 |
| Licence | Public domain (Natural Earth terms) |
| Pinned by | SHA-256 of each zip in `data/map/sources.json`; `npm run map:fetch` verifies, `-- --accept-new` re-pins |
| Countries zip sha256 | `36a54ee97a509325e98eb44fd91bc7e53b0c5139cf10039918042bbd64102192` |
| Places zip sha256 | `2963ee08f7743f13f37d5243acd77a2f7a510e26a36c7e04b920f1b381f2b251` |
| Fetched / checked | 2026-10-18 |
| Notes | 50m and 110m India-POV variants do not exist (HTTP 403, 2026-10-18); the low-detail layer is derived by simplifying the 10m file. Raw files live in `data/raw/ne/` (gitignored). |

## Border build (derived data)

Built by `npm run map:build` from the pinned India-POV file into `public/data/borders.{high,low}.topo.json` (object `countries`, properties `{ id: ADM0_A3, name }`, 248 countries).

| Layer | Settings | Raw | Gzip (transfer) |
|-------|----------|-----|-----------------|
| high | quantization 5e4 (about 0.007 deg, 800 m), no simplification | 3.47 MB | 798 KB |
| low | presimplify + simplify min weight 2e-3, quantization 1e4 | 711 KB | 177 KB |

Budgets (spec section 10) are measured as **gzip transfer size**: low <= 300 KB, high <= 1 MB. Sweep done 2026-10-18: high at quantization 1e5 was 942 KB gz (too close to the cap); quantization 5e4 keeps margin and is below the 1:10m source precision.
Patches: `data/map/patches/*.json` are applied before topology building (see `scripts/map/patches.ts`). None exist yet; the Shaksgam patch is pending the owner's reference polygon (Plan 1 Task 4).

Border build also: rewinds wrongly wound polygons and drops rings that quantization flipped (see `docs/MAP-POLICY.md`). After the fix: high 3.47 MB raw, low 658 KB raw; low has 229 of 248 countries (micro-states vanish at far zoom; high detail has all 248).

## Capitals and country list (derived)

`public/data/capitals.json`: 212 capitals from `ne_10m_populated_places_simple` rows with `featurecla` `Admin-0 capital` (202) or `Admin-0 capital alt` (13), minus 3 whose country the India-POV file does not list. Fields: name, country (ADM0_A3), lat, lon (4 decimals), rank. `public/data/countries.json`: all 248 `{ id, name }` from the India-POV file.
