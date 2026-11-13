import { sql } from 'drizzle-orm'
import type { AnyPgColumn } from 'drizzle-orm/pg-core'
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
import { policy } from '../identity/public.ts'
import { company } from '../identity/public-tables.ts'

// The company's Ontology in the Hub's database (A Ontologia da empresa, U1; data D1): what the
// company's systems declare (the inventory), what an agent or a person proposed with its proof, the
// revisions that approved it and, one immutable version per revision, the concepts, fields, codes,
// relations and sources. The company's rows never come here, only their names and counts.
export const ontology = pgSchema('ontology')

const KEY = '^[a-z][a-z0-9_]{0,39}$'
export const COMPANY_ROW = sql`company_id = ${scoped.companyId}`
export const STATES = ['EXPERIMENTAL', 'ACTIVE', 'DEPRECATED'] as const

export function instant(name: string) {
  return timestamp(name, { withTimezone: true })
}

export function keyCheck(name: string, column: AnyPgColumn) {
  return check(name, sql`${column} ~ ${KEY}`)
}

export function companyFk(name: string, companyId: AnyPgColumn) {
  return foreignKey({ name, columns: [companyId], foreignColumns: [company.id] }).onDelete(
    'cascade',
  )
}

/** One reading of a connection's declarations: open until `inventory_end` closes it. */
export const inventoryRun = ontology.table(
  'inventory_run',
  {
    id: uuid('id').primaryKey(),
    companyId: text('company_id').notNull(),
    connectionId: uuid('connection_id').notNull(),
    startedAt: instant('started_at').notNull(),
  },
  (table) => [
    companyFk('inventory_run_company_id_fkey', table.companyId),
    unique('inventory_run_company_id_id_key').on(table.companyId, table.id),
    index('inventory_run_connection_started_idx').on(
      table.companyId,
      table.connectionId,
      table.startedAt.desc(),
    ),
    policy(SCOPE_ROLES.COMPANY, 'all', COMPANY_ROW),
  ],
)

/** How a run ended, written once: the run is closed by this insert, never by an update. */
export const inventoryEnd = ontology.table(
  'inventory_end',
  {
    runId: uuid('run_id').primaryKey(),
    companyId: text('company_id').notNull(),
    endedAt: instant('ended_at').notNull(),
    outcome: text('outcome', { enum: ['COMPLETE', 'PARTIAL', 'FAILED', 'INTERRUPTED'] }).notNull(),
    // `CAP`, or the type of the system's answer.
    reason: text('reason', {
      enum: [
        'CAP',
        'REFUSED',
        'AUTH_REFUSED',
        'UNREADABLE',
        'BUSY',
        'UNREACHABLE',
        'DEADLINE',
        'NOT_IN_ROLE',
      ],
    }),
    pages: integer('pages').notNull(),
  },
  (table) => [
    foreignKey({
      name: 'inventory_end_run_fkey',
      columns: [table.companyId, table.runId],
      foreignColumns: [inventoryRun.companyId, inventoryRun.id],
    }).onDelete('cascade'),
    check(
      'inventory_end_outcome',
      sql`${table.outcome} IN ('COMPLETE', 'PARTIAL', 'FAILED', 'INTERRUPTED')`,
    ),
    check(
      'inventory_end_reason',
      sql`${table.reason} IS NULL OR ${table.reason} IN ('CAP', 'REFUSED', 'AUTH_REFUSED', 'UNREADABLE', 'BUSY', 'UNREACHABLE', 'DEADLINE', 'NOT_IN_ROLE')`,
    ),
    check(
      'inventory_end_reason_outcome',
      sql`(${table.reason} IS NULL) = (${table.outcome} IN ('COMPLETE', 'INTERRUPTED'))`,
    ),
    check('inventory_end_pages', sql`${table.pages} >= 0`),
    policy(SCOPE_ROLES.COMPANY, 'all', COMPANY_ROW),
  ],
)

