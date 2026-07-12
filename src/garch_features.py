from arch import arch_model
import pandas as pd
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

    fitted = model.fit(disp="off")

    return fitted


def generate_garch_features(df, start_date):
    garch_predictions = []

    # Initial GARCH history
    training_returns = df[
        df.index < start_date
    ]["log_return"].copy()


    # Generate forecasts from start_date onward
    for current_date in df[df.index >= start_date].index:

        # Fit using only information available so far
        model = fit_garch(training_returns)

        # Forecast next-day variance
        forecast = model.forecast(horizon=1)

        predicted_variance = forecast.variance.iloc[-1, 0]

        predicted_volatility = (
            np.sqrt(predicted_variance)
            / 100
            * np.sqrt(252)
        )

        garch_predictions.append({
            "date": current_date,
            "garch_vol_prediction": predicted_volatility
        })


        # Update history after observing today's return
        actual_return = df.loc[current_date, "log_return"]

        training_returns.loc[current_date] = actual_return


    return pd.DataFrame(garch_predictions)


