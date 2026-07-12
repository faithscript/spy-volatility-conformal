import { StatCard } from "./StatCard";

export function Nav() {
  const links = [
    { href: "#finding", label: "Finding" },
    { href: "#methodology", label: "Method" },
    { href: "#results", label: "Results" },
    { href: "#features", label: "Features" },
    { href: "#conformal", label: "Conformal" },
    { href: "#limitations", label: "Limits" },
  ];

  return (
    <nav className="nav">
      <div className="nav-inner">
        <a href="#" className="nav-brand">
          SPY Vol Forecast
        </a>
        <div className="nav-links">
          {links.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}

export function Hero() {
  return (
    <header className="hero">
      <p className="hero-eyebrow">Quantitative ML · Walk-forward validation · Split conformal</p>
      <h1>SPY Volatility Forecasting with Conformal Prediction</h1>
      <p className="hero-summary">
        Benchmarks GARCH(1,1) against walk-forward Random Forest and a GARCH-hybrid
        Random Forest on ~10 years of daily SPY data, then wraps the best model in
        calibrated uncertainty intervals.
      </p>
      <div className="stat-grid">
        <StatCard
          value="76%"
          label="MAE reduction vs GARCH"
          detail="Hybrid RF 0.00728 vs GARCH 0.03035"
          href="#results"
        />
        <StatCard
          value="92.0%"
          label="Empirical conformal coverage"
          detail="90% target · 503-day test window"
          href="#conformal"
        />
        <StatCard
          value="8"
          label="Engineered RF features"
          detail="+ GARCH forecast in hybrid model"
          href="#features"
        />
      </div>
    </header>
  );
}
