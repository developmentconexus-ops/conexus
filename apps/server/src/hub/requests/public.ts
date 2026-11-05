import type { FastifyInstance } from 'fastify'
import type { RequestDeps } from './requests.ts'
import { createRequests } from './requests.ts'
import { registerRequestRoutes } from './routes.ts'

export type { NoticeRequests } from './requests.ts'
/** For the bell, which joins a notice to its request (code C8). */
export { NOTICE_VIEW } from './requests.ts'
export { request } from './tables.ts'

/**
 * The requests to publish a version (step 24.3.4, U2). They reach the apps, Projects and identity
 * only through their public doors (code C4); the notifications they write come by the port
 * `main.ts` hands them.
 */
export function requestsOf(deps: RequestDeps) {
  const requests = createRequests(deps)
  return Object.freeze({
    routes: (app: FastifyInstance) => registerRequestRoutes(app, requests),
    /** What a publish closes, handed to the apps (`publishIn`). */
    closeRequests: requests.closeRequests,
    /** What the Projeto's page reads, handed to Projects. */
    publishRequestOf: requests.publishRequestOf,
  })
}

export type RequestsPart = ReturnType<typeof requestsOf>
