import type { FailureCode } from '@conexus/hub-api'
import {
  createSession,
  deleteSession,
  getSession,
  Person,
  requestPasswordRecovery,
  setPassword,
} from '@conexus/hub-api'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import type { SessionReader } from '../../platform/access.ts'
import { CLIENT_ADDRESS_HEADER } from '../../platform/access.ts'
import type { Config } from '../../platform/config.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { answer, serve } from '../../platform/http.ts'
import type { Auth } from './auth.ts'
import {
  inLibrary,
  PASSWORD_RECOVERY_PATH,
  RESET_PASSWORD_PATH,
  refusedAs,
  refusedReply,
  SIGN_IN_PATH,
  withRequestLog,
} from './auth.ts'
import { checkPassword } from './password-check.ts'
import type { createPasswordRecovery } from './password-recovery.ts'

const FORWARDED = ['origin', CLIENT_ADDRESS_HEADER, 'user-agent', 'cookie']
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

/** Counts one attempt on `path` against the caller's address; the limit answers `exceeded`. */
export async function countAttempt(
  deps: { auth: Auth; config: Config },
  input: { headers: Headers; log: FailureLog; path: string; exceeded: FailureCode },
): Promise<void> {
  const reply = await withRequestLog(input.log, () =>
    inLibrary(() =>
      deps.auth.handler(
        libraryRequest(deps.config, { path: input.path, headers: input.headers, body: {} }),
      ),
    ),
  )
  if (!reply.ok) throw await refusedReply(reply, { 429: input.exceeded })
}

export function registerIdentityRoutes(
  app: FastifyInstance,
  deps: {
    auth: Auth
    config: Config
    readSession: SessionReader
    recovery: ReturnType<typeof createPasswordRecovery>
  },
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
    await checkPassword(body.password)
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

  serve(app, requestPasswordRecovery, async ({ body, headers, log }) => {
    await countAttempt(deps, {
      headers,
      log,
      path: PASSWORD_RECOVERY_PATH,
      exceeded: 'RECOVERY_ATTEMPTS_EXCEEDED',
    })
    const mail = await deps.recovery.request(body.email)
    log.info({ sent: mail !== undefined }, 'PASSWORD_RECOVERY_REQUESTED')
    // Mailed after the commit and the answer, so the answer is the same in time as well (T3A).
    return answer(undefined, [], mail && (() => deps.recovery.send(mail)))
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
