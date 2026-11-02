import { ACCOUNT_KINDS, ACCOUNT_STATES, EFFORTS } from '@conexus/hub-api'
import { sql } from 'drizzle-orm'
import type { AnyPgColumn } from 'drizzle-orm/pg-core'
import {
  boolean,
  bytea,
  check,
  foreignKey,
  integer,
  pgPolicy,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'
import { ADMINISTRATOR, company, member, policy } from '../../hub/identity/public.ts'
import { SCOPE_ROLES, scoped } from '../../platform/database.ts'
import { builder } from '../schema/public.ts'

// Every row belongs to a company and leaves with it, and a person's rows leave with their
// membership: the foreign keys say so, and their cascade runs as the tables' owner (data D17).

function instant(name: string) {
  return timestamp(name, { withTimezone: true })
}

const OWN_COMPANY = sql`company_id = ${scoped.companyId}`
// A person's own rows are theirs alone: no one else in the company reads them (founder, D4). A
// company scope with no person is the Hub's own work on the company, such as `reseal`.
const OWN_OR_COMPANY = sql`company_id = ${scoped.companyId}
  and (person_id is null or person_id = ${scoped.personId} or ${scoped.personId} is null)`
const OPERATOR_COMPANY = sql`${ADMINISTRATOR} and company_id = ${scoped.companyId}`
// The role that owns builder.sealed_of, the one reader of `sealed` (Grant A); it cannot log in.
const SEALS = 'hub_model_seals'

function companyKey(name: string, table: { companyId: AnyPgColumn }) {
  return foreignKey({ name, columns: [table.companyId], foreignColumns: [company.id] }).onDelete(
    'cascade',
  )
}

/**
 * A model account of the company (no person) or of a person in it. Linking seals the credential and
 * stores no model (founder, D12). `position` orders one queue: one owner, one provider. Its unique
 * constraint is deferrable, so an order writes every position before it is checked; Drizzle cannot
 * declare that, so migration model_account_order adds it (data D5).
 */
export const modelAccount = builder.table(
  'model_account',
  {
    id: uuid('id').primaryKey(),
    companyId: text('company_id').notNull(),
    personId: text('person_id'),
    kind: text('kind', { enum: ACCOUNT_KINDS }).notNull(),
    provider: text('provider').notNull(),
    label: text('label').notNull(),
    position: integer('position').notNull(),
    state: text('state', { enum: ACCOUNT_STATES }).notNull(),
    sealed: bytea('sealed').notNull(),
    keyId: text('key_id').notNull(),
    // The last four characters of a key, the only part that ever leaves; a sign-in has none.
    hint: text('hint'),
    linkedBy: text('linked_by').notNull(),
    linkedAt: instant('linked_at').notNull(),
    revision: integer('revision').notNull(),
    // The creation's Idempotency-Key, or the sign-in's id it was completed from (code C37).
    attemptKey: text('attempt_key').notNull(),
    // Set by the queue when the provider answered 429 or 402: skipped until then (study D3).
    limitedUntil: instant('limited_until'),
    // The lease of a subscription's token refresh: one refresh at a time (security S34, data D25).
    refreshUntil: instant('refresh_until'),
    // The model ids the provider answered for this credential, as it sent them; null while unread
    // (a kind with no reader, a failed read, a row from before): then the registry's list stands.
    servedModels: text('served_models').array(),
    servedAt: instant('served_at'),
  },
  (table) => [
    companyKey('model_account_company_id_fkey', table),
    foreignKey({
      name: 'model_account_member_fkey',
      columns: [table.companyId, table.personId],
      foreignColumns: [member.organizationId, member.userId],
    }).onDelete('cascade'),
    unique('model_account_attempt_key').on(table.companyId, table.attemptKey),
    check(
      'model_account_kind',
      sql`${table.kind} IN ('api_key', 'claude_subscription', 'google_cliproxy')`,
    ),
    check('model_account_state', sql`${table.state} IN ('ready', 'paused', 'refused')`),
    check('model_account_label_length', sql`char_length(${table.label}) BETWEEN 1 AND 60`),
    check('model_account_position', sql`${table.position} >= 0`),
    check('model_account_hint', sql`(${table.kind} = 'api_key') = (${table.hint} IS NOT NULL)`),
    policy(SCOPE_ROLES.COMPANY, 'all', OWN_OR_COMPANY),
    pgPolicy('model_seals_select', { for: 'select', to: SEALS, using: sql`true` }),
  ],
)

/** A company account given to one of its people: while it has any, only they use it (P1, P3). */
export const modelAccountAssignee = builder.table(
  'model_account_assignee',
  {
    accountId: uuid('account_id').notNull(),
    companyId: text('company_id').notNull(),
    personId: text('person_id').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.accountId, table.personId] }),
    foreignKey({
      name: 'model_account_assignee_account_id_fkey',
      columns: [table.accountId],
      foreignColumns: [modelAccount.id],
    }).onDelete('cascade'),
    foreignKey({
      name: 'model_account_assignee_member_fkey',
      columns: [table.companyId, table.personId],
      foreignColumns: [member.organizationId, member.userId],
    }).onDelete('cascade'),
    policy(SCOPE_ROLES.COMPANY, 'all', OWN_COMPANY),
  ],
)

