import { useMemo } from "react";
import Plot from "react-plotly.js";
import type { SiteData } from "../types";
import { baseLayout, COLORS, fmt, fmtPct } from "../lib/chartTheme";

interface Props {
  data: SiteData;
}

export function ConformalSection({ data }: Props) {
  const { conformal, meta } = data;
  const points = conformal.daily;
  const dates = points.map((p) => p.date);
  const elevated = meta.regimeDefinitions.elevated;
  const crisis = meta.regimeDefinitions.crisis;

  const layout = useMemo(
    () =>
      baseLayout({
        height: 440,
        xaxis: {
          ...baseLayout().xaxis,
          rangeslider: { visible: true, bgcolor: COLORS.bg, thickness: 0.06 },
        },
      }),
    [],
  );

  return (
    <div className="conformal-section">
      <div className="stat-grid stat-grid-4">
        <div className="mini-stat">
          <div className="mini-stat-value">{fmtPct(conformal.metrics.targetCoverage)}</div>
          <div className="mini-stat-label">Target coverage</div>
        </div>
        <div className="mini-stat">
          <div className="mini-stat-value">{fmtPct(conformal.metrics.empiricalCoverage)}</div>
          <div className="mini-stat-label">Empirical coverage</div>
        </div>
        <div className="mini-stat">
          <div className="mini-stat-value">{fmt(conformal.metrics.q)}</div>
          <div className="mini-stat-label">Calibration q</div>
        </div>
        <div className="mini-stat">
          <div className="mini-stat-value">{fmt(conformal.metrics.avgIntervalWidth)}</div>
          <div className="mini-stat-label">Avg interval width</div>
        </div>
      </div>

      <p className="conformal-meta">
        Split conformal on Hybrid RF · oldest 80% calibrates q · test window{" "}
        {meta.conformalTestStart} → {meta.conformalTestEnd} ({points.length} days)
      </p>

      <div className="chart-wrap">
        <Plot
          data={[
            {
              type: "scattergl",
              mode: "lines",
              name: "Upper bound",
              x: dates,
              y: points.map((p) => p.upper),
              line: { color: COLORS.bandLine, width: 1, dash: "dot" },
              showlegend: true,
            },
            {
              type: "scattergl",
              mode: "lines",
              name: "90% interval",
              x: dates,
              y: points.map((p) => p.lower),
              fill: "tonexty",
              fillcolor: COLORS.band,
              line: { color: COLORS.bandLine, width: 1, dash: "dot" },
            },
            {
              type: "scattergl",
              mode: "lines",
              name: "Hybrid forecast",
              x: dates,
              y: points.map((p) => p.predicted),
              line: { color: COLORS.hybrid, width: 1.5 },
            },
            {
              type: "scattergl",
              mode: "lines",
              name: "Actual realized vol",
              x: dates,
              y: points.map((p) => p.actual),
              line: { color: COLORS.actual, width: 1.5 },
            },
          ]}
          layout={layout}
          config={{
            displayModeBar: true,
            modeBarButtonsToRemove: ["lasso2d", "select2d"],
            responsive: true,
          }}
          style={{ width: "100%" }}
          useResizeHandler
        />
      </div>

      <div className="regime-split">
        <h4>Coverage regime split — elevated vol (actual &gt; {elevated.threshold})</h4>
        <p className="regime-note">{elevated.description}</p>
        <p>
          Marginal coverage looks fine ({fmtPct(conformal.metrics.empiricalCoverage)} vs{" "}
          {fmtPct(conformal.metrics.targetCoverage)} target), but conditional coverage
          within volatility regimes tells a different story:
        </p>
        <table className="data-table data-table-compact">
          <thead>
            <tr>
              <th>Regime</th>
              <th>Cutoff</th>
              <th>n</th>
              <th>Coverage</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Calm / below elevated</td>
              <td className="mono">≤ {conformal.regimeSplit.lowVol.threshold}</td>
              <td className="mono">{conformal.regimeSplit.lowVol.n}</td>
              <td className="mono">{fmtPct(conformal.regimeSplit.lowVol.coverage)}</td>
            </tr>
            <tr className="row-warn">
              <td>Elevated vol</td>
              <td className="mono">&gt; {conformal.regimeSplit.highVol.threshold}</td>
              <td className="mono">{conformal.regimeSplit.highVol.n}</td>
              <td className="mono">{fmtPct(conformal.regimeSplit.highVol.coverage)}</td>
            </tr>
          </tbody>
        </table>
        <p className="regime-note">
          This is distinct from the <em>crisis-level</em> cutoff (actual &gt;{" "}
          {crisis.threshold}) used in the Results section for model-error degradation
          (n=103 over the full walk-forward sample).
        </p>
        <p className="chart-caption">
          A single fixed-width interval calibrated on pooled residuals over-covers calm
          days and under-covers volatile ones — when the interval matters most. Natural
          next step: adaptive or regime-weighted conformal methods, not a generic future-work
          bullet.
        </p>
      </div>
    </div>
  );
}
