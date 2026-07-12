import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const RESULTS = path.join(ROOT, "results");
const OUT_DIR = path.join(__dirname, "../public/data");

type Row = Record<string, string>;

interface PredictionPoint {
  date: string;
  actual: number;
  predicted: number;
}

interface Metrics {
  mae: number;
  rmse: number;
}

interface FeatureRow {
  feature: string;
  importance: number;
}

interface SeriesBundle {
  daily: PredictionPoint[];
  display: PredictionPoint[];
}

function parseCsv(content: string): Row[] {
  const lines = content.trim().split("\n");
  const headers = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const row: Row = {};
    headers.forEach((h, i) => {
      row[h.trim()] = values[i]?.trim() ?? "";
    });
    return row;
  });
}

function readCsv(relPath: string): Row[] {
  const content = fs.readFileSync(path.join(RESULTS, relPath), "utf-8");
  return parseCsv(content);
}

function computeMetrics(points: PredictionPoint[]): Metrics {
  const errors = points.map((p) => p.predicted - p.actual);
  const absErrors = errors.map(Math.abs);
  const mae = absErrors.reduce((a, b) => a + b, 0) / absErrors.length;
  const rmse = Math.sqrt(
    errors.reduce((sum, e) => sum + e * e, 0) / errors.length,
  );
  return { mae, rmse };
}

function buildNaiveSeries(points: PredictionPoint[]): PredictionPoint[] {
  const naive: PredictionPoint[] = [];
  for (let i = 1; i < points.length; i++) {
    naive.push({
      date: points[i].date,
      actual: points[i].actual,
      predicted: points[i - 1].actual,
    });
  }
  return naive;
}

function lag1Autocorrelation(values: number[]): number {
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    const d = values[i] - mean;
    den += d * d;
    if (i < n - 1) num += d * (values[i + 1] - mean);
  }
  return num / den;
}

/** Largest-Triangle-Three-Buckets downsampling (shape-preserving). */
function lttb(
  points: PredictionPoint[],
  targetCount: number,
): PredictionPoint[] {
  if (points.length <= targetCount) return points;

  const sampled: PredictionPoint[] = [points[0]];
  const bucketSize = (points.length - 2) / (targetCount - 2);

  for (let i = 0; i < targetCount - 2; i++) {
    const bucketStart = Math.floor((i + 0) * bucketSize) + 1;
    const bucketEnd = Math.floor((i + 1) * bucketSize) + 1;
    const nextBucketStart = Math.floor((i + 1) * bucketSize) + 1;
    const nextBucketEnd = Math.min(
      Math.floor((i + 2) * bucketSize) + 1,
      points.length,
    );

    const prev = sampled[sampled.length - 1];
    let avgX = 0;
    let avgY = 0;
    let avgCount = 0;
    for (let j = nextBucketStart; j < nextBucketEnd; j++) {
      avgX += j;
      avgY += points[j].actual;
      avgCount++;
    }
    if (avgCount > 0) {
      avgX /= avgCount;
      avgY /= avgCount;
    }

    const prevIdx = points.findIndex((p) => p.date === prev.date);
    let maxArea = -1;
    let bestIdx = bucketStart;

    for (let j = bucketStart; j < Math.min(bucketEnd, points.length - 1); j++) {
      const area = Math.abs(
        (prevIdx - avgX) * (points[j].actual - prev.actual) -
          (prevIdx - j) * (avgY - prev.actual),
      );
      if (area > maxArea) {
        maxArea = area;
        bestIdx = j;
      }
    }
    sampled.push(points[bestIdx]);
  }

  sampled.push(points[points.length - 1]);
  return sampled;
}

function toSeries(
  rows: Row[],
  predictionCol: string,
): PredictionPoint[] {
  return rows.map((r) => ({
    date: r.date,
    actual: Number(r.actual_vol),
    predicted: Number(r[predictionCol]),
  }));
}

function filterByDate(
  points: PredictionPoint[],
  start: string,
  end: string,
): PredictionPoint[] {
  return points.filter((p) => p.date >= start && p.date <= end);
}

const CRISIS_THRESHOLD = 0.3;
const ELEVATED_THRESHOLD = 0.2;

