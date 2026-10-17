# Roadmap

Each plan produces working, testable software on its own. Plans live in `docs/superpowers/plans/`. Spec: `docs/superpowers/specs/2026-10-18-defcon-design.md`.

| Plan | Scope | Status |
|------|-------|--------|
| 1. Foundation, map, globe core | Scaffold and tokens; India-POV borders (two detail levels) with patch engine and guard tests; capitals; hairline Three.js globe; country picking; Sonar Boot; budgets. | Written, not started |
| 2. Events and live data | Event schema; GDELT and UCDP normalisers; real historical seed (UCDP GED CSV); dedupe, confidence, severity; 15-minute snapshot publisher; Web Worker client; instanced event layer with sonar ripples; "data as of" UI. | Not written |
| 3. Dossiers and navigation | Per-country dossier build (World Bank, CIA Factbook, SIPRI link/licence check) with source and date per field and redaction for missing data; Country Dive; ⌘K jump; capital and label LOD. | Not written |
| 4. Signature interactions | Pulse Border, Grain = Data, Cursor = Radar, Alliance Arcs (allies + active disputes), Declassify with time scrubber, Night Watch, World Sound, day/night terminator. | Not written |
| 5. Hardening and launch | Adaptive quality tiers, phone tier, accessibility pass, About/Sources page, hosting and scheduled ingestion, launch checks. Needs owner approval before any deploy or spend. | Not written |

Blocking items needing the owner: Shaksgam reference polygon and guard-point review (Plan 1); UCDP token and ACLED account, or a decision to skip them (Plan 2); hosting and domain (Plan 5).
