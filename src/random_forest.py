from data_pipeline import build_dataset, summarize_data
from results_io import compute_metrics, save_predictions, save_metrics, save_feature_importance
from sklearn.ensemble import RandomForestRegressor
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np


def create_features(df):
    df["vol_lag_1"] = df["realized_vol"].shift(1)
    df["vol_lag_5"] = df["realized_vol"].shift(5)
    df["vol_lag_10"] = df["realized_vol"].shift(10)

    df["return_lag_1"] = df["log_return"].shift(1)
    df["return_lag_5"] = df["log_return"].shift(5)
    df["return_lag_10"] = df["log_return"].shift(10)

    df["rolling_mean_return"] = (
        df["log_return"]
        .rolling(window=5)
        .mean()
    )

    df["volume_lag_1"] = (
        df["Volume"]["SPY"]
        .shift(1)
    )

    df["target"] = df["realized_vol"].shift(-1)

    return df.dropna()

def get_feature_columns():
    return [
        "vol_lag_1",
        "vol_lag_5",
        "vol_lag_10",
        "return_lag_1",
        "return_lag_5",
        "return_lag_10",
        "rolling_mean_return",
        "volume_lag_1"
    ]


def train_rf(X_train, y_train):
    model = RandomForestRegressor(
        n_estimators=100,
        random_state=42
    )

    model.fit(X_train, y_train)

    return model

def walk_forward_rf(df, train_end_date, retrain_every=1):

    predictions = []

    train = df[df.index <= train_end_date]
    test = df[df.index > train_end_date]

    feature_columns = get_feature_columns()

    X_train = train[feature_columns]
    y_train = train["target"]

    model = None

    for i, current_date in enumerate(test.index):

        # Retrain every 'retrain_every' trading days
        if model is None or i % retrain_every == 0:
            print(f"Retraining at {current_date} ({i}/{len(test)})")
            model = train_rf(X_train, y_train)

        # Predict today's volatility
        X_today = df.loc[[current_date], feature_columns]

        prediction = model.predict(X_today)[0]

        predictions.append({
            "date": current_date,
            "rf_vol_prediction": prediction,
            "actual_vol": df.loc[current_date, "realized_vol"]
        })

        # Add today's data to the expanding training set
        X_train = pd.concat([
            X_train,
            df.loc[[current_date], feature_columns]
        ])

        y_train = pd.concat([
            y_train,
            pd.Series(
                [df.loc[current_date, "target"]],
                index=[current_date]
            )
        ])

    return pd.DataFrame(predictions), model

def plot_predicted_vs_actual_volatility(results):
    plt.figure(figsize=(12, 6))

    plt.plot(
        results["date"],
        results["actual_vol"],
        label="Actual"
    )

    plt.plot(
        results["date"],
        results["rf_vol_prediction"],
        label="Random Forest"
    )

    plt.title("Random Forest: Predicted vs Actual Realized Volatility")
    plt.xlabel("Date")
    plt.ylabel("Annualized Volatility")
    plt.legend()

    plt.tight_layout()
    plt.show()

if __name__ == "__main__":

    df = build_dataset()
    df = create_features(df)

    # Bug fix: this used to be `results = walk_forward_rf(...)`, which only
    # captured the tuple's first element and left `model` undefined below.
    results, model = walk_forward_rf(
        df,
        train_end_date=pd.Timestamp("2016-07-10")
    )

    summarize_data(results)

    metrics = compute_metrics(
        results,
        prediction_col="rf_vol_prediction",
        model_name="random_forest"
    )

    print(f"MAE:  {metrics['mae']:.6f}")
    print(f"RMSE: {metrics['rmse']:.6f}")

    SAVE_RESULTS = False

    if SAVE_RESULTS:
        save_predictions(results, "random_forest_predictions.csv")
        save_metrics(metrics, "random_forest_metrics.csv")
        save_feature_importance(
            model,
            get_feature_columns(),
            "random_forest_feature_importance.csv"
        )

    plot_predicted_vs_actual_volatility(results)