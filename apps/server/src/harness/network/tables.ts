import { NETWORK_LIMITS } from '@conexus/hub-api'
import { sql } from 'drizzle-orm'
import type { AnyPgColumn } from 'drizzle-orm/pg-core'
import { check, foreignKey, primaryKey, text, unique, uuid } from 'drizzle-orm/pg-core'
import { policy } from '../../hub/identity/public.ts'
import { company, member, user } from '../../hub/identity/public-tables.ts'
import { SCOPE_ROLES } from '../../platform/database.ts'
import { builder, instant, OWN, OWN_COMPANY } from '../schema/public.ts'

const REASON_MAX = sql.raw(String(NETWORK_LIMITS.reason))

function reasonLength(name: string, reason: AnyPgColumn) {
  return check(name, sql`char_length(${reason}) BETWEEN 1 AND ${REASON_MAX}`)
}

export const companyNetworkDomain = builder.table(
  'company_network_domain',
  {
    id: uuid('id').primaryKey(),
    companyId: text('company_id').notNull(),
    domain: text('domain').notNull(),
    reason: text('reason').notNull(),
    grantedBy: text('granted_by'),
    grantedAt: instant('granted_at').notNull().defaultNow(),
  },
  (table) => [
    foreignKey({
      name: 'company_network_domain_company_id_fkey',
      columns: [table.companyId],
      foreignColumns: [company.id],
    }).onDelete('cascade'),
    foreignKey({
      name: 'company_network_domain_granted_by_fkey',
      columns: [table.grantedBy],
      foreignColumns: [user.id],
    }).onDelete('set null'),
    unique('company_network_domain_company_id_domain_key').on(table.companyId, table.domain),
    reasonLength('company_network_domain_reason', table.reason),
    policy(SCOPE_ROLES.COMPANY, 'all', OWN_COMPANY),
  ],
)

export const conversationNetworkDomain = builder.table(
  'conversation_network_domain',
  {
    // The Mastra thread's id: the thread is Mastra's own table, so no foreign key reaches it.
    conversationId: uuid('conversation_id').notNull(),
    companyId: text('company_id').notNull(),
    personId: text('person_id').notNull(),
    domain: text('domain').notNull(),
    reason: text('reason').notNull(),
    grantedAt: instant('granted_at').notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.conversationId, table.domain] }),
    foreignKey({
      name: 'conversation_network_domain_member_fkey',
      columns: [table.companyId, table.personId],
      foreignColumns: [member.organizationId, member.userId],
    }).onDelete('cascade'),
    reasonLength('conversation_network_domain_reason', table.reason),
    policy(SCOPE_ROLES.COMPANY, 'all', OWN),
  ],
)
