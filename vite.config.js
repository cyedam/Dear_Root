import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves this repo at https://cyedam.github.io/MyShop/ (case-sensitive)
  base: '/MyShop/',
  plugins: [react()],
})
