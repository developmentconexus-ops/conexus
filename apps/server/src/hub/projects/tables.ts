import { sql } from 'drizzle-orm'
import {
  check,
  pgPolicy,
  pgSchema,
  text,
  timestamp,
  unique,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { SCOPE_ROLES, scoped } from '../../platform/database.ts'
import { ADMINISTRATOR, policy } from '../identity/public.ts'

export const projects = pgSchema('projects')

// Both tables belong to a company, which identity owns, so company_id is only its id, with no
// foreign key between owners (data D17). The company's routes reach their own rows; the Central
// reads and deletes the rows of the one company it deletes, and writes none.
const OWN_COMPANY = sql`company_id = ${scoped.companyId}`
const OPERATOR_COMPANY = sql`${ADMINISTRATOR} and company_id = ${scoped.companyId}`
const HOSTS = 'hub_hosts'

export const project = projects.table(
  'project',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id').notNull(),
    name: text('name').notNull(),
    attemptKey: text('attempt_key').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    // The app's host label, `<name>--<nickname>`, stored at birth and never parsed (decision 0024).
    // Null only for a Project made by step 7's image after a rollback; step 9's contract fills it.
    hostLabel: text('host_label').unique('project_host_label_key'),
  },
  (table) => [
    check(
      'project_host_label_form',
      sql`${table.hostLabel} ~ '^[a-z0-9]+(-[a-z0-9]+)*--[a-z0-9]+(-[a-z0-9]+)*$' and char_length(${table.hostLabel}) <= 63`,
    ),
    unique('project_company_id_attempt_key_key').on(table.companyId, table.attemptKey),
    uniqueIndex('project_company_name_key').on(
      table.companyId,
      sql`lower(${table.name} collate "und-x-icu")`,
    ),
    check('project_name_length', sql`char_length(${table.name}) BETWEEN 1 AND 100`),
    policy(SCOPE_ROLES.COMPANY, 'all', OWN_COMPANY),
    policy(SCOPE_ROLES.OPERATOR, 'select', OPERATOR_COMPANY),
    policy(SCOPE_ROLES.OPERATOR, 'delete', OPERATOR_COMPANY),
    // The function behind projectOfHost finds a host's Project before anyone knows its company
    // (migration app_grants); its role reads three columns and cannot log in.
    pgPolicy('hosts_select', { for: 'select', to: HOSTS, using: sql`true` }),
  ],
)

// The company's one Neon project. `creating` holds the claim of whoever calls Neon, until
// `claimed_until`; `ready` says the project exists in Neon, not that it accepts a connection.
export const companyDatabase = projects.table(
  'company_database',
  {
    companyId: text('company_id').primaryKey(),
    state: text('state', { enum: ['creating', 'ready'] }).notNull(),
    neonProjectId: text('neon_project_id').unique('company_database_neon_project_id_key'),
    claimedUntil: timestamp('claimed_until', { withTimezone: true }),
  },
  (table) => [
    check('company_database_state', sql`${table.state} IN ('creating', 'ready')`),
    check(
      'company_database_ready_has_project',
      sql`(${table.state} = 'ready') = (${table.neonProjectId} IS NOT NULL)`,
    ),
    check(
      'company_database_creating_has_claim',
      sql`(${table.state} = 'creating') = (${table.claimedUntil} IS NOT NULL)`,
    ),
    policy(SCOPE_ROLES.COMPANY, 'all', OWN_COMPANY),
    policy(SCOPE_ROLES.OPERATOR, 'select', OPERATOR_COMPANY),
    policy(SCOPE_ROLES.OPERATOR, 'delete', OPERATOR_COMPANY),
  ],
)
