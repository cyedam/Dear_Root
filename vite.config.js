import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages serves this repo at https://cyedam.github.io/<repo name>/ (case-sensitive).
// The deploy workflow passes the current repo name in BASE_PATH, so renaming the repo
// doesn't break the site. Local builds fall back to the current name.
const base = process.env.BASE_PATH || '/Dear_Root/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react()],
})
