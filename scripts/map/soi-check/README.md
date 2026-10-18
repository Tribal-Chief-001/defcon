# Survey of India cross-check (analysis scripts, not part of the build)

Purpose: check Natural Earth's India point-of-view outline against India's own official map, using the Survey of India's vector political map.

**Source:** `https://surveyofindia.gov.in/UserFiles/files/POLMAP_ENGLISH-2026.pdf` (Political Map of India, English, 13th edition, file dated 23 Jan 2026), 31,785,145 bytes, sha256 `75f4c9f9b14b94c3d383487b6a1b4d599870455f364b3a560e2538fff1c5fe00`, downloaded 2026-10-18. The PDF is a Government of India publication and is not committed to this repo; download it yourself.

**Method (2026-10-18)**
1. `pdftocairo -svg POLMAP_ENGLISH-2026.pdf polmap.svg` (poppler-utils; 327 MB SVG).
2. `python3 -I extract-halo.py polmap.svg halo.json`: the international boundary is drawn with an orange halo stroke (3 stroked paths, 49 subpaths, 15,063 densified points).
3. `node register.mjs halo.json data/raw/ne/ne_10m_admin_0_countries_ind.shp halo-lonlat.json`: the page is a polyconic-style projection, so the halo is registered to Natural Earth's India outline by trimmed ICP with a degree-4 polynomial (no map projection assumed). Result: rms 3.66 km, median 2.35 km, p95 7.42 km over 12,803 of 15,063 points.
4. `node compare.mjs halo-lonlat.json <ne countries ind .shp> <ne_10m_admin_0_boundary_lines_disputed_areas.shp>`.

**Findings (see docs/MAP-POLICY.md)**
- Natural Earth's own "Indian claim" line for the Shaksgam Valley (B06) lies within a median 3.2 km (max 8.0 km) of the Survey of India boundary.
- In the Shaksgam sector (441 boundary points) the Survey of India boundary lies a median 3.9 km (p90 10.2 km, max 18.4 km) from Natural Earth's India outline, which is about the registration error. Points inside the valley (north of K2, Kyagar area) and K2 itself are inside India in the Natural Earth India file. **No Shaksgam patch is needed.**
- Limits: accuracy is about 4 km (the registration residual, map scale 1:4,000,000); the halo is the centre of a 5.1 pt stroke, not necessarily the exact line; this checks the outline, not the Survey of India's naming or labels.
