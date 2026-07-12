import { useMemo } from "react";
import Plot from "react-plotly.js";
import type { PredictionPoint } from "../types";
import { baseLayout, COLORS } from "../lib/chartTheme";

interface Props {
  points: PredictionPoint[];
  predictionLabel: string;
  predictionColor: string;
  resolutionNote?: string;
}

export function VolatilityChart({
  points,
  predictionLabel,
  predictionColor,
  resolutionNote,
}: Props) {
  const layout = useMemo(
    () =>
      baseLayout({
        height: 420,
        xaxis: {
          ...baseLayout().xaxis,
          rangeslider: { visible: true, bgcolor: COLORS.bg, thickness: 0.06 },
        },
      }),
    [],
  );

  const dates = points.map((p) => p.date);
  const actual = points.map((p) => p.actual);
  const predicted = points.map((p) => p.predicted);

  return (
    <div className="chart-wrap">
      {resolutionNote && <p className="chart-note">{resolutionNote}</p>}
      <Plot
        data={[
          {
            type: "scattergl",
            mode: "lines",
            name: "Actual realized vol",
            x: dates,
            y: actual,
            line: { color: COLORS.actual, width: 1.5 },
          },
          {
            type: "scattergl",
            mode: "lines",
            name: predictionLabel,
            x: dates,
            y: predicted,
            line: { color: predictionColor, width: 1.5 },
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
  );
}
