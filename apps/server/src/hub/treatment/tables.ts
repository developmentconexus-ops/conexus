import { LAKE_TABLE_NAME_PATTERN, TREATMENT_RUN_FAILURES } from '@conexus/hub-api'
import { sql } from 'drizzle-orm'
import {
  check,
  foreignKey,
  integer,
  jsonb,
  pgSchema,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { SCOPE_ROLES, scoped } from '../../platform/database.ts'
import { ADMINISTRATOR, policy } from '../identity/public.ts'

export const treatment = pgSchema('treatment')

const CAUSES = ['COPY', 'NOW'] as const
const STATES = ['STARTING', 'RUNNING', 'DONE', 'FAILED', 'STOPPED'] as const
const MODEL_STATUSES = ['BUILT', 'FAILED', 'SKIPPED'] as const

function listed(values: readonly string[]) {
  return sql.raw(values.map((value) => `'${value}'`).join(', '))
}

// company_id has no foreign key to the company identity owns (data D17). Versions and model runs
// need no policy of the Central: its deletions reach them by cascade.
const OWN_COMPANY = sql`company_id = ${scoped.companyId}`
const OPERATOR_COMPANY = sql`${ADMINISTRATOR} and company_id = ${scoped.companyId}`

export const treatmentModel = treatment.table(
  'model',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id').notNull(),
    name: text('name').notNull(),
    description: text('description').notNull(),
    createdBy: text('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    unique('treatment_model_company_id_id_key').on(table.companyId, table.id),
    unique('treatment_model_name_key').on(table.companyId, table.name),
    check(
      'treatment_model_name',
      sql`${table.name} ~ ${sql.raw(`'${LAKE_TABLE_NAME_PATTERN.source}'`)}`,
    ),
    check('treatment_model_description', sql`char_length(${table.description}) <= 500`),
    policy(SCOPE_ROLES.COMPANY, 'all', OWN_COMPANY),
    policy(SCOPE_ROLES.OPERATOR, 'select', OPERATOR_COMPANY),
    policy(SCOPE_ROLES.OPERATOR, 'delete', OPERATOR_COMPANY),
  ],
)

export const treatmentVersion = treatment.table(
  'version',
  {
    id: text('id').primaryKey(),
    modelId: text('model_id').notNull(),
    companyId: text('company_id').notNull(),
    number: integer('number').notNull(),
    sql: text('sql').notNull(),
    inputs: jsonb('inputs').notNull(),
    hash: text('hash').notNull(),
    proposedBy: text('proposed_by').notNull(),
    proposedAt: timestamp('proposed_at', { withTimezone: true }).notNull(),
    approvedBy: text('approved_by'),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
  },
  (table) => [
    foreignKey({
      name: 'treatment_version_model_fkey',
      columns: [table.companyId, table.modelId],
      foreignColumns: [treatmentModel.companyId, treatmentModel.id],
    }).onDelete('cascade'),
    unique('treatment_version_company_id_id_key').on(table.companyId, table.id),
    unique('treatment_version_number_key').on(table.modelId, table.number),
    check('treatment_version_number', sql`${table.number} >= 1`),
    check('treatment_version_sql', sql`char_length(${table.sql}) <= 20000`),
    check('treatment_version_inputs', sql`jsonb_typeof(${table.inputs}) = 'array'`),
    check('treatment_version_hash', sql`${table.hash} ~ '^[0-9a-f]{64}$'`),
    check(
      'treatment_version_approved',
      sql`(${table.approvedBy} IS NULL) = (${table.approvedAt} IS NULL)`,
    ),
    policy(SCOPE_ROLES.COMPANY, 'all', OWN_COMPANY),
  ],
)

export const treatmentRun = treatment.table(
  'run',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id').notNull(),
    lakeId: text('lake_id').notNull(),
    cause: text('cause', { enum: CAUSES }).notNull(),
    state: text('state', { enum: STATES }).notNull(),
    select: jsonb('select').notNull(),
    pending: jsonb('pending').notNull().default([]),
    failure: text('failure', { enum: TREATMENT_RUN_FAILURES }),
    stoppedBy: text('stopped_by'),
    attempt: integer('attempt').notNull(),
    task: text('task'),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
    endedAt: timestamp('ended_at', { withTimezone: true }),
  },
  (table) => [
    unique('treatment_run_company_id_id_key').on(table.companyId, table.id),
    uniqueIndex('treatment_run_open_key').on(table.companyId).where(sql`${table.endedAt} IS NULL`),
    check('treatment_run_cause', sql`${table.cause} IN (${listed(CAUSES)})`),
    check('treatment_run_state', sql`${table.state} IN (${listed(STATES)})`),
    check(
      'treatment_run_ended',
      sql`(${table.endedAt} IS NULL) = (${table.state} IN ('STARTING', 'RUNNING'))`,
    ),
    check(
      'treatment_run_failure_only_when_failed',
      sql`(${table.state} = 'FAILED') = (${table.failure} IS NOT NULL)`,
    ),
    check(
      'treatment_run_failure',
      sql`${table.failure} IS NULL OR ${table.failure} IN (${listed(TREATMENT_RUN_FAILURES)})`,
    ),
    check('treatment_run_attempt', sql`${table.attempt} >= 1`),
    check('treatment_run_select', sql`jsonb_typeof(${table.select}) = 'array'`),
    check('treatment_run_pending', sql`jsonb_typeof(${table.pending}) = 'array'`),
    policy(SCOPE_ROLES.COMPANY, 'all', OWN_COMPANY),
    policy(SCOPE_ROLES.OPERATOR, 'select', OPERATOR_COMPANY),
    policy(SCOPE_ROLES.OPERATOR, 'delete', OPERATOR_COMPANY),
  ],
)

export const treatmentModelRun = treatment.table(
  'model_run',
  {
    runId: text('run_id').notNull(),
    companyId: text('company_id').notNull(),
    name: text('name').notNull(),
    versionId: text('version_id'),
    status: text('status', { enum: MODEL_STATUSES }).notNull(),
    rows: integer('rows'),
    failure: text('failure'),
    line: integer('line'),
  },
  (table) => [
    foreignKey({
      name: 'treatment_model_run_run_fkey',
      columns: [table.companyId, table.runId],
      foreignColumns: [treatmentRun.companyId, treatmentRun.id],
    }).onDelete('cascade'),
    // The migration sets only version_id to null; Drizzle cannot say which columns (data D5).
    foreignKey({
      name: 'treatment_model_run_version_fkey',
      columns: [table.companyId, table.versionId],
      foreignColumns: [treatmentVersion.companyId, treatmentVersion.id],
    }).onDelete('set null'),
    primaryKey({ columns: [table.runId, table.name] }),
    check('treatment_model_run_status', sql`${table.status} IN (${listed(MODEL_STATUSES)})`),
    check(
      'treatment_model_run_rows',
      sql`(${table.status} = 'BUILT') = (${table.rows} IS NOT NULL) AND ${table.rows} >= 0`,
    ),
    check(
      'treatment_model_run_failure',
      sql`(${table.status} = 'FAILED') = (${table.failure} IS NOT NULL)`,
    ),
    check(
      'treatment_model_run_line',
      sql`${table.line} IS NULL OR (${table.status} = 'FAILED' AND ${table.line} >= 1)`,
    ),
    policy(SCOPE_ROLES.COMPANY, 'all', OWN_COMPANY),
  ],
)
