import type { FastifyInstance } from 'fastify'
import type { TreatmentRouteDeps } from './routes.ts'
import { registerTreatmentRoutes } from './routes.ts'

export { deleteCompanyTreatments, treatModelsOf } from './models.ts'
export {
  TREAT_TASK_SCHEMA,
  TreatTaskResult,
  TreatTaskSpec,
  treatTaskSchema,
} from './treat-task.ts'

/** The company's treatments: the routes that propose them, say yes to them and list what they make. */
export function createTreatment(deps: TreatmentRouteDeps) {
  return Object.freeze({
    routes: (app: FastifyInstance) => registerTreatmentRoutes(app, deps),
  })
}
