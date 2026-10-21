import { sql } from 'drizzle-orm'
import {
  check,
  foreignKey,
  integer,
  jsonb,
  pgPolicy,
  pgSchema,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { company, member, policy } from '../../hub/identity/public.ts'
import { project } from '../../hub/projects/public.ts'
import { SCOPE_ROLES, scoped } from '../../platform/database.ts'

// The Builder's schema in the Hub's database (decision 0011). A run is one turn that may write: the
// machine, the lease and the version it saves live here, the turn's words in Mastra's database.
const builder = pgSchema('builder')

// A Projeto's runs are the company's to read: Diego is told whose turn is open (card, criterion 12).
const OWN_COMPANY = sql`company_id = ${scoped.companyId}`

/**
 * One turn that writes. At most one is `open` or `saving` per Projeto (D15). `lease_until` and
 * `owner` say which copy of the program drives it (data D25); `deadline_at` is the turn's hour,
 * which a resumed turn does not renew. `base_sha` is the `main` it started from, `candidate_sha` the
 * version it saved, `copied_at` when that version reached the bucket.
 */
export const run = builder.table(
  'run',
  {
    id: uuid('id').primaryKey(),
    companyId: text('company_id').notNull(),
    projectId: text('project_id').notNull(),
    personId: text('person_id').notNull(),
    conversationId: text('conversation_id').notNull(),
    state: text('state').notNull(),
    baseSha: text('base_sha'),
    candidateSha: text('candidate_sha'),
    deadlineAt: timestamp('deadline_at', { withTimezone: true }).notNull(),
    leaseUntil: timestamp('lease_until', { withTimezone: true }).notNull(),
    owner: uuid('owner').notNull(),
    copiedAt: timestamp('copied_at', { withTimezone: true }),
  },
  (table) => [
    foreignKey({
      name: 'run_company_id_fkey',
      columns: [table.companyId],
      foreignColumns: [company.id],
    }).onDelete('cascade'),
    foreignKey({
      name: 'run_project_id_fkey',
      columns: [table.projectId],
      foreignColumns: [project.id],
    }).onDelete('cascade'),
    foreignKey({
      name: 'run_member_fkey',
      columns: [table.companyId, table.personId],
      foreignColumns: [member.organizationId, member.userId],
    }).onDelete('cascade'),
    check(
      'run_state',
      sql`${table.state} IN ('open', 'saving', 'saved', 'unchanged', 'stopped', 'interrupted', 'failed')`,
    ),
    uniqueIndex('run_one_open_per_project')
      .on(table.projectId)
      .where(sql`${table.state} IN ('open', 'saving')`),
    policy(SCOPE_ROLES.COMPANY, 'all', OWN_COMPANY),
    // The function behind companies_with_runs names the companies with work left, before any
    // company is known (migration e13_runs_grants); its role cannot log in.
    pgPolicy('runs_select', { for: 'select', to: 'hub_runs', using: sql`true` }),
  ],
)

/** One event of a turn, kept by its position so a reconnect reads what it missed (card, 22). */
export const runEvent = builder.table(
  'run_event',
  {
    runId: uuid('run_id').notNull(),
    companyId: text('company_id').notNull(),
    n: integer('n').notNull(),
    event: jsonb('event').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.runId, table.n] }),
    foreignKey({
      name: 'run_event_run_id_fkey',
      columns: [table.runId],
      foreignColumns: [run.id],
    }).onDelete('cascade'),
    policy(SCOPE_ROLES.COMPANY, 'all', OWN_COMPANY),
  ],
)
