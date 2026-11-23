import type { FastifyInstance } from 'fastify'
import { registerCopyRoutes } from './routes.ts'
import { createCopyService } from './service.ts'

export { copyModeOf } from './mode.ts'
export type { ProjectCopiesView } from './project-view.ts'
export type { CopyService } from './service.ts'

/**
 * The company's copies: what each reads, its runs and its releases to Projetos. The rows it reads
 * live in the company's database, reached only through `CompanyPostgres`.
 */
export function createCopies(deps: Parameters<typeof createCopyService>[0]) {
  const service = createCopyService(deps)
  return Object.freeze({
    ...service,
    routes: (app: FastifyInstance) => registerCopyRoutes(app, service),
  })
}
