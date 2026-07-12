import yfinance as yf
import numpy as np

def fetch_spy_data(period="15y", interval="1d"):
    spy = yf.download("SPY", period=period, interval=interval, auto_adjust=False)
    return spy

def compute_log_returns(df):
    adj_close = df['Adj Close']['SPY']
    df['log_return'] = np.log(adj_close / adj_close.shift(1))
    return df

def compute_realized_vol(df, window=21, trading_days=252):
    df['realized_vol'] = (
        df['log_return']
        .rolling(window=window)
        .std()
        * np.sqrt(trading_days)
    )
    return df

def create_target(df):
    df["target"] = df["realized_vol"].shift(-1)
    return df

def build_dataset():
    df = fetch_spy_data()
    df = compute_log_returns(df)
    df = compute_realized_vol(df)
    df = create_target(df)

    df = df.dropna()

    return df

def summarize_data(results):
    print(results.shape)
    print(results.head())
    print(results.tail())


if __name__ == "__main__":
    df = build_dataset()
    summarize_data(df)