export function Methodology() {
  return (
    <div className="method-grid">
      <div className="method-card">
        <h3>Target</h3>
        <p>
          Next-day <strong>realized volatility</strong> of SPY: 21-day rolling standard
          deviation of log returns, annualized (× √252). Close-to-close daily data via
          yfinance.
        </p>
      </div>

      <div className="method-card">
        <h3>Walk-forward protocol</h3>
        <div className="walkforward-steps">
          <span>Fit</span>
          <span className="arrow">→</span>
          <span>Predict</span>
          <span className="arrow">→</span>
          <span>Observe</span>
          <span className="arrow">→</span>
          <span>Expand</span>
          <span className="arrow">↻</span>
        </div>
        <p>
          Both GARCH and RF retrain/refit <strong>every trading day</strong> on an
          expanding window. Train ends 2016-07-10; evaluation runs 2016-07-11 through
          2026-07-09 (~2,513 OOS days). No look-ahead.
        </p>
      </div>

      <div className="method-card">
        <h3>Models compared</h3>
        <ul className="compact-list">
          <li>
            <strong>GARCH(1,1)</strong> — normal dist, forecasts from raw returns only
          </li>
          <li>
            <strong>Random Forest</strong> — 8 features: vol lags (1/5/10), return lags
            (1/5/10), 5-day rolling mean return, volume lag
          </li>
          <li>
            <strong>Hybrid RF</strong> — same 8 features + <code>garch_vol_prediction</code>{" "}
            as 9th input
          </li>
        </ul>
      </div>
    </div>
  );
}
