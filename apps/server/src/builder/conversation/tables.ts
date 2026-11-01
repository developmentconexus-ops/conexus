import { foreignKey, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core'
import { company, member, policy } from '../../hub/identity/public.ts'
import { project } from '../../hub/projects/public.ts'
import { SCOPE_ROLES } from '../../platform/database.ts'
import { builder, OWN } from '../schema/public.ts'

/**
 * One Mastra thread, whose id is this row's: the company, the Projeto and the person it belongs to.
 * The row is written before the thread and leaves with its Projeto, its person or its company, after
 * their release deleted the thread (data D17). `attempt_key` and `body_hash` keep a creation's
 * Idempotency-Key (code C37).
 */
export const conversation = builder.table(
  'conversation',
  {
    id: uuid('id').primaryKey(),
    companyId: text('company_id').notNull(),
    projectId: text('project_id').notNull(),
    personId: text('person_id').notNull(),
    attemptKey: text('attempt_key').notNull(),
    bodyHash: text('body_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    foreignKey({
      name: 'conversation_company_id_fkey',
      columns: [table.companyId],
      foreignColumns: [company.id],
    }).onDelete('cascade'),
    foreignKey({
      name: 'conversation_project_id_fkey',
      columns: [table.projectId],
      foreignColumns: [project.id],
    }).onDelete('cascade'),
    foreignKey({
      name: 'conversation_member_fkey',
      columns: [table.companyId, table.personId],
      foreignColumns: [member.organizationId, member.userId],
    }).onDelete('cascade'),
    unique('conversation_attempt_key').on(table.companyId, table.personId, table.attemptKey),
    policy(SCOPE_ROLES.COMPANY, 'all', OWN),
  ],
)
