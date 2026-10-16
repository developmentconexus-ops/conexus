import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.tsx'],
    testTimeout: 10_000,
    // A screen formats a date in the browser's own zone; one zone here lets a test expect a literal.
    env: { TZ: 'America/Sao_Paulo' },
  },
})