/** What a run found: a table, a field, a code or an operation, by its address in the system. */
export const inventoryEntry = ontology.table(
  'inventory_entry',
  {
    runId: uuid('run_id').notNull(),
    companyId: text('company_id').notNull(),
    kind: text('kind', { enum: ['TABLE', 'FIELD', 'CODE', 'OPERATION'] }).notNull(),
    // `TABELA`, `TABELA.CAMPO`, `TABELA.CAMPO=valor`, or the operation's id.
    name: text('name').notNull(),
    type: text('type'),
    label: text('label'),
    // The field is the company's own, not the system's.
    custom: boolean('custom').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.runId, table.kind, table.name] }),
    foreignKey({
      name: 'inventory_entry_run_fkey',
      columns: [table.companyId, table.runId],
      foreignColumns: [inventoryRun.companyId, inventoryRun.id],
    }).onDelete('cascade'),
    check('inventory_entry_kind', sql`${table.kind} IN ('TABLE', 'FIELD', 'CODE', 'OPERATION')`),
    check('inventory_entry_name', sql`char_length(${table.name}) BETWEEN 1 AND 200`),
    check('inventory_entry_type', sql`char_length(${table.type}) <= 20`),
    check('inventory_entry_label', sql`char_length(${table.label}) <= 200`),
    policy(SCOPE_ROLES.COMPANY, 'all', COMPANY_ROW),
  ],
)

/** What a query proved against the system: counts and the columns' shape, never a row. */
export const proofRun = ontology.table(
  'proof_run',
  {
    id: uuid('id').primaryKey(),
    companyId: text('company_id').notNull(),
    connectionId: uuid('connection_id').notNull(),
    query: text('query').notNull(),
    // sha-256 of the query: the whole query is past a btree entry's limit.
    queryHash: text('query_hash').notNull(),
    ranAt: instant('ran_at').notNull(),
    outcome: text('outcome', { enum: ['OK', 'FAILED'] }).notNull(),
    // The type of the system's answer.
    reason: text('reason'),
    // Zero is a proof.
    rows: bigint('rows', { mode: 'number' }).notNull(),
    // `ProofShape` of `@conexus/hub-api`, parsed again at each read (code C27).
    shape: jsonb('shape').notNull(),
    // Only on the proof of a role's source: its rows with no pair in the base's.
    outsideBase: bigint('outside_base', { mode: 'number' }),
  },
  (table) => [
    companyFk('proof_run_company_id_fkey', table.companyId),
    unique('proof_run_company_id_id_key').on(table.companyId, table.id),
    index('proof_run_query_idx').on(
      table.companyId,
      table.connectionId,
      table.queryHash,
      table.ranAt.desc(),
    ),
    check('proof_run_query', sql`char_length(${table.query}) BETWEEN 1 AND 4000`),
    check('proof_run_query_hash', sql`${table.queryHash} ~ '^[0-9a-f]{64}$'`),
    check('proof_run_outcome', sql`${table.outcome} IN ('OK', 'FAILED')`),
    check('proof_run_reason', sql`(${table.outcome} = 'OK') = (${table.reason} IS NULL)`),
    check('proof_run_rows', sql`${table.rows} >= 0`),
    check('proof_run_shape', sql`jsonb_typeof(${table.shape}) = 'array'`),
    check('proof_run_outside_base', sql`${table.outsideBase} IS NULL OR ${table.outsideBase} >= 0`),
    policy(SCOPE_ROLES.COMPANY, 'all', COMPANY_ROW),
  ],
)

/** A demand for a change of the Ontology, with its items; closed once every item is decided. */
export const proposal = ontology.table(
  'proposal',
  {
    id: uuid('id').primaryKey(),
    companyId: text('company_id').notNull(),
    demand: text('demand').notNull(),
    // No foreign key to the person, as connection.linked_by: the proposal is the company's.
    proposedBy: text('proposed_by').notNull(),
    // Null when the screen or the migration proposed.
    agent: text('agent', { enum: ['builder', 'assistant'] }),
    conversationId: text('conversation_id'),
    baseRevision: integer('base_revision').notNull(),
    createdAt: instant('created_at').notNull(),
    state: text('state', { enum: ['OPEN', 'CLOSED'] }).notNull(),
    // The screen's Idempotency-Key and its body's hash (code C37); null on an agent's or the migration's.
    attemptKey: text('attempt_key'),
    bodyHash: text('body_hash'),
  },
  (table) => [
    companyFk('proposal_company_id_fkey', table.companyId),
    unique('proposal_company_id_id_key').on(table.companyId, table.id),
    unique('proposal_company_id_attempt_key_key').on(table.companyId, table.attemptKey),
    // One open proposal of a conversation.
    uniqueIndex('proposal_open_conversation_key')
      .on(table.companyId, table.conversationId)
      .where(sql`${table.state} = 'OPEN' AND ${table.conversationId} IS NOT NULL`),
    check('proposal_demand', sql`char_length(${table.demand}) BETWEEN 1 AND 500`),
    check(
      'proposal_agent',
      sql`${table.agent} IS NULL OR ${table.agent} IN ('builder', 'assistant')`,
    ),
    check('proposal_base_revision', sql`${table.baseRevision} >= 0`),
    check('proposal_state', sql`${table.state} IN ('OPEN', 'CLOSED')`),
    check('proposal_attempt', sql`(${table.attemptKey} IS NULL) = (${table.bodyHash} IS NULL)`),
    policy(SCOPE_ROLES.COMPANY, 'all', COMPANY_ROW),
  ],
)

