import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { NEVER_RERUN } from '../../scripts/rerun-exempt.ts'
import { CI_RETRY, FlakyReporter } from '../../scripts/vitest-flaky-reporter.ts'

// The files T4 forbids rerunning: a flake there may be the defect, so it stays red.
const noRetry = [
  ...new Set([...NEVER_RERUN.files, ...NEVER_RERUN.tests.map((entry) => entry.file)]),
]
  .filter((file) => file.startsWith('apps/web/src/'))
  .map((file) => file.slice('apps/web/'.length))

const shared = {
  environment: 'jsdom',
  setupFiles: ['./vitest.setup.ts'],
  testTimeout: 10_000,
  // Without it Vitest 5 copies every transformed module to a new folder in the system temp and never removes it.
  fsModuleCache: true,
  // A screen formats a date in the browser's own zone; one zone here lets a test expect a literal.
  env: { TZ: 'America/Sao_Paulo' },
} as const

export default defineConfig({
  plugins: [react()],
  test: {
    reporters: ['default', new FlakyReporter()],
    projects: [
      {
        extends: true,
        test: {
          ...shared,
          name: 'rerun',
          include: ['src/**/*.test.tsx'],
          exclude: noRetry,
          retry: CI_RETRY,
        },
      },
      {
        extends: true,
        test: { ...shared, name: 'never-rerun', include: noRetry, retry: 0 },
      },
    ],
  },
})
