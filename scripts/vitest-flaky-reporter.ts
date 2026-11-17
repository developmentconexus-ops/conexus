// Defect: the web's vitest half had no second round, so one flaky screen test painted a pull request
// red until someone reran the job by hand, and no flaky test left a record (testing T4).
// apps/web/vitest.config.ts retries a failed test once on the CI; a test that passed only on the
// retry goes to the same record as the second round of scripts/test-run.ts (CONEXUS_FLAKY_FILE).
// Revalidate by 2027-05-17, or when Vitest changes TestCase.diagnostic().
import { relative, resolve } from 'node:path'
import type { Reporter, TestCase } from 'vitest/node'
import type { Flaky } from './flaky-report.ts'
import { reportFlaky } from './flaky-report.ts'

/** The web's one retry exists only on the CI, where a runner can contend for CPU. */
export const CI_RETRY = process.env.CI ? 1 : 0

const ROOT = resolve(import.meta.dirname, '..')

function flakyOf(testCase: TestCase): Flaky | undefined {
  if (testCase.diagnostic()?.flaky !== true) return undefined
  return {
    file: relative(ROOT, testCase.module.moduleId),
    name: testCase.fullName.replaceAll(' > ', ' › '),
  }
}

export class FlakyReporter implements Reporter {
  private readonly flaky: Flaky[] = []

  onTestCaseResult(testCase: TestCase): void {
    const found = flakyOf(testCase)
    if (found !== undefined) this.flaky.push(found)
  }

  onTestRunEnd(): void {
    if (this.flaky.length > 0) reportFlaky(this.flaky)
  }
}
