import { Person } from '@conexus/hub-api'
import type { SessionReader } from '../../platform/access.ts'
import type { Auth } from './auth.ts'
import { endOfLifetime, inLibrary } from './auth.ts'

/**
 * The library reads, renews and ends sessions; `capAtTotalLifetime` in auth.ts bounds a renewal. A
 * release without that bound renewed a session past its total, so the total is read here too
 * (docs/reference/boundaries.md, "The session's total lifetime").
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
    if (Date.now() >= endOfLifetime(session.session.createdAt)) return { kind: 'SIGNED_OUT' }
    return {
      kind: 'SIGNED_IN',
      person: Person.parse(session.user),
      sessionToken: session.session.token,
      setCookie: found.headers.getSetCookie(),
    }
  }
}
