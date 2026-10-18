# Tension index (provisional)

Defcon's own composite of recent event volume and severity, per country or global. Labelled **"DEFCON-style"** in the UI. It is **not** the official US DEFCON level and says nothing about real-world readiness. Provisional: the owner reviews the formula and constants. Code: `src/events/tension.ts`; tests: `tests/events/tension.test.ts`.

## Formula

```
score = sum over events in the last 7 days of
        weight[kind] * severity^1.5 * (human-coded ? 1 : 0.5) * 0.5^(ageDays / 3)
level = clamp(round(1 + 4 * (1 - exp(-score / scale))), 1, 5)
```

Weights: civilian 1.2, armed 1, riot 0.6, protest 0.3, other 0. Events after `nowS` and older than the window count 0. `severity` is the scale in `docs/SEVERITY.md`.

## Calibration (2026-10-18)

`scale = 1448`, from `scripts/events/calibrate-tension.ts`: the median 7-day global score of the UCDP archive (310 daily windows, 2025-10-18 to 2026-08-31; p25 631, median 681, p75 722, max 1,111) maps to a level value of 2.5. Consequence: over the last year the global level stayed at 2-3; level 4 needs about 2.1 times the median weekly activity (score about 1,420) and level 5 about 4.4 times (about 3,000).

## Comparability (found on real data)

Applying that UCDP-calibrated scale to the GDELT-only last 30 days (UCDP data ends 2026-08-31) gave **global level 5 (score 6,808) and USA level 4, while Ukraine scored 1, Israel 1, Sudan 1, India 2**. GDELT is US-centric local news with noisy "armed" codes, so its score is not comparable with UCDP's. Therefore `tension()` also returns `humanShare` (fraction of the score from human-coded events) and `comparable` (`humanShare >= 0.5` and `score > 0`). **The UI must not present a non-comparable level as a measure of tension** (for example, no orange Pulse Border and no "level" text); it should say "auto-coded data only" until human-coded data (ACLED or newer UCDP) covers the window.

## Limits

- One calibration on one source and one year; revisit when ACLED is added or UCDP releases newer months.
- Severity and weights are judgment calls; they affect rankings between countries.
- Countries are assigned with the India-POV borders.
