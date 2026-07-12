/**
 * Sanity-check that model/window toggles map to distinct chart datasets.
 * Run: npx tsx scripts/verify-chart-toggles.ts
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(__dirname, "../public/data/site-data.json");
const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

type ModelKey = "garch" | "randomForest" | "hybrid" | "naive";
type WindowKey = "full" | "covid" | "apr2025" | "crisis";

function getPoints(model: ModelKey, window: WindowKey) {
  if (window === "full") return data.models[model].display;
  return data.windows[window][model];
}

function seriesSignature(points: { date: string; predicted: number }[]) {
  if (points.length === 0) return "empty";
  const first = points[0];
  const last = points[points.length - 1];
  const predSum = points.reduce((s, p) => s + p.predicted, 0);
  return `${points.length}|${first.date}|${last.date}|${predSum.toFixed(6)}`;
}

const models: ModelKey[] = ["garch", "randomForest", "hybrid", "naive"];
const windows: WindowKey[] = ["full", "covid", "apr2025", "crisis"];

console.log("=== Toggle data signatures ===\n");

for (const window of windows) {
  console.log(`Window: ${window}`);
  const sigs = new Map<string, string>();
  for (const model of models) {
    const pts = getPoints(model, window);
    const sig = seriesSignature(pts);
    console.log(`  ${model.padEnd(14)} n=${String(pts.length).padStart(4)}  ${sig}`);
    sigs.set(model, sig);
  }
  const unique = new Set(sigs.values());
  if (unique.size !== models.length) {
    console.warn(`  ⚠ Not all models differ in window "${window}"`);
  }
  console.log();
}

// Window switches should change data for same model
const garchFull = seriesSignature(getPoints("garch", "full"));
const garchCovid = seriesSignature(getPoints("garch", "covid"));
const garchCrisis = seriesSignature(getPoints("garch", "crisis"));

console.log("=== GARCH window switches ===");
console.log(`  full     vs covid:   ${garchFull === garchCovid ? "SAME (bad)" : "different (ok)"}`);
console.log(`  full     vs crisis:  ${garchFull === garchCrisis ? "SAME (bad)" : "different (ok)"}`);
console.log(`  covid    vs crisis:  ${garchCovid === garchCrisis ? "SAME (bad)" : "different (ok)"}`);

// crisis filter integrity
const crisisPts = getPoints("garch", "crisis");
const bad = crisisPts.filter((p: { actual: number }) => p.actual <= 0.3);
console.log(`\n=== Crisis filter (actual > 0.30) ===`);
console.log(`  n=${crisisPts.length}, violations=${bad.length}`);

// conformal elevated split
const { lowVol, highVol } = data.conformal.regimeSplit;
console.log(`\n=== Conformal elevated split (actual > 0.20) ===`);
console.log(`  lowVol n=${lowVol.n}, highVol n=${highVol.n}, threshold=${lowVol.threshold}`);

const confHigh = data.conformal.daily.filter((p: { actual: number }) => p.actual > 0.2);
console.log(`  conformal high-vol rows match: ${confHigh.length === highVol.n}`);

console.log("\nDone.");
