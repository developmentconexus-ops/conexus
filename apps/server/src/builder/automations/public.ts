import type { Mastra } from '@mastra/core/mastra'
import type { FastifyInstance } from 'fastify'
import type { ReleaseScope } from '../conversation/public.ts'
import type { AutomationsDeps } from './automations.ts'
import { createAutomations } from './automations.ts'
import { releaseAutomations } from './release.ts'
import { registerAutomationRoutes } from './routes.ts'
import { automationRuns } from './runs.ts'

export { AUTOMATION_TIMEZONE, cronOf } from './cadence.ts'
export type { AutomationInput } from './run.ts'
export { AUTOMATION_TURN_MS, AUTOMATION_WORKFLOW, automationRun } from './run.ts'

/**
 * The Assistant's automations (step 24.2) on the Hub's one `Mastra`: the routes, and the removal
 * the Hub runs before the conversations'.
 */
export function automationsOf(
  deps: Omit<AutomationsDeps, 'runs'> & { mastra: Mastra; bootedAt: number },
) {
  const runs = automationRuns({ mastra: deps.mastra, bootedAt: deps.bootedAt })
  const automations = createAutomations({ ...deps, runs })
  return Object.freeze({
    routes: (app: FastifyInstance) => registerAutomationRoutes(app, automations),
    release: (scope: ReleaseScope) => releaseAutomations(deps, scope),
  })
}

export type AutomationsPart = ReturnType<typeof automationsOf>
