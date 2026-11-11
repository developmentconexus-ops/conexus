import { PROOF_PAGE_ROWS } from '@conexus/hub-api'
import { sql } from 'drizzle-orm'
import {
  bigint,
  boolean,
  check,
  foreignKey,
  index,
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
import { project } from '../projects/public-tables.ts'

// The copies' own schema in the Hub's database (data D1, Capacity 2): what each copy reads, where its
// pass stands, its runs and the Projetos it is released to. The rows a copy reads live in the
// company's database, never here.
export const copies = pgSchema('copies')

function instant(name: string) {
  return timestamp(name, { withTimezone: true })
}

/**
 * One copy of a company's data from one of its connections (founder, 2026-11-09): the definition is
 * the company's, copied from a template when it is turned on. The lease, the position and the
 * watermark are ours (docs/reference/boundaries.md): no installed library keeps them between runs.
 */
export const copy = copies.table(
  'copy',
  {
    id: uuid('id').primaryKey(),
    companyId: text('company_id').notNull(),
    // The connection's connector, so the row's connection is its company's (as project_connection).
    connectorId: text('connector_id').notNull(),
    connectionId: uuid('connection_id').notNull(),
    // The table in the company's `sync` schema (`CopyName`).
    name: text('name').notNull(),
    // What the definition came from: a template, its id and its label, or the Builder's proposal,
    // its label and no template (Capacity 3).
    label: text('label').notNull(),
    model: text('model'),
    // `CopyDefinition` of the kit, parsed again at each run (code C27).
    definition: jsonb('definition').notNull(),
    // No foreign key to the person, as connection.linked_by: the copy is the company's.
    createdBy: text('created_by').notNull(),
    createdAt: instant('created_at').notNull(),
    // The creation's Idempotency-Key and its body's hash (code C37).
    attemptKey: text('attempt_key').notNull(),
    bodyHash: text('body_hash').notNull(),
    // The lease of one run (data D25): who holds it and until when.
    claimToken: uuid('claim_token'),
    claimedUntil: instant('claimed_until'),
    // The pass: its number, when it began, the last key written, and when the last complete pass began.
    pass: integer('pass').notNull().default(0),
    passStartedAt: instant('pass_started_at'),
    position: jsonb('position'),
    watermark: instant('watermark'),
    // The table's rows after the last complete pass.
    rows: bigint('rows', { mode: 'number' }),
    lastRunId: uuid('last_run_id'),
  },
  (table) => [
    unique('copy_company_id_name_key').on(table.companyId, table.name),
    unique('copy_company_id_attempt_key_key').on(table.companyId, table.attemptKey),
    // The target of the runs' and releases' composite keys.
    unique('copy_company_id_id_key').on(table.companyId, table.id),
    foreignKey({
      name: 'copy_company_id_fkey',
      columns: [table.companyId],
      foreignColumns: [company.id],
    }).onDelete('cascade'),
    foreignKey({
      name: 'copy_connection_fkey',
      columns: [table.companyId, table.connectorId, table.connectionId],
      foreignColumns: [connection.companyId, connection.connectorId, connection.id],
    }).onDelete('cascade'),
    check('copy_claim', sql`(${table.claimToken} IS NULL) = (${table.claimedUntil} IS NULL)`),
    check('copy_name', sql`${table.name} ~ '^[a-z][a-z0-9_]{0,39}$'`),
    check('copy_definition', sql`jsonb_typeof(${table.definition}) = 'object'`),
    policy(SCOPE_ROLES.COMPANY, 'all', sql`company_id = ${scoped.companyId}`),
  ],
)

/** One run of a copy: open until it ends with its outcome; the 100 newest of each copy are kept. */
export const copyRun = copies.table(
  'copy_run',
  {
    id: uuid('id').primaryKey(),
    companyId: text('company_id').notNull(),
    copyId: uuid('copy_id').notNull(),
    startedAt: instant('started_at').notNull(),
    endedAt: instant('ended_at'),
    outcome: text('outcome', { enum: ['COMPLETE', 'PARTIAL', 'ERROR', 'INTERRUPTED'] }),
    // `CAP`, `STOPPED` or the error's code.
    reason: text('reason'),
    pages: integer('pages').notNull().default(0),
    read: integer('read').notNull().default(0),
    written: integer('written').notNull().default(0),
  },
  (table) => [
    foreignKey({
      name: 'copy_run_copy_fkey',
      columns: [table.companyId, table.copyId],
      foreignColumns: [copy.companyId, copy.id],
    }).onDelete('cascade'),
    check('copy_run_ended', sql`(${table.endedAt} IS NULL) = (${table.outcome} IS NULL)`),
    check(
      'copy_run_outcome',
      sql`${table.outcome} IS NULL OR ${table.outcome} IN ('COMPLETE', 'PARTIAL', 'ERROR', 'INTERRUPTED')`,
    ),
    // One open run per copy.
    uniqueIndex('copy_run_open_key').on(table.copyId).where(sql`${table.endedAt} IS NULL`),
    index('copy_run_copy_started_idx').on(table.copyId, table.startedAt),
    policy(SCOPE_ROLES.COMPANY, 'all', sql`company_id = ${scoped.companyId}`),
  ],
)

/** A copy released to a Projeto: its app's logins may read the copy's table. */
export const projectCopy = copies.table(
  'project_copy',
  {
    companyId: text('company_id').notNull(),
    projectId: text('project_id').notNull(),
    copyId: uuid('copy_id').notNull(),
    // No foreign key to the person, as connection.linked_by.
    grantedBy: text('granted_by').notNull(),
    grantedAt: instant('granted_at').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.projectId, table.copyId] }),
    foreignKey({
      name: 'project_copy_project_fkey',
      columns: [table.companyId, table.projectId],
      foreignColumns: [project.companyId, project.id],
    }).onDelete('cascade'),
    foreignKey({
      name: 'project_copy_copy_fkey',
      columns: [table.companyId, table.copyId],
      foreignColumns: [copy.companyId, copy.id],
    }).onDelete('cascade'),
    policy(SCOPE_ROLES.COMPANY, 'all', sql`company_id = ${scoped.companyId}`),
  ],
)

