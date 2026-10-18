# VRI study 2: sensitivity and structural features

Date: 2026-10-18. Script: `npm run index:study2` (`scripts/index/study2.ts`; helpers `structural.ts`, `ged.ts`, `metrics.ts`, `panel.ts`; data from `npm run data:ucdp` and `npm run index:fetch`). Follows [VRI-BASELINE-STUDY.md](VRI-BASELINE-STUDY.md). Deterministic (seeded bootstrap), about 50 s and 380 MB.

**Questions:** (A) does the 25-deaths / 3-month target choice matter? (B) do structural features (World Bank WDI and WGI, neighbour violence) beat a history-only model, with uncertainty?

**Setup.** Country-month panel from UCDP GED 26.1 (126 countries, all mapped to Natural Earth ids). Targets: escalation (next h months >= thr deaths), rise (next 3 months >= 25 and >= 2x the previous 3), onset (no deaths in the last 12 months, next 12 months >= 25). Split by time: train t <= 2015-12, test 2021-01 and later (label windows never cross). Features use only data available at t: history (log deaths over 3, 12, 36 months), neighbours (log deaths of land neighbours over 12 months, how many had >= 25, how many neighbours), WDI (log GDP per capita, log population, infant mortality) and WGI (government effectiveness, rule of law, control of corruption, voice and accountability, regulatory quality). A World Bank value for year Y is used only from Y+1 on and at most 3 years old; the model comparison uses the 41,592 country-months from 1998 with every input. WGI's perceived-violence estimate is left out on purpose. Models are ridge logistic regressions; the 95% intervals are a cluster bootstrap over countries of the test rows (500 resamples), for differences against the history-only model M0.

## Results (raw output)

## Coverage

- GED events 417968; panel rows 51534; countries mapped to Natural Earth ids 126; dropped as unmapped: none; duplicate country-months skipped: 0
- rows with every structural input (from 1998): 41592 of 51534; train <= 2015-12, test 2021-01 and later

## A. Escalation target: threshold and horizon (history-only; all mapped rows)

| deaths in the next | at least | test rows | prevalence | positives in quiet places | AUC persistence (3 m) | AUC logistic | AP logistic | Brier skill |
|---|---|---|---|---|---|---|---|---|
| 3 months | 10 | 7182 | 30.6% | 24 of 2200 (1.1%) | 0.960 | 0.975 | 0.954 | 74.9% |
| 3 months | 25 | 7182 | 25.6% | 14 of 1839 (0.8%) | 0.971 | 0.981 | 0.958 | 77.9% |
| 3 months | 100 | 7182 | 18.0% | 2 of 1296 (0.2%) | 0.982 | 0.986 | 0.951 | 77.5% |
| 6 months | 10 | 6804 | 35.2% | 43 of 2396 (1.8%) | 0.947 | 0.972 | 0.959 | 75.0% |
| 6 months | 25 | 6804 | 30.4% | 30 of 2070 (1.4%) | 0.962 | 0.976 | 0.958 | 77.1% |
| 6 months | 100 | 6804 | 22.4% | 6 of 1527 (0.4%) | 0.980 | 0.988 | 0.968 | 81.0% |
| 12 months | 10 | 6048 | 40.1% | 86 of 2427 (3.5%) | 0.926 | 0.962 | 0.955 | 71.4% |
| 12 months | 25 | 6048 | 36.0% | 62 of 2175 (2.9%) | 0.943 | 0.967 | 0.956 | 74.1% |
| 12 months | 100 | 6048 | 27.2% | 19 of 1645 (1.2%) | 0.965 | 0.980 | 0.959 | 77.8% |

## B. escalation: next 3 months >= 25 deaths (control)

Train rows 26724 (5166 positives); test rows 7023, positives 1748 (24.9%), countries 124.

| model | AUC | AUC 95% CI | AP | Brier skill | delta AUC vs M0 (95% CI) | delta AP vs M0 (95% CI) |
|---|---|---|---|---|---|---|
| M0 history | 0.980 | 0.968-0.990 | 0.957 | 78.0% |  |  |
| M1 + neighbours | 0.980 | 0.968-0.989 | 0.957 | 77.9% | -0.000 (-0.001 to +0.001) | -0.000 (-0.002 to +0.001) |
| M2 + WDI | 0.980 | 0.968-0.989 | 0.958 | 77.9% | -0.000 (-0.002 to +0.001) | +0.001 (-0.002 to +0.004) |
| M3 + WGI | 0.981 | 0.969-0.990 | 0.956 | 77.6% | +0.001 (-0.001 to +0.003) | -0.001 (-0.003 to +0.001) |
| M4 all | 0.980 | 0.968-0.990 | 0.957 | 77.7% | +0.000 (-0.002 to +0.002) | -0.000 (-0.003 to +0.003) |

Baseline: persistence (3 m deaths) AUC 0.971; 500 cluster-bootstrap resamples over countries of the test rows (the fitted models are fixed: uncertainty from training is not included).

## B. rise: next 3 months >= 25 and >= 2x the previous 3

Train rows 26724 (1556 positives); test rows 7023, positives 352 (5.0%), countries 124.

