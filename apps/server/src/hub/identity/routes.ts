import type { FailureCode } from '@conexus/hub-api'
import { createSession, deleteSession, getSession, Person, setPassword } from '@conexus/hub-api'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import type { Config } from '../../platform/config.ts'
import { Failure } from '../../platform/failure.ts'
import { answer, serve } from '../../platform/http.ts'
import type { Auth } from './auth.ts'
import { RESET_PASSWORD_PATH, SIGN_IN_PATH, withRequestLog } from './auth.ts'

const FORWARDED = ['origin', 'cf-connecting-ip', 'user-agent', 'cookie']
const SignedIn = z.object({ user: Person })
const LibraryRefusal = z.object({ code: z.string() })
const PASSWORD_REFUSALS: Partial<Record<string, FailureCode>> = {
  INVALID_TOKEN: 'PASSWORD_LINK_INVALID',
  PASSWORD_TOO_SHORT: 'PASSWORD_TOO_SHORT',
}

/** By status, never by the library's message (code C52); its one outside system is the database. */
function refusalOf(status: number): FailureCode {
  if (status === 401) return 'SIGN_IN_REFUSED'
  if (status === 429) return 'SIGN_IN_ATTEMPTS_EXCEEDED'
  if (status < 500) return 'REQUEST_MALFORMED'
  return 'DATABASE_UNAVAILABLE'
}

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

function statusOf(error: unknown): number {
  const status = z.object({ statusCode: z.number().int() }).safeParse(error)
  return status.success ? status.data.statusCode : 500
}

export function registerIdentityRoutes(
  app: FastifyInstance,
  deps: { auth: Auth; config: Config },
): void {
  serve(app, createSession, async ({ body, headers, log }) => {
    const reply = await withRequestLog(log, () =>
      deps.auth.handler(libraryRequest(deps.config, { path: SIGN_IN_PATH, headers, body })),
    )
    if (!reply.ok) throw new Failure(refusalOf(reply.status))
    const { user } = SignedIn.parse(await reply.json())
    log.info({ personId: user.id }, 'SESSION_CREATED')
    return answer({ person: user }, reply.headers.getSetCookie())
  })

  serve(app, setPassword, async ({ body, headers, log }) => {
    const reset = { newPassword: body.password, token: body.token }
    const reply = await withRequestLog(log, () =>
      deps.auth.handler(
        libraryRequest(deps.config, { path: RESET_PASSWORD_PATH, headers, body: reset }),
      ),
    )
    if (reply.status === 400) {
      const refusal = LibraryRefusal.safeParse(await reply.json().catch(() => undefined))
      const code = refusal.success ? PASSWORD_REFUSALS[refusal.data.code] : undefined
      throw new Failure(code ?? 'REQUEST_MALFORMED')
    }
    if (!reply.ok) throw new Failure(refusalOf(reply.status))
    log.info({}, 'PASSWORD_SET')
    return answer(undefined)
  })

  serve(app, getSession, ({ person }) => answer({ person }))

  serve(app, deleteSession, async ({ headers, person, log }) => {
    const current = await deps.auth.api.getSession({ headers, query: { disableCookieCache: true } })
    if (current === null) throw new Failure('SESSION_REQUIRED')
    // The library's sign-out logs and swallows a failed delete (api/routes/sign-out.mjs:49-54),
    // so the row goes first and fails loudly, and only then are the cookies expired (S20).
    await deps.auth.api
      .revokeSession({ body: { token: current.session.token }, headers })
      .catch((error: unknown) => {
        const code = statusOf(error) === 401 ? 'SESSION_REQUIRED' : 'DATABASE_UNAVAILABLE'
        throw new Failure(code, { cause: error })
      })
    const signedOut = await deps.auth.api.signOut({ headers, returnHeaders: true })
    log.info({ personId: person.id }, 'SESSION_ENDED')
    return answer(undefined, signedOut.headers.getSetCookie())
  })
}
