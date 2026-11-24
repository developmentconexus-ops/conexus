import { sql } from 'drizzle-orm'
import { check, pgSchema, text, timestamp } from 'drizzle-orm/pg-core'
import { SCOPE_ROLES, scoped } from '../../platform/database.ts'
import { ADMINISTRATOR, policy } from '../identity/public.ts'

export const lake = pgSchema('lake')

// The company's one data lake. The stack in AWS is the truth; `state` is the last state the Hub
// saw, and the row says whose lake it is and where to ask for it. company_id is only the company's
// id, which identity owns, with no foreign key between owners (data D17).
export const companyLake = lake.table(
  'company_lake',
  {
    companyId: text('company_id').primaryKey(),
    lakeId: text('lake_id').notNull().unique('company_lake_lake_id_key'),
    state: text('state', {
      enum: ['creating', 'ready', 'failed', 'deleting', 'delete_failed'],
    }).notNull(),
    account: text('account').notNull(),
    region: text('region').notNull(),
    template: text('template').notNull(),
    stackId: text('stack_id').unique('company_lake_stack_id_key'),
    since: timestamp('since', { withTimezone: true }).notNull(),
    failure: text('failure'),
  },
  (table) => [
    check('company_lake_lake_id_form', sql`${table.lakeId} ~ '^[a-z0-9]{12}$'`),
    check(
      'company_lake_state',
      sql`${table.state} IN ('creating', 'ready', 'failed', 'deleting', 'delete_failed')`,
    ),
    check('company_lake_account_form', sql`${table.account} ~ '^[0-9]{12}$'`),
    check('company_lake_region_form', sql`${table.region} ~ '^[a-z]{2}-[a-z]+-[0-9]$'`),
    check('company_lake_template_form', sql`${table.template} ~ '^[0-9a-f]{64}$'`),
    check(
      'company_lake_settled_has_stack',
      sql`${table.state} NOT IN ('ready', 'deleting', 'delete_failed') OR ${table.stackId} IS NOT NULL`,
    ),
    check(
      'company_lake_failure_only_when_failed',
      sql`(${table.state} = 'failed') = (${table.failure} IS NOT NULL)`,
    ),
    check(
      'company_lake_failure_code',
      sql`${table.failure} IS NULL OR ${table.failure} = 'LAKE_CREATE_FAILED'`,
    ),
    policy(SCOPE_ROLES.COMPANY, 'select', sql`company_id = ${scoped.companyId}`),
    // The Central reaches every row to read and write, and one company's to delete.
    ...(['select', 'insert', 'update'] as const).map((verb) =>
      policy(SCOPE_ROLES.OPERATOR, verb, ADMINISTRATOR),
    ),
    policy(
      SCOPE_ROLES.OPERATOR,
      'delete',
      sql`${ADMINISTRATOR} and company_id = ${scoped.companyId}`,
    ),
  ],
)
