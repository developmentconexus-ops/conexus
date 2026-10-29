import { CONNECTION_STATES } from '@conexus/hub-api'
import { sql } from 'drizzle-orm'
import {
  bytea,
  check,
  foreignKey,
  jsonb,
  pgPolicy,
  pgSchema,
  text,
  timestamp,
  unique,
  uniqueIndex,
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

/** A company's account in an outside system (founder, C1): as many per connector as it links, each by its name (founder, 2026-10-29), sealed (S32). */
export const connection = connectors.table(
  'connection',
  {
    id: uuid('id').primaryKey(),
    companyId: text('company_id').notNull(),
    connectorId: text('connector_id').notNull(),
    // The name the company gives at Ligar ("Matriz"), stored as typed: what tells two connections
    // of a connector apart.
    name: text('name').notNull(),
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
    // No foreign key, as linked_by.
    testedBy: text('tested_by'),
    // The last working test's items (founder, X2): id, label, subject, outcome, source; never a
    // value read. The Hub parses it with hub-api's TestCheck on read (C27); the database only keeps it.
    lastTest: jsonb('last_test'),
    // The creation's Idempotency-Key (code C37).
    attemptKey: text('attempt_key').notNull(),
  },
  (table) => [
    foreignKey({
      name: 'connection_company_id_fkey',
      columns: [table.companyId],
      foreignColumns: [company.id],
    }).onDelete('cascade'),
    // A company links as many accounts of a connector as it wants, each under a name that is
    // unique whatever its case, as the Projects' (data D33: REINDEX when the ICU major changes).
    uniqueIndex('connection_name_key').on(
      table.companyId,
      table.connectorId,
      sql`lower(${table.name} collate "und-x-icu")`,
    ),
    unique('connection_attempt_key').on(table.companyId, table.attemptKey),
    // The Hub trims before it writes; the database refuses what escapes (as model_account_label_length, 1 to 60).
    check(
      'connection_name',
      sql`char_length(${table.name}) BETWEEN 1 AND 60 AND ${table.name} = btrim(${table.name})`,
    ),
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
