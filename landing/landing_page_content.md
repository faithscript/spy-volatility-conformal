# Volatility Forecasting with Conformal Prediction — Content Source Document

This is raw analytical content, not page copy. Feed this to Cursor alongside the
CSVs/PNGs as the factual backbone for the landing page — the goal is that no
claim on the page should exist that isn't traceable to a number in here.

---

## 1. The One Honest Headline Finding (should probably lead the page)

**A naive "tomorrow = today" baseline outperforms both Random Forest models on
raw MAE, and beats GARCH by an order of magnitude.**

| Model | MAE | RMSE |
|---|---|---|
| Naive persistence (predict tomorrow's vol = today's vol) | **0.00567** | 0.01228 |
| Hybrid GARCH-RF | 0.00728 | 0.01309 |
| Random Forest | 0.00739 | 0.01310 |
| GARCH(1,1) | 0.03035 | 0.04924 |

Why this happens: `actual_vol` is a 21-day rolling standard deviation of log
returns. Consecutive days share 20 of 21 underlying return observations, so
the lag-1 autocorrelation of the target itself is **0.993**. Predicting
"tomorrow ≈ today" is close to unbeatable on a target that is, by
construction, almost the same number two days in a row.

This is *not* a project failure — it's a real methodological finding worth
stating plainly:

- It explains why `vol_lag_1` alone carries **96–97% of feature importance**
  in both RF models (see section 3).
- It reframes what "RF beats GARCH by 76%" actually means: RF isn't smarter
  than GARCH so much as RF has direct access to the autocorrelated target
  itself (via `vol_lag_1`), while GARCH is forecasting from raw returns and
  was never structurally positioned to exploit that autocorrelation the same
  way.
- It's the actual thesis for why the *hybrid* model's marginal lift over
  plain RF is small (see section 4) — there's not much room left for GARCH's
  signal to add value once `vol_lag_1` has already captured most of the
  predictable structure.

Page framing suggestion: don't hide this — a "Surprising Finding" callout box
with the table above is more credible and more interesting than a page that
only shows the flattering 76% number.

---

## 2. GARCH: Where and How It Breaks

- **Directional bias:** GARCH overshoots (predicts higher than actual) on
  **60.0%** of all days, but its mean signed error is nearly zero (+0.0015),
  meaning the overshoots and undershoots are roughly offsetting in
  aggregate — the real story is in the *extremes*, not the average day.
- **High-volatility regime degradation is severe:** on days where actual
  volatility exceeded 0.30 (crisis-level, n=103 days across 10 years),
  GARCH's MAE balloons to **0.1427** — versus **0.0255** on calmer days.
  That's a **5.6x** degradation. Compare to RF's **4.6x** degradation
  (0.0296 vs 0.0065) over the same split — GARCH doesn't just perform worse
  in crises, it degrades proportionally *more* than RF does.
- **The overshoot/undershoot pattern tells a mean-reversion-lag story:**
  - Max overshoot: **+0.438** on 2020-03-17 (predicted 1.238 vs actual 0.800)
    — right as COVID vol was still climbing, GARCH's persistence parameter
    pushed the forecast past where realized vol actually landed.
  - Max undershoot: **-0.448** on 2020-04-06 — three weeks later, as markets
    began calming, GARCH was still extrapolating elevated variance forward
    and under-forecast how fast things settled.
  - This overshoot-into-the-spike / undershoot-on-the-way-down pattern is a
    textbook signature of GARCH's α+β persistence term: it reacts hard to
    a shock and is slow to let go of it.
- **COVID window (2020-02-15 to 2020-04-15) MAE: GARCH 0.1823** vs
  **RF 0.0442** vs **Hybrid 0.0459** — GARCH's error in this single 2-month
  window is roughly 4x its full-sample MAE, meaning a small number of
  crisis days account for a disproportionate share of its overall error.
- **2025 spike (April 2025, ~tariff-shock timing):** actual peak volatility
  reached 0.524 on 2025-04-24; GARCH's peak forecast in that window hit
  0.773 — a **47% overshoot** at the peak. This is the same overshoot
  pattern as 2020, at smaller scale, suggesting it's structural to the
  model rather than a one-off COVID artifact.

---

## 3. Feature Importance: What the Trees Actually Learned

**Random Forest (8 features):**

| Feature | Importance |
|---|---|
| vol_lag_1 | 0.9696 |
| rolling_mean_return | 0.0074 |
| volume_lag_1 | 0.0059 |
| vol_lag_10 | 0.0056 |
| vol_lag_5 | 0.0046 |
| return_lag_1 | 0.0028 |
| return_lag_5 | 0.0022 |
| return_lag_10 | 0.0018 |

**Hybrid Random Forest (9 features, adds `garch_vol_prediction`):**

| Feature | Importance |
|---|---|
| vol_lag_1 | 0.9624 |
| garch_vol_prediction | 0.0092 |
| volume_lag_1 | 0.0083 |
| rolling_mean_return | 0.0067 |
| vol_lag_10 | 0.0043 |
| vol_lag_5 | 0.0032 |
| return_lag_1 | 0.0022 |
| return_lag_5 | 0.0019 |
| return_lag_10 | 0.0017 |

**What's interesting here:**

- Adding GARCH's forecast as a feature pulls importance away almost
  entirely from `vol_lag_1` (0.9696 → 0.9624, a 0.72-point drop) and
  `garch_vol_prediction` lands in that gap at 0.0092 — becoming the
  **second most important feature**, ahead of every lagged return and
  every other lag except `vol_lag_1` itself.
