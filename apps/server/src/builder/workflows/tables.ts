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

const WORKFLOW_COMPANIES = 'hub_workflow_companies'

/**
 * A workflow of a company or of one Projeto (step 24.6, `H`): its draft, which people and the
 * Construtor change at the revision they read, and the published version that runs. `project_id`
 * null is the company. Only the Hub writes it; it leaves with its Projeto or its company. Its
 * authors are only ids (data D17): a person who leaves the company leaves it with none.
 */
export const workflow = builder.table(
  'workflow',
  {
    id: uuid('id').primaryKey(),
    companyId: text('company_id').notNull(),
    projectId: text('project_id'),
    name: text('name').notNull(),
    draft: jsonb('draft'),
    revision: integer('revision').notNull().default(0),
    // The draft of the last test, written by the runs (step 24.6, U3).
    testDraft: jsonb('test_draft'),
    state: text('state').notNull().default('ON'),
    activeVersion: integer('active_version'),
    // Who made that version the active one: the person who answers for what it runs (D2-a). Only an id (data D17).
    activeBy: text('active_by'),
    ...authored(),
  },
  // Typed, because the workflow and its versions name each other.
  (table): PgTableExtraConfigValue[] => [
    foreignKey({
      name: 'workflow_company_id_fkey',
      columns: [table.companyId],
      foreignColumns: [company.id],
    }).onDelete('cascade'),
    foreignKey({
      name: 'workflow_project_fkey',
      columns: [table.companyId, table.projectId],
      foreignColumns: [project.companyId, project.id],
    }).onDelete('cascade'),
    unique('workflow_company_id_id_key').on(table.companyId, table.id),
    // The active version is one of the workflow's own (data D15); none before the first publish.
    foreignKey({
      name: 'workflow_active_version_fkey',
      columns: [table.companyId, table.id, table.activeVersion],
      foreignColumns: [
        workflowVersion.companyId,
        workflowVersion.workflowId,
        workflowVersion.number,
      ],
    }),
    check('workflow_state_known', sql`${table.state} in ('ON', 'PAUSED', 'PAUSED_OWNER')`),
    check('workflow_revision_not_negative', sql`${table.revision} >= 0`),
    check(
      'workflow_active_by_needs_version',
      sql`${table.activeVersion} is not null or ${table.activeBy} is null`,
    ),
    policy(SCOPE_ROLES.COMPANY, 'all', OWN_COMPANY),
    // The function behind the start's clean-up reads the companies with a workflow (migration
    // e246_workflow_grants); its role reads one column and cannot log in.
    pgPolicy('workflow_companies_select', {
      for: 'select',
      to: WORKFLOW_COMPANIES,
      using: sql`true`,
    }),
  ],
)

/** A published version: the frozen document of one revision, never changed after it is written. */
export const workflowVersion = builder.table(
  'workflow_version',
  {
    workflowId: uuid('workflow_id').notNull(),
    number: integer('number').notNull(),
    companyId: text('company_id').notNull(),
    frozen: jsonb('frozen').notNull(),
    sourceRevision: integer('source_revision').notNull(),
    publishedBy: text('published_by'),
    publishedAt: instant('published_at').notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ name: 'workflow_version_pkey', columns: [table.workflowId, table.number] }),
    foreignKey({
      name: 'workflow_version_workflow_fkey',
      columns: [table.companyId, table.workflowId],
      foreignColumns: [workflow.companyId, workflow.id],
    }).onDelete('cascade'),
    // Publishing the same revision twice finds the version the first made.
    unique('workflow_version_workflow_id_source_revision_key').on(
      table.workflowId,
      table.sourceRevision,
    ),
    unique('workflow_version_company_id_workflow_id_number_key').on(
      table.companyId,
      table.workflowId,
      table.number,
    ),
    check('workflow_version_number_positive', sql`${table.number} > 0`),
    policy(SCOPE_ROLES.COMPANY, 'all', OWN_COMPANY),
  ],
)