| model | AUC | AUC 95% CI | AP | Brier skill | delta AUC vs M0 (95% CI) | delta AP vs M0 (95% CI) |
|---|---|---|---|---|---|---|
| M0 history | 0.807 | 0.767-0.849 | 0.150 | 3.5% |  |  |
| M1 + neighbours | 0.803 | 0.765-0.846 | 0.150 | 2.7% | -0.004 (-0.015 to +0.008) | -0.000 (-0.011 to +0.010) |
| M2 + WDI | 0.804 | 0.764-0.845 | 0.150 | 4.7% | -0.003 (-0.011 to +0.005) | -0.000 (-0.013 to +0.014) |
| M3 + WGI | 0.818 | 0.778-0.860 | 0.159 | 4.6% | +0.011 (+0.001 to +0.021) | +0.009 (+0.001 to +0.021) |
| M4 all | 0.807 | 0.766-0.849 | 0.155 | 4.8% | +0.000 (-0.013 to +0.013) | +0.005 (-0.012 to +0.023) |

Baseline: persistence (3 m deaths) AUC 0.738; 500 cluster-bootstrap resamples over countries of the test rows (the fitted models are fixed: uncertainty from training is not included).

## B. onset: no deaths in the last 12 months, next 12 months >= 25

Train rows 15575 (617 positives); test rows 2837, positives 62 (2.2%), countries 85.

| model | AUC | AUC 95% CI | AP | Brier skill | delta AUC vs M0 (95% CI) | delta AP vs M0 (95% CI) |
|---|---|---|---|---|---|---|
| M0 history | 0.585 | 0.425-0.765 | 0.035 | 0.5% |  |  |
| M1 + neighbours | 0.616 | 0.396-0.795 | 0.028 | -2.8% | +0.032 (-0.114 to +0.169) | -0.006 (-0.060 to +0.005) |
| M2 + WDI | 0.616 | 0.441-0.794 | 0.030 | -0.1% | +0.032 (-0.222 to +0.279) | -0.005 (-0.075 to +0.022) |
| M3 + WGI | 0.608 | 0.394-0.870 | 0.041 | -0.1% | +0.024 (-0.112 to +0.228) | +0.006 (-0.027 to +0.058) |
| M4 all | 0.644 | 0.436-0.837 | 0.033 | -2.1% | +0.060 (-0.065 to +0.185) | -0.002 (-0.049 to +0.016) |

Baseline: persistence (3 m deaths) AUC 0.500; 500 cluster-bootstrap resamples over countries of the test rows (the fitted models are fixed: uncertainty from training is not included).

## What it says

1. **The target choice does not rescue "escalation".** At every threshold (10, 25, 100 deaths) and horizon (3, 6, 12 months) history alone ranks the next period with AUC 0.93 to 0.99, and at most 3.5% of positives happen in places with no deaths in the last 12 months. Structural features change nothing (all intervals of the AUC differences include 0, within +-0.003). Saying "violence continues where it is happening" is accurate, easy and not a forecast.
2. **Rise is where there is something to explain, and history carries most of it.** Persistence ranks it with AUC 0.74, the history-only logistic with 0.81 (interval 0.77 to 0.85), but Brier skill is only 3.5% over the base rate. Adding the WGI governance scores gives AUC +0.011 (interval +0.001 to +0.021) and AP +0.009 (+0.001 to +0.021): a small gain that only just excludes zero, one of eight comparisons made here and uncorrected for that. Neighbour violence, WDI and the all-features model add nothing measurable (their intervals sit around 0).
3. **Onset cannot be forecast from these inputs at this sample size.** In 2021 to mid-2025 only 62 of 2,837 quiet country-months (85 countries) saw 25 or more deaths in the next 12 months. All models score AUC 0.58 to 0.64 with intervals of roughly 0.4 to 0.87: indistinguishable from each other and from a coin flip. This is the finding the spec warned about: "if structural features add nothing measurable over persistence, say so".

## Consequences for the VRI design (proposed)

- **Ship** what the data supports: **Activity now** (the existing tension index) and **Momentum** (change against the country's own baseline), each with plain definitions; a **Risk** component defined as "chance of a rise in the next 3 months", from history (optionally with WGI), labelled with its modest skill (AUC 0.81, Brier skill about 4%) and its range, never with the word "forecast" for onset.
- **Do not claim** to predict outbreaks in peaceful countries, and do not show structural drivers (GDP, neighbours) as "why this score": they did not earn a place. If a "why this score" list is built, it explains the history terms and, at most, the WGI term.
- The headline must stay "risk estimate", with the interval and the test-year performance visible in the method panel.

## Limits (do not over-read)

- One time split (test years 2021 to 2025); a different split could move the small WGI gain either way. The intervals cover test-set sampling only, not training uncertainty or the choice of model.
- Universe is only the 126 countries in GED; never-violent countries are absent, and states that changed (Yugoslavia, Rhodesia, Czechoslovakia) are mapped to their successor's World Bank series, which is wrong for the 1990s training rows.
- Deaths are UCDP `best` estimates; WGI is a perceptions index with margins of error; neighbours use current land borders (island states have none).
- Thresholds (25 deaths, doubling) are the spec's defaults, only probed here in table A for escalation, not for rise or onset.
- No independent review of this study yet.