const EFFORT_LIST = sql.raw(EFFORTS.map((effort) => `'${effort}'`).join(', '))

/** The company's default model, any model of the registry (founder, C4), and its reasoning level. */
export const companyModel = builder.table(
  'company_model',
  {
    companyId: text('company_id').primaryKey(),
    model: text('model').notNull(),
    effort: text('effort', { enum: EFFORTS }).notNull().default('off'),
  },
  (table) => [
    companyKey('company_model_company_id_fkey', table),
    check('company_model_effort', sql`${table.effort} IN (${EFFORT_LIST})`),
    policy(SCOPE_ROLES.COMPANY, 'all', OWN_COMPANY),
  ],
)

/** A person's own default model and level in a company; it leaves with their membership (card 12.3). */
export const personModelDefault = builder.table(
  'person_model_default',
  {
    companyId: text('company_id').notNull(),
    personId: text('person_id').notNull(),
    model: text('model').notNull(),
    effort: text('effort', { enum: EFFORTS }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.companyId, table.personId] }),
    foreignKey({
      name: 'person_model_default_member_fkey',
      columns: [table.companyId, table.personId],
      foreignColumns: [member.organizationId, member.userId],
    }).onDelete('cascade'),
    check('person_model_default_effort', sql`${table.effort} IN (${EFFORT_LIST})`),
    policy(
      SCOPE_ROLES.COMPANY,
      'all',
      sql`company_id = ${scoped.companyId} and person_id = ${scoped.personId}`,
    ),
  ],
)

/** A sign-in kind the operators opened to the company; the API key needs no row (founder, D9). */
export const companyAccountKind = builder.table(
  'company_account_kind',
  {
    companyId: text('company_id').notNull(),
    kind: text('kind', { enum: ACCOUNT_KINDS }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.companyId, table.kind] }),
    companyKey('company_account_kind_company_id_fkey', table),
    check(
      'company_account_kind_kind',
      sql`${table.kind} IN ('claude_subscription', 'google_cliproxy')`,
    ),
    policy(SCOPE_ROLES.COMPANY, 'select', OWN_COMPANY),
    policy(SCOPE_ROLES.OPERATOR, 'select', OPERATOR_COMPANY),
    policy(SCOPE_ROLES.OPERATOR, 'insert', OPERATOR_COMPANY),
    policy(SCOPE_ROLES.OPERATOR, 'delete', OPERATOR_COMPANY),
  ],
)

/**
 * A sign-in between its start and its completion: what the vendor's flow needs to finish, sealed,
 * for the one person who started it. It is spent once (security S22) and lives until its flow's
 * window for the code ends.
 */
export const modelAccountSignIn = builder.table(
  'model_account_sign_in',
  {
    id: uuid('id').primaryKey(),
    companyId: text('company_id').notNull(),
    personId: text('person_id').notNull(),
    owner: text('owner', { enum: ['company', 'me'] }).notNull(),
    kind: text('kind', { enum: ACCOUNT_KINDS }).notNull(),
    label: text('label').notNull(),
    sealed: bytea('sealed').notNull(),
    keyId: text('key_id').notNull(),
    expiresAt: instant('expires_at').notNull(),
  },
  (table) => [
    foreignKey({
      name: 'model_account_sign_in_member_fkey',
      columns: [table.companyId, table.personId],
      foreignColumns: [member.organizationId, member.userId],
    }).onDelete('cascade'),
    check('model_account_sign_in_owner', sql`${table.owner} IN ('company', 'me')`),
    check(
      'model_account_sign_in_kind',
      sql`${table.kind} IN ('claude_subscription', 'google_cliproxy')`,
    ),
    check('model_account_sign_in_label_length', sql`char_length(${table.label}) BETWEEN 1 AND 60`),
    policy(
      SCOPE_ROLES.COMPANY,
      'all',
      sql`company_id = ${scoped.companyId}
      and (person_id = ${scoped.personId} or ${scoped.personId} is null)`,
    ),
    pgPolicy('model_seals_select', { for: 'select', to: SEALS, using: sql`true` }),
  ],
)

/**
 * The company's automatic switch: when every account of the chosen model's provider is out, a turn
 * goes on with the next model of `chain` (founder, card reading 1 A). Owners and administrators
 * write it at its `revision` (code C38).
 */
export const companyModelFallback = builder.table(
  'company_model_fallback',
  {
    companyId: text('company_id').primaryKey(),
    enabled: boolean('enabled').notNull(),
    chain: text('chain').array().notNull(),
    revision: integer('revision').notNull(),
  },
  (table) => [
    companyKey('company_model_fallback_company_id_fkey', table),
    policy(SCOPE_ROLES.COMPANY, 'all', OWN_COMPANY),
  ],
)

/**
 * One company-wide Observer and Reflector selection: null follows the conversation's model, 'auto'
 * is the cheap model of its provider, and a company with no row never chose, which reads 'auto'.
 */
export const observationalMemoryModels = builder.table(
  'observational_memory_models',
  {
    companyId: text('company_id').primaryKey(),
    observer: text('observer'),
    reflector: text('reflector'),
  },
  (table) => [
    companyKey('observational_memory_models_company_id_fkey', table),
    policy(SCOPE_ROLES.COMPANY, 'all', OWN_COMPANY),
  ],
)
