import { RequestState } from '@conexus/hub-api'
import { sql } from 'drizzle-orm'
import {
  check,
  foreignKey,
  integer,
  pgSchema,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { SCOPE_ROLES, scoped } from '../../platform/database.ts'
import { company, member, policy } from '../identity/public.ts'
import { project } from '../projects/public.ts'

export const requests = pgSchema('requests')

const STATES = sql.raw(RequestState.options.map((state) => `'${state}'`).join(', '))

/**
 * `decided_by` has no foreign key, so a decision outlives the person who took it (data D17). That the
 * decider is not the asker is the code's rule, not the table's.
 */
export const request = requests.table(
  'request',
  {
    id: uuid('id').primaryKey(),
    attemptKey: text('attempt_key').notNull(),
    companyId: text('company_id').notNull(),
    requestedBy: text('requested_by').notNull(),
    projectId: text('project_id').notNull(),
    kind: text('kind').notNull(),
    number: integer('number').notNull(),
    message: text('message').notNull().default(''),
    state: text('state').notNull(),
    decidedBy: text('decided_by'),
    reason: text('reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    foreignKey({
      name: 'request_company_id_fkey',
      columns: [table.companyId],
      foreignColumns: [company.id],
    }).onDelete('cascade'),
    foreignKey({
      name: 'request_member_fkey',
      columns: [table.companyId, table.requestedBy],
      foreignColumns: [member.organizationId, member.userId],
    }).onDelete('cascade'),
    foreignKey({
      name: 'request_project_id_fkey',
      columns: [table.projectId],
      foreignColumns: [project.id],
    }).onDelete('cascade'),
    unique('request_attempt_key').on(table.companyId, table.attemptKey),
    check('request_kind', sql`${table.kind} in ('PUBLISH_APP_VERSION')`),
    check('request_number', sql`${table.number} > 0`),
    check('request_message', sql`char_length(${table.message}) <= 280`),
    check('request_state', sql`${table.state} in (${STATES})`),
    check(
      'request_decided',
      sql`(${table.state} in ('PENDING', 'CANCELLED')) = (${table.decidedBy} is null)`,
    ),
    check('request_reason', sql`${table.reason} is null or ${table.state} = 'DECLINED'`),
    uniqueIndex('request_open_key')
      .on(table.companyId, table.projectId)
      .where(sql`${table.state} = 'PENDING'`),
    policy(SCOPE_ROLES.COMPANY, 'all', sql`company_id = ${scoped.companyId}`),
  ],
)
