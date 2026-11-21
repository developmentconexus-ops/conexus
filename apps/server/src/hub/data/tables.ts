import { sql } from 'drizzle-orm'
import {
  check,
  foreignKey,
  index,
  integer,
  pgSchema,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { SCOPE_ROLES, scoped } from '../../platform/database.ts'
import { policy } from '../identity/public.ts'
import { company } from '../identity/public-tables.ts'

// The data trail's own schema in the Hub's database: the record of each read of a company's data.
export const data = pgSchema('data')

export const DATA_READ_AGENTS = ['ASSISTANT', 'BUILDER', 'CONSTRUTOR', 'AGENT', 'APP'] as const
export const DATA_READ_VERBS = ['SAMPLE', 'QUERY', 'LIVE'] as const
export const DATA_READ_QUERY_MAX = 4000

function listed(values: readonly string[]) {
  return sql.raw(values.map((value) => `'${value}'`).join(', '))
}

function instant(name: string) {
  return timestamp(name, { withTimezone: true })
}

/**
 * One read of a company's data by an agent or an app: who, what, the query and the outcome. Never
 * the rows.
 */
export const dataRead = data.table(
  'data_read',
  {
    id: uuid('id').primaryKey(),
    companyId: text('company_id').notNull(),
    at: instant('at').notNull(),
    // No foreign key to the person, as connector_write.
    personId: text('person_id').notNull(),
    agent: text('agent', { enum: DATA_READ_AGENTS }).notNull(),
    projectId: text('project_id'),
    agentId: text('agent_id'),
    threadId: text('thread_id'),
    verb: text('verb', { enum: DATA_READ_VERBS }).notNull(),
    tables: text('tables').array().notNull(),
    connectionId: uuid('connection_id'),
    operation: text('operation'),
    query: text('query'),
    outcome: text('outcome').notNull(),
    rows: integer('rows'),
    ms: integer('ms').notNull(),
  },
  (table) => [
    foreignKey({
      name: 'data_read_company_id_fkey',
      columns: [table.companyId],
      foreignColumns: [company.id],
    }).onDelete('cascade'),
    // The Registro's page, newest first, and its cut by person (R.11).
    index('data_read_company_newest_idx').on(
      table.companyId,
      table.at.desc().nullsFirst(),
      table.id.desc().nullsFirst(),
    ),
    index('data_read_person_newest_idx').on(
      table.companyId,
      table.personId,
      table.at.desc().nullsFirst(),
      table.id.desc().nullsFirst(),
    ),
    check('data_read_agent', sql`${table.agent} in (${listed(DATA_READ_AGENTS)})`),
    check('data_read_verb', sql`${table.verb} in (${listed(DATA_READ_VERBS)})`),
    check(
      'data_read_live',
      sql`(${table.verb} = 'LIVE') = (${table.connectionId} is not null and ${table.operation} is not null)`,
    ),
    check(
      'data_read_query',
      sql`(${table.query} is null or ${table.verb} = 'QUERY') and char_length(${table.query}) <= ${sql.raw(String(DATA_READ_QUERY_MAX))}`,
    ),
    check(
      'data_read_counts',
      sql`(${table.rows} is null or ${table.rows} >= 0) and ${table.ms} >= 0`,
    ),
    policy(SCOPE_ROLES.COMPANY, 'all', sql`company_id = ${scoped.companyId}`),
  ],
)
