export interface PredictionPoint {
  date: string;
  actual: number;
  predicted: number;
}

export interface Metrics {
  mae: number;
  rmse: number;
}

export interface ConformalPoint {
  date: string;
  actual: number;
  predicted: number;
  lower: number;
  upper: number;
}

export interface FeatureRow {
  feature: string;
  importance: number;
}

export interface SeriesBundle {
  daily: PredictionPoint[];
  display: PredictionPoint[];
}

export interface WindowData {
  label?: string;
  threshold?: number;
  start?: string;
  end?: string;
  garch: PredictionPoint[];
  randomForest: PredictionPoint[];
  hybrid: PredictionPoint[];
  naive: PredictionPoint[];
}

export interface CrisisRegimeMetrics {
  crisis: Metrics;
  calm: Metrics;
}

export interface SiteData {
  meta: {
    datasetStart: string;
    datasetEnd: string;
    tradingDays: number;
    lag1Autocorr: number;
    trainEndDate: string;
    conformalTestStart: string;
    conformalTestEnd: string;
    regimeDefinitions: {
      crisis: { threshold: number; label: string; description: string };
      elevated: { threshold: number; label: string; description: string };
    };
  };
  metrics: Record<string, Metrics>;
  crisisRegimeMetrics: {
    garch: CrisisRegimeMetrics;
    randomForest: CrisisRegimeMetrics;
    hybrid: CrisisRegimeMetrics;
    naive: CrisisRegimeMetrics;
  };
  windowMetrics: {
    covid: Record<string, Metrics>;
    crisis: Record<string, Metrics>;
  };
  models: Record<string, SeriesBundle>;
  windows: {
    covid: WindowData;
    apr2025: WindowData;
    crisis: WindowData;
  };
  conformal: {
    daily: ConformalPoint[];
    metrics: {
      q: number;
      targetCoverage: number;
      empiricalCoverage: number;
      avgIntervalWidth: number;
    };
    regimeSplit: {
      lowVol: { n: number; coverage: number; threshold: number; label: string };
      highVol: { n: number; coverage: number; threshold: number; label: string };
    };
  };
  featureImportance: {
    randomForest: FeatureRow[];
    hybrid: FeatureRow[];
  };
}
