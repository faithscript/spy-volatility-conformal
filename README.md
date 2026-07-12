# SPY Volatility Forecasting with Conformal Prediction

Forecasts SPY volatility with GARCH, Random Forest, and a GARCH-RF hybrid using
walk-forward validation, then quantifies uncertainty with split conformal
prediction.

**Live demo:** https://spy-volatility-conformal.vercel.app/

---

## Overview

This project benchmarks a classical econometric volatility model, GARCH(1,1),
against a walk-forward Random Forest and a GARCH-hybrid Random Forest on ~10
years of daily SPY data. All three models are evaluated with day-by-day
walk-forward validation — retraining/refitting on every new observation — so
the comparison against GARCH's recursive updating is fair. The
best-performing model is then wrapped in split conformal prediction to
produce calibrated uncertainty intervals rather than point forecasts alone.

**A key finding of this project:** a naive "tomorrow's volatility = today's
volatility" baseline outperforms both Random Forest models on raw MAE, and
beats GARCH by an order of magnitude. This isn't a project failure — it's a
real result of how the target is constructed (see [Honest Finding](#honest-finding)
below), and it's reported here deliberately rather than hidden.

---

## Honest Finding

Realized volatility is a 21-day rolling standard deviation of log returns.
Consecutive days share 20 of 21 underlying return observations, so the
target's lag-1 autocorrelation is **0.993**. Predicting "tomorrow ≈ today" is
close to unbeatable on a target that is, by construction, almost the same
number two days in a row.

| Model | MAE | RMSE |
|---|---|---|
| Naive persistence | 0.00566 | 0.01228 |
| Hybrid GARCH-RF | 0.00728 | 0.01309 |
| Random Forest | 0.00739 | 0.01310 |
| GARCH(1,1) | 0.03035 | 0.04924 |

This explains why `vol_lag_1` alone carries ~97% of feature importance in
both RF models, and reframes what "RF beats GARCH" actually means: RF has
direct access to the autocorrelated target via its own lag, while GARCH is
forecasting from raw returns and was never structurally positioned to
exploit that autocorrelation the same way.

---

## Methodology

**Target:** next-day realized volatility of SPY — 21-day rolling standard
deviation of log returns, annualized (× √252). Daily close-to-close data via
`yfinance`.

**Walk-forward protocol:** fit → predict → observe → expand. Both GARCH and
the Random Forest models retrain/refit on every trading day using an
expanding window. Training ends 2016-07-10; evaluation runs 2016-07-11
through 2026-07-09 (~2,513 out-of-sample days). No look-ahead.

**Models compared:**
- **GARCH(1,1)** — normal distribution, forecasts from raw returns only
- **Random Forest** — 8 features: volatility lags (1/5/10), return lags
  (1/5/10), 5-day rolling mean return, volume lag
- **Hybrid Random Forest** — same 8 features + GARCH's next-day volatility
  forecast as a 9th input

**Conformal prediction:** split conformal applied to the Hybrid RF's
predictions. The oldest 80% of the walk-forward test period calibrates the
residual quantile `q`; the most recent 20% (2024-07-05 → 2026-07-08, 503
days) receives `prediction ± q` intervals and is evaluated for empirical
coverage against a 90% target.

---

## Results

| Model | MAE | RMSE |
|---|---|---|
| GARCH(1,1) | 0.03035 | 0.04924 |
| Random Forest | 0.00739 | 0.01310 |
| Hybrid GARCH-RF | 0.00728 | 0.01309 |

- Hybrid RF reduces MAE by **76%** versus the GARCH baseline.
- GARCH's error concentrates in crisis periods: MAE degrades **5.6x** in
  high-volatility regimes (actual vol > 0.30) versus calm periods, and
  overshoots peak volatility by 30-45% during both the 2020 COVID spike and
  the April 2025 spike.
- The Hybrid RF's improvement over plain RF is small (~1.6% MAE) and
  uneven — it wins only 50.3% of individual days, and specifically
  underperforms plain RF in the high-volatility regime (MAE 0.0316 vs
  0.0296), despite winning slightly more often day-to-day there.

**Conformal prediction:**

| Metric | Value |
|---|---|
| Target coverage | 90.0% |
| Empirical coverage | 92.0% |
| Calibration quantile (q) | 0.01553 |
| Avg. interval width | 0.03106 |

Marginal coverage looks good, but conditional coverage by regime tells a
different story:

| Regime | N | Coverage |
|---|---|---|
| Calm (actual ≤ 0.20) | 448 | 94.2% |
| Elevated vol (actual > 0.20) | 55 | 74.5% |

A single fixed-width interval calibrated on pooled residuals over-covers
calm days and under-covers volatile ones — exactly when the interval matters
most. Full interactive charts, feature importance breakdowns, and the coverage
analysis are on the [live demo](https://spy-volatility-conformal.vercel.app/).

---

## Limitations

- Single asset — SPY only; no cross-asset or portfolio extension.
- Split conformal with a fixed-width interval; not adaptive or
  regime-conditioned.
- Close-to-close realized volatility only; no intraday or options-implied
  volatility.
- Target autocorrelation (ρ = 0.993) inflates apparent ML skill relative to
  return-based models like GARCH.
- Conditional coverage fails in the elevated-volatility regime (74.5% vs 90%
  target) despite acceptable marginal coverage.

---

## Repo Structure

```
spy-volatility-conformal/
├── src/
│   ├── data_pipeline.py       # fetch SPY data, compute returns + realized vol target
│   ├── garch.py                # GARCH(1,1) walk-forward baseline
│   ├── garch_features.py       # reusable GARCH forecast generation (used by hybrid)
│   ├── random_forest.py        # walk-forward Random Forest
│   ├── hybrid_garch_rf.py      # walk-forward Hybrid GARCH-RF
│   ├── conformal.py            # split conformal prediction on Hybrid RF
│   └── results_io.py           # shared save/metrics helpers
├── results/
│   ├── predictions/
│   ├── metrics/
│   ├── feature_importance/
│   └── conformal/
├── landing/                     # React + Vite + Plotly.js results page
├── requirements.txt
└── LICENSE
```

---

## Running It Yourself

### Backend (models)

Requires Python 3.12+.

```bash
git clone https://github.com/faithscript/spy-volatility-conformal.git
cd spy-volatility-conformal

python3 -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate

pip install -r requirements.txt

cd src
python3 garch.py               # GARCH baseline
python3 random_forest.py       # Random Forest
python3 hybrid_garch_rf.py     # Hybrid GARCH-RF
python3 conformal.py           # split conformal intervals on the Hybrid RF
```

Each script prints its MAE/RMSE (and, for the conformal script, coverage
stats) to the console and writes results into `results/` — predictions,
metrics, feature importance, and conformal outputs, matching the repo
structure above. Note that all scripts assume they're run **from inside
`src/`**, since their save paths are relative to that directory.

### Frontend (results page)

Requires Node.js.

```bash
cd landing
npm install
npm run dev
```

This starts a local dev server (default: `http://localhost:5173`) serving
the same interactive results page as the live demo. To build a production
bundle:

```bash
npm run build
```

---

## Tech Stack

Python, arch, scikit-learn, pandas, NumPy, yfinance, matplotlib, React,
Plotly.js

---

Not investment advice. Research portfolio piece demonstrating walk-forward
evaluation and honest reporting of baseline performance.