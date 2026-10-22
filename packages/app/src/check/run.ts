import { rmSync } from 'node:fs'
import type { Result } from '../result.ts'
import { navegador } from './browser.ts'
import { telas, worker } from './build.ts'
import { dependencies } from './dependencies.ts'
import { manifesto } from './manifest.ts'
import type { StepName } from './report.ts'
import { CheckReport, firstProblems, STEP_NAMES } from './report.ts'
import type { CheckContext, Outcome } from './step.ts'
import { workOf } from './step.ts'
import { tipos } from './types.ts'

const STEPS: Readonly<Record<StepName, (ctx: CheckContext) => Promise<Outcome>>> = {
  dependências: dependencies,
  manifesto,
  tipos,
  telas,
  worker,
  navegador,
}

/**
 * Every step in order over the app folder; after one fails, the rest are skipped. A step the
 * machine could not run ends the whole check without a report: that is no verdict on the app.
 */
export async function runCheck(ctx: CheckContext): Promise<Result<CheckReport, string>> {
  rmSync(workOf(ctx), { recursive: true, force: true })
  const steps: CheckReport['steps'] = []
  let failed = false
  for (const name of STEP_NAMES) {
    if (failed) {
      steps.push({ name, state: 'skipped', problems: [] })
      continue
    }
    const outcome = await STEPS[name](ctx)
    if (outcome.state === 'platform') return { ok: false, error: `${name}: ${outcome.reason}` }
    const problems = outcome.state === 'passed' ? [] : firstProblems(outcome.problems)
    steps.push({ name, state: outcome.state, problems })
    failed = outcome.state === 'failed'
  }
  return { ok: true, value: CheckReport.parse({ ok: !failed, steps }) }
}
