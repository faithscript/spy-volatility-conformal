import { lazy, Suspense } from "react";
import { Nav, Hero } from "./components/Hero";
import { Section } from "./components/Section";
import { HonestFinding } from "./components/HonestFinding";
import { Methodology } from "./components/Methodology";
import { FeatureImportance } from "./components/FeatureImportance";
import { Limitations } from "./components/Limitations";
import { Footer } from "./components/Footer";
import { useSiteData } from "./hooks/useSiteData";
import "./App.css";

const ResultsSection = lazy(() =>
  import("./components/ResultsSection").then((m) => ({ default: m.ResultsSection })),
);
const ConformalSection = lazy(() =>
  import("./components/ConformalSection").then((m) => ({ default: m.ConformalSection })),
);

function ChartFallback() {
  return <div className="chart-wrap chart-loading">Loading chart…</div>;
}

function App() {
  const { data, error, loading } = useSiteData();

  if (loading) {
    return <div className="loading">Loading project data…</div>;
  }

  if (error || !data) {
    return (
      <div className="loading error">
        Failed to load data. Run <code>npm run prepare-data</code> first.
        {error && <pre>{error}</pre>}
      </div>
    );
  }

  return (
    <>
      <Nav />
      <main className="main">
        <Hero />

        <Section
          id="finding"
          title="The honest finding"
          subtitle="Why a naive baseline beats sophisticated models on this target"
        >
          <HonestFinding data={data} />
        </Section>

        <Section
          id="methodology"
          title="Methodology"
          subtitle="Walk-forward validation with no look-ahead"
        >
          <Methodology />
        </Section>

        <Section
          id="results"
          title="Results"
          subtitle="Predicted vs actual realized volatility — data-driven, interactive"
        >
          <Suspense fallback={<ChartFallback />}>
            <ResultsSection data={data} />
          </Suspense>
        </Section>

        <Section
          id="features"
          title="Feature importance"
          subtitle="What the trees actually learned"
        >
          <FeatureImportance data={data} />
        </Section>

        <Section
          id="conformal"
          title="Conformal prediction"
          subtitle="Calibrated uncertainty intervals on Hybrid RF forecasts"
        >
          <Suspense fallback={<ChartFallback />}>
            <ConformalSection data={data} />
          </Suspense>
        </Section>

        <Section id="limitations" title="Limitations" subtitle="What this project does not claim">
          <Limitations />
        </Section>

        <Footer />
      </main>
    </>
  );
}

export default App;
