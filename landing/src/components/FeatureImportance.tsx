import type { SiteData, FeatureRow } from "../types";
import { fmtPct } from "../lib/chartTheme";

interface Props {
  data: SiteData;
}

function FeatureBars({
  title,
  features,
  highlightSecond,
}: {
  title: string;
  features: FeatureRow[];
  highlightSecond?: string;
}) {
  const sorted = [...features].sort((a, b) => b.importance - a.importance);

  return (
    <div className="feature-card">
      <h4>{title}</h4>
      <div className="feature-bars">
        {sorted.map((f) => {
          const isTop = f.feature === "vol_lag_1";
          const isSecond = highlightSecond && f.feature === highlightSecond;
          return (
            <div className="feature-row" key={f.feature}>
              <div className="feature-name">
                <code>{f.feature}</code>
              </div>
              <div className="feature-bar-track">
                <div
                  className={`feature-bar-fill ${isTop ? "bar-top" : ""} ${isSecond ? "bar-second" : ""}`}
                  style={{ width: `${Math.max(f.importance * 100, 0.4)}%` }}
                />
              </div>
              <div className="feature-pct mono">{fmtPct(f.importance, 2)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function FeatureImportance({ data }: Props) {
  return (
    <div className="feature-section">
      <div className="feature-grid">
        <FeatureBars
          title="Random Forest (8 features)"
          features={data.featureImportance.randomForest}
        />
        <FeatureBars
          title="Hybrid RF (9 features)"
          features={data.featureImportance.hybrid}
          highlightSecond="garch_vol_prediction"
        />
      </div>
      <ul className="insight-list">
        <li>
          <code>vol_lag_1</code> dominates both models (~97% / ~96%). The trees mostly
          learn persistence.
        </li>
        <li>
          In the hybrid model, <code>garch_vol_prediction</code> is the{" "}
          <strong>second most important feature</strong> (0.92%) — ahead of every return
          lag and longer vol lags. GARCH contributes something the smoothed 21-day window
          dilutes, likely sensitivity to the most recent squared return.
        </li>
        <li>
          Still under 1% total importance: a minor correction on top of{" "}
          <code>vol_lag_1</code>, consistent with hybrid&apos;s small MAE edge.
        </li>
      </ul>
    </div>
  );
}
