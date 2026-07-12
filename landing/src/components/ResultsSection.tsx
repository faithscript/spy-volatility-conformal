import { useMemo, useState } from "react";
import Plot from "react-plotly.js";
import type { SiteData } from "../types";
import { VolatilityChart } from "./VolatilityChart";
import { COLORS, fmt } from "../lib/chartTheme";

type ModelKey = "garch" | "randomForest" | "hybrid" | "naive";
type WindowKey = "full" | "covid" | "apr2025" | "crisis";

interface Props {
  data: SiteData;
}

const MODELS: { key: ModelKey; label: string; color: string; predLabel: string }[] = [
  { key: "garch", label: "GARCH(1,1)", color: COLORS.garch, predLabel: "GARCH forecast" },
  { key: "randomForest", label: "Random Forest", color: COLORS.rf, predLabel: "RF forecast" },
  { key: "hybrid", label: "Hybrid GARCH-RF", color: COLORS.hybrid, predLabel: "Hybrid forecast" },
  { key: "naive", label: "Naive persistence", color: COLORS.naive, predLabel: "Naive (today = tomorrow)" },
];

function buildCaption(model: ModelKey, data: SiteData): string {
  const crisisThreshold = data.meta.regimeDefinitions.crisis.threshold;
  const garchCrisis = data.crisisRegimeMetrics.garch;
  const rfCrisis = data.crisisRegimeMetrics.randomForest;
  const hybridCrisis = data.crisisRegimeMetrics.hybrid;
  const naiveCrisis = data.crisisRegimeMetrics.naive;
  const garchDeg =
    garchCrisis.calm.mae > 0 ? garchCrisis.crisis.mae / garchCrisis.calm.mae : 0;
  const rfDeg =
    rfCrisis.calm.mae > 0 ? rfCrisis.crisis.mae / rfCrisis.calm.mae : 0;

  switch (model) {
    case "garch":
      return `GARCH overshoots on 60% of days; mean signed error ≈ 0, so damage is in extremes. Crisis-level regime (actual > ${crisisThreshold}): MAE ${fmt(garchCrisis.crisis.mae)} vs ${fmt(garchCrisis.calm.mae)} calm — ${garchDeg.toFixed(1)}× degradation. COVID window MAE: ${fmt(data.windowMetrics.covid.garch.mae)}.`;
    case "randomForest":
      return `Strong aggregate performance driven almost entirely by vol_lag_1 (~97% importance). COVID window MAE: ${fmt(data.windowMetrics.covid.randomForest.mae)}. Crisis-level MAE (actual > ${crisisThreshold}): ${fmt(rfCrisis.crisis.mae)} (${rfDeg.toFixed(1)}× vs calm).`;
    case "hybrid":
      return `Marginal aggregate gain over RF (~1.6% MAE) but wins only ~50.3% of individual days. Crisis-level MAE (actual > ${crisisThreshold}): ${fmt(hybridCrisis.crisis.mae)} vs RF ${fmt(rfCrisis.crisis.mae)} — hybrid underperforms in the highest-stakes regime despite winning more days there.`;
    case "naive":
      return `Tomorrow = today's realized vol. Beats Hybrid and RF on raw MAE because the 21-day rolling target has lag-1 autocorrelation of ${fmt(data.meta.lag1Autocorr, 3)}. The strongest honest baseline for this problem. Crisis-level MAE: ${fmt(naiveCrisis.crisis.mae)}.`;
    default:
      return "";
  }
}

export function ResultsSection({ data }: Props) {
  const [model, setModel] = useState<ModelKey>("garch");
  const [window, setWindow] = useState<WindowKey>("full");

  const activeModel = MODELS.find((m) => m.key === model)!;
  const crisisThreshold = data.meta.regimeDefinitions.crisis.threshold;

  const points = useMemo(() => {
    if (window === "full") {
      return data.models[model].display;
    }
    return data.windows[window][model];
  }, [data, model, window]);

  const dateRange =
    points.length > 0
      ? `${points[0].date} → ${points[points.length - 1].date}`
      : "no data";

  const resolutionNote =
    window === "full"
      ? `Full sample · ${points.length} points (LTTB) · ${dateRange}. Zoom, use the range slider, or pick a crisis window for daily data.`
      : window === "crisis"
        ? `Crisis-level filter (actual > ${crisisThreshold}) · ${points.length} days · ${dateRange}`
        : `Daily resolution · ${points.length} days · ${dateRange}`;

  const caption = buildCaption(model, data);

  const maeBarLayout = useMemo(
    () => ({
      paper_bgcolor: COLORS.surface,
      plot_bgcolor: COLORS.surface,
      font: { family: "JetBrains Mono, monospace", color: COLORS.text, size: 11 },
      margin: { l: 120, r: 16, t: 16, b: 40 },
      height: 200,
      xaxis: { gridcolor: COLORS.border, tickformat: ".4f" },
      yaxis: { gridcolor: COLORS.border },
      barmode: "group" as const,
    }),
    [],
  );

  const maeData = [
    { name: "Naive", mae: data.metrics.naive.mae, color: COLORS.naive },
    { name: "Hybrid", mae: data.metrics.hybrid.mae, color: COLORS.hybrid },
    { name: "RF", mae: data.metrics.randomForest.mae, color: COLORS.rf },
    { name: "GARCH", mae: data.metrics.garch.mae, color: COLORS.garch },
  ];

  return (
    <div className="results-section">
      <p className="regime-note">
        <strong>Two regime cutoffs on this page:</strong> model-error analysis uses{" "}
        <em>crisis-level</em> (actual &gt; {crisisThreshold}) — see Conformal section
        for a separate <em>elevated</em> cutoff (actual &gt;{" "}
        {data.meta.regimeDefinitions.elevated.threshold}) used for coverage splits.
      </p>

      <div className="chart-controls">
        <div className="tab-group" role="tablist" aria-label="Model">
          {MODELS.map((m) => (
            <button
              key={m.key}
              role="tab"
              aria-selected={model === m.key}
              className={model === m.key ? "tab active" : "tab"}
              onClick={() => setModel(m.key)}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="tab-group" role="tablist" aria-label="Time window">
          {(
            [
              ["full", "Full sample"],
              ["covid", "COVID 2020"],
              ["apr2025", "Apr 2025"],
              ["crisis", `Crisis (>${crisisThreshold})`],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              role="tab"
              aria-selected={window === key}
              className={window === key ? "tab tab-sm active" : "tab tab-sm"}
              onClick={() => setWindow(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <VolatilityChart
        key={`${model}-${window}`}
        points={points}
        predictionLabel={activeModel.predLabel}
        predictionColor={activeModel.color}
        resolutionNote={resolutionNote}
      />

      <p className="chart-caption">{caption}</p>

      <div className="mae-comparison">
        <h4>MAE comparison (full sample)</h4>
        <Plot
          data={[
            {
              type: "bar",
              orientation: "h",
              y: maeData.map((d) => d.name),
              x: maeData.map((d) => d.mae),
              marker: { color: maeData.map((d) => d.color) },
              text: maeData.map((d) => fmt(d.mae)),
              textposition: "outside",
            },
          ]}
          layout={maeBarLayout}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: "100%" }}
          useResizeHandler
        />
      </div>
    </div>
  );
}
