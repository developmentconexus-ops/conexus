import type { FastifyInstance } from 'fastify'
import type { RequestDeps } from './requests.ts'
import { createRequests } from './requests.ts'
import { registerRequestRoutes } from './routes.ts'

export type { NoticeRequests } from './requests.ts'
/** For the bell, which reads what the requests of its notices say now (code C8). */
export { noticeViewsOf } from './views.ts'

/**
 * The requests to publish a version (step 24.3.4, U2). They reach the apps, Projects and identity
 * only through their public doors (code C4); the notifications they write come by the port
 * `main.ts` hands them.
 */
export function requestsOf(deps: RequestDeps) {
  const requests = createRequests(deps)
  return Object.freeze({
    routes: (app: FastifyInstance) => registerRequestRoutes(app, requests),
    closeRequests: requests.closeRequests,
    publishRequestOf: requests.publishRequestOf,
  })
}
