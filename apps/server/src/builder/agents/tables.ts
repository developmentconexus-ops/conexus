import { sql } from 'drizzle-orm'
import type { PgTableExtraConfigValue } from 'drizzle-orm/pg-core'
import {
  check,
  foreignKey,
  integer,
  jsonb,
  pgPolicy,
  primaryKey,
  text,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'
import { company, policy } from '../../hub/identity/public.ts'
import { project } from '../../hub/projects/public.ts'
import { SCOPE_ROLES } from '../../platform/database.ts'
import { authored, builder, instant, OWN_COMPANY } from '../schema/public.ts'
import { toolVersion } from '../tools/public.ts'

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
    ...authored(),
    updatedAt: instant('updated_at').notNull().defaultNow(),
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
  },
  (table) => [
    primaryKey({ name: 'agent_tool_pkey', columns: [table.agentId, table.toolVersionId] }),
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
  },
  (table) => [
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
