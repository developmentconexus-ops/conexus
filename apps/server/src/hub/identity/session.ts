import { Person } from '@conexus/hub-api'
import { sql } from 'drizzle-orm'
import { z } from 'zod'
import type { SessionReader } from '../../platform/access.ts'
import type { Database } from '../../platform/database.ts'
import type { Auth } from './auth.ts'

const TOTAL_HOURS = 8

const Deadline = z.object({ ended: z.boolean(), renew: z.boolean() })
type Deadline = z.infer<typeof Deadline>

/**
 * The library checks the idle deadline by the process clock (api/routes/session.mjs:155) and has
 * no total one; both, and when to renew, are read here by the database clock (security S18).
 */
async function deadlineOf(
  database: Database,
  token: string,
  lifetimes: { idleSeconds: number; renewAfterSeconds: number },
): Promise<Deadline> {
  const rows = await database.read((tx) =>
    tx.execute(sql`select
        now() >= expires_at or now() >= created_at + make_interval(hours => ${TOTAL_HOURS}) as ended,
        now() >= expires_at - make_interval(secs => ${lifetimes.idleSeconds - lifetimes.renewAfterSeconds}) as renew
      from auth.session where token = ${token}`),
  )
  const [row] = rows.rows.map((value) => Deadline.parse(value))
  return row ?? { ended: true, renew: false }
}

export function createSessionReader(deps: {
  auth: Auth
  database: Database
  lifetimes: { idleSeconds: number; renewAfterSeconds: number }
}): SessionReader {
  return async ({ headers }) => {
    const query = { disableCookieCache: true, disableRefresh: true }
    const found = await deps.auth.api.getSession({ headers, query })
    if (found === null) return { kind: 'SIGNED_OUT' }
    const { token } = found.session
    const deadline = await deadlineOf(deps.database, token, deps.lifetimes)
    if (deadline.ended) {
      await deps.auth.api.revokeSession({ body: { token }, headers })
      return { kind: 'SIGNED_OUT' }
    }
    if (!deadline.renew)
      return { kind: 'SIGNED_IN', person: Person.parse(found.user), setCookie: [] }
    const renewed = await deps.auth.api.getSession({
      headers,
      query: { disableCookieCache: true },
      returnHeaders: true,
    })
    if (renewed.response === null) return { kind: 'SIGNED_OUT' }
    return {
      kind: 'SIGNED_IN',
      person: Person.parse(renewed.response.user),
      setCookie: renewed.headers.getSetCookie(),
    }
  }
}
