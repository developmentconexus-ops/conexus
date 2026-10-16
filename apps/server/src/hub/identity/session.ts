import { Person } from '@conexus/hub-api'
import type { SessionReader } from '../../platform/access.ts'
import type { Auth } from './auth.ts'
import { inLibrary } from './auth.ts'

/** The library reads, renews and ends sessions; `capAtTotalLifetime` in auth.ts bounds a renewal. */
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
    return {
      kind: 'SIGNED_IN',
      person: Person.parse(session.user),
      sessionToken: session.session.token,
      setCookie: found.headers.getSetCookie(),
    }
  }
}
