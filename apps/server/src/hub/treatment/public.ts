import type { FastifyInstance } from 'fastify'
import type { TreatmentRouteDeps } from './routes.ts'
import { registerTreatmentRoutes } from './routes.ts'

export { deleteCompanyTreatments, treatModelsOf } from './models.ts'
export { readModelSql } from './sql.ts'
export {
  TREAT_TASK_SCHEMA,
  TreatTaskResult,
  TreatTaskSpec,
  treatTaskSchema,
} from './treat-task.ts'

export function createTreatment(deps: TreatmentRouteDeps) {
  return Object.freeze({
    routes: (app: FastifyInstance) => registerTreatmentRoutes(app, deps),
  })
}
