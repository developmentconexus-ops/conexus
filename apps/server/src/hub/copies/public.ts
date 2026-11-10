import type { FastifyInstance } from 'fastify'
import { registerCopyRoutes } from './routes.ts'
import { createCopyService } from './service.ts'

export type { CopyService } from './service.ts'
export type { CopyClock, CopyRunEnd, CopyState, CopyTuning } from './store.ts'

/**
 * The company's copies (Capacidade 2): what each reads, its runs and its releases to Projetos. The
 * rows it reads live in the company's database, reached only through `CompanyPostgres`; the source,
 * only through the connectors' port.
 */
export function createCopies(deps: Parameters<typeof createCopyService>[0]) {
  const service = createCopyService(deps)
  return Object.freeze({
    ...service,
    routes: (app: FastifyInstance) => registerCopyRoutes(app, service),
  })
}
