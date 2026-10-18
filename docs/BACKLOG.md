# Backlog

Open items found during Plan 1 that were deliberately not fixed. Each is graded Minor by effect unless noted. Source: final whole-branch review (2026-10-18) and implementer notes.

## Needs the owner

- ~~Shaksgam Valley patch~~ **Not needed** (D-027): Natural Earth's India file already includes the valley; verified against the Survey of India map.
- **Review the India guard point list** (`data/map/india-guard.json`, 18 verified points) against the Survey of India map.
- **Confirm** that capitals of Kosovo, Somaliland and Western Sahara stay dropped (D-022).

## Engine and UI

- `GlobeCanvas` effect depends on `onPick`: an inline callback rebuilds the globe and refetches data. Keep it in a ref.
- `installFrameOverlay` (dev only) never removes its element or key listener.
- A lost WebGL context shows the permanent "cannot run WebGL2" message with no restore path (wording misleading for a transient GPU reset).
- `dispose()` does not call `renderer.forceContextLoss()`; the `hasWebGL2` probe context is never released (context pile-up under HMR / React StrictMode).
- Data fetches are sequential and StrictMode double-fetches the low file: use `AbortController` and `Promise.all`.
- Until the high-detail file loads, picking uses the low-detail data (lacks about 19 micro-states); the picker swap is deferred twice.
- Picking at exactly lat -90, or exactly lon +-180 on Chukotka, returns null (exact equality only).
- Keyboard navigation and pinch zoom of the globe are not implemented (spec lists keyboard navigation; planned for Plan 5 accessibility pass).

## Tests, scripts, docs

- Regression test against the Survey of India reference: commit a simplified registered boundary (about 3,000 points) and assert the built India outline stays within about 8 km of it everywhere. Needs a decision on redistributing derived data from a Government of India map.
- Outline differences beyond Shaksgam are unchecked individually: e.g. the northern tip near 75.2E 37.0N differs by up to 18 km, and Kalapani/Sir Creek were not compared.
- `scripts/check-budgets.ts` passes silently when `dist/` or data files are missing; it should fail.
- `india-guard.json` `status` is not validated (a typo skips an entry) and a `pending-owner` entry only warns.
- `docs/DATA-SOURCES.md` border table has stale low-detail numbers (711 KB raw / 177 KB gz; measured 626 KB / 162 KB). D-021 should say the antimeridian split also caused the seam lines (fixed).
- Patch engine fails on overlaps only, not on gaps (cut-from without add-to); see D-026.
- Micro-states without a polygon (Vatican, Tuvalu's capital point, Coral Sea Islands, Scarborough Reef): point-based lookup in Plan 3.

## Plan 2 deferred minors (final review, 2026-10-18)

- `fetch-gdelt.ts` drops a slot silently after 3 failed attempts and ignores `Retry-After`; the summary does not report failures; `fetch-ucdp.ts` does not retry thrown network errors.
- `verifySnapshotHash` resolves true when SubtleCrypto is missing (plain http off localhost): the checksum is skipped silently.
- GDELT is fetched over plain http (GDELT offers no https for these files); source URLs from GDELT end up as links on the card (http(s) only, `noopener noreferrer`).
- `merge.ts`: merged groups lose the other rows' actors and place; `find` recurses without a depth limit; a row with the head's own id can add it to `alsoIds`.
- The idle archive load is not cancelled by a visibility change; the poller does not refetch when the tab becomes visible again.
- `freshness` shows `HH:MM UTC` without a date, ambiguous when days old.
- GDELT-only recent window: the recent snapshot has no UCDP data after 2026-08-31 and GDELT is US-centric and noisy (see `docs/TENSION-INDEX.md`); human-coded coverage (ACLED, newer UCDP) is the real fix.
- No scheduled 15-minute ingest yet (Plan 5): "live" means the age of the last manual build, shown honestly by the pill.

## Plan 3 deferred minors (2026-10-18)

- An unknown id in the URL (`#c=XXX`) leaves the hash in place while no dossier opens; it should be cleared.
- Clicking a capital marker that has an event under it opens the event card as well as the dive.
- Capital labels are not culled against the open dossier panel; no hover cursor over markers; no keyboard route to markers (the palette is the accessible route).
- The dive framing shift (0.17 / 0.2 of the canvas) is a fixed guess; desktop-width framing was not checked visually.
- Factbook fields are archived (data date 2026-01-22, D-038): replace them (Wikidata or national sources) in a later plan; 61 Factbook files did not match a country by capital coordinates (see DATA-SOURCES.md).
- `GlobeCanvas` rebuilds the whole globe when `onPick` or `onLabels` changes identity (both are stable today; keep them in refs if that changes).
