# Conflict risk indices and forecasting systems vs Defcon Fatality Index and VRI

Read date for every source below: 2026-10-29 (today) unless stated. Tags: FETCHED = I read the page or document text myself this session. SNIPPET = only seen in a web-search result summary, treat as UNVERIFIED. NOT READ = I could not open it. Quotes are 25 words or fewer. No 2026 facts are from memory; every 2026 date below comes from a page I fetched or a search result cited next to it.

Defcon reference (given in the task, not a web fact): Fatality Index = 100*log10(1+deaths in 90 days)/log10(10001), UCDP, with ranges and bands. VRI = two ridge logistic models (P of at least 25 deaths in next 3 months; P of a sharp rise: at least 25 and at least 2x previous 3 months), country history plus World Bank governance indicators, 90% cluster-bootstrap intervals, momentum, heuristic confidence label, additive "why this score", time-split backtest AUC 0.85 (rise) vs 0.74 (recent deaths alone) and 0.98 (continue), yearly rolling backtest, calibration bins, 130 countries, refreshed by hand.

---

## 1. ViEWS (Violence and Impacts Early-Warning System), Uppsala University and PRIO

### Takeaway
The only system here that matches Defcon's design (open, learned, validated) at much larger scale: monthly country and 0.5 degree grid forecasts out to 36 months, an ensemble, and published competitions. Its newest release is 29 days old. Strongest published evidence also shows how hard it is to beat a simple historical baseline.

