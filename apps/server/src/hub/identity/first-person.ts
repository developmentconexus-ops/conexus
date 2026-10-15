import type { Email } from '@conexus/hub-api'
import { sql } from 'drizzle-orm'
import { z } from 'zod'
import type { PublicOrigin } from '../../platform/config.ts'
import type { Database } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import type { Auth } from './auth.ts'
import { linkTokenOf } from './auth.ts'

const SET_PASSWORD_PAGE = '/set-password'

const Resident = z.object({ id: z.string(), email: z.string(), hasPassword: z.boolean() })
type Resident = z.infer<typeof Resident>

async function residents(database: Database): Promise<Resident[]> {
  const rows = await database.read((tx) =>
    tx.execute(sql`select u.id, u.email, coalesce(bool_or(a.password is not null), false) as "hasPassword"
      from auth.user u
      left join auth.account a on a.user_id = u.id and a.provider_id = 'credential'
      group by u.id, u.email`),
  )
  return rows.rows.map((row) => Resident.parse(row))
}

/** An earlier link of the same person stops working when a new one is given (C64). */
async function forgetLinks(database: Database, personId: string): Promise<void> {
  await database.command((tx) =>
    tx.execute(sql`delete from auth.verification where value = ${personId}`),
  )
}

export type FirstPerson = (input: { name: string; email: Email }) => Promise<{ link: string }>

export function createFirstPerson(deps: {
  auth: Auth
  database: Database
  publicOrigin: PublicOrigin
}): FirstPerson {
  return async ({ name, email }) => {
    const people = await residents(deps.database)
    const same = people.find((person) => person.email === email.toLowerCase())
    if (people.length > 1 || (people.length === 1 && (same === undefined || same.hasPassword))) {
      throw new Failure('FIRST_PERSON_EXISTS')
    }
    if (same === undefined) {
      const context = await deps.auth.$context
      await context.internalAdapter.createUser({ name, email }, { method: 'admin' })
    } else {
      await forgetLinks(deps.database, same.id)
    }
    const token = await linkTokenOf(() => deps.auth.api.requestPasswordReset({ body: { email } }))
    return { link: `${deps.publicOrigin}${SET_PASSWORD_PAGE}#token=${token}` }
  }
}
