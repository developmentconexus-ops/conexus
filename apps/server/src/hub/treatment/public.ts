import type { FastifyInstance } from 'fastify'
import type { TreatmentRouteDeps } from './routes.ts'
import { registerTreatmentRoutes } from './routes.ts'
import type { TreatmentRunDeps } from './treatment-run.ts'
import { createTreatmentRuns } from './treatment-run.ts'

export { deleteCompanyTreatments, treatModelsOf } from './models.ts'
export type { LastStatus, ModelGraph } from './select.ts'
export { selection } from './select.ts'
export { readModelSql } from './sql.ts'
export {
  ModelName,
  TREAT_TASK_SCHEMA,
  TreatTaskResult,
  TreatTaskSpec,
  treatTaskSchema,
} from './treat-task.ts'

/**
 * The treatment of the Hub: its routes and its runs, which share the copies' task and queue; the
 * copies reach the runs through `hooks`, given at the Hub's start (subjects do not import each other).
 */
export function createTreatment(deps: Omit<TreatmentRouteDeps, 'runs'> & TreatmentRunDeps) {
  const runs = createTreatmentRuns(deps)
  return Object.freeze({
    routes: (app: FastifyInstance) => registerTreatmentRoutes(app, { ...deps, runs }),
    hooks: runs.hooks,
    sweepAll: runs.sweepAll,
    idle: runs.idle,
  })
}
