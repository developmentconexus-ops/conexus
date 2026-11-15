import { sql } from 'drizzle-orm'
import { check, foreignKey, integer, jsonb, text, unique, uuid } from 'drizzle-orm/pg-core'
import { policy } from '../../hub/identity/public.ts'
import { company } from '../../hub/identity/public-tables.ts'
import { SCOPE_ROLES } from '../../platform/database.ts'
import { authored, builder, instant, OWN_COMPANY } from '../schema/public.ts'

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
    // `CODE` is a tool in code (step 24.4): it reads several operations, which its version keeps.
    kind: text('kind').notNull().default('PRESET'),
    connectionId: uuid('connection_id').notNull(),
    operation: text('operation'),
    slug: text('slug').notNull(),
    currentVersion: integer('current_version').notNull().default(1),
    ...authored(),
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
    check('tool_kind', sql`${table.kind} in ('PRESET', 'CODE')`),
    check(
      'tool_operation_by_kind',
      sql`(${table.kind} = 'PRESET') = (${table.operation} is not null)`,
    ),
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
    ...authored(),
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
