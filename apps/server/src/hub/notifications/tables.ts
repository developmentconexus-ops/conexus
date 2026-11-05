import { AutomationFailureCode } from '@conexus/hub-api'
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
import { request } from '../requests/public.ts'

export const notifications = pgSchema('notifications')

const FAILURE_CODES = sql.raw(AutomationFailureCode.options.map((code) => `'${code}'`).join(', '))

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
    // What each kind carries, as `NotificationRow` reads it: one bad row would fail the whole bell.
    check(
      'notification_done',
      sql`${table.kind} <> 'AUTOMATION_DONE' or (${table.conversationId} is not null and ${table.failureCode} is null)`,
    ),
    check(
      'notification_failed',
      sql`${table.kind} <> 'AUTOMATION_FAILED' or (${table.failureCode} is not null and ${table.failureCode} in (${FAILURE_CODES}))`,
    ),
    check(
      'notification_paused',
      sql`${table.kind} <> 'AUTOMATION_PAUSED' or (${table.conversationId} is null and ${table.failureCode} is null)`,
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

/**
 * What a request to publish tells (step 24.3.4, U2): its deciders that it opened, and its asker that
 * it was decided. A row beside the bell's, so the automations' rows stay as they are (data D6). The
 * person who asks writes the deciders' rows, so inserting needs only the company; reading and
 * marking read stay the person's own. It leaves with its request, or its person, by cascade.
 */
export const requestNotice = notifications.table(
  'request_notice',
  {
    id: uuid('id').primaryKey(),
    companyId: text('company_id').notNull(),
    personId: text('person_id').notNull(),
    requestId: uuid('request_id').notNull(),
    kind: text('kind').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    readAt: timestamp('read_at', { withTimezone: true }),
  },
  (table) => [
    foreignKey({
      name: 'request_notice_member_fkey',
      columns: [table.companyId, table.personId],
      foreignColumns: [member.organizationId, member.userId],
    }).onDelete('cascade'),
    foreignKey({
      name: 'request_notice_request_id_fkey',
      columns: [table.requestId],
      foreignColumns: [request.id],
    }).onDelete('cascade'),
    check('request_notice_kind', sql`${table.kind} in ('REQUEST_OPENED', 'REQUEST_DECIDED')`),
    unique('request_notice_key').on(table.requestId, table.personId, table.kind),
    index('request_notice_person_created').on(
      table.companyId,
      table.personId,
      table.createdAt.desc(),
      table.id.desc(),
    ),
    policy(SCOPE_ROLES.COMPANY, 'select', OWN),
    policy(SCOPE_ROLES.COMPANY, 'update', OWN),
    policy(SCOPE_ROLES.COMPANY, 'insert', sql`company_id = ${scoped.companyId}`),
  ],
)
