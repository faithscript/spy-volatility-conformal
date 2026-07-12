import type { SiteData } from "../types";
import { fmt } from "../lib/chartTheme";

interface Props {
  data: SiteData;
}

export function HonestFinding({ data }: Props) {
  const { metrics } = data;
  const rows = [
    { model: "Naive persistence", mae: metrics.naive.mae, rmse: metrics.naive.rmse, highlight: true },
    { model: "Hybrid GARCH-RF", mae: metrics.hybrid.mae, rmse: metrics.hybrid.rmse, highlight: false },
    { model: "Random Forest", mae: metrics.randomForest.mae, rmse: metrics.randomForest.rmse, highlight: false },
    { model: "GARCH(1,1)", mae: metrics.garch.mae, rmse: metrics.garch.rmse, highlight: false },
  ];

  const { transition, stable, threshold } = data.transitionAnalysis;
  const transitionLift = (1 - transition.hybrid.mae / transition.naive.mae) * 100;
  const stableLift = (1 - stable.naive.mae / stable.hybrid.mae) * 100;

  return (
    <div className="callout callout-amber">
      <div className="callout-label">Baseline result</div>
      <h3>A naive baseline beats both Random Forest models on raw MAE</h3>
      <p>
        Predicting tomorrow&apos;s volatility equals today&apos;s realized vol outperforms
        both tree models and beats GARCH by an order of magnitude, not because the
        project failed, but because the target is almost autocorrelated by construction.
      </p>

      <table className="data-table">
        <thead>
          <tr>
            <th>Model</th>
            <th>MAE</th>
            <th>RMSE</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.model} className={r.highlight ? "row-highlight" : ""}>
              <td>{r.model}</td>
              <td className="mono">{fmt(r.mae)}</td>
              <td className="mono">{fmt(r.rmse)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="insight-list">
        <li>
          <strong>Target lag-1 autocorrelation: {fmt(data.meta.lag1Autocorr, 3)}</strong> —
          realized vol is a 21-day rolling std; consecutive days share 20 of 21 return
          observations.
        </li>
        <li>
          This explains why <code>vol_lag_1</code> carries ~97% of RF feature importance,
          and why RF&apos;s edge over GARCH is structural access to the autocorrelated
          target, not necessarily superior modeling.
        </li>
        <li>
          Hybrid&apos;s marginal lift over plain RF (~1.6% MAE) makes sense: once{" "}
          <code>vol_lag_1</code> captures most predictable structure, there&apos;s little
          room left for GARCH&apos;s signal.
        </li>
      </ul>

      <div className="callout-divider" />

      <h4>But naive isn&apos;t universally better</h4>
      <p>
        Splitting days by how much realized volatility moved from the day before tells a
        sharper story. On stable days, where naive persistence&apos;s &quot;nothing
        changes&quot; assumption mostly holds — it wins easily. But on the days
        volatility is shifting fastest, the hybrid model pulls ahead.
      </p>

      <table className="data-table">
        <thead>
          <tr>
            <th>Day type</th>
            <th>N</th>
            <th>Naive MAE</th>
            <th>Hybrid MAE</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Stable days</td>
            <td className="mono">{stable.n}</td>
            <td className="mono row-highlight">{fmt(stable.naive.mae)}</td>
            <td className="mono">{fmt(stable.hybrid.mae)}</td>
          </tr>
          <tr>
            <td>Transition days (top 10%)</td>
            <td className="mono">{transition.n}</td>
            <td className="mono">{fmt(transition.naive.mae)}</td>
            <td className="mono row-highlight">{fmt(transition.hybrid.mae)}</td>
          </tr>
        </tbody>
      </table>
      <p className="table-caption">
        Transition days are those where{" "}
        <code>|Δ realized vol| ≥ {fmt(threshold, 3)}</code> — the 90th percentile of
        day-over-day changes. Stable days are everything below that cutoff.
      </p>

      <ul className="insight-list">
        <li>
          On transition days, the hybrid model beats naive persistence on MAE by{" "}
          <strong>{transitionLift.toFixed(1)}%</strong> and wins on{" "}
          <strong>{(transition.hybridWinRate * 100).toFixed(1)}%</strong> of individual
          days in that regime.
        </li>
        <li>
          On stable days, naive persistence beats the hybrid by{" "}
          <strong>{stableLift.toFixed(1)}%</strong> — this is where &quot;nothing
          changes&quot; is nearly always the right call.
        </li>
        <li>
          The takeaway: naive persistence wins on aggregate MAE because most days are
          stable, not because it&apos;s a better model. The hybrid&apos;s edge shows
          up when volatility is shifting fastest.
        </li>
      </ul>
    </div>
  );
}
