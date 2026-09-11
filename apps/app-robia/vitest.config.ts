import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Separate from vite.config.ts so `vite build`/`vite dev` never pull in
// test-only tooling. Scoped narrowly to the RC-11 PageSpeed additions —
// this is app-robia's first test setup, kept minimal on purpose.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
})
