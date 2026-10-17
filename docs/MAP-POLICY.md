# Map policy

**India's boundary must match India's official map.** This is a hard requirement (decision D-002).

- **Authority:** the Survey of India's official political map of India (and the MEA's published depiction). Natural Earth's India point-of-view file only approximates it.
- **Source:** `ne_10m_admin_0_countries_ind`, pinned by SHA-256 (`data/map/sources.json`). Never use OSM/Protomaps-style border tiles. No alternative-worldview toggle.
- **Patches:** geometry the file lacks is added in `data/map/patches/*.json` (see `scripts/map/patches.ts`). A claimed area is always added to one country **and** cut from its neighbour so polygons never overlap. Each patch records its `source`.
- **Guard (tests):** `data/map/india-guard.json` lists points and the country that must contain each; `tests/map/india-guard.test.ts` checks both detail levels. `data/map/india-outline.sha256` pins India's outline; `tests/map/india-outline.test.ts` fails if it changes.
- **Changing the pin:** only with an owner-approved entry in `docs/DECISIONS.md`, then `npm run map:pin-india`.
- **Measured 2026-10-18 on the unpatched file:** Srinagar, Leh, Gilgit, Muzaffarabad, Skardu, Aksai Chin, Kargil, Tawang, Itanagar are inside India. **Shaksgam Valley (36.2N, 77.0E) is inside China**, so it needs a patch; its guard entry is `pending-owner`. Coordinates of guard points must be reviewed by the owner against the Survey of India map.
- **Pending (owner):** reference polygon for the Shaksgam Valley and review of the point list. Plan 1 is not done until this clears.
- **Out of scope for v1:** maritime zones (EEZ).
- **Other disputed territories:** shown as in the same Natural Earth file; to be documented here when Plan 3 adds country dossiers.

## Build pipeline gotchas (found 2026-10-18)

- Some Natural Earth polygons (Indonesia, Maldives, Bahamas) are wound the other way for d3-geo; the build rewinds any polygon whose spherical area exceeds a hemisphere (`scripts/map/rewind.ts`).
- Quantization can flip tiny islets; after quantizing, rings whose winding no longer matches are dropped (`dropBadRings` in `scripts/map/build-borders.ts`). The low-detail file loses about 19 micro-states/territories this way; high detail keeps them.
- Without these, `geoContains` returns the "whole world minus the country" for those countries and ocean clicks pick wrong countries.

## India-POV file differences (found 2026-10-18)

- **Not separate countries in this file:** Kosovo, Somaliland, Western Sahara. Their capitals (Pristina, Hargeisa, Bir Lehlou) are therefore dropped from `capitals.json` so capitals follow the same worldview as the borders. Owner to confirm this reading when dossiers (Plan 3) are designed.
- **Too small for the high-detail border data (quantization 800 m):** Vatican (VAT), Coral Sea Islands (CSI), Scarborough Reef (SCR). They stay in `countries.json` and (for Vatican City) in `capitals.json`, but have no polygon.
- **Id mismatch:** South Sudan is `SDS` in the countries file and `SSD` in the places file; the capitals build aliases it.
- **Text fields are NUL-padded** in the dbf; the build trims them.
