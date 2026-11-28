import { sql } from 'drizzle-orm'
import type { PgTableExtraConfigValue } from 'drizzle-orm/pg-core'
import {
  boolean,
  check,
  foreignKey,
  integer,
  jsonb,
  pgPolicy,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'
import { authored, builder, instant, OWN, OWN_COMPANY } from '../harness/schema/public.ts'
import { policy } from '../hub/identity/public.ts'
import { company, member } from '../hub/identity/public-tables.ts'
import { project } from '../hub/projects/public-tables.ts'
import { SCOPE_ROLES } from '../platform/database.ts'

// The definitions of the nine tables of the old agents (conversations, saved agents and tools).
// Their code left with the old harness; the tables stay until the contract migration that drops
// them, so `drizzle-kit generate` finds them and emits no `DROP`.

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

const AGENT_COMPANIES = 'hub_agent_companies'

/**
 * An agent of a Projeto (step 24.3, `A1`): its draft, which people and the Construtor change at the
 * revision they read, and the published version that answers. Only the Hub writes it; it leaves
 * with its Projeto or its company. Its author is only an id (data D17): a person who leaves the
 * company leaves the agent with no author.
 */
export const agent = builder.table(
  'agent',
  {
    id: uuid('id').primaryKey(),
    companyId: text('company_id').notNull(),
    projectId: text('project_id').notNull(),
    draft: jsonb('draft').notNull(),
    revision: integer('revision').notNull().default(1),
    activeVersion: integer('active_version'),
    // Who made that version the active one (publish, restore or publish again): the person who answers for it (step 24.5, D2-a). Only an id, like the authors (data D17).
    activeBy: text('active_by'),
    ...authored(),
    updatedAt: instant('updated_at').notNull().defaultNow(),
    // The start of the last turn with the published version, by anyone; the test conversation never writes it.
    lastRunAt: instant('last_run_at'),
  },
  // Typed, because the agent and its versions name each other.
  (table): PgTableExtraConfigValue[] => [
    foreignKey({
      name: 'agent_company_id_fkey',
      columns: [table.companyId],
      foreignColumns: [company.id],
    }).onDelete('cascade'),
    foreignKey({
      name: 'agent_project_fkey',
      columns: [table.companyId, table.projectId],
      foreignColumns: [project.companyId, project.id],
    }).onDelete('cascade'),
    unique('agent_company_id_id_key').on(table.companyId, table.id),
    // The active version is one of the agent's own (data D15); none before the first publish.
    foreignKey({
      name: 'agent_active_version_fkey',
      columns: [table.companyId, table.id, table.activeVersion],
      foreignColumns: [agentVersion.companyId, agentVersion.agentId, agentVersion.number],
    }),
    check('agent_revision_positive', sql`${table.revision} > 0`),
    policy(SCOPE_ROLES.COMPANY, 'all', OWN_COMPANY),
    // The function behind the start's load reads the companies with a published agent (migration
    // e243_agents_grants); its role reads two columns and cannot log in.
    pgPolicy('agent_companies_select', { for: 'select', to: AGENT_COMPANIES, using: sql`true` }),
  ],
)

/** A published version: a copy of the draft of one revision, never changed after it is written. */
export const agentVersion = builder.table(
  'agent_version',
  {
    agentId: uuid('agent_id').notNull(),
    number: integer('number').notNull(),
    companyId: text('company_id').notNull(),
    config: jsonb('config').notNull(),
    sourceRevision: integer('source_revision').notNull(),
    message: text('message').notNull(),
    publishedBy: text('published_by'),
    publishedAt: instant('published_at').notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ name: 'agent_version_pkey', columns: [table.agentId, table.number] }),
    foreignKey({
      name: 'agent_version_agent_fkey',
      columns: [table.companyId, table.agentId],
      foreignColumns: [agent.companyId, agent.id],
    }).onDelete('cascade'),
    // Publishing the same revision twice finds the version the first made.
    unique('agent_version_agent_id_source_revision_key').on(table.agentId, table.sourceRevision),
    unique('agent_version_company_id_agent_id_number_key').on(
      table.companyId,
      table.agentId,
      table.number,
    ),
    check('agent_version_number_positive', sql`${table.number} > 0`),
    policy(SCOPE_ROLES.COMPANY, 'all', OWN_COMPANY),
  ],
)

/**
 * The version of each tool the draft chose, one per tool. It points at the version with no action
 * on delete, so a tool in use refuses to leave the library (`TOOL_IN_USE`).
 */
