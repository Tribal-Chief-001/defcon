# VRI baseline study (first step of INSTABILITY-INDEX.md section 9)

Date: 2026-10-18. Script: `npm run index:study` (`scripts/index/study.ts`, helpers `panel.ts`, `metrics.ts`, tests in `tests/index/`). Data: UCDP GED 26.1 only (CC BY 4.0, 1989-01 to 2025-12, 417,968 events), nothing else yet. Output panel: `data/index/country-month.csv` (gitignored, regenerable; 51,534 rows, 126 countries).

**Question:** how hard is a prior-violence-only baseline to beat? If structural features add nothing over persistence, say so (spec section 9).

**Setup.** Country-month panel by Gleditsch-Ward country, deaths = UCDP `best`. Features use data up to month t only: deaths in the last 3, 12 and 36 months. Targets: *escalation* = next 3 months hold >= 25 deaths; *rise* = escalation and at least double the previous 3 months. Split by time: train t <= 2016-09, validation 2017-01..2020-09, test 2021-01..2025-09 (the label windows never cross a split). Baselines: persistence (rank by deaths in the last 3 months), any violence in the last 12 months, and a logistic regression on log1p of the three sums. Brier skill = improvement over always predicting the training base rate.

## Results (raw output)

events 417968, countries 126, panel rows 51534 (1991-12 to 2025-12; labels need 3 future months)

### Target "escalation": next 3 months >= 25 deaths
Train rows 37548, base rate 19.9%; logistic on log1p(deaths 3/12/36 months), weights -2.87, 1.15, 0.84, 0.91

| split | rows | positives | AUC persistence(3m) | AUC any-violence(12m) | AUC logistic | AP persistence | AP logistic | Brier logistic | Brier base rate | Brier skill | Log loss |
|---|---|---|---|---|---|---|---|---|---|---|---|
| train (<=2016-09) | 37548 | 7482 (19.9%) | 0.942 | 0.841 | 0.962 | 0.852 | 0.885 | 0.052 | 0.160 | 67.6% | 0.183 |
| validation (2017-01..2020-09) | 5670 | 1327 (23.4%) | 0.978 | 0.830 | 0.987 | 0.953 | 0.969 | 0.033 | 0.180 | 81.5% | 0.127 |
| test (2021-01..2025-09) | 7182 | 1839 (25.6%) | 0.971 | 0.820 | 0.981 | 0.941 | 0.958 | 0.043 | 0.194 | 77.9% | 0.152 |

Test: 3475 country-months had zero deaths in the previous 12 months; 14 of 1839 test positives (0.8%) happened there (the part persistence cannot catch).

Reliability on test (logistic, 5 equal-count bins): predicted -> observed
- bin 1: 0.7% -> 0.2% (n 1436)
- bin 2: 0.7% -> 0.6% (n 1436)
- bin 3: 2.2% -> 1.5% (n 1437)
- bin 4: 28.6% -> 28.7% (n 1436)
- bin 5: 90.4% -> 97.1% (n 1437)

### Target "rise": next 3 months >= 25 deaths and >= 2x previous 3 months
Train rows 37548, base rate 6.6%; logistic on log1p(deaths 3/12/36 months), weights -3.28, -0.69, 0.91, 0.87

| split | rows | positives | AUC persistence(3m) | AUC any-violence(12m) | AUC logistic | AP persistence | AP logistic | Brier logistic | Brier base rate | Brier skill | Log loss |
|---|---|---|---|---|---|---|---|---|---|---|---|
| train (<=2016-09) | 37548 | 2486 (6.6%) | 0.744 | 0.765 | 0.825 | 0.123 | 0.223 | 0.056 | 0.062 | 9.2% | 0.200 |
| validation (2017-01..2020-09) | 5670 | 269 (4.7%) | 0.762 | 0.758 | 0.835 | 0.091 | 0.167 | 0.043 | 0.046 | 6.4% | 0.160 |
| test (2021-01..2025-09) | 7182 | 380 (5.3%) | 0.736 | 0.736 | 0.811 | 0.094 | 0.159 | 0.048 | 0.050 | 4.0% | 0.178 |

Test: 3475 country-months had zero deaths in the previous 12 months; 14 of 380 test positives (3.7%) happened there (the part persistence cannot catch).

Reliability on test (logistic, 5 equal-count bins): predicted -> observed
- bin 1: 1.3% -> 0.2% (n 1436)
- bin 2: 1.4% -> 0.6% (n 1436)
- bin 3: 3.1% -> 2.0% (n 1437)
- bin 4: 8.7% -> 9.3% (n 1436)
- bin 5: 21.1% -> 14.3% (n 1437)


## What it says

1. **"Escalation" is almost entirely persistence.** Counting deaths in the last 3 months already ranks the next quarter with AUC 0.97 on the 2021-2025 test years, and only 14 of 1,839 test positives (0.8%) happened where there had been no deaths for 12 months. A model on this target mostly says "violent countries stay violent". It is well calibrated, but it must **not** be sold as a forecast; it is a description of continuing conflict.
2. **"Rise" is the harder, more useful target, and persistence is weak on it:** AUC 0.74 (persistence) to 0.81 (logistic on history only), average precision 0.09 to 0.16 (base rate 5.3%), Brier skill only 4%. The top bin is over-confident (predicts 21%, observed 14%). This is where structural features (governance, regime type, neighbours, economy) could add something, and where honesty about uncertainty matters most.
3. **Onset (a quiet country turning violent) is too rare to evaluate at a 3-month horizon** (14 test cases). It needs a longer horizon (12 months) or a lower threshold to have enough events.

## Limits of this study (do not over-read the numbers)

- **Universe:** only the 126 countries that appear in GED at least once; never-violent countries are absent, and states are present for all months from 1989 even before they existed (for example South Sudan before 2011). Test years 2021-2025 are the cleanest; training years are less so. Adding peaceful countries would raise AUCs (easy negatives), so the numbers here are not inflated that way, but they are also not a global picture.
- **Threshold 25 and the 3-month horizon are the spec's defaults and are not yet tested for sensitivity** (10, 25, 100; 12 months).
- **Deaths are UCDP `best` estimates**, with their own reporting lags and uncertainty; no `low`/`high` ranges used.
- **Only 3 history features.** No structural, neighbour or regime inputs yet; the "rise" gain from 0.74 to 0.81 AUC is from history alone (3-, 12- and 36-month sums).
- **No uncertainty yet:** no bootstrap intervals on the metrics, one split only.
- Single run, no repeated splits; the script is deterministic but the result has not been independently reviewed.

## Consequences for the VRI design (proposed, to be confirmed)

- Keep **Risk** but define its headline target as **rise and onset**, not "violence continues"; show "ongoing conflict" separately as a status taken straight from the data.
- Next study steps, in order: (a) sensitivity to threshold and horizon, plus a 12-month onset target; (b) add World Bank WGI aggregates, V-Dem and WDI, and neighbour violence, and test whether they beat the history-only logistic on rise/onset with bootstrap intervals; (c) only then decide the headline model. If (b) shows no gain, ship Momentum and Activity now with the finding written down.
