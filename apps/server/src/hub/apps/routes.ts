import {
  APP_OPEN_PATH,
  AppOpenQuery,
  checkAppCall,
  createAppFrameHandoff,
  createAppSession,
  createAppVersion,
  FAILURES,
  listAppVersions,
  setLiveVersion,
} from '@conexus/hub-api'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { optionalSessionOf } from '../../platform/access.ts'
import { Failure, logFailure } from '../../platform/failure.ts'
import { answer, serve } from '../../platform/http.ts'
import { sendPage } from '../../platform/screens.ts'
import type { AppVersions } from './app-versions.ts'
import type { AppDoor } from './handoff.ts'

/**
 * The handoff answers a navigation, so a failure is never JSON: a missing session goes to sign-in
 * with the address to come back to, any other failure gets the screens' page with its status. A
 * request that is no navigation goes on to the Hub's handler, which answers the problem (S48).
 */
function answerNavigationFailure(error: unknown, request: FastifyRequest, reply: FastifyReply) {
  if (error instanceof Failure && error.code === 'REQUEST_ORIGIN_REFUSED') throw error
  const failure =
    error instanceof Failure ? error : new Failure('INTERNAL_UNEXPECTED', { cause: error })
  logFailure(request.log, failure)
  if (failure.code === 'SESSION_REQUIRED') {
    return reply.redirect(`/login?${new URLSearchParams({ redirect: request.url })}`, 303)
  }
  return sendPage(reply, FAILURES[failure.code].status)
}

/**
 * The pass, on the public listener, where the person's Hub session is: the browser the dispatcher
 * sent here goes on to the app's host with it, by a 303 as an OAuth authorization endpoint answers,
 * and no screen of the Hub opens on the way (security S22, S48).
 */
export function registerHandoffRoute(app: FastifyInstance, door: AppDoor): void {
  app.route({
    method: 'GET',
    url: APP_OPEN_PATH,
    // The one problem it answers: a request that is no navigation reads JSON (security S48).
    config: { access: 'handoff', failures: ['REQUEST_ORIGIN_REFUSED'] },
    errorHandler: answerNavigationFailure,
    handler: async (request, reply) => {
      const query = AppOpenQuery.safeParse(request.query)
      if (!query.success) {
        throw new Failure('NOT_FOUND', { details: { reason: 'MALFORMED' }, cause: query.error })
      }
      const session = optionalSessionOf(request)
      if (session === undefined) throw new Failure('SESSION_REQUIRED')
      const made = await door.createHandoff({ ...session, ...query.data })
      const { companyId, projectId } = made
      request.log.info({ companyId, projectId }, 'APP_HANDOFF_CREATED')
      return reply.redirect(made.location, 303)
    },
  })
  // The same pass for the Prévia, whose frame cannot reach `/apps/open` with the Hub's cookie: the
  // Hub's own page asks, by its session and the binding hash the frame's entry page sent it.
  serve(app, createAppFrameHandoff, async ({ person, sessionToken, body, log }) => {
    const made = await door.createHandoff({ person, sessionToken, ...body })
    log.info({ companyId: made.companyId, projectId: made.projectId }, 'APP_HANDOFF_CREATED')
    return answer({ location: made.location })
  })
}

/** A Projeto's versions, for its owners and administrators, on the public listener. */
export function registerVersionRoutes(app: FastifyInstance, versions: AppVersions): void {
  serve(app, listAppVersions, async ({ person, params }) =>
    answer({ versions: await versions.list({ person, ...params }) }),
  )
  serve(app, createAppVersion, async ({ person, params, body, attemptKey }) => {
    const sent = await versions.send({ person, ...params, ...body, attemptKey })
    return answer({ version: sent.version })
  })
  serve(app, setLiveVersion, async ({ person, params, body }) =>
    answer({ version: await versions.setLive({ person, ...params, versionId: body.versionId }) }),
  )
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
