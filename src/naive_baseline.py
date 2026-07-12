from data_pipeline import build_dataset, summarize_data
from results_io import compute_metrics, save_predictions, save_metrics
import matplotlib.pyplot as plt
import pandas as pd


def compute_naive_predictions(df, train_end_date):
    test = df[df.index > train_end_date].copy()

    test["naive_vol_prediction"] = test["realized_vol"].shift(1)
    test["actual_vol"] = test["realized_vol"]

    test = test.dropna(subset=["naive_vol_prediction"])

    results = test[["naive_vol_prediction", "actual_vol"]].reset_index()
    results = results.rename(columns={"Date": "date", "index": "date"})

    return results


def plot_predicted_vs_actual_volatility(results):
    plt.figure(figsize=(12, 6))

    plt.plot(
        results["date"],
        results["actual_vol"],
        label="Actual"
    )

    plt.plot(
        results["date"],
        results["naive_vol_prediction"],
        label="Naive Persistence"
    )

    plt.title("Naive Persistence: Predicted vs Actual Realized Volatility")
    plt.xlabel("Date")
    plt.ylabel("Annualized Volatility")
    plt.legend()

    plt.tight_layout()
    plt.show()


if __name__ == "__main__":

    df = build_dataset()

    results = compute_naive_predictions(
        df,
        train_end_date=pd.Timestamp("2016-07-10")
    )

    summarize_data(results)

    metrics = compute_metrics(
        results,
        prediction_col="naive_vol_prediction",
        model_name="naive_persistence"
    )

    print(f"MAE:  {metrics['mae']:.6f}")
    print(f"RMSE: {metrics['rmse']:.6f}")

    save_predictions(results, "naive_persistence_predictions.csv")
    save_metrics(metrics, "naive_persistence_metrics.csv")


    plot_predicted_vs_actual_volatility(results)