# Roadmap

Each plan produces working, testable software on its own. Plans live in `docs/superpowers/plans/`. Spec: `docs/superpowers/specs/2026-10-18-defcon-design.md`.

| Plan | Scope | Status |
|------|-------|--------|
| 1. Foundation, map, globe core | Scaffold and tokens; India-POV borders (two detail levels) with patch engine and guard tests; capitals; hairline Three.js globe; country picking; Sonar Boot; budgets. | Done, on `main` |
| 2. Events and live data | Event schema; GDELT and UCDP normalisers; real historical seed (UCDP GED CSV); dedupe, confidence, severity; snapshot format; Web Worker client; instanced event layer with sonar ripples; "data as of" UI; provisional tension index. | Done, on `main` |
| 3. Dossiers and navigation | Per-country dossier build (World Bank, CIA Factbook mirror, memberships) with source and date per field and redaction for missing data; Country Dive; Cmd/Ctrl-K jump; capital and label LOD; micro-state lookup. | Plan written (11 tasks); executing |
| 4. Signature interactions | Pulse Border, Grain = Data, Cursor = Radar, Alliance Arcs (allies + active disputes), Declassify with time scrubber, Night Watch, World Sound, day/night terminator. | Not written |
| 5. Data pipeline and hosting | Scheduled ingestion (GitHub Actions), publishing the event snapshot to the deployed site, Vercel deployment flow, CI hardening. | Not written |
| 6. Hardening and launch | Adaptive quality tiers, phone tier, accessibility pass, CSP and security headers verified against the real app, About/Sources page, error boundary and monitoring, launch checklist. | Not written |

Repository: private GitHub repo `Tribal-Chief-001/defcon` (CI green on a clean runner); Vercel-ready (`vercel.json`, `docs/DEPLOY.md`), deployed by the owner.

Items needing the owner: guard-point list review (Plan 1); UCDP token and ACLED account, or a decision to skip them (Plan 2); Vercel project connection and domain (Plan 5); choosing a licence.
