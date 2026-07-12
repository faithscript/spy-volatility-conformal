import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves at /volatility-forecasting-conformal/; Vercel serves at /
const base = process.env.GITHUB_PAGES === 'true'
  ? '/volatility-forecasting-conformal/'
  : '/'

export default defineConfig({
  base,
  plugins: [react()],
})
