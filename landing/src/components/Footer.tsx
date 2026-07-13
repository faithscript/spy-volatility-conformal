const GITHUB_URL = "https://github.com/faithscript/spy-volatility-conformal";

const STACK = [
  "Python",
  "arch",
  "scikit-learn",
  "pandas",
  "numpy",
  "yfinance",
  "matplotlib",
  "React",
  "Plotly.js",
];

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-stack">
        {STACK.map((t) => (
          <span key={t} className="stack-pill">
            {t}
          </span>
        ))}
      </div>
      <div className="footer-links">
        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
          View source on GitHub →
        </a>
        <a href={`${GITHUB_URL}/tree/main/src`} target="_blank" rel="noopener noreferrer">
          Model scripts (src/) →
        </a>
      </div>
      <p className="footer-note">
        Not investment advice. Walk-forward evaluation on SPY daily data.
      </p>
    </footer>
  );
}
