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

  return (
    <div className="callout callout-amber">
      <div className="callout-label">Surprising finding</div>
      <h3>A naive baseline beats both Random Forest models on raw MAE</h3>
      <p>
        Predicting tomorrow&apos;s volatility equals today&apos;s realized vol outperforms
        both tree models and beats GARCH by an order of magnitude — not because the
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
    </div>
  );
}
