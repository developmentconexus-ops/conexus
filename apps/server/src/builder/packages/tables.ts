import { sql } from 'drizzle-orm'
import { foreignKey, pgSchema, primaryKey, text, timestamp } from 'drizzle-orm/pg-core'
import { company, policy } from '../../hub/identity/public.ts'
import { project } from '../../hub/projects/public.ts'
import { SCOPE_ROLES, scoped } from '../../platform/database.ts'

const builder = pgSchema('builder')

/**
 * A library the Projeto's owner allowed the Builder to use, at an exact version: the second grant of
 * a package updates its version. It goes with the Projeto it was granted in, and stays when the
 * person who granted it leaves: the app that imports it would not check without it.
 */
export const packageGrant = builder.table(
  'package_grant',
  {
    companyId: text('company_id').notNull(),
    projectId: text('project_id').notNull(),
    name: text('name').notNull(),
    version: text('version').notNull(),
    grantedBy: text('granted_by').notNull(),
    grantedAt: timestamp('granted_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.projectId, table.name] }),
    foreignKey({
      name: 'package_grant_project_id_fkey',
      columns: [table.projectId],
      foreignColumns: [project.id],
    }).onDelete('cascade'),
    foreignKey({
      name: 'package_grant_company_id_fkey',
      columns: [table.companyId],
      foreignColumns: [company.id],
    }).onDelete('cascade'),
    policy(SCOPE_ROLES.COMPANY, 'all', sql`company_id = ${scoped.companyId}`),
  ],
)