/**
 * A copy the Builder proposed in a Projeto's conversation (Capacity 3): the definition it wrote, the
 * count of one page of proof, never a row. A person who manages copies turns it on, which makes the
 * copy and releases it to the Projeto, or dismisses it.
 */
export const copyProposal = copies.table(
  'copy_proposal',
  {
    id: uuid('id').primaryKey(),
    companyId: text('company_id').notNull(),
    // The connection's connector, so the row's connection is its company's (as copy).
    connectorId: text('connector_id').notNull(),
    connectionId: uuid('connection_id').notNull(),
    projectId: text('project_id').notNull(),
    // The table the copy would make in the company's `sync` schema (`CopyName`).
    name: text('name').notNull(),
    label: text('label').notNull(),
    // `CopyDefinition` of the kit, parsed again when the proposal is turned on (code C27).
    definition: jsonb('definition').notNull(),
    // No foreign key to the person, as copy.created_by.
    proposedBy: text('proposed_by').notNull(),
    provedRows: integer('proved_rows').notNull(),
    provedMore: boolean('proved_more').notNull(),
    proposedAt: instant('proposed_at').notNull(),
    state: text('state', { enum: ['OPEN', 'ACCEPTED', 'DISMISSED'] }).notNull(),
    // The copy it turned into; null again when that copy is deleted, a row nobody reads (data D15).
    copyId: uuid('copy_id'),
  },
  (table) => [
    foreignKey({
      name: 'copy_proposal_company_id_fkey',
      columns: [table.companyId],
      foreignColumns: [company.id],
    }).onDelete('cascade'),
    foreignKey({
      name: 'copy_proposal_connection_fkey',
      columns: [table.companyId, table.connectorId, table.connectionId],
      foreignColumns: [connection.companyId, connection.connectorId, connection.id],
    }).onDelete('cascade'),
    foreignKey({
      name: 'copy_proposal_project_fkey',
      columns: [table.companyId, table.projectId],
      foreignColumns: [project.companyId, project.id],
    }).onDelete('cascade'),
    foreignKey({
      name: 'copy_proposal_copy_fkey',
      columns: [table.copyId],
      foreignColumns: [copy.id],
    }).onDelete('set null'),
    check('copy_proposal_name', sql`${table.name} ~ '^[a-z][a-z0-9_]{0,39}$'`),
    check('copy_proposal_definition', sql`jsonb_typeof(${table.definition}) = 'object'`),
    check(
      'copy_proposal_proved_rows',
      sql`${table.provedRows} BETWEEN 0 AND ${sql.raw(String(PROOF_PAGE_ROWS))}`,
    ),
    check('copy_proposal_state', sql`${table.state} IN ('OPEN', 'ACCEPTED', 'DISMISSED')`),
    check('copy_proposal_copy', sql`${table.state} = 'ACCEPTED' OR ${table.copyId} IS NULL`),
    // One open proposal of a name per company.
    uniqueIndex('copy_proposal_open_name_key')
      .on(table.companyId, table.name)
      .where(sql`${table.state} = 'OPEN'`),
    policy(SCOPE_ROLES.COMPANY, 'all', sql`company_id = ${scoped.companyId}`),
  ],
)
