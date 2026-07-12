# Landing Page

Technical portfolio page for the SPY volatility forecasting + conformal prediction project.

## Run locally

```bash
cd landing
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Build

```bash
npm run build
npm run preview
```

## Data pipeline

`npm run prepare-data` reads CSVs from `../results/` and writes `public/data/site-data.json`:

- Full-sample metrics (including naive persistence baseline)
- LTTB-downsampled series (~500 pts) for default chart view
- Full daily series for crisis-window presets
- Conformal intervals + regime-split coverage
- Feature importance tables

Re-run automatically before `dev` and `build`.

## Deploy

Static output in `dist/`.

### Vercel (recommended)

Clean URL (`your-project.vercel.app`), no subpath config, auto-deploys on push.

1. Push this repo to GitHub
2. [vercel.com/new](https://vercel.com/new) → Import `faithscript/volatility-forecasting-conformal`
3. Set **Root Directory** to `landing`
4. Deploy (Vercel reads `landing/vercel.json` automatically)

Or CLI: `cd landing && npx vercel`

### GitHub Pages (alternative)

URL: `https://faithscript.github.io/volatility-forecasting-conformal/`

1. Push to `main` (includes `.github/workflows/deploy-landing.yml`)
2. Repo **Settings → Pages → Build and deployment → Source: GitHub Actions**
3. Push triggers the workflow; site goes live after first successful run

Verify toggles after deploy: `npm run verify-toggles`
