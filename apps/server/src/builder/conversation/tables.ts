import { sql } from 'drizzle-orm'
import {
  foreignKey,
  pgSchema,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'
import { company, member, policy } from '../../hub/identity/public.ts'
import { project } from '../../hub/projects/public.ts'
import { SCOPE_ROLES, scoped } from '../../platform/database.ts'

// The Builder's schema in the Hub's database (decision 0011); the conversation's words live in
// Mastra's database (decision 0010), and this index says whose each thread is.
const builder = pgSchema('builder')

// A conversation is its starter's alone (founder, study D1 A). A company scope with no person is the
// Hub's own work on the company: releasing the conversations of a Projeto, a person or the company.
const OWN = sql`company_id = ${scoped.companyId}
  and (person_id = ${scoped.personId} or ${scoped.personId} is null)`

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

/** A message sent to a conversation, by its Idempotency-Key, so a repeat starts no second turn. */
export const conversationTurn = builder.table(
  'conversation_turn',
  {
    conversationId: uuid('conversation_id').notNull(),
    companyId: text('company_id').notNull(),
    personId: text('person_id').notNull(),
    idempotencyKey: text('idempotency_key').notNull(),
    bodyHash: text('body_hash').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.conversationId, table.idempotencyKey] }),
    foreignKey({
      name: 'conversation_turn_conversation_id_fkey',
      columns: [table.conversationId],
      foreignColumns: [conversation.id],
    }).onDelete('cascade'),
    policy(SCOPE_ROLES.COMPANY, 'all', OWN),
  ],
)
