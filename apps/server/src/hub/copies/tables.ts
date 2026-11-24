import {
  LAKE_INTERVALS,
  LAKE_RUN_FAILURE_CODES,
  LAKE_TABLE_NAME_PATTERN,
  SOURCE_TABLE_ID_PATTERN,
  SYSTEM_CODE_MAX,
  SYSTEM_MESSAGE_MAX,
} from '@conexus/hub-api'
import { sql } from 'drizzle-orm'
import {
  bigint,
  boolean,
  check,
  date,
  foreignKey,
  integer,
  jsonb,
  pgSchema,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { SCOPE_ROLES, scoped } from '../../platform/database.ts'
import { connection } from '../connectors/public-tables.ts'
import { policy } from '../identity/public.ts'
import { company } from '../identity/public-tables.ts'

export const copies = pgSchema('copies')

const INTERVALS = sql.raw(LAKE_INTERVALS.map((interval) => `'${interval}'`).join(', '))
const OUTCOMES = ['COMPLETE', 'ERROR', 'INTERRUPTED'] as const
const OUTCOME_LIST = sql.raw(OUTCOMES.map((outcome) => `'${outcome}'`).join(', '))
const FAILURE_CODES = sql.raw(LAKE_RUN_FAILURE_CODES.map((code) => `'${code}'`).join(', '))

function instant(name: string) {
  return timestamp(name, { withTimezone: true })
}

export const lakeCopy = copies.table(
  'lake_copy',
  {
    companyId: text('company_id').notNull(),
    connectorId: text('connector_id').notNull(),
    connectionId: uuid('connection_id').notNull(),
    interval: text('interval', { enum: LAKE_INTERVALS }).notNull(),
    startDate: date('start_date', { mode: 'string' }),
    createdAt: instant('created_at').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.companyId, table.connectionId] }),
    foreignKey({
      name: 'lake_copy_company_id_fkey',
      columns: [table.companyId],
      foreignColumns: [company.id],
    }).onDelete('cascade'),
    foreignKey({
      name: 'lake_copy_connection_fkey',
      columns: [table.companyId, table.connectorId, table.connectionId],
      foreignColumns: [connection.companyId, connection.connectorId, connection.id],
    }).onDelete('cascade'),
    check('lake_copy_interval', sql`${table.interval} IN (${INTERVALS})`),
    policy(SCOPE_ROLES.COMPANY, 'all', sql`company_id = ${scoped.companyId}`),
  ],
)

export const lakeRun = copies.table(
  'lake_run',
  {
    id: uuid('id').primaryKey(),
    companyId: text('company_id').notNull(),
    connectionId: uuid('connection_id').notNull(),
    startedAt: instant('started_at').notNull(),
    endedAt: instant('ended_at'),
    outcome: text('outcome', { enum: OUTCOMES }),
    whole: boolean('whole').notNull(),
    code: text('code', { enum: LAKE_RUN_FAILURE_CODES }),
    failedTable: text('failed_table'),
    systemCode: text('system_code'),
    systemMessage: text('system_message'),
    taskArn: text('task_arn'),
    attempt: integer('attempt').notNull(),
  },
  (table) => [
    foreignKey({
      name: 'lake_run_copy_fkey',
      columns: [table.companyId, table.connectionId],
      foreignColumns: [lakeCopy.companyId, lakeCopy.connectionId],
    }).onDelete('cascade'),
    unique('lake_run_company_id_id_key').on(table.companyId, table.id),
    check('lake_run_ended', sql`(${table.endedAt} IS NULL) = (${table.outcome} IS NULL)`),
    check(
      'lake_run_outcome',
      sql`${table.outcome} IS NULL OR ${table.outcome} IN (${OUTCOME_LIST})`,
    ),
    check(
      'lake_run_code',
      sql`${table.code} IS NULL OR (${table.outcome} = 'ERROR' AND ${table.code} IN (${FAILURE_CODES}))`,
    ),
    check(
      'lake_run_system_code',
      sql`char_length(${table.systemCode}) <= ${sql.raw(String(SYSTEM_CODE_MAX))}`,
    ),
    check(
      'lake_run_system_message',
      sql`char_length(${table.systemMessage}) <= ${sql.raw(String(SYSTEM_MESSAGE_MAX))}`,
    ),
    check(
      'lake_run_task_arn',
      sql`${table.taskArn} IS NULL OR ${table.taskArn} LIKE 'arn:aws:ecs:%'`,
    ),
    check('lake_run_attempt', sql`${table.attempt} >= 1`),
    uniqueIndex('lake_run_open_key').on(table.connectionId).where(sql`${table.endedAt} IS NULL`),
    policy(SCOPE_ROLES.COMPANY, 'all', sql`company_id = ${scoped.companyId}`),
  ],
)

export const lakeTable = copies.table(
  'lake_table',
  {
    id: uuid('id').primaryKey(),
    companyId: text('company_id').notNull(),
    connectionId: uuid('connection_id').notNull(),
    sourceTable: text('source_table').notNull(),
    name: text('name').notNull(),
    label: text('label').notNull(),
    columns: jsonb('columns').notNull(),
    rows: bigint('rows', { mode: 'number' }),
    lastRunId: uuid('last_run_id'),
  },
  (table) => [
    foreignKey({
      name: 'lake_table_copy_fkey',
      columns: [table.companyId, table.connectionId],
      foreignColumns: [lakeCopy.companyId, lakeCopy.connectionId],
    }).onDelete('cascade'),
    foreignKey({
      name: 'lake_table_last_run_id_fkey',
      columns: [table.lastRunId],
      foreignColumns: [lakeRun.id],
    }).onDelete('set null'),
    unique('lake_table_company_id_id_key').on(table.companyId, table.id),
    unique('lake_table_source_key').on(table.companyId, table.connectionId, table.sourceTable),
    uniqueIndex('lake_table_name_key').on(table.companyId, sql`lower(${table.name})`),
    check(
      'lake_table_source_table',
      sql`${table.sourceTable} ~ ${sql.raw(`'${SOURCE_TABLE_ID_PATTERN.source}'`)}`,
    ),
    check(
      'lake_table_name',
      sql`${table.name} ~ ${sql.raw(`'${LAKE_TABLE_NAME_PATTERN.source}'`)}`,
    ),
    check('lake_table_columns', sql`jsonb_typeof(${table.columns}) = 'array'`),
    policy(SCOPE_ROLES.COMPANY, 'all', sql`company_id = ${scoped.companyId}`),
  ],
)

export const lakeTableRun = copies.table(
  'lake_table_run',
  {
    runId: uuid('run_id').notNull(),
    tableId: uuid('table_id').notNull(),
    companyId: text('company_id').notNull(),
    read: integer('read').notNull(),
    written: integer('written').notNull(),
    rows: bigint('rows', { mode: 'number' }).notNull(),
    whole: boolean('whole').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.runId, table.tableId] }),
    foreignKey({
      name: 'lake_table_run_run_fkey',
      columns: [table.companyId, table.runId],
      foreignColumns: [lakeRun.companyId, lakeRun.id],
    }).onDelete('cascade'),
    foreignKey({
      name: 'lake_table_run_table_fkey',
      columns: [table.companyId, table.tableId],
      foreignColumns: [lakeTable.companyId, lakeTable.id],
    }).onDelete('cascade'),
    check(
      'lake_table_run_counts',
      sql`${table.read} >= 0 AND ${table.written} >= 0 AND ${table.rows} >= 0`,
    ),
    policy(SCOPE_ROLES.COMPANY, 'all', sql`company_id = ${scoped.companyId}`),
  ],
)