### Cited findings
- Owner and funding: co-hosted by Uppsala University Department of Peace and Conflict Research and PRIO. Funders listed include the European Research Council, Riksbankens Jubileumsfond, UN ESCWA, UK FCDO, Swedish Research Council, Norwegian Research Council and UNHCR. FETCHED. [viewsforecasting.org](https://viewsforecasting.org/)
- Target and unit: state-based armed conflict (whether it occurs, how widespread, how intense). Worldwide country-month forecasts plus geo-referenced forecasts at 0.5 degree (PRIO-GRID) for Africa and the Middle East; horizon 1 to 36 months. FETCHED. [viewsforecasting.org](https://viewsforecasting.org/); [early-warning-system page](https://viewsforecasting.org/early-warning-system/)
- Original 2019 scope: state-based, non-state and one-sided violence in Africa; ensemble of constituent models each reflecting a theme or statistical/ML approach; forecasts at country and subnational level. FETCHED. [PRIO, Hegre et al. 2019 JPR 56(2)](https://www.prio.org/publications/11231); full text read from [Konstanz repository PDF](https://kops.uni-konstanz.de/server/api/core/bitstreams/197041e4-3a22-46b3-8ac4-1d0f6c75b916/content)
- Cadence and timeliness: site says "New forecasts released every month." The release notice shown is "Conflict Forecasts for Sep 2026-Aug 2029," posted 30 Sep 2026; the previous notice shown is 30 Jun 2026. The data page names dataset `fatalities003_2026_08_t01` (Sep 2026 to Aug 2029, input data up to Aug 2026). So the newest forecast is about 29 days old today. The announced dates look quarterly while the text says monthly; I did not resolve this. FETCHED. [home](https://viewsforecasting.org/); [data page](https://viewsforecasting.org/data/)
- The early-warning-system page still shows a dashboard snapshot for June 2025 built on data through December 2024, so parts of the site are stale. FETCHED. [early-warning-system](https://viewsforecasting.org/early-warning-system/)
- Inputs: UCDP data (GED and the UCDP candidate stream) plus themed covariates (conflict history, economy, demography, institutions, geography, protest, etc.). Multiple imputation for missing predictors. FETCHED. [Hegre et al. 2019 PDF](https://kops.uni-konstanz.de/server/api/core/bitstreams/197041e4-3a22-46b3-8ac4-1d0f6c75b916/content)
- Model class: ensemble of themed models (logistic, random forest, dynamic simulation among others in 2019); the current production pipeline is an ML ensemble run through Prefect; the README says "Fatalities002" is in production while the data page names fatalities003, an inconsistency I did not resolve. FETCHED. [views_pipeline README](https://github.com/prio-data/views_pipeline/blob/main/README.md); [data page](https://viewsforecasting.org/data/)
- Weights learned, not editorial (ensemble weights tuned on a calibration period). FETCHED (2019 paper). [PDF](https://kops.uni-konstanz.de/server/api/core/bitstreams/197041e4-3a22-46b3-8ac4-1d0f6c75b916/content)
- Published validation (2019 paper, country-month, state-based conflict, 36 months, test period Jan 2015 to Dec 2017, Table V):
  - Baseline (share of training months with conflict): AUROC 0.8238, Brier 0.1252, AUPR 0.675.
  - Baseline plus conflict history theme: AUROC 0.9442, Brier 0.0662, AUPR 0.851.
  - Ensemble: AUROC 0.9555, Brier 0.0932, AUPR 0.869. The Brier score of the ensemble is worse than the simpler history model; the authors say it may be because the ensemble gives more high-probability predictions.
  - Grid level (Table VI): ensemble AUROC 0.9484, AUPR 0.277, Brier 0.00623; baseline AUROC 0.6324, AUPR 0.049.
  - The authors say they give priority to AUPR over AUROC.
  FETCHED. [PDF](https://kops.uni-konstanz.de/server/api/core/bitstreams/197041e4-3a22-46b3-8ac4-1d0f6c75b916/content)
- Out-of-sample design: train/calibrate/test partitions in time; an evaluation as of 1 Oct 2018 and a true-future window. For the newer challenge, a true future window (July 2024 to June 2025) and independent scoring committee. FETCHED. [PRIO news 3602](https://www.prio.org/news/3602); [arXiv 2407.11045 text](https://arxiv.org/abs/2407.11045)
- 2022 escalation competition (International Interactions 48(4)): a simple ensemble of contributions predicted better than the average individual model; judged on performance, novelty, uniqueness, replicability. FETCHED. [PRIO 13337](https://www.prio.org/publications/13337)
- 2023/24 prediction challenge: forecast UCDP fatalities as full probability distributions, scored mainly with CRPS (also IGN and MIS); 13 institutions. Data: 87% of country-months and 99% of grid-months are zero. Benchmarks include "exactly zero," "last historical value" (Poisson), and "conflictology" empirical-distribution models (past 12 months of the same country; bootstrap of 240 months worldwide). FETCHED. [arXiv 2407.11045 PDF, read locally](https://arxiv.org/pdf/2407.11045); [PRIO news 3602](https://www.prio.org/news/3602)
- Interim result (26 Feb 2025): the organizers' "Conflictology" benchmark led all contestant models at both country and grid level; Observed Markov Model and Bayesian negative-binomial GLMM close behind at country level. Final scores: NOT READ (JPR 62(6) 2070-2087 is cited by IDEAS in a search result but I did not open it; the challenge site predcomp.viewsforecasting.org returned HTTP 502). FETCHED (interim). [PRIO news 3602](https://www.prio.org/news/3602)
- Independent critique/complement: Schincariol, Frank and Chadefaux (JPR 62(6), 2025) say VIEWS is more accurate on average but a pattern-matching "Shape finder" better captures escalation and de-escalation; switching between them beat both and two baselines (null and t-1) on error and variability. FETCHED. [JPR abstract](https://academic.oup.com/jpr/article/62/6/2052/8435458)
- Uncertainty reporting: the 2019 system produced probabilities by simulation; the challenge asks for sample-based predictive distributions. Whether the operational CSV carries intervals: NOT READ.
- Explainability to end users: theme models and "relative importance of themes" tables in the paper; no per-country "why this score" found on the pages I read. NOT READ for the dashboard.
- Transparency: pipeline repo licence listed as CC BY-NC-SA 4.0 (non-commercial); the README says it is "actively under construction" and "not yet ready for operational use"; data and artifacts are not in git. FETCHED. [README](https://github.com/prio-data/views_pipeline/blob/main/README.md)
- Access: CSV downloads (country-month and PRIO-GRID-month), JSON codebook, REST API, interactive tool at data.viewsforecasting.org; no licence or pricing terms stated on the data page; the page has link inconsistencies (a sub-national file dated 2026_06, a codebook link pointing at a 2026_02 version). Free. FETCHED. [data page](https://viewsforecasting.org/data/)
- Limitations/failure modes: forecasts hover near the mean and miss sudden surges and declines (Schincariol et al.); depends on UCDP release lag; grid forecasts limited to Africa and the Middle East; pipeline still labeled not operational. OCHA's Centre for Humanitarian Data (26 Oct 2022) concluded conflict-prediction models do poorly on new onsets and ongoing conflict dominates as a predictor; that post does not name ViEWS. FETCHED. [academic.oup.com JPR](https://academic.oup.com/jpr/article/62/6/2052/8435458); [OCHA Centre](https://centre.humdata.org/assessing-the-technical-feasibility-of-conflict-prediction-for-anticipatory-action/)
- Example headline output (SNIPPET, UNVERIFIED): press coverage of an end-2025 release projects 2026 battle deaths of 28,300 for Ukraine, 7,700 for Palestine/Israel and 4,300 for Sudan; no exact release date. [search result, PRIO news 3670 / ReliefWeb](https://reliefweb.int/report/world/ai-model-warns-deadliest-conflict-zones-2026)
- USP: scale, ensemble, fully probabilistic distributions, 36-month horizon, open competitions that crowdsource improvements, and subnational grid.

### Inferences
- The 2019 AUROC of 0.9555 for "any state-based conflict in a country-month" is dominated by persistence (history theme alone gives 0.9442), so it is not comparable to Defcon's 0.85 for the "rise" target; Defcon's 0.98 "continue" is the like-for-like number.
- The "conflictology" benchmark leading all entries in Feb 2025 is the strongest argument that Defcon must publish an empirical-history baseline next to every model.

### Gaps
- Final 2023/24 leaderboard, CRPS values, operational calibration or interval info, per-country explanations: NOT READ.

---

## 2. EU JRC Global Conflict Risk Index (GCRI) and the EU Conflict Early Warning System (EWS)

### Takeaway
A structural, slow-moving risk index feeding an internal EEAS process. The public evidence of validation is thin and optimistic (in-sample style metrics), and I found no release after the 2022 revision. Timeliness: newest dated item found is 7 Dec 2022.

### Cited findings
- Owner: European Commission Joint Research Centre (Science4Peace / DRMKC); GCRI is the quantitative base of the EEAS-run EU Conflict Early Warning System. Funding: EU institutional; explicit budget NOT FOUND. SNIPPET. [JRC DRMKC GCRI page](https://drmkc.jrc.ec.europa.eu/initiatives-services/global-conflict-risk-index); [EEAS EWS fact sheet](https://eeas.europa.eu/sites/default/files/ews_fact_sheet_2020_abridged.pdf)
- Target: "statistical risk of violent conflict in a given country in the upcoming one to four years," expressed as probability and intensity (battle-related deaths); about 140 countries; 22 structural variables in six categories (political, security, social, economy, geography/environment, demographic). First sentence FETCHED from the AI GCRI report; counts SNIPPET. [AI GCRI report, 2019](https://publications.jrc.ec.europa.eu/repository/bitstream/JRC118746/ai_gcri_technical_report.pdf); [science4peace About GCRI](https://science4peace.jrc.ec.europa.eu/Home/About-GCRI)
- Inputs: open-source structural indicators; unit country-year. FETCHED (statement). [AI GCRI report](https://publications.jrc.ec.europa.eu/repository/bitstream/JRC118746/ai_gcri_technical_report.pdf)
- Model class: original GCRI estimated with linear and logistic regression (two steps: probability then intensity); 2019 experimental AI version uses random forest with ten-fold cross-validation and SMOTE oversampling inside the folds. Weights learned (the statistical model), though a steering committee influenced design choices. FETCHED. [AI GCRI report](https://publications.jrc.ec.europa.eu/repository/bitstream/JRC118746/ai_gcri_technical_report.pdf)
- Validation published in that 2019 report: "precision and accuracy metrics are above 98%" for the tuned national-power and subnational models (cut-off 4: accuracy 0.988/0.987, sensitivity 1, AUC 0.958/0.970); confusion matrices show 0 false positives. The text says the tables are the result of applying the model "to the overall dataset," which I read as in-sample; no time-split or persistence baseline; adding an IDP variable lowered AUC to 0.56-0.70. FETCHED (my in-sample reading is an inference). [AI GCRI report](https://publications.jrc.ec.europa.eu/repository/bitstream/JRC118746/ai_gcri_technical_report.pdf)
- 2022 revision "The Global Conflict Risk Index 2022: Revised Data and Methods" (EUR 31330, 7 Dec 2022): new conflict definitions, fewer missing values, a new framework chosen after a systematic comparison of 14 probability and intensity models, short-term projections of predictors; claims better predictive performance. Numbers NOT READ (full PDF not opened). FETCHED (abstract page). [JRC131326](https://publications.jrc.ec.europa.eu/repository/handle/JRC131326)
- Uncertainty: single probability plus intensity category; no intervals seen. NOT READ in full.
- Explainability: random forest variable importance by country described as a benefit. FETCHED. [AI GCRI report](https://publications.jrc.ec.europa.eu/repository/bitstream/JRC118746/ai_gcri_technical_report.pdf)
- EWS process: EEAS says the goal is not "prediction"; EU Delegation field assessments and Conflict Prevention Reports; a 2024 EUISS brief says senior directors get a long list of 20 cases and pick 10 priorities. SNIPPET. [EEAS fact sheet](https://eeas.europa.eu/sites/default/files/ews_fact_sheet_2020_abridged.pdf); [EUISS brief 2024](https://www.iss.europa.eu/sites/default/files/EUISSFiles/Brief_2024-1_Early%20warning_0.pdf)
- Newer JRC work: a "Dynamic Conflict Risk Model" for sub-national Africa, 1 to 6 months ahead. SNIPPET. [search result, science4peace](https://science4peace.jrc.ec.europa.eu/Home/About-GCRI)
- Access: the web app (science4peace.jrc.ec.europa.eu) is a single-page app I could not read; global-crisis-risk.jrc.ec.europa.eu did not resolve (DNS error). Repository pages carry contradictory "Commission only" / "public" access notices. FETCHED. [JRC131326](https://publications.jrc.ec.europa.eu/repository/handle/JRC131326)
- Limitations: dataset imbalance, data quality of variables, the report itself lists further work on variable selection and conflict definitions. EWS outputs are internal. FETCHED. [AI GCRI report](https://publications.jrc.ec.europa.eu/repository/bitstream/JRC118746/ai_gcri_technical_report.pdf)
- USP: embedded in EU policy process and in INFORM Risk (conflict component, see section 5).

### Inferences
- Defcon's time-split backtest with a rising-risk target is a stronger validation design than the one the GCRI report published.

### Gaps
- Any 2023 to 2026 GCRI update, live dashboard contents, the 2022 report's numbers: NOT READ / NOT FOUND.

---

## 3. ACLED CAST (Conflict Alert System)

### Takeaway
A well-engineered, frequently refreshed forecast of event counts (not deaths, not probabilities), with intervals but little published skill evidence beyond monthly aggregate misses. Access sits behind a free login.

### Cited findings
- Owner: ACLED. Funding: NOT READ.
- Target: counts of Battles, Explosions/remote violence and Violence against civilians events in four-week rolling periods ending Fridays, six periods ahead (about six months), at admin-1, country and global level, reconciled with MinTraceSparse; training since January 2018. FETCHED. [CAST methodology](https://acleddata.com/methodology/cast-methodology/)
- Coverage: "every country around the world"; number not stated. Cadence: the methodology page says predictions are published weekly; the monthly CAST report series and a search result describe monthly releases, an inconsistency. FETCHED / SNIPPET. [CAST methodology (fetched with accuracy prompt)](https://acleddata.com/methodology/cast-methodology/); [search result](https://acleddata.com/early-warning/conflict-alert-system/)
- Inputs: ACLED event indicators (trends, actor activity, spillover, agreements), WorldPop population, CIESIN infant mortality, V-Dem indicators, time trends. FETCHED. [methodology](https://acleddata.com/methodology/cast-methodology/)
- Model: light gradient boosted machine with Tweedie objective; learned; tuned weekly. FETCHED. [methodology](https://acleddata.com/methodology/cast-methodology/)
- Validation: the page says accuracy metrics for previous forecasts are published but reports no numbers, baselines or out-of-sample protocol (rolling time-series cross-validation is mentioned only for intervals). Monthly reports (snippets): Dec 2024 forecast 16,227 events, 2,677 (16%) fewer observed; Jan 2024 3% off; Apr 2024 2%; Jun 2024 5%; large country misses were mostly under-predictions. SNIPPET, UNVERIFIED (the June 2025 report URL returned 404 when fetched). [methodology](https://acleddata.com/methodology/cast-methodology/); [Dec/Oct 2024 reports in search](https://acleddata.com/wp-content/data-viz/cast-report/october-2024/report_october24_final.html)
- Uncertainty: "high and low scenarios" from a conformal-inspired residual approach per unit and horizon (not probabilities of thresholds). FETCHED. [methodology](https://acleddata.com/methodology/cast-methodology/)
- Explainability: none described. Transparency: model described in prose; code and training data not open (NOT FOUND).
- Access: monthly results page needs a myACLED login; a search result says free accounts get 10 logins/downloads of CAST outputs; use bound by ACLED Terms and Conditions and a citation format. FETCHED / SNIPPET. [CAST page](https://acleddata.com/platform/cast-conflict-alert-system); [methodology](https://acleddata.com/methodology/cast-methodology/)
- Timeliness: newest report I could confirm in search is June 2025; I did not find or read a 2026 edition (NOT FOUND, not evidence that none exists). SNIPPET. [ReliefWeb CAST report June 2025](https://reliefweb.int/report/world/cast-report-june-2025)
- Limitations: forecasts event reports (depends on ACLED coverage and media), no fatality target, no baseline comparison published on pages read.
- USP: subnational, six-month, multiple event types, intervals, tight link to the most timely event dataset.

### Inferences
- CAST is complementary rather than competing: its target (counts) differs from Defcon's death thresholds, and no probability of crossing a threshold is offered.

### Gaps
- Funding, accuracy tab numbers, current release date, baselines: NOT READ.

---

## 4. Early Warning Project (US Holocaust Memorial Museum and Dartmouth)

### Takeaway
Close methodological cousin to Defcon: regularized logistic model, probabilities, bootstrap uncertainty, honest accuracy page. Target is rare mass-killing onset, annual cadence, newest assessment about 10 months old.

### Cited findings
- Owner: joint project of USHMM and Dartmouth's Dickey Center. SNIPPET. Funding: NOT READ. [search result, thewire.in coverage](https://thewire.in/communalism/india-among-top-countries-at-risk-of-mass-atrocities-us-holocaust-museum-warns)
- Target: onset of a new intrastate mass killing (deliberate killing of at least 1,000 noncombatants by an armed group within one year, targeted for group membership) within the next two years; more than 160 countries (166 in the 2024 blog); annual. FETCHED. [accuracy page](https://earlywarningproject.ushmm.org/accuracy); [SRA page](https://earlywarningproject.ushmm.org/statistical-risk-assessment); [USHMM blog](https://www.ushmm.org/en/genocide-prevention/blog/how-to-use-the-early-warning-projects-statistical-risk-assessment-2024)
- Timeliness: latest listed assessment is "2025-26" (press coverage dates it to December 2025, built on 2024 data), so about 10 months old; I found no 2026-27 edition. FETCHED / SNIPPET. [SRA page](https://earlywarningproject.ushmm.org/statistical-risk-assessment)
- Inputs: over 30 public country-year variables (history of mass killing, population, infant mortality, ethnic fractionalization, coups, repression, civil liberties, battle deaths) since 1945; deliberately avoids retrospectively recoded data. FETCHED. [model methodology](https://earlywarningproject.ushmm.org/methodology-statistical-model)
- Model: logistic regression with elastic-net regularization (winner of tests since the 2017-18 assessment); learned. FETCHED. [accuracy page](https://earlywarningproject.ushmm.org/accuracy); [methodology](https://earlywarningproject.ushmm.org/methodology-statistical-model)
- Validation (analyses dated 2025, retrospective forecasts since 1994): 4,877 country-year estimates and 38 onsets; mean risk 6% in onset years vs 2% otherwise; 68% of onsets in the Top-30 list in the two prior years; 66% of onsets in countries scored 4% or higher; at the 4% cut-off "about twenty false positives for every mass killing onset"; about 1% of countries see an onset per year. No AUC on the pages read. Unclear whether each historical year used only past data; the older methodology page says it tested out-of-sample on later years and still cites a 2020 analysis, while the accuracy page says it evaluates the 2024 model retroactively. Treat the retrospective design as UNVERIFIED. FETCHED. [accuracy page](https://earlywarningproject.ushmm.org/accuracy); [methodology](https://earlywarningproject.ushmm.org/methodology-statistical-model)
- Uncertainty: probabilities; a bootstrap analysis of ranking and estimate uncertainty (analysis dated 2021) and a plain statement that probabilities are themselves expressions of uncertainty. FETCHED. [uncertainty page](https://earlywarningproject.ushmm.org/uncertainty)
- Explainability: per-country factor view, interactives to sort by risk factor and "change a country's risk factors"; coefficients on GitHub. FETCHED. [SRA page](https://earlywarningproject.ushmm.org/statistical-risk-assessment); [methodology](https://earlywarningproject.ushmm.org/methodology-statistical-model)
- Transparency and access: public CSV, data dictionary, PDF reports, GitHub organisation; licence terms NOT READ (GitHub API query failed). FETCHED. [SRA page](https://earlywarningproject.ushmm.org/statistical-risk-assessment)
- Limitations (own words): covers only within-country mass killing; rare event so even top estimates are low (top country about 6.5% in the 2024 assessment); slow-moving structural variables, sudden jumps from coups; "not causal" (SNIPPET); long high-risk spells (e.g. Nigeria above 10% for 1994-2000 with no onset); risk factors reflect enabling conditions. FETCHED. [USHMM blog](https://www.ushmm.org/en/genocide-prevention/blog/how-to-use-the-early-warning-projects-statistical-risk-assessment-2024); [accuracy page](https://earlywarningproject.ushmm.org/accuracy)
- USP: mass-atrocity focus, ranking plus calibrated probability, clear public discussion of base rates.

### Inferences
- The EWP bootstrap-the-whole-pipeline idea is the same family as Defcon's cluster bootstrap; EWP is the best reference for how to explain rare-event probabilities to non-specialists.

### Gaps
- Funding, licence, AUC, expert-opinion pool status: NOT READ.

---

## 5. INFORM Risk Index and INFORM Severity Index (EU JRC/DRMKC with IASC; Severity with ACAPS)

### Takeaway
Editorial composite indices for humanitarian planning, not conflict forecasts. Strength is breadth (191 countries), a statistical audit, and a documented cross-check of Risk against Severity. Weakness: no predictive scoring in the AUC sense.

### Cited findings (INFORM Risk)
- Owner: INFORM initiative (European Commission JRC and IASC partners); site managed by JRC. FETCHED. [DRMKC INFORM](https://drmkc.jrc.ec.europa.eu/inform-index/)
- Measures: risk of humanitarian crises and disasters; three dimensions (hazard and exposure, vulnerability, lack of coping capacity); 191 countries; 74 indicators per the 2024 JRC audit, while a search result says 50 (conflict between sources, UNVERIFIED which is current). FETCHED / SNIPPET. [JRC139164 audit page](https://publications.jrc.ec.europa.eu/repository/handle/JRC139164); [search result](https://dkkv.org/en/new-inform-risk-index-published-making-risks-comparable-worldwide/)
- Cadence and timeliness: results page lists "INFORM Risk Index Mid 2026" (v073), "INFORM Risk Index 2026" (v072) and a 2017-2026 trend file, no release dates stated; all Excel; no licence statement. FETCHED. [Results and data](https://drmkc.jrc.ec.europa.eu/inform-index/INFORM-Risk/Results-and-data)
- Model class: composite of normalised indicators; weights editorial; aggregation formula NOT READ. The conflict hazard component draws on the GCRI (SNIPPET from 2017-era material, UNVERIFIED for the current version). [search result, INFORM annual report 2018](https://drmkc.jrc.ec.europa.eu/inform-index/Portals/0/InfoRM/Publications/INFORM%20Annual%20Report%202018.pdf)
- Validation: JRC-COIN statistical audit (9 Dec 2024): adequate representation of the data via correlation and PCA; scores and categories robust to imputation, aggregation and weighting; some aggregates lack statistical coherence. FETCHED. [JRC139164](https://publications.jrc.ec.europa.eu/repository/handle/JRC139164)
- Predictive cross-check (from the Severity methodology): INFORM Risk 2023 (published Sept 2022) vs INFORM Severity for Jul-Dec 2022: 100% of "Very High Risk" countries and 90% of "High Risk" countries had a crisis, none in the lowest category; 52% of crisis countries had the same Risk and Severity category and over 97% were within one category. This is category matching by the same programme, not AUC or out-of-sample probability scoring. FETCHED. [INFORM Severity methodology v2026, JRC144740](https://www.acaps.org/fileadmin/Dataset/Methodology_files/Severity_Methodology_update-online_20260202.pdf)
- Uncertainty: categories and a reliability index (SNIPPET); no intervals. Explainability: indicator-level scores in the Excel file and country profiles. Transparency: open methodology and data, no licence statement on the data page. Access: free Excel, map explorer.
- Limitations: guidance says it is a simplified view to use with other sources (SNIPPET); a 2025 Scientific Reports paper argues the vulnerability design overlooks women and children (SNIPPET). [search result](https://iris.uniupo.it/bitstream/11579/220346/1/s41598-025-10490-4.pdf)

### Cited findings (INFORM Severity)
- Owner: JRC with ACAPS; "Concept and Methodology, Version 2026" (JRC144740, EUR 40592, CC BY 4.0). Measures current severity of humanitarian crises on five levels from three dimensions (impact, conditions of people affected, complexity); monthly; launched 2020. Statistical audit and revision in 2026 reworked the "Concentration of conditions" aggregation and replaced outdated indicators; a 0-10 rescaling is proposed. Monthly 2026 tables in search results show 1-10 sub-scores from February 2026 versus 1-5 in January (SNIPPET). The landing page lists "INFORM Severity Index - September 2026" as latest. FETCHED. [methodology PDF](https://www.acaps.org/fileadmin/Dataset/Methodology_files/Severity_Methodology_update-online_20260202.pdf); [DRMKC landing](https://drmkc.jrc.ec.europa.eu/inform-index/)
- Weights/inputs: expert-built from many sources, indicators updated whenever new data arrive, monthly snapshot; judgement calls on which data to include. Own limitations: category simplification gives "an impression of greater accuracy than intended" for scores near boundaries; displacement cross-counted; "entirely reliant on primary data." FETCHED. [methodology PDF](https://www.acaps.org/fileadmin/Dataset/Methodology_files/Severity_Methodology_update-online_20260202.pdf)
- Same document compares conflict indices: ACLED Conflict Index correlates 0.38 with HIIK Conflict Barometer, 0.49 with GPI overall and 0.52 with the GPI domestic and international conflict domain (Table 17). FETCHED. [same PDF](https://www.acaps.org/fileadmin/Dataset/Methodology_files/Severity_Methodology_update-online_20260202.pdf)
- USP: official humanitarian prioritisation tool, monthly, combined with Risk and a "Warning" product.

### Inferences
- Severity is a now-cast and Risk is structural; neither answers "will deaths rise next quarter."

### Gaps
- INFORM Risk aggregation formula, indicator list, release dates, licence, how conflict probability enters today: NOT READ. Severity crisis count: NOT FOUND.

---

## 6. Fragile States Index (Fund for Peace)

### Takeaway
A descriptive, partly editorial annual ranking, not a forecast, with no published predictive validation I could find. The newest edition I can confirm is 2024.

### Cited findings
- Owner: Fund for Peace (published with Foreign Policy 2005-2018 and The New Humanitarian since 2019, SNIPPET). Funding: donations (site has a donate link); detail NOT READ. [fragilestatesindex.org](https://fragilestatesindex.org/); [search result](https://en.wikipedia.org/wiki/Fragile_States_Index)
- Measures: state fragility; 12 CAST indicators (cohesion C1-C3, economic E1-E3, political P1-P3, social S1-S2, cross-cutting X1); each scored 0-10 and summed to 0-120 (scale SNIPPET); 178 countries per the methodology page; annual. FETCHED. [methodology](https://fragilestatesindex.org/methodology/)
- Inputs: content analysis of 45-50 million articles a year from over 10,000 English-language sources, quantitative datasets from UN, World Bank, WHO, and qualitative expert review per country, triangulated by rules. Weights/scoring editorial plus rule-based. FETCHED. [methodology](https://fragilestatesindex.org/methodology/)
- Validation: a panel review checks proportionality; no predictive metrics found. NOT FOUND.
- Uncertainty: none (point scores). Explainability: indicator breakdown per country, heat map, dashboard. Access: free Excel download; licence NOT READ. FETCHED. [home](https://fragilestatesindex.org/)
- Timeliness: the site's newest analysis link is "Analysis - 2024"; the "Global Data" page text still says data 2007-2021; a Mendeley dataset spanning 2006 to 2024 was posted 24 Jan 2025 (SNIPPET). I found no 2025 or 2026 edition. [Global Data](https://fragilestatesindex.org/global-data/); [Mendeley](https://data.mendeley.com/datasets/bhbcjtgjdm)
- Critiques (all SNIPPET, UNVERIFIED): double counting among overlapping indicators and odd rankings (ACLED commentary); conflation of causes and consequences; a 2023 UNU-MERIT working paper finds fragility indices carry some signal but also noise from cross-referencing and time lags. [ACLED](https://acleddata.com/?p=14275); [UNU-MERIT](https://merit.unu.edu/publications/working-papers/abstract/?id=9647)
- USP: long time series (2006 onward), media-based signal, wide recognition.

### Gaps
- Exact release date of the latest edition, licence, any predictive test: NOT FOUND / NOT READ.

---

## 7. Global Peace Index (Institute for Economics and Peace)

### Takeaway
A well-known annual composite of "negative peace," with an expert-weighted formula and a self-reported robustness check, not a forecast. Newest edition about 21 weeks old.

### Cited findings
- Owner: Institute for Economics and Peace, founded by Steve Killelea; an international expert panel chose indicators and weights. Funding: NOT READ. FETCHED. [GPI 2026 report PDF, read locally](https://www.visionofhumanity.org/wp-content/uploads/2026/06/Global-Peace-Index-2026-Report.pdf)
- Measures: 163 countries (99.7% of population), 23 indicators in three domains (6 ongoing conflict, 11 societal safety and security, 6 militarisation); annual; 2026 edition dated 5 June 2026 (20th edition per a study site, SNIPPET). FETCHED. [Vision of Humanity](https://www.visionofhumanity.org/maps/#/); [report PDF](https://www.visionofhumanity.org/wp-content/uploads/2026/06/Global-Peace-Index-2026-Report.pdf)
- Weights: editorial; indicators weighted 1-5 by the panel; internal peace 60% and external peace 40%, "agreed upon by the advisory panel." FETCHED. [report PDF](https://www.visionofhumanity.org/wp-content/uploads/2026/06/Global-Peace-Index-2026-Report.pdf)
- Validation: IEP's own robustness test says 70% of pairwise country comparisons stay the same under different weighting schemes; no predictive validation published in the pages read. FETCHED. [report PDF](https://www.visionofhumanity.org/wp-content/uploads/2026/06/Global-Peace-Index-2026-Report.pdf)
- Inputs: includes UCDP battle-related deaths and SIPRI military data (cited in report references); qualitative indicators scored by experts (original EIU terrorism score, SNIPPET). FETCHED / SNIPPET. [report PDF](https://www.visionofhumanity.org/wp-content/uploads/2026/06/Global-Peace-Index-2026-Report.pdf); [Vision of Humanity](https://www.visionofhumanity.org/the-challenge-of-measuring-peace/)
- Uncertainty: none (score 1-5 and rank). Explainability: indicator tables, domain scores. Access: free reports and map; licence NOT READ.
- Headline: peacefulness fell for a 12th straight year; Iceland first, Russia 163rd (search result, SNIPPET). [search result](https://www.spokesman.com/stories/2026/jun/11/us-falls-again-in-global-peace-rankings-while-icel/)
- Critiques: I found no peer-reviewed critique in my searches (NOT FOUND); one low-quality blog says the militarisation domain penalises size and defence, UNVERIFIED. The Severity methodology treats GPI as one of several conflict indices to correlate against. [search result](https://anantamias.com/global-peace-index-india/)
- USP: brand recognition, a 2008-onward series, a mix of conflict, safety and militarisation in one number.

---

## 8. Other credible systems

### 8a. Conflict Forecast (Mueller, Rauh and Seimon; Cambridge/Barcelona School of Economics)
- What it forecasts: monthly forecasts of (1) outbreak of any violence (zero to positive fatalities) and (2) outbreak of armed conflict (under 50 deaths followed by over 50), covering more than 170 countries and about 65,000 grid cells of 55 by 55 km, from January 2010; site map shows 12-month outbreak risk for countries not in conflict and forecast intensity for those in conflict. SNIPPET (paper abstract) and FETCHED (site map text). [DOAJ abstract in search](https://doaj.org/article/d7b71cb6bf064b5293ff50fba098f5c5); [conflictforecast.org](https://conflictforecast.org/)
- Method: topic model on newspaper text (over 3.5 million articles in the 2022 paper) plus conflict history; text mainly helps for rare outbreaks in previously peaceful countries. The same text-derived features appear in the VIEWS challenge document (over 6 million articles). FETCHED (abstract, challenge document). [International Interactions 48(4), RePEc record](https://ideas.repec.org/e/pmu156.html); [arXiv 2407.11045](https://arxiv.org/pdf/2407.11045)
- Validation: said to have performed strongly in the VIEWS competition (SNIPPET); AUC or other numbers NOT READ (Cambridge pages returned HTTP 403/404).
- Owner and funding: Cambridge and BSE academics; a related Dynamic Early Warning and Action Model was funded by FCDO (SNIPPET). Open data per the paper abstract; licence and latest forecast month shown on the site: NOT READ (site page did not state them).
- USP: the only widely cited system whose signal comes from news text, which targets the outbreak case that history-only models cannot see.

### 8b. Political Instability Task Force (PITF), Goldstone et al.
- A global model forecasting instability onset two years ahead; the 2010 American Journal of Political Science paper reports over 80% accuracy on 1955-2003 data in a matched case-control design; strongest predictor is a five-category regime type; few variables. SNIPPET. [USIP report and abstract in search](https://www.usip.org/publications/2008/03/using-quantitative-and-qualitative-models-forecast-instability)
- Status: the PITF pages at George Mason are listed under archived materials; I found no evidence of ongoing public forecasts (SNIPPET). Treat as a legacy methods benchmark, not a live competitor.
- Case-control accuracy is not comparable to full-population AUC (my inference).

### 8c. The VIEWS-challenge research ecosystem (a living benchmark set)
- Benchmarks and entrants worth scoring against: the empirical "conflictology" baseline, the Observed Markov Model, the Bayesian negative-binomial GLMM, the CCEW tree ensembles ("Forests of Uncertaint(r)ees," arXiv 2512.06210, beats history-based baselines up to a year ahead, FETCHED abstract), the Gaussian-process "Currents of Conflict" (arXiv 2506.06828, uses only past conflict data, FETCHED abstract), and the Shape finder. [PRIO news 3602](https://www.prio.org/news/3602); [arXiv 2512.06210](https://arxiv.org/abs/2512.06210); [arXiv 2506.06828](https://arxiv.org/abs/2506.06828); [JPR 62(6)](https://academic.oup.com/jpr/article/62/6/2052/8435458)

### Not researched
- Crisis24 and other commercial ratings, CAMEO/ICEWS-based forecasting, Correlates of War tools, CrisisWatch: NOT READ (not covered in this pass).

---

## Method comparison table

| System | Target | Horizon | Learned vs editorial | Validated? | Intervals? | Explainability | Open data/code | Cadence |
|---|---|---|---|---|---|---|---|---|
| Defcon Fatality Index | Deaths in last 90 days (UCDP), log scale 0-100 | Descriptive (past 90 days) | Fixed formula | n/a (not a forecast) | Low-high ranges | Formula | Open project | By hand |
| Defcon VRI | P(>=25 deaths next 3 mo); P(rise: >=25 and >=2x prior) | 3 months | Learned (ridge logistic) | Time-split AUC 0.85 / 0.98 / 0.74 baseline, rolling yearly, calibration bins | 90% cluster bootstrap | Additive "why", momentum, heuristic confidence | Open | By hand, 130 countries |
| ViEWS | State-based fatalities / conflict; distributions in challenge | 1-36 months; country and 0.5 degree grid | Learned ensemble | Yes: AUROC, AUPR, Brier (2019); CRPS true-future challenge | Sample distributions (challenge); operational CSV unclear | Theme importance; no per-country why found | Repo CC BY-NC-SA 4.0 (non-operational); CSV and API | Monthly claimed; notices 30 Jun and 30 Sep 2026 |
| EU JRC GCRI / EWS | Probability and intensity of violent conflict | 1-4 years, about 140 countries | Learned (regression; RF experiment) | Weak public evidence (in-sample-style); 2022 numbers NOT READ | No | RF variable importance; EWS is qualitative | Reports public/ambiguous; EWS internal | Latest found Dec 2022 |
| ACLED CAST | Event counts by type | About 6 months; admin-1 | Learned (LightGBM) | Monthly aggregate error only; no baselines read | Conformal-style low/high | None | Methodology prose; data login | Weekly vs monthly (conflicting) |
| Early Warning Project | Onset of mass killing (>=1,000 civilians) | 2 years; 160+ countries | Learned (elastic-net logistic) | Yes, retrospective 1994+; top-30 captures 68%; no AUC read | Bootstrap analysis | Country factor view; coefficients | CSV, GitHub; licence NOT READ | Annual (2025-26 latest) |
| INFORM Risk | Risk of humanitarian crisis/disaster | Structural, 191 countries | Editorial composite | Audit (Dec 2024); category match to Severity | No | Indicator scores | Free Excel | Twice-yearly files (Mid 2026) |
| INFORM Severity | Current crisis severity, 5 levels | Now-cast | Editorial, expert data | Own limits stated | No | Dimensions | CC BY 4.0 method; free data | Monthly (Sep 2026 listed) |
| Fragile States Index | State fragility, 0-120 | Descriptive | Editorial + media content analysis | None found | No | 12 indicators | Free Excel | Annual (2024 latest found) |
| Global Peace Index | Peacefulness, 1-5 | Descriptive, 163 countries | Editorial weights | Weighting robustness only | No | Domain and indicator tables | Free report | Annual (Jun 2026) |
| Conflict Forecast | Outbreak of violence/conflict | 12 months in site text; 170+ countries and grid | Learned (text + history) | Strong in VIEWS competition (SNIPPET); numbers NOT READ | NOT READ | Topic features | Open data claimed | Monthly claimed |
| PITF | Instability onset | 2 years | Learned (logit) | 80%+ case-control (1955-2003) | NOT READ | Few variables | Archived | Inactive |

---

## Where a lightweight open project can credibly be better, and where it cannot (my inference, not sourced fact)

Can be better:
1. Actionable binary targets with calibration shown. ViEWS's flagship output is a 36-month fatality distribution; Defcon's "at least 25 deaths in 3 months" and "sharp rise" probabilities are easier to read, and publishing calibration bins is rarer than AUC alone (EWP is the exception).
2. Per-country additive "why this score" plus intervals. I found no per-country attribution in ViEWS or CAST, and the GPI, FSI and INFORM give no uncertainty.
3. Testing against the target that matters. Most "AUC 0.95" figures are persistence-driven. Defcon's separate "rise" target and its comparison with recent deaths alone is the right design; the OCHA Centre review and the "conflictology" benchmark result both argue for this.
4. Openness and licence. ViEWS code is non-commercial and labeled not operational; CAST needs a login; GCRI and EWS are partly internal or ambiguous.
5. Transparent, small, reproducible pipeline; a fast way to add a plain empirical-history baseline and a last-value baseline to every table.

Cannot be better:
1. Scale and ensemble depth: ViEWS runs 36-month forecasts for the world and a 0.5 degree grid with a team and cloud pipeline; a one-person 130-country model will not match that.
2. Independent, pre-registered true-future evaluation with a scoring committee and CRPS; Defcon's backtests are by its own authors.
3. Outbreaks in quiet countries: history-plus-governance models cannot see onsets after zero deaths (the Shape finder paper states the limit for history-only models); Conflict Forecast's news-text signal addresses this.
4. Timeliness: hand refresh means monthly cadence systems will usually be fresher (ViEWS newest 29 days, INFORM Severity monthly).
5. Event-level, subnational, and humanitarian-impact detail (CAST admin-1, INFORM Severity).
6. Rare-event statistics: with 130 countries and few rise events, AUC intervals will be wide; EWP shows the honest way to say so.

Suggested scoring axes later: target clarity, out-of-sample rigor, baseline reporting, uncertainty, explainability, openness, freshness, coverage, access cost.

---

## What I could not read or verify
- ViEWS: final 2023/24 challenge scores (predcomp site HTTP 502; JPR article not opened), interval content of operational CSVs, dashboard explanations, why release notices are 30 Jun and 30 Sep while text says monthly.
- GCRI: 2022 revision numbers (PDF not opened), live dashboard, any 2023-2026 update; global-crisis-risk.jrc.ec.europa.eu did not resolve; EWS internals.
- CAST: current release date, accuracy tab, funding, true cadence (weekly vs monthly), licence beyond Terms and Conditions; the June 2025 report URL returned 404 on fetch.
- EWP: funding, AUC, licence; GitHub API failed; accuracy page design ambiguity noted above.
- INFORM: Risk aggregation formula and indicator count (74 vs 50), release dates, licence.
- FSI: latest edition date, licence, any predictive validation. GPI: funding, licence, peer-reviewed critique.
- Conflict Forecast: AUC and other numbers (Cambridge and BSE pages returned 403/404), latest forecast month. PITF: current status confirmed only by a search snippet.
- Not researched: Crisis24 and commercial ratings, CAMEO/ICEWS forecasting, CoW tools, CrisisWatch.