function filterCrisis(points: PredictionPoint[], threshold = CRISIS_THRESHOLD): PredictionPoint[] {
  return points.filter((p) => p.actual > threshold);
}

function filterCalm(points: PredictionPoint[], threshold = CRISIS_THRESHOLD): PredictionPoint[] {
  return points.filter((p) => p.actual <= threshold);
}

function computeCoverage(
  points: { actual: number; lower: number; upper: number }[],
): number {
  const inside = points.filter(
    (p) => p.actual >= p.lower && p.actual <= p.upper,
  );
  return inside.length / points.length;
}

function loadPredictions(): {
  garch: SeriesBundle;
  randomForest: SeriesBundle;
  hybrid: SeriesBundle;
  naive: SeriesBundle;
  metrics: Record<string, Metrics>;
  lag1Autocorr: number;
} {
  const garchRows = readCsv("predictions/garch_predictions.csv");
  const rfRows = readCsv("predictions/random_forest_predictions.csv");
  const hybridRows = readCsv("predictions/hybrid_random_forest_predictions.csv");

  const garchDaily = toSeries(garchRows, "garch_vol_prediction");
  const rfDaily = toSeries(rfRows, "rf_vol_prediction");
  const hybridDaily = toSeries(hybridRows, "rf_vol_prediction");
  const naiveDaily = buildNaiveSeries(garchDaily);

  const DISPLAY_POINTS = 500;

  return {
    garch: { daily: garchDaily, display: lttb(garchDaily, DISPLAY_POINTS) },
    randomForest: { daily: rfDaily, display: lttb(rfDaily, DISPLAY_POINTS) },
    hybrid: { daily: hybridDaily, display: lttb(hybridDaily, DISPLAY_POINTS) },
    naive: { daily: naiveDaily, display: lttb(naiveDaily, DISPLAY_POINTS) },
    metrics: {
      garch: computeMetrics(garchDaily),
      randomForest: computeMetrics(rfDaily),
      hybrid: computeMetrics(hybridDaily),
      naive: computeMetrics(naiveDaily),
    },
    lag1Autocorr: lag1Autocorrelation(garchDaily.map((p) => p.actual)),
  };
}

function loadConformal() {
  const rows = readCsv("conformal/hybrid_random_forest_conformal_predictions.csv");
  const metricsRow = readCsv("conformal/hybrid_random_forest_conformal_metrics.csv")[0];

  const daily = rows.map((r) => ({
    date: r.date,
    actual: Number(r.actual_vol),
    predicted: Number(r.rf_vol_prediction),
    lower: Number(r.lower),
    upper: Number(r.upper),
  }));

  const lowVol = daily.filter((p) => p.actual <= 0.2);
  const highVol = daily.filter((p) => p.actual > 0.2);

  return {
    daily,
    metrics: {
      q: Number(metricsRow.q),
      targetCoverage: Number(metricsRow.target_coverage),
      empiricalCoverage: Number(metricsRow.empirical_coverage),
      avgIntervalWidth: Number(metricsRow.avg_interval_width),
    },
    regimeSplit: {
      lowVol: {
        n: lowVol.length,
        coverage: computeCoverage(lowVol),
        threshold: ELEVATED_THRESHOLD,
        label: "Calm / elevated",
      },
      highVol: {
        n: highVol.length,
        coverage: computeCoverage(highVol),
        threshold: ELEVATED_THRESHOLD,
        label: "Elevated vol",
      },
    },
  };
}

function loadFeatureImportance() {
  const rf = readCsv("feature_importance/random_forest_feature_importance.csv").map(
    (r) => ({ feature: r.feature, importance: Number(r.importance) }),
  );
  const hybrid = readCsv(
    "feature_importance/hybrid_random_forest_feature_importance.csv",
  ).map((r) => ({ feature: r.feature, importance: Number(r.importance) }));
  return { randomForest: rf, hybrid };
}

