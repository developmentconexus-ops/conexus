import { Person } from '@conexus/hub-api'
import type { SessionReader } from '../../platform/access.ts'
import type { Auth } from './auth.ts'
import { inLibrary } from './auth.ts'

const TOTAL_MS = 8 * 60 * 60 * 1000

/**
 * The library reads, slides and creates sessions by its own clock; it has no total lifetime, so
 * the 8 hours are checked here on the session it returns (criterion 14).
 */
export function createSessionReader(deps: { auth: Auth }): SessionReader {
  return async ({ headers }) => {
    const found = await inLibrary(() =>
      deps.auth.api.getSession({
        headers,
        query: { disableCookieCache: true },
        returnHeaders: true,
      }),
    )
    const session = found.response
    if (session === null) return { kind: 'SIGNED_OUT' }
    if (Date.now() >= session.session.createdAt.getTime() + TOTAL_MS) {
      const { token } = session.session
      await inLibrary(() => deps.auth.api.revokeSession({ body: { token }, headers }))
      return { kind: 'SIGNED_OUT' }
    }
    return {
      kind: 'SIGNED_IN',
      person: Person.parse(session.user),
      setCookie: found.headers.getSetCookie(),
    }
  }
}
