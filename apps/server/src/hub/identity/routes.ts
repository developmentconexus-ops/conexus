import { createSession, deleteSession, getSession, Person, setPassword } from '@conexus/hub-api'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import type { SessionReader } from '../../platform/access.ts'
import type { Config } from '../../platform/config.ts'
import { answer, serve } from '../../platform/http.ts'
import type { Auth } from './auth.ts'
import {
  inLibrary,
  RESET_PASSWORD_PATH,
  refusedAs,
  refusedReply,
  SIGN_IN_PATH,
  withRequestLog,
} from './auth.ts'

const FORWARDED = ['origin', 'cf-connecting-ip', 'user-agent', 'cookie']
const SignedIn = z.object({ user: Person })

function libraryRequest(
  config: Config,
  request: { path: string; headers: Headers; body: unknown },
): Request {
  const sent = new Headers({ 'content-type': 'application/json' })
  for (const name of FORWARDED) {
    const value = request.headers.get(name)
    if (value !== null) sent.set(name, value)
  }
  return new Request(`${config.publicOrigin}/api/auth${request.path}`, {
    method: 'POST',
    headers: sent,
    body: JSON.stringify(request.body),
  })
}

export function registerIdentityRoutes(
  app: FastifyInstance,
  deps: { auth: Auth; config: Config; readSession: SessionReader },
): void {
  serve(app, createSession, async ({ body, headers, log }) => {
    const reply = await withRequestLog(log, () =>
      inLibrary(() =>
        deps.auth.handler(libraryRequest(deps.config, { path: SIGN_IN_PATH, headers, body })),
      ),
    )
    if (!reply.ok) {
      throw await refusedReply(reply, { 401: 'SIGN_IN_REFUSED', 429: 'SIGN_IN_ATTEMPTS_EXCEEDED' })
    }
    const { user } = SignedIn.parse(await reply.json())
    log.info({ personId: user.id }, 'SESSION_CREATED')
    return answer({ person: user }, reply.headers.getSetCookie())
  })

  serve(app, setPassword, async ({ body, headers, log }) => {
    const reset = { newPassword: body.password, token: body.token }
    const reply = await withRequestLog(log, () =>
      inLibrary(() =>
        deps.auth.handler(
          libraryRequest(deps.config, { path: RESET_PASSWORD_PATH, headers, body: reset }),
        ),
      ),
    )
    if (!reply.ok) throw await refusedReply(reply, { INVALID_TOKEN: 'PASSWORD_LINK_INVALID' })
    log.info({}, 'PASSWORD_SET')
    return answer(undefined)
  })

  serve(app, getSession, async ({ headers }) => {
    const session = await deps.readSession({ headers })
    if (session.kind === 'SIGNED_OUT') return answer({ state: 'SIGNED_OUT' })
    return answer({ state: 'SIGNED_IN', person: session.person }, session.setCookie)
  })

  serve(app, deleteSession, async ({ headers, person, sessionToken, log }) => {
    // The library's sign-out logs and swallows a failed delete (api/routes/sign-out.mjs:49-54),
    // so the row goes first and fails loudly, and only then are the cookies expired (S20).
    const body = { token: sessionToken }
    await inLibrary(() =>
      refusedAs(() => deps.auth.api.revokeSession({ body, headers }), { 401: 'SESSION_REQUIRED' }),
    )
    const signedOut = await inLibrary(() => deps.auth.api.signOut({ headers, returnHeaders: true }))
    log.info({ personId: person.id }, 'SESSION_ENDED')
    return answer(undefined, signedOut.headers.getSetCookie())
  })
}
