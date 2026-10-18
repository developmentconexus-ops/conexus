import { checkAppCall, createAppHandoff, createAppSession } from '@conexus/hub-api'
import type { FastifyInstance } from 'fastify'
import { answer, serve } from '../../platform/http.ts'
import type { AppDoor } from './handoff.ts'

/** The pass, on the public listener, where the person's Hub session is. */
export function registerHandoffRoute(app: FastifyInstance, door: AppDoor): void {
  serve(app, createAppHandoff, async ({ person, sessionToken, body, log }) => {
    const made = await door.createHandoff({ person, sessionToken, ...body })
    log.info({ companyId: made.companyId, projectId: made.projectId }, 'APP_HANDOFF_CREATED')
    return answer({ location: made.location })
  })
}

/** The dispatcher's two calls, on the edge listener alone (security S48). */
export function registerEdgeRoutes(edge: FastifyInstance, door: AppDoor): void {
  serve(edge, createAppSession, async ({ body, log }) => {
    const made = await door.redeemHandoff(body)
    log.info({ companyId: made.companyId, projectId: made.projectId }, 'APP_SESSION_CREATED')
    return answer({ session: made.session })
  })
  serve(edge, checkAppCall, async ({ query, headers }) =>
    answer(await door.checkCall({ host: query.host, headers })),
  )
}
