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
