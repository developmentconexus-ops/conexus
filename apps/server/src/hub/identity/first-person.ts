import type { Email } from '@conexus/hub-api'
import { sql } from 'drizzle-orm'
import type { PublicOrigin } from '../../platform/config.ts'
import { Failure } from '../../platform/failure.ts'
import { INSTALLATION_ADMINISTRATOR } from './admission.ts'
import type { Auth, LibraryCommand } from './auth.ts'
import { forgetLinks, linkTokenOf } from './auth.ts'

const SET_PASSWORD_PAGE = '/set-password'
// Two runs at once would each see an empty installation; this lock makes the second wait (C65).
const FIRST_PERSON_LOCK = sql`select pg_advisory_xact_lock(hashtext('conexus.first-person'))`

export type FirstPerson = (input: { name: string; email: Email }) => Promise<{ link: string }>

export function createFirstPerson(deps: {
  auth: Auth
  libraryCommand: LibraryCommand
  publicOrigin: PublicOrigin
}): FirstPerson {
  return ({ name, email }) =>
    deps.libraryCommand(async (tx) => {
      await tx.execute(FIRST_PERSON_LOCK)
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
      if (same === undefined) {
        await internalAdapter.createUser(
          { name, email, role: INSTALLATION_ADMINISTRATOR },
          { method: 'admin' },
        )
      } else await forgetLinks(tx, same.id)
      const token = await linkTokenOf(() => deps.auth.api.requestPasswordReset({ body: { email } }))
      return { link: `${deps.publicOrigin}${SET_PASSWORD_PAGE}#token=${token}` }
    })
}