- That's a genuinely notable result: it means the trees found GARCH's
  one-step-ahead forecast more useful than 5-day or 10-day lagged
  volatility, and more useful than any return-based feature. GARCH is
  contributing *something* `vol_lag_1` doesn't already encode — most
  plausibly, GARCH's sensitivity to the most recent day's squared return
  (which lagged realized-vol features, being smoothed 21-day windows,
  dilute).
- At the same time, 0.0092 is still under 1% of total importance — the
  trees clearly treat it as a minor correction on top of `vol_lag_1`, not
  a co-equal signal. This is consistent with the marginal (not dramatic)
  MAE improvement from hybridizing (section 4).

---

## 4. Plain RF vs. Hybrid RF: A More Careful Comparison Than the Headline Number

The headline: Hybrid MAE (0.00728) beats plain RF MAE (0.00739) by about
1.6% — real, but small. Breaking it down further:

- **Hybrid wins on only 50.3% of individual days** — essentially a coin
  flip. The aggregate MAE improvement isn't from being *consistently*
  better; it's a marginal edge that shows up unevenly.
- **In the high-volatility regime specifically (actual_vol > 0.30, n=103),
  hybrid actually has a *worse* MAE than plain RF: 0.0316 vs 0.0296.**
  This is worth stating plainly on the page — the model that's supposed to
  help most in crisis conditions (by incorporating GARCH's forecast) is
  marginally *underperforming* plain RF exactly there, in aggregate error
  terms.
- Yet **hybrid wins more individual days in that same high-vol regime**
  (54.4% vs the overall 50.3%) — meaning hybrid is right more often in
  crisis periods, but wrong by more when it's wrong, likely on the
  specific days GARCH itself overshoots hardest (section 2). A few bad
  days from an inherited GARCH overshoot are dragging hybrid's high-vol
  MAE down despite winning the day-count majority.
- **COVID window specifically: plain RF (0.0442) narrowly beat hybrid
  (0.0459)** — again consistent with GARCH's own COVID overshoot bleeding
  into the hybrid's predictions during the exact window it was supposed to
  help most.

Framing suggestion: this is a legitimately interesting, nuanced result —
"hybridizing helps on average but not uniformly, and specifically
underperforms in the highest-stakes regime" is a more sophisticated and
credible claim than "hybrid model improves on RF," and shows you actually
interrogated the result instead of taking the aggregate MAE at face value.

---

## 5. Conformal Prediction: Where the Coverage Guarantee Actually Holds

- **Overall empirical coverage: 92.05%** against a 90% target, over a
  503-day test window (2024-07-05 to 2026-07-08), with average interval
  width of **0.0311** (annualized volatility units) and calibration
  quantile **q = 0.01553**.
- **This headline number hides a regime split that matters:**
  - On low-volatility test days (actual_vol ≤ 0.20, n=448): coverage is
    **94.2%** — comfortably above target.
  - On high-volatility test days (actual_vol > 0.20, n=55): coverage drops
    to **74.5%** — well *below* the 90% target.
- This is a textbook illustration of a known limitation of split conformal
  prediction: it guarantees *marginal* coverage (correct on average across
  the whole test set) but makes no promise about *conditional* coverage
  within a subgroup or regime. A single fixed-width interval, calibrated
  on residuals pooled across calm and volatile periods, ends up too wide
  for calm days (over-covering, wasting interval width) and too narrow for
  volatile days (under-covering, when the interval matters most).
- This directly motivates — and gives you a real, demonstrated reason to
  cite — **adaptive/conformalized quantile regression or regime-weighted
  conformal methods** as the natural next step, rather than listing it as a
  generic "future work" bullet with no evidence behind it.

---

## 6. Suggested Page Structure (content-first, not design)

1. **Hero** — one-sentence summary + the 3 resume-style stat callouts (76%
   MAE reduction vs GARCH, 92% empirical coverage on a 90% target, 8
   engineered features)
2. **The Honest Finding** — naive persistence baseline table (section 1).
   This is the credibility-builder; lead with it, don't bury it.
3. **Methodology** — walk-forward validation explained plainly: why daily
   retraining for both GARCH and RF (fairness of comparison), what
   realized volatility is, what the hybrid feature set contains
4. **Results** — the three PNG plots side by side or stacked, each with a
   2-3 sentence caption pulling from sections 2-4 (not just "here's the
   plot")
5. **Feature Importance** — the two tables from section 3, with the
   `vol_lag_1` dominance and `garch_vol_prediction`'s #2 ranking called out
6. **Conformal Prediction** — coverage number + the regime-split finding
   from section 5, ideally visualized as a banded interval plot over the
   test window if you build one
7. **Limitations** — single asset (SPY only), split (not adaptive)
   conformal, close-to-close volatility only, target autocorrelation
   inflating apparent model skill, conditional coverage failure in
   high-vol regime
8. **Tech stack / GitHub link** footer

---

## 7. Raw Numbers Reference (for quick lookup while writing copy)

- GARCH: MAE 0.03035, RMSE 0.04924
- Random Forest: MAE 0.00739, RMSE 0.01310
- Hybrid RF: MAE 0.00728, RMSE 0.01309
- Naive persistence: MAE 0.00567, RMSE 0.01228
- Conformal: q=0.01553, target 90%, empirical 92.05%, avg width 0.0311
- Actual_vol lag-1 autocorrelation: 0.993
- Dataset: SPY daily, 2016-07-11 to 2026-07-09 (~10 years, 2,513 trading days)
- Train/test split: train_end_date = 2016-07-10, walk-forward daily thereafter
- Conformal calibration/test split: oldest 80% calibrates q, most recent 20%
  (2024-07-05 to 2026-07-08) evaluated for coverage