function windowMetrics(points: PredictionPoint[]): Metrics {
  return computeMetrics(points);
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const predictions = loadPredictions();
  const conformal = loadConformal();
  const featureImportance = loadFeatureImportance();

  const covidStart = "2020-02-15";
  const covidEnd = "2020-04-15";
  const apr2025Start = "2025-04-01";
  const apr2025End = "2025-05-15";

  const windows = {
    covid: {
      label: "COVID (Feb–Apr 2020)",
      start: covidStart,
      end: covidEnd,
      garch: filterByDate(predictions.garch.daily, covidStart, covidEnd),
      randomForest: filterByDate(predictions.randomForest.daily, covidStart, covidEnd),
      hybrid: filterByDate(predictions.hybrid.daily, covidStart, covidEnd),
      naive: filterByDate(predictions.naive.daily, covidStart, covidEnd),
    },
    apr2025: {
      label: "Apr 2025 spike",
      start: apr2025Start,
      end: apr2025End,
      garch: filterByDate(predictions.garch.daily, apr2025Start, apr2025End),
      randomForest: filterByDate(predictions.randomForest.daily, apr2025Start, apr2025End),
      hybrid: filterByDate(predictions.hybrid.daily, apr2025Start, apr2025End),
      naive: filterByDate(predictions.naive.daily, apr2025Start, apr2025End),
    },
    crisis: {
      label: "Crisis-level (actual > 0.30)",
      threshold: CRISIS_THRESHOLD,
      garch: filterCrisis(predictions.garch.daily),
      randomForest: filterCrisis(predictions.randomForest.daily),
      hybrid: filterCrisis(predictions.hybrid.daily),
      naive: filterCrisis(predictions.naive.daily),
    },
  };

  const crisisRegimeMetrics = {
    garch: {
      crisis: windowMetrics(filterCrisis(predictions.garch.daily)),
      calm: windowMetrics(filterCalm(predictions.garch.daily)),
    },
    randomForest: {
      crisis: windowMetrics(filterCrisis(predictions.randomForest.daily)),
      calm: windowMetrics(filterCalm(predictions.randomForest.daily)),
    },
    hybrid: {
      crisis: windowMetrics(filterCrisis(predictions.hybrid.daily)),
      calm: windowMetrics(filterCalm(predictions.hybrid.daily)),
    },
    naive: {
      crisis: windowMetrics(filterCrisis(predictions.naive.daily)),
      calm: windowMetrics(filterCalm(predictions.naive.daily)),
    },
  };

  const windowMetricsSummary = {
    covid: {
      garch: windowMetrics(windows.covid.garch),
      randomForest: windowMetrics(windows.covid.randomForest),
      hybrid: windowMetrics(windows.covid.hybrid),
    },
    crisis: {
      garch: windowMetrics(windows.crisis.garch),
      randomForest: windowMetrics(windows.crisis.randomForest),
      hybrid: windowMetrics(windows.crisis.hybrid),
    },
  };

  const siteData = {
    meta: {
      datasetStart: predictions.garch.daily[0].date,
      datasetEnd: predictions.garch.daily[predictions.garch.daily.length - 1].date,
      tradingDays: predictions.garch.daily.length,
      lag1Autocorr: predictions.lag1Autocorr,
      trainEndDate: "2016-07-10",
      conformalTestStart: conformal.daily[0].date,
      conformalTestEnd: conformal.daily[conformal.daily.length - 1].date,
      regimeDefinitions: {
        crisis: {
          threshold: CRISIS_THRESHOLD,
          label: "Crisis-level",
          description: "Model error analysis — days where actual vol exceeded 0.30 (n=103 over full sample).",
        },
        elevated: {
          threshold: ELEVATED_THRESHOLD,
          label: "Elevated vol",
          description:
            "Conformal coverage split — actual vol above 0.20 in the 503-day test window (n=55); lower bar to retain enough high-vol days for conditional coverage analysis.",
        },
      },
    },
    metrics: predictions.metrics,
    crisisRegimeMetrics,
    windowMetrics: windowMetricsSummary,
    models: {
      garch: predictions.garch,
      randomForest: predictions.randomForest,
      hybrid: predictions.hybrid,
      naive: predictions.naive,
    },
    windows,
    conformal,
    featureImportance,
  };

  fs.writeFileSync(
    path.join(OUT_DIR, "site-data.json"),
    JSON.stringify(siteData, null, 2),
  );

  console.log(`Wrote site-data.json (${(fs.statSync(path.join(OUT_DIR, "site-data.json")).size / 1024).toFixed(0)} KB)`);
  console.log("Metrics:", predictions.metrics);
  console.log("Conformal regime split:", conformal.regimeSplit);
}

main();
