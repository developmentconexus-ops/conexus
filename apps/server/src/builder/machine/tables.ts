import { sql } from 'drizzle-orm'
import { foreignKey, pgSchema, text, timestamp } from 'drizzle-orm/pg-core'
import { company, policy } from '../../hub/identity/public.ts'
import { project } from '../../hub/projects/public.ts'
import { SCOPE_ROLES, scoped } from '../../platform/database.ts'

const builder = pgSchema('builder')

/** The E2B machine of a Projeto, by the id the provider gave it; `used_at` is its last turn. */
export const machine = builder.table(
  'machine',
  {
    projectId: text('project_id').primaryKey(),
    companyId: text('company_id').notNull(),
    sandboxId: text('sandbox_id').notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    foreignKey({
      name: 'machine_project_id_fkey',
      columns: [table.projectId],
      foreignColumns: [project.id],
    }).onDelete('cascade'),
    foreignKey({
      name: 'machine_company_id_fkey',
      columns: [table.companyId],
      foreignColumns: [company.id],
    }).onDelete('cascade'),
    policy(SCOPE_ROLES.COMPANY, 'all', sql`company_id = ${scoped.companyId}`),
  ],
)
