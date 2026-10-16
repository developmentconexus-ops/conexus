import type { Email } from '@conexus/hub-api'
import { Person } from '@conexus/hub-api'
import type { PublicOrigin } from '../../platform/config.ts'
import { transactionLock } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { INSTALLATION_ADMINISTRATOR } from './admission.ts'
import type { Auth, LibraryCommand } from './auth.ts'
import { forgetLinks, hasPassword, linkTokenOf } from './auth.ts'

const SET_PASSWORD_PAGE = '/set-password'

export type FirstPerson = (input: { name: string; email: Email }) => Promise<{ link: string }>

export function createFirstPerson(deps: {
  auth: Auth
  libraryCommand: LibraryCommand
  publicOrigin: PublicOrigin
}): FirstPerson {
  return ({ name, email }) =>
    deps.libraryCommand(async (tx) => {
      // Two runs at once would each see an empty installation; the second waits here.
      await transactionLock(tx, 'conexus.first-person')
      const { internalAdapter } = await deps.auth.$context
      const people = Person.array().parse(await internalAdapter.listUsers(2))
      const [only] = people
      const same = only?.email === email.toLowerCase() ? only : undefined
      const withPassword = same ? await hasPassword(deps.auth, same.id) : false
      if (people.length > 1 || (only !== undefined && (same === undefined || withPassword))) {
        throw new Failure('FIRST_PERSON_EXISTS')
      }
      if (same === undefined) {
        await deps.auth.api.createUser({ body: { name, email, role: INSTALLATION_ADMINISTRATOR } })
      } else await forgetLinks(tx, same.id)
      const token = await linkTokenOf(() => deps.auth.api.requestPasswordReset({ body: { email } }))
      return { link: `${deps.publicOrigin}${SET_PASSWORD_PAGE}#token=${token}` }
    })
}
