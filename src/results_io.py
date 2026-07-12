import os
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error
import numpy as np

# Paths are relative to src/, matching the existing results/ layout
PREDICTIONS_DIR = os.path.join("..", "results", "predictions")
METRICS_DIR = os.path.join("..", "results", "metrics")
FEATURE_IMPORTANCE_DIR = os.path.join("..", "results", "feature_importance")
CONFORMAL_DIR = os.path.join("..", "results", "conformal")


def _ensure_dir(path):
    os.makedirs(path, exist_ok=True)


def compute_metrics(results, prediction_col, model_name):
    """Compute MAE/RMSE for a results df with an 'actual_vol' column."""
    actual = results["actual_vol"]
    predicted = results[prediction_col]

    mae = mean_absolute_error(actual, predicted)
    rmse = np.sqrt(mean_squared_error(actual, predicted))

    return {"model": model_name, "mae": mae, "rmse": rmse}


def save_predictions(results, filename):
    _ensure_dir(PREDICTIONS_DIR)
    path = os.path.join(PREDICTIONS_DIR, filename)
    results.to_csv(path, index=False)
    print(f"Saved predictions -> {path}")
    return path


def save_metrics(metrics, filename):
    _ensure_dir(METRICS_DIR)
    path = os.path.join(METRICS_DIR, filename)
    pd.DataFrame([metrics]).to_csv(path, index=False)
    print(f"Saved metrics -> {path}")
    return path


def save_feature_importance(model, feature_columns, filename):
    """Only meaningful for tree-based models (RF, Hybrid RF). Not GARCH."""
    _ensure_dir(FEATURE_IMPORTANCE_DIR)
    path = os.path.join(FEATURE_IMPORTANCE_DIR, filename)

    importance = pd.DataFrame({
        "feature": feature_columns,
        "importance": model.feature_importances_
    }).sort_values("importance", ascending=False)

    importance.to_csv(path, index=False)
    print(f"Saved feature importance -> {path}")
    return path

def save_conformal_predictions(results, filename):
    _ensure_dir(CONFORMAL_DIR)
    path = os.path.join(CONFORMAL_DIR, filename)
    results.to_csv(path, index=False)
    print(f"Saved conformal predictions -> {path}")
    return path


def save_conformal_metrics(metrics, filename):
    _ensure_dir(CONFORMAL_DIR)
    path = os.path.join(CONFORMAL_DIR, filename)
    pd.DataFrame([metrics]).to_csv(path, index=False)
    print(f"Saved conformal metrics -> {path}")
    return path
