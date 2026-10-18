import type { PersonId } from '@conexus/hub-api'
import { Person } from '@conexus/hub-api'
import { and, eq, gt, sql } from 'drizzle-orm'
import type { SessionReader } from '../../platform/access.ts'
import type { ReadTx } from '../../platform/database.ts'
import type { Auth } from './auth.ts'
import { endOfLifetime, inLibrary } from './auth.ts'
import { session, user } from './tables.ts'

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

/**
 * The id of a live Hub session, by its token or by its id, as an app's door asks it outside the
 * library: past its idle deadline or its total lifetime the session counts as ended (security S18).
 */
export async function liveHubSession(
  tx: ReadTx,
  by: { token: string } | { id: string },
): Promise<string | undefined> {
  const [row] = await tx
    .select({ id: session.id, createdAt: session.createdAt })
    .from(session)
    .where(
      and(
        'token' in by ? eq(session.token, by.token) : eq(session.id, by.id),
        gt(session.expiresAt, sql`statement_timestamp()`),
      ),
    )
  if (row === undefined || Date.now() >= endOfLifetime(row.createdAt)) return undefined
  return row.id
}

/** The person's name, which an app sees as its caller's. */
export async function personNameOf(tx: ReadTx, personId: PersonId): Promise<string | undefined> {
  const [row] = await tx.select({ name: user.name }).from(user).where(eq(user.id, personId))
  return row?.name
}
