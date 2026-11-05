import { cancelPublishRequest, decidePublishRequest, requestPublish } from '@conexus/hub-api'
import type { FastifyInstance } from 'fastify'
import { answer, serve } from '../../platform/http.ts'
import type { Requests } from './requests.ts'

/** Asking to publish, deciding and withdrawing: each line names who acted and on what, by ids (S41). */
export function registerRequestRoutes(app: FastifyInstance, requests: Requests): void {
  serve(app, requestPublish, async ({ person, params, body, attemptKey, log }) => {
    const asked = await requests.ask({ person, ...params, ...body, attemptKey })
    if (asked.created) {
      const { number } = body
      const requestId = asked.request.id
      log.info({ by: person.id, ...params, number, requestId }, 'PUBLISH_REQUESTED')
    }
    return answer({ request: asked.request })
  })
  serve(app, decidePublishRequest, async ({ person, params, body, log }) => {
    const decided = await requests.decide({ person, ...params, decision: body })
    const { state, projectId, number } = decided
    log.info({ by: person.id, ...params, projectId, number, state }, 'PUBLISH_REQUEST_DECIDED')
    return answer({ state })
  })
  serve(app, cancelPublishRequest, async ({ person, params, log }) => {
    await requests.cancel({ person, ...params })
    log.info({ by: person.id, ...params }, 'PUBLISH_REQUEST_CANCELLED')
    return answer(undefined)
  })
}