const ITEM_KINDS = [
  'ADD_CONCEPT',
  'ADD_FIELD',
  'SET_CODE',
  'ADD_RELATION',
  'SET_SOURCE',
  'RENAME_LABEL',
  'DEPRECATE',
  'NOTE',
] as const

/** One change of a proposal, decided by itself; its content cannot change after it is written. */
export const proposalItem = ontology.table(
  'proposal_item',
  {
    proposalId: uuid('proposal_id').notNull(),
    companyId: text('company_id').notNull(),
    n: integer('n').notNull(),
    kind: text('kind', { enum: ITEM_KINDS }).notNull(),
    // The address of the element: `pedido`, `pedido.tipo_operacao`, `pedido.tipo_operacao=101`, `@pedido_vendedor`.
    target: text('target').notNull(),
    // `ItemContent` of `@conexus/hub-api`, parsed again at each read (code C27).
    content: jsonb('content').notNull(),
    proofRunId: uuid('proof_run_id'),
    decision: text('decision', { enum: ['PENDING', 'APPROVED', 'REFUSED'] }).notNull(),
    reason: text('reason'),
    // No foreign key to the person, as proposal.proposed_by.
    decidedBy: text('decided_by'),
    decidedAt: instant('decided_at'),
  },
  (table) => [
    primaryKey({ columns: [table.proposalId, table.n] }),
    foreignKey({
      name: 'proposal_item_proposal_fkey',
      columns: [table.companyId, table.proposalId],
      foreignColumns: [proposal.companyId, proposal.id],
    }).onDelete('cascade'),
    foreignKey({
      name: 'proposal_item_proof_fkey',
      columns: [table.companyId, table.proofRunId],
      foreignColumns: [proofRun.companyId, proofRun.id],
    }),
    check('proposal_item_n', sql`${table.n} >= 1`),
    check(
      'proposal_item_kind',
      sql`${table.kind} IN (${sql.raw(ITEM_KINDS.map((kind) => `'${kind}'`).join(', '))})`,
    ),
    check('proposal_item_target', sql`char_length(${table.target}) BETWEEN 1 AND 130`),
    check('proposal_item_content', sql`jsonb_typeof(${table.content}) = 'object'`),
    check('proposal_item_decision', sql`${table.decision} IN ('PENDING', 'APPROVED', 'REFUSED')`),
    check('proposal_item_reason', sql`char_length(${table.reason}) <= 500`),
    check(
      'proposal_item_decided',
      sql`(${table.decision} = 'PENDING') = (${table.decidedAt} IS NULL)`,
    ),
    policy(SCOPE_ROLES.COMPANY, 'all', COMPANY_ROW),
  ],
)

/** One approval: the number is the company's, in order; every version below names one. */
export const revision = ontology.table(
  'revision',
  {
    companyId: text('company_id').notNull(),
    number: integer('number').notNull(),
    proposalId: uuid('proposal_id').notNull(),
    // No foreign key to the people, as proposal.proposed_by.
    proposedBy: text('proposed_by').notNull(),
    approvedBy: text('approved_by').notNull(),
    approvedAt: instant('approved_at').notNull(),
    // sha-256 in hexadecimal, computed by the server before the versions are written.
    hash: text('hash').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.companyId, table.number] }),
    companyFk('revision_company_id_fkey', table.companyId),
    foreignKey({
      name: 'revision_proposal_fkey',
      columns: [table.companyId, table.proposalId],
      foreignColumns: [proposal.companyId, proposal.id],
    }),
    check('revision_number', sql`${table.number} >= 1`),
    check('revision_hash', sql`${table.hash} ~ '^[0-9a-f]{64}$'`),
    policy(SCOPE_ROLES.COMPANY, 'all', COMPANY_ROW),
  ],
)
