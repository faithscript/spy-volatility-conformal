export function Limitations() {
  const items = [
    "Single asset — SPY only; no cross-asset or portfolio extension.",
    "Split conformal with a fixed-width interval; not adaptive or regime-conditioned.",
    "Close-to-close realized volatility only; no intraday or options-implied vol.",
    "Target autocorrelation (ρ = 0.993) inflates apparent ML skill vs return-based models like GARCH.",
    "Two regime cutoffs are used intentionally: crisis-level (>0.30) for model-error analysis vs elevated (>0.20) for conformal conditional coverage (see section notes).",
    "Conditional coverage fails in the elevated-vol regime (74.5% vs 90% target) despite acceptable marginal coverage.",
  ];

  return (
    <ul className="limitations-list">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
