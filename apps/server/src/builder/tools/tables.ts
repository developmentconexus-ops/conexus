import { sql } from 'drizzle-orm'
import {
  check,
  foreignKey,
  integer,
  jsonb,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'
import { company, policy } from '../../hub/identity/public.ts'
import { SCOPE_ROLES } from '../../platform/database.ts'
import { builder, OWN_COMPANY } from '../schema/public.ts'

function instant(name: string) {
  return timestamp(name, { withTimezone: true })
}

/**
 * A tool of the company's library (step 24.3, `T1`): one read of one connection, the same in every
 * version. It belongs to the company, never to a Projeto; a Projeto may use it when it received the
 * connection. The connection is only its id (data D17): a connection the Projeto lost refuses the
 * tool where it is used, as an agent's draft refuses it.
 */
export const tool = builder.table(
  'tool',
  {
    id: uuid('id').primaryKey(),
    companyId: text('company_id').notNull(),
    // `CODE` joins with step 24.4's tools in code, without migrating the rows.
    kind: text('kind').notNull().default('PRESET'),
    connectionId: uuid('connection_id').notNull(),
    operation: text('operation').notNull(),
    slug: text('slug').notNull(),
    currentVersion: integer('current_version').notNull().default(1),
    createdBy: text('created_by'),
    bodyHash: text('body_hash').notNull(),
    createdAt: instant('created_at').notNull().defaultNow(),
    updatedAt: instant('updated_at').notNull().defaultNow(),
  },
  (table) => [
    foreignKey({
      name: 'tool_company_id_fkey',
      columns: [table.companyId],
      foreignColumns: [company.id],
    }).onDelete('cascade'),
    unique('tool_company_id_slug_key').on(table.companyId, table.slug),
    unique('tool_company_id_id_key').on(table.companyId, table.id),
    check('tool_kind', sql`${table.kind} in ('PRESET')`),
    policy(SCOPE_ROLES.COMPANY, 'all', OWN_COMPANY),
  ],
)

/**
 * One version of a tool, never changed after it is written: an agent's published version holds the
 * version of each tool it uses, so a new one changes no published agent.
 */
export const toolVersion = builder.table(
  'tool_version',
  {
    id: uuid('id').primaryKey(),
    toolId: uuid('tool_id').notNull(),
    companyId: text('company_id').notNull(),
    number: integer('number').notNull(),
    config: jsonb('config').notNull(),
    createdBy: text('created_by'),
    bodyHash: text('body_hash').notNull(),
    createdAt: instant('created_at').notNull().defaultNow(),
  },
  (table) => [
    // A version is of its tool's company.
    foreignKey({
      name: 'tool_version_tool_fkey',
      columns: [table.companyId, table.toolId],
      foreignColumns: [tool.companyId, tool.id],
    }).onDelete('cascade'),
    unique('tool_version_tool_id_number_key').on(table.toolId, table.number),
    // The keys an agent's choice points at: the version of that tool, of that company.
    unique('tool_version_tool_id_id_key').on(table.toolId, table.id),
    unique('tool_version_company_id_id_key').on(table.companyId, table.id),
    policy(SCOPE_ROLES.COMPANY, 'all', OWN_COMPANY),
  ],
)
