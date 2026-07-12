import type { Layout } from "plotly.js";

export const COLORS = {
  bg: "#0d1117",
  surface: "#161b22",
  border: "#30363d",
  text: "#e6edf3",
  muted: "#8b949e",
  actual: "#c9d1d9",
  garch: "#f78166",
  rf: "#3fb950",
  hybrid: "#58a6ff",
  naive: "#d2a8ff",
  band: "rgba(88, 166, 255, 0.18)",
  bandLine: "rgba(88, 166, 255, 0.45)",
  amber: "#d29922",
};

export function baseLayout(overrides: Partial<Layout> = {}): Partial<Layout> {
  return {
    paper_bgcolor: COLORS.surface,
    plot_bgcolor: COLORS.surface,
    font: { family: "JetBrains Mono, monospace", color: COLORS.text, size: 11 },
    margin: { l: 56, r: 24, t: 40, b: 48 },
    xaxis: {
      gridcolor: COLORS.border,
      linecolor: COLORS.border,
      tickcolor: COLORS.border,
      tickfont: { size: 10 },
    },
    yaxis: {
      gridcolor: COLORS.border,
      linecolor: COLORS.border,
      tickcolor: COLORS.border,
      tickformat: ".2f",
      title: { text: "Annualized vol", font: { size: 11 } },
    },
    legend: {
      orientation: "h",
      y: 1.12,
      x: 0,
      bgcolor: "transparent",
      font: { size: 10 },
    },
    hovermode: "x unified",
    ...overrides,
  };
}

export function fmt(n: number, digits = 5): string {
  return n.toFixed(digits);
}

export function fmtPct(n: number, digits = 1): string {
  return `${(n * 100).toFixed(digits)}%`;
}
