# Severity (1-5)

Defcon's own scale. Rule: **severity 4-5 requires human-coded fatalities.** Auto-coded events (GDELT) never exceed 3. Implemented in `src/events/severity.ts`, tested in `tests/events/severity.test.ts`. Provisional: the owner reviews the table.

| Event | Rule |
|-------|------|
| Human-coded `armed` / `civilian` (UCDP) | by best-estimate deaths: 0 -> 1, 1-4 -> 2, 5-24 -> 3, 25-99 -> 4, 100+ -> 5; unknown -> 1 |
| Human-coded `riot` / `protest` / `other` (none yet; ACLED later) | max(base, the same death bins); base riot 2, protest 1, other 1 |
| Auto-coded `armed` / `civilian` (GDELT) | 2, plus 1 when GoldsteinScale <= -9.5; capped at 3; deaths are ignored |
| Auto-coded `protest` / `riot` | protest 1, riot 2; plus 1 when NumSources >= 10; capped at 3 |
| Auto-coded `other` | 1 |

Unknown or non-finite inputs never produce a value outside 1..5.