export const agentTool = builder.table(
  'agent_tool',
  {
    agentId: uuid('agent_id').notNull(),
    toolId: uuid('tool_id').notNull(),
    toolVersionId: uuid('tool_version_id').notNull(),
    companyId: text('company_id').notNull(),
    /** A write's `ToolApproval` (step 24.5); null on a read. */
    approval: text('approval'),
  },
  (table) => [
    primaryKey({ name: 'agent_tool_pkey', columns: [table.agentId, table.toolVersionId] }),
    check('agent_tool_approval', sql`${table.approval} in ('ASK', 'AUTO')`),
    unique('agent_tool_agent_id_tool_id_key').on(table.agentId, table.toolId),
    foreignKey({
      name: 'agent_tool_agent_fkey',
      columns: [table.companyId, table.agentId],
      foreignColumns: [agent.companyId, agent.id],
    }).onDelete('cascade'),
    foreignKey({
      name: 'agent_tool_tool_version_fkey',
      columns: [table.toolId, table.toolVersionId],
      foreignColumns: [toolVersion.toolId, toolVersion.id],
    }),
    foreignKey({
      name: 'agent_tool_company_tool_version_fkey',
      columns: [table.companyId, table.toolVersionId],
      foreignColumns: [toolVersion.companyId, toolVersion.id],
    }),
    policy(SCOPE_ROLES.COMPANY, 'all', OWN_COMPANY),
  ],
)

/** The version of each tool a published version holds: what it calls, whatever the library gains. */
export const agentVersionTool = builder.table(
  'agent_version_tool',
  {
    agentId: uuid('agent_id').notNull(),
    number: integer('number').notNull(),
    toolVersionId: uuid('tool_version_id').notNull(),
    companyId: text('company_id').notNull(),
    /** A write's `ToolApproval` as the version was published (step 24.5); null on a read. */
    approval: text('approval'),
  },
  (table) => [
    check('agent_version_tool_approval', sql`${table.approval} in ('ASK', 'AUTO')`),
    primaryKey({
      name: 'agent_version_tool_pkey',
      columns: [table.agentId, table.number, table.toolVersionId],
    }),
    foreignKey({
      name: 'agent_version_tool_agent_version_fkey',
      columns: [table.companyId, table.agentId, table.number],
      foreignColumns: [agentVersion.companyId, agentVersion.agentId, agentVersion.number],
    }).onDelete('cascade'),
    foreignKey({
      name: 'agent_version_tool_tool_version_fkey',
      columns: [table.companyId, table.toolVersionId],
      foreignColumns: [toolVersion.companyId, toolVersion.id],
    }),
    policy(SCOPE_ROLES.COMPANY, 'all', OWN_COMPANY),
  ],
)

/**
 * A person's conversation with an agent (step 24.3, U2), one row per Mastra thread, whose id is this
 * row's: which agent, and whether it runs the draft. Written before the thread, and never changed;
 * it leaves with its agent, its person or its company, after their removal deleted the thread.
 */
export const agentConversation = builder.table(
  'agent_conversation',
  {
    id: uuid('id').primaryKey(),
    companyId: text('company_id').notNull(),
    personId: text('person_id').notNull(),
    agentId: uuid('agent_id').notNull(),
    draft: boolean('draft').notNull(),
  },
  (table) => [
    foreignKey({
      name: 'agent_conversation_company_id_fkey',
      columns: [table.companyId],
      foreignColumns: [company.id],
    }).onDelete('cascade'),
    foreignKey({
      name: 'agent_conversation_agent_fkey',
      columns: [table.companyId, table.agentId],
      foreignColumns: [agent.companyId, agent.id],
    }).onDelete('cascade'),
    foreignKey({
      name: 'agent_conversation_member_fkey',
      columns: [table.companyId, table.personId],
      foreignColumns: [member.organizationId, member.userId],
    }).onDelete('cascade'),
    policy(SCOPE_ROLES.COMPANY, 'all', OWN),
  ],
)

/**
 * The connections an Assistant conversation chose, one row per Mastra thread, whose id is this
 * row's (step 24.1, U2). Only the Hub's routes write it, the creation and `PUT …/connections`, so
 * Mastra's own writes of the thread's metadata, the title's and the observation's, never undo a
 * choice. The row is written before the thread and leaves with its Projeto, its person or its
 * company, after their release deleted the thread (data D17).
 */
export const assistantConversation = builder.table(
  'assistant_conversation',
  {
    id: uuid('id').primaryKey(),
    companyId: text('company_id').notNull(),
    personId: text('person_id').notNull(),
    // The thread's place, as its mark says; none on the Início.
    projectId: text('project_id'),
    connections: uuid('connections').array().notNull(),
  },
  (table) => [
    foreignKey({
      name: 'assistant_conversation_company_id_fkey',
      columns: [table.companyId],
      foreignColumns: [company.id],
    }).onDelete('cascade'),
    foreignKey({
      name: 'assistant_conversation_project_id_fkey',
      columns: [table.projectId],
      foreignColumns: [project.id],
    }).onDelete('cascade'),
    foreignKey({
      name: 'assistant_conversation_member_fkey',
      columns: [table.companyId, table.personId],
      foreignColumns: [member.organizationId, member.userId],
    }).onDelete('cascade'),
    policy(SCOPE_ROLES.COMPANY, 'all', OWN),
  ],
)

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
