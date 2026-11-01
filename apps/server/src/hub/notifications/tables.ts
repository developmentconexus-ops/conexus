import { sql } from 'drizzle-orm'
import {
  check,
  foreignKey,
  index,
  pgSchema,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'
import { SCOPE_ROLES, scoped } from '../../platform/database.ts'
import { company, member, policy } from '../identity/public.ts'

export const notifications = pgSchema('notifications')

// A notification is its person's alone: the company's routes reach only their own rows.
const OWN = sql`company_id = ${scoped.companyId} and person_id = ${scoped.personId}`

/**
 * What the Hub tells a person: an automation's run ended (step 24.2, U2). One per run, by
 * `(company_id, run_id)`, so a repeated step tells nothing twice. The row leaves with its person or
 * its company by the foreign keys' cascade (data D17), so no release deletes it. `project_id` and
 * `automation_id` are only the place and the automation named, for the address (no foreign key:
 * the automation is Mastra's row, and a deleted Projeto or automation leaves its notification).
 */
export const notification = notifications.table(
  'notification',
  {
    id: uuid('id').primaryKey(),
    companyId: text('company_id').notNull(),
    personId: text('person_id').notNull(),
    kind: text('kind').notNull(),
    automationId: text('automation_id').notNull(),
    automationName: text('automation_name').notNull(),
    projectId: text('project_id'),
    conversationId: uuid('conversation_id'),
    failureCode: text('failure_code'),
    runId: text('run_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    readAt: timestamp('read_at', { withTimezone: true }),
  },
  (table) => [
    foreignKey({
      name: 'notification_company_id_fkey',
      columns: [table.companyId],
      foreignColumns: [company.id],
    }).onDelete('cascade'),
    foreignKey({
      name: 'notification_member_fkey',
      columns: [table.companyId, table.personId],
      foreignColumns: [member.organizationId, member.userId],
    }).onDelete('cascade'),
    check(
      'notification_kind',
      sql`${table.kind} in ('AUTOMATION_DONE', 'AUTOMATION_FAILED', 'AUTOMATION_PAUSED')`,
    ),
    unique('notification_run_key').on(table.companyId, table.runId),
    index('notification_person_created').on(
      table.companyId,
      table.personId,
      table.createdAt.desc(),
      table.id.desc(),
    ),
    policy(SCOPE_ROLES.COMPANY, 'all', OWN),
  ],
)
