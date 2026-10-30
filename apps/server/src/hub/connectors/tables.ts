import { CONNECTION_STATES } from '@conexus/hub-api'
import { sql } from 'drizzle-orm'
import {
  bytea,
  check,
  foreignKey,
  integer,
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
import { company, member, policy } from '../identity/public.ts'

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
    // Written and read by nothing since Testar became one check (founder, 2026-10-30): a later
    // migration drops it, once no running image reads it (data D6).
    lastTest: jsonb('last_test'),
    // The creation's Idempotency-Key (code C37).
    attemptKey: text('attempt_key').notNull(),
    // Bumped by every write of `sealed` that other writers must notice: a refresh stores only on
    // the revision it read, and Conectar de novo raises it (code C38).
    revision: integer('revision').notNull().default(0),
    // The lease of an OAuth key's refresh: one refresh at a time (security S34, data D25).
    refreshUntil: instant('refresh_until'),
    // The provider's account id (AccountRef) and its name as the provider shows it; both null for a
    // connector whose account is `none`.
    accountRef: text('account_ref'),
    accountLabel: text('account_label'),
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
    // The target of connection_sign_in's composite key: a row about a connection is the connection's
    // company's and connector's.
    unique('connection_company_connector_id_key').on(table.companyId, table.connectorId, table.id),
    // The Hub trims before it writes; the database refuses what escapes (as model_account_label_length, 1 to 60).
    check(
      'connection_name',
      sql`char_length(${table.name}) BETWEEN 1 AND 60 AND ${table.name} = btrim(${table.name})`,
    ),
    check('connection_state', sql`${table.state} IN ('NEW', 'ACTIVE', 'NEEDS_REAUTH')`),
    // One provider account is one connection, across companies: the index ignores the row policy,
    // and its 23505 does not say whose row it met.
    uniqueIndex('connection_account_key')
      .on(table.connectorId, table.accountRef)
      .where(sql`${table.accountRef} IS NOT NULL`),
    check(
      'connection_account',
      sql`(${table.accountRef} IS NULL) = (${table.accountLabel} IS NULL)
        AND (${table.accountLabel} IS NULL OR char_length(${table.accountLabel}) BETWEEN 1 AND 120)`,
    ),
    check('connection_connector_id', sql`${table.connectorId} ~ '^[a-z][a-z0-9-]{1,31}$'`),
    policy(SCOPE_ROLES.COMPANY, 'all', sql`company_id = ${scoped.companyId}`),
    pgPolicy('connection_seals_select', {
      for: 'select',
      to: 'hub_connection_seals',
      using: sql`true`,
    }),
  ],
)

/**
 * An OAuth authorization between its start and its return: the PKCE verifier, sealed, for the one
 * person who started it. It is spent once (security S22) and lives as long as the provider's code
 * (decision 0049). `connectionId` is set for Conectar de novo, with the connection's `revision` at
 * the start; `name` is set for a first link.
 */
export const connectionSignIn = connectors.table(
  'connection_sign_in',
  {
    id: uuid('id').primaryKey(),
    companyId: text('company_id').notNull(),
    personId: text('person_id').notNull(),
    connectorId: text('connector_id').notNull(),
    connectionId: uuid('connection_id'),
    name: text('name'),
    connectionRevision: integer('connection_revision'),
    sealed: bytea('sealed').notNull(),
    keyId: text('key_id').notNull(),
    expiresAt: instant('expires_at').notNull(),
  },
  (table) => [
    foreignKey({
      name: 'connection_sign_in_member_fkey',
      columns: [table.companyId, table.personId],
      foreignColumns: [member.organizationId, member.userId],
    }).onDelete('cascade'),
    // The row's company and connector are the connection's, so no scope writes a row about another
    // company's connection (as app_access_company_id_project_id_fkey). MATCH SIMPLE: a first link
    // has no connection.
    foreignKey({
      name: 'connection_sign_in_company_id_connector_id_connection_id_fkey',
      columns: [table.companyId, table.connectorId, table.connectionId],
      foreignColumns: [connection.companyId, connection.connectorId, connection.id],
    }).onDelete('cascade'),
    check(
      'connection_sign_in_name',
      sql`${table.name} IS NULL OR (char_length(${table.name}) BETWEEN 1 AND 60 AND ${table.name} = btrim(${table.name}))`,
    ),
    check(
      'connection_sign_in_target',
      sql`(${table.connectionId} IS NULL) <> (${table.name} IS NULL)
        AND (${table.connectionId} IS NULL) = (${table.connectionRevision} IS NULL)`,
    ),
    policy(
      SCOPE_ROLES.COMPANY,
      'all',
      sql`company_id = ${scoped.companyId}
      and (person_id = ${scoped.personId} or ${scoped.personId} is null)`,
    ),
  ],
)
