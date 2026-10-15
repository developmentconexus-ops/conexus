import { runWithAdapter } from '@better-auth/core/context'
import type { Email } from '@conexus/hub-api'
import { sql } from 'drizzle-orm'
import type { PublicOrigin } from '../../platform/config.ts'
import type { CommandTx, Database } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import type { Auth } from './auth.ts'
import { adapterOn, linkTokenOf } from './auth.ts'

const SET_PASSWORD_PAGE = '/set-password'
// Two runs at once would each see an empty installation; this lock makes the second wait (C65).
const FIRST_PERSON_LOCK = sql`select pg_advisory_xact_lock(hashtext('conexus.first-person'))`

/**
 * An earlier link of the same person stops working when a new one is given (C64). The library
 * stores each link under a hash of its token, so only the person's id, the stored value, finds it.
 */
async function forgetLinks(tx: CommandTx, personId: string): Promise<void> {
  await tx.execute(sql`delete from auth.verification where value = ${personId}`)
}

export type FirstPerson = (input: { name: string; email: Email }) => Promise<{ link: string }>

export function createFirstPerson(deps: {
  auth: Auth
  database: Database
  publicOrigin: PublicOrigin
}): FirstPerson {
  return ({ name, email }) =>
    deps.database.command(async (tx) => {
      await tx.execute(FIRST_PERSON_LOCK)
      const token = await runWithAdapter(adapterOn(deps.auth, tx), async () => {
        const { internalAdapter } = await deps.auth.$context
        const people = await internalAdapter.listUsers(2)
        const [only] = people
        const same = only?.email === email.toLowerCase() ? only : undefined
        const hasPassword = same
          ? Boolean((await internalAdapter.findCredentialAccount(same.id))?.password)
          : false
        if (people.length > 1 || (only !== undefined && (same === undefined || hasPassword))) {
          throw new Failure('FIRST_PERSON_EXISTS')
        }
        if (same === undefined)
          await internalAdapter.createUser({ name, email }, { method: 'admin' })
        else await forgetLinks(tx, same.id)
        return linkTokenOf(() => deps.auth.api.requestPasswordReset({ body: { email } }))
      })
      return { link: `${deps.publicOrigin}${SET_PASSWORD_PAGE}#token=${token}` }
    })
}
