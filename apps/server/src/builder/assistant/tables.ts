import { sql } from 'drizzle-orm'
import { foreignKey, pgSchema, text, uuid } from 'drizzle-orm/pg-core'
import { company, member, policy } from '../../hub/identity/public.ts'
import { project } from '../../hub/projects/public.ts'
import { SCOPE_ROLES, scoped } from '../../platform/database.ts'

// The Builder's schema in the Hub's database (decision 0011); the Assistant's conversation lives in
// Mastra's database (decision 0010), and this row holds what only the Hub writes of it.
const builder = pgSchema('builder')

// A conversation is its starter's alone (step 24.1, criterion 8). A company scope with no person is
// the Hub's own work on the company.
const OWN = sql`company_id = ${scoped.companyId}
  and (person_id = ${scoped.personId} or ${scoped.personId} is null)`

/**
 * The connections an Assistant conversation chose, one row per Mastra thread, whose id is this
 * row's (step 24.1, U2). Only the Hub's routes write it, the creation and `PUT …/connections`, so
 * Mastra's own writes of the thread's metadata, the title's and the observation's, never undo a
 * choice. The row is written before the thread and leaves with its Projeto, its person or its
 * company, after their release deleted the thread (data D17).
 */
export const assistantConversation = builder.table(
  'assistant_conversation',
  {
    id: uuid('id').primaryKey(),
    companyId: text('company_id').notNull(),
    personId: text('person_id').notNull(),
    // The thread's place, as its mark says; none on the Início.
    projectId: text('project_id'),
    connections: uuid('connections').array().notNull(),
  },
  (table) => [
    foreignKey({
      name: 'assistant_conversation_company_id_fkey',
      columns: [table.companyId],
      foreignColumns: [company.id],
    }).onDelete('cascade'),
    foreignKey({
      name: 'assistant_conversation_project_id_fkey',
      columns: [table.projectId],
      foreignColumns: [project.id],
    }).onDelete('cascade'),
    foreignKey({
      name: 'assistant_conversation_member_fkey',
      columns: [table.companyId, table.personId],
      foreignColumns: [member.organizationId, member.userId],
    }).onDelete('cascade'),
    policy(SCOPE_ROLES.COMPANY, 'all', OWN),
  ],
)
