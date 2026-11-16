import { sql } from 'drizzle-orm'
import { integer, text } from 'drizzle-orm/pg-core'
import { SCOPE_ROLES, scoped } from '../../../platform/database.ts'
import { policy } from '../../identity/public.ts'
import { organizationRole } from '../../identity/public-tables.ts'
import { copies } from '../tables.ts'

/**
 * How many times a role's marks were set: every setRoleCopies counts one, and a failed one puts its
 * marks back only while the count is still its own, so a later set that answered 200 stays.
 */
export const copyReaderTurn = copies.table(
  'copy_reader_turn',
  {
    roleId: text('role_id')
      .primaryKey()
      .references(() => organizationRole.id, { onDelete: 'cascade' }),
    companyId: text('company_id').notNull(),
    turn: integer('turn').notNull(),
  },
  () => [policy(SCOPE_ROLES.COMPANY, 'all', sql`company_id = ${scoped.companyId}`)],
)
