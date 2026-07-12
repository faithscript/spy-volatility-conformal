import pandas as pd
import numpy as np
from results_io import save_conformal_predictions, save_conformal_metrics
 
PREDICTIONS_PATH = "../results/predictions/hybrid_random_forest_predictions.csv"
PREDICTION_COL = "rf_vol_prediction"
TARGET_COVERAGE = 0.90
 
 
def load_predictions(path):
    df = pd.read_csv(path, parse_dates=["date"])
    return df.sort_values("date").reset_index(drop=True)
 
 
def split_calibration(df, calibration_frac=0.20):
    split_idx = int(len(df) * (1 - calibration_frac))
 
    calibration = df.iloc[:split_idx].reset_index(drop=True)
    test = df.iloc[split_idx:].reset_index(drop=True)
 
    return calibration, test
 
 
def compute_q(calibration, prediction_col, target_coverage):
    residuals = (calibration["actual_vol"] - calibration[prediction_col]).abs()
    q = np.quantile(residuals, target_coverage)
    return q
 
 
def apply_intervals(test, prediction_col, q):
    test = test.copy()
    test["lower"] = test[prediction_col] - q
    test["upper"] = test[prediction_col] + q
    return test
 
 
def compute_coverage(test):
    inside = (test["actual_vol"] >= test["lower"]) & (test["actual_vol"] <= test["upper"])
    empirical_coverage = inside.mean()
    avg_interval_width = (test["upper"] - test["lower"]).mean()
    return empirical_coverage, avg_interval_width
 
 
if __name__ == "__main__":
 
    df = load_predictions(PREDICTIONS_PATH)
 
    # calibration = oldest 80% (used only to compute q)
    # test = most recent 20% (gets pred +/- q intervals applied)
    calibration, test = split_calibration(df, calibration_frac=0.20)
 
    q = compute_q(calibration, PREDICTION_COL, TARGET_COVERAGE)
    print(f"q ({int(TARGET_COVERAGE*100)}th percentile residual): {q:.6f}")
 
    test = apply_intervals(test, PREDICTION_COL, q)
 
    empirical_coverage, avg_interval_width = compute_coverage(test)
    print(f"Empirical coverage: {empirical_coverage:.4f}")
    print(f"Avg interval width: {avg_interval_width:.6f}")
 
    metrics = {
        "model": "hybrid_random_forest",
        "q": q,
        "target_coverage": TARGET_COVERAGE,
        "empirical_coverage": empirical_coverage,
        "avg_interval_width": avg_interval_width,
    }
 
    save_conformal_predictions(test, "hybrid_random_forest_conformal_predictions.csv")
    save_conformal_metrics(metrics, "hybrid_random_forest_conformal_metrics.csv")