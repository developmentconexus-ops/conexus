import { foreignKey, pgSchema, text, timestamp } from 'drizzle-orm/pg-core'
import { session } from '../identity/public.ts'

// A Projeto's app opens on its own host: the Hub hands the browser a one-use pass there, and the
// dispatcher trades it for an app session (security S22). Only hashes are stored. The Hub's login
// reads them with no scope, as it reads auth.session: it finds a row by its hash before it knows the
// company. Each row lives no longer than the Hub session it came from (data D17).
export const apps = pgSchema('apps')

function instant(name: string) {
  return timestamp(name, { withTimezone: true })
}

export const handoff = apps.table(
  'handoff',
  {
    codeHash: text('code_hash').primaryKey(),
    bindingHash: text('binding_hash').notNull(),
    hostLabel: text('host_label').notNull(),
    personId: text('person_id').notNull(),
    companyId: text('company_id').notNull(),
    projectId: text('project_id').notNull(),
    hubSessionId: text('hub_session_id').notNull(),
    expiresAt: instant('expires_at').notNull(),
  },
  (table) => [
    foreignKey({
      name: 'handoff_hub_session_id_fkey',
      columns: [table.hubSessionId],
      foreignColumns: [session.id],
    }).onDelete('cascade'),
  ],
)

export const appSession = apps.table(
  'app_session',
  {
    tokenHash: text('token_hash').primaryKey(),
    hostLabel: text('host_label').notNull(),
    personId: text('person_id').notNull(),
    companyId: text('company_id').notNull(),
    projectId: text('project_id').notNull(),
    hubSessionId: text('hub_session_id').notNull(),
  },
  (table) => [
    foreignKey({
      name: 'app_session_hub_session_id_fkey',
      columns: [table.hubSessionId],
      foreignColumns: [session.id],
    }).onDelete('cascade'),
  ],
)
