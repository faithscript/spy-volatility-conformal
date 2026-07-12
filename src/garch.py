from arch import arch_model
from data_pipeline import build_dataset, summarize_data
from results_io import compute_metrics, save_predictions, save_metrics
import pandas as pd
import matplotlib.pyplot as plt
import numpy as np


def fit_garch(returns):
    scaled_returns = returns.dropna() * 100

    model = arch_model(
        scaled_returns,
        vol="Garch",
        p=1,
        q=1,
        dist="normal"
    )

    # Estimate omega, alpha, beta
    fitted = model.fit(disp="off")

    return fitted


def walk_forward_garch(df, train_end_date):
    predictions = []

    # Split into initial training period and test period
    train = df[df.index <= train_end_date]
    test = df[df.index > train_end_date]

    # Start with only historical returns
    training_returns = train["log_return"].copy()

    for current_date in test.index:

        # 1. Fit GARCH using only known information
        model = fit_garch(training_returns)

        # 2. Forecast tomorrow's variance
        forecast = model.forecast(horizon=1)

        predicted_variance = forecast.variance.iloc[-1, 0]

        # Convert variance -> annualized volatility
        predicted_volatility = (
            np.sqrt(predicted_variance)
            / 100
            * np.sqrt(252)
        )

        # Store prediction and actual realized volatility
        predictions.append({
            "date": current_date,
            "garch_vol_prediction": predicted_volatility,
            "actual_vol": df.loc[current_date, "realized_vol"]
        })

        # 3. After the day happens, add the actual return
        actual_return = df.loc[current_date, "log_return"]

        training_returns.loc[current_date] = actual_return

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
        results["garch_vol_prediction"],
        label="GARCH"
    )

    plt.title("GARCH(1,1): Predicted vs Actual Realized Volatility")
    plt.xlabel("Date")
    plt.ylabel("Annualized Volatility")
    plt.legend()

    plt.tight_layout()
    plt.show()

if __name__ == "__main__":

    df = build_dataset()

    results, model = walk_forward_garch(
        df,
        train_end_date=pd.Timestamp("2016-07-10")
    )

    summarize_data(results)

    metrics = compute_metrics(
        results,
        prediction_col="garch_vol_prediction",
        model_name="garch"
    )

    print(f"MAE:  {metrics['mae']:.6f}")
    print(f"RMSE: {metrics['rmse']:.6f}")

    SAVE_RESULTS = False

    if SAVE_RESULTS:
        save_predictions(results, "garch_predictions.csv")
        save_metrics(metrics, "garch_metrics.csv")

    # Note: GARCH has no feature_importances_ (it's not a tree model),
    # so there's nothing to save here — unlike the RF-based models.

    plot_predicted_vs_actual_volatility(results)