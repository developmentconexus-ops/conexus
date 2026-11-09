import type { FastifyInstance } from 'fastify'
import type { ReleaseScope } from '../controller-kit/public.ts'
import { dropOrphans } from './boot.ts'
import { releaseWorkflows } from './release.ts'
import { registerWorkflowRoutes } from './routes.ts'
import { LOOP_LIMIT_NOT_BUILT, NOT_BUILT, workflowTools } from './tools.ts'
import type { WorkflowsDeps } from './workflows.ts'

/** The eight tools the published workflows' definitions name, for the Hub's one `Mastra`. */
export function workflowToolsOf() {
  return workflowTools({ limit: LOOP_LIMIT_NOT_BUILT, executors: NOT_BUILT })
}

/**
 * The company's workflows (step 24.6) on the Hub's one `Mastra`: the routes, the pass at start
 * that drops the definitions the Hub has no version for, and the removal the Hub runs before the
 * conversations'.
 */
export function workflowsOf(deps: WorkflowsDeps) {
  return Object.freeze({
    routes: (app: FastifyInstance) => registerWorkflowRoutes(app, deps),
    boot: () => dropOrphans(deps),
    release: (scope: ReleaseScope) => releaseWorkflows(deps, scope),
  })
}

export type { TriggerShape } from './compile.ts'
export { compiled } from './compile.ts'
export type { FrozenWorkflow } from './frozen.ts'
export { graphProblems } from './graph-problems.ts'
export type { MastraWorkflowId } from './ids.ts'
export { mastraWorkflowIdOf, parseMastraWorkflowId, pathOf } from './ids.ts'
export { registryIndexOf } from './index.ts'
export { problemsOf } from './problems.ts'
