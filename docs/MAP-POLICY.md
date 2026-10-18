# Map policy

**India's boundary must match India's official map.** This is a hard requirement (decision D-002).

- **Authority:** the Survey of India's official political map of India (and the MEA's published depiction). Natural Earth's India point-of-view file only approximates it.
- **Source:** `ne_10m_admin_0_countries_ind`, pinned by SHA-256 (`data/map/sources.json`). Never use OSM/Protomaps-style border tiles. No alternative-worldview toggle.
- **Patches:** geometry the file lacks is added in `data/map/patches/*.json` (see `scripts/map/patches.ts`). A claimed area is always added to one country **and** cut from its neighbour so polygons never overlap. Each patch records its `source`.
- **Guard (tests):** `data/map/india-guard.json` lists points and the country that must contain each; `tests/map/india-guard.test.ts` checks both detail levels. `data/map/india-outline.sha256` pins India's outline; `tests/map/india-outline.test.ts` fails if it changes.
- **Changing the pin:** only with an owner-approved entry in `docs/DECISIONS.md`, then `npm run map:pin-india`.
- **Measured 2026-10-18 on the unpatched file:** Srinagar, Leh, Gilgit, Muzaffarabad, Skardu, Aksai Chin, Kargil, Tawang, Itanagar and the Shaksgam Valley (north of K2, Kyagar area) are inside India; K2 is inside India. **No patch is needed** (see the cross-check below). An earlier note here said the Shaksgam Valley was in China; that was wrong (see D-027).
- **Guard point list:** `data/map/india-guard.json` has 18 verified points. Their coordinates need the owner's review against the Survey of India map.
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

## Cross-check against the Survey of India map (2026-10-18)

The Survey of India's Political Map of India (English, 13th edition, file dated 23 Jan 2026) is a vector PDF. Its international-boundary stroke was extracted and registered to Natural Earth's India outline (rms 3.66 km, median 2.35 km over 12,803 points; method and scripts in `scripts/map/soi-check/`). Results:

- Natural Earth's own "Indian claim" line for the Shaksgam Valley (B06) is a median 3.2 km (max 8.0 km) from the Survey of India boundary.
- In the Shaksgam sector the Survey of India boundary is a median 3.9 km (p90 10.2, max 18.4 km) from Natural Earth's India outline, about the registration error. Points in the valley are inside India in the Natural Earth India file.
- Limits: about 4 km accuracy at map scale 1:4,000,000; the halo is the centre of a 5.1 pt stroke; this compares outlines only, not names or labels. Natural Earth's outline is therefore consistent with the official map to within the check's accuracy, not proven identical.
- Not yet done: a regression test against this reference (the registered boundary is not committed; see BACKLOG).

