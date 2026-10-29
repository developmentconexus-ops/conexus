import { CONNECTION_STATES } from '@conexus/hub-api'
import { sql } from 'drizzle-orm'
import {
  bytea,
  check,
  foreignKey,
  pgPolicy,
  pgSchema,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'
import { SCOPE_ROLES, scoped } from '../../platform/database.ts'
import { company, policy } from '../identity/public.ts'

// The connectors' own schema in the Hub's database (data D1). A connection belongs to a company and
// leaves with it; its credential is sealed, and only connectors.sealed_of reads it (Grant A, as builder).
export const connectors = pgSchema('connectors')

function instant(name: string) {
  return timestamp(name, { withTimezone: true })
}

/** A company's account in an outside system (founder, C1): one per connector, sealed (S32). */
export const connection = connectors.table(
  'connection',
  {
    id: uuid('id').primaryKey(),
    companyId: text('company_id').notNull(),
    connectorId: text('connector_id').notNull(),
    // The kit's version at linking (founder, L1): a grant compares it from step 20.
    connectorVersion: text('connector_version').notNull(),
    state: text('state', { enum: CONNECTION_STATES }).notNull(),
    sealed: bytea('sealed').notNull(),
    keyId: text('key_id').notNull(),
    // No foreign key to the person, as model_account.linked_by: who linked may leave the company
    // and the connection stays, because it is the company's (C1).
    linkedBy: text('linked_by').notNull(),
    linkedAt: instant('linked_at').notNull(),
    testedAt: instant('tested_at'),
    // The creation's Idempotency-Key (code C37).
    attemptKey: text('attempt_key').notNull(),
  },
  (table) => [
    foreignKey({
      name: 'connection_company_id_fkey',
      columns: [table.companyId],
      foreignColumns: [company.id],
    }).onDelete('cascade'),
    unique('connection_connector_key').on(table.companyId, table.connectorId),
    unique('connection_attempt_key').on(table.companyId, table.attemptKey),
    check('connection_state', sql`${table.state} IN ('NEW', 'ACTIVE', 'NEEDS_REAUTH')`),
    check('connection_connector_id', sql`${table.connectorId} ~ '^[a-z][a-z0-9-]{1,31}$'`),
    policy(SCOPE_ROLES.COMPANY, 'all', sql`company_id = ${scoped.companyId}`),
    pgPolicy('connection_seals_select', {
      for: 'select',
      to: 'hub_connection_seals',
      using: sql`true`,
    }),
  ],
)
