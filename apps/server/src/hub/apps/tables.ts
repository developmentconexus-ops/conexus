import { sql } from 'drizzle-orm'
import type { PgTableExtraConfigValue } from 'drizzle-orm/pg-core'
import {
  boolean,
  bytea,
  check,
  foreignKey,
  integer,
  jsonb,
  pgSchema,
  primaryKey,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core'
import { SCOPE_ROLES, scoped } from '../../platform/database.ts'
import { ADMINISTRATOR, policy, session } from '../identity/public.ts'
import { project } from '../projects/public.ts'

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

// A Projeto's app and its versions belong to a company, as its Projects do (decision 0039): the
// company's routes reach their own rows; the Central reads and deletes the rows of the one company
// it deletes. A version's files are kept by content, once per company (decision 0012).
const OWN_COMPANY = sql`company_id = ${scoped.companyId}`
const OPERATOR_COMPANY = sql`${ADMINISTRATOR} and company_id = ${scoped.companyId}`
const COMPANY_POLICIES = [
  policy(SCOPE_ROLES.COMPANY, 'all', OWN_COMPANY),
  policy(SCOPE_ROLES.OPERATOR, 'select', OPERATOR_COMPANY),
  policy(SCOPE_ROLES.OPERATOR, 'delete', OPERATOR_COMPANY),
]
/** The send's ceiling in bytes (APP_LIMITS), which no single file passes. */
const FILE_MAX_BYTES = 10 * 1024 * 1024

/**
 * One row per Projeto with an app: the version on the air (null: the example), the send in course
 * with the claim that ends it, and whether the app's schema and logins exist.
 */
export const app = apps.table(
  'app',
  {
    projectId: text('project_id').primaryKey(),
    companyId: text('company_id').notNull(),
    liveVersionId: text('live_version_id'),
    sendingVersionId: text('sending_version_id'),
    claimedUntil: instant('claimed_until'),
    databaseReady: boolean('database_ready').notNull().default(false),
  },
  // Typed, because the table and its versions name each other.
  (table): PgTableExtraConfigValue[] => [
    foreignKey({
      name: 'app_project_id_fkey',
      columns: [table.projectId],
      foreignColumns: [project.id],
    }).onDelete('cascade'),
    // The version on the air and the one being sent are versions of this Projeto.
    foreignKey({
      name: 'app_live_version_fkey',
      columns: [table.projectId, table.liveVersionId],
      foreignColumns: [appVersion.projectId, appVersion.id],
    }),
    foreignKey({
      name: 'app_sending_version_fkey',
      columns: [table.projectId, table.sendingVersionId],
      foreignColumns: [appVersion.projectId, appVersion.id],
    }),
    check(
      'app_sending_has_claim',
      sql`(${table.sendingVersionId} IS NULL) = (${table.claimedUntil} IS NULL)`,
    ),
    ...COMPANY_POLICIES,
  ],
)

export const appVersion = apps.table(
  'app_version',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id').notNull(),
    projectId: text('project_id').notNull(),
    number: integer('number').notNull(),
    state: text('state', { enum: ['sending', 'ready', 'failed', 'pruning'] }).notNull(),
    failure: text('failure'),
    manifest: jsonb('manifest').notNull(),
    digest: text('digest').notNull(),
    sentBy: text('sent_by').notNull(),
    attemptKey: text('attempt_key').notNull(),
    createdAt: instant('created_at').notNull(),
  },
  (table) => [
    foreignKey({
      name: 'app_version_project_id_fkey',
      columns: [table.projectId],
      foreignColumns: [app.projectId],
    }).onDelete('cascade'),
    unique('app_version_project_id_number_key').on(table.projectId, table.number),
    unique('app_version_project_id_attempt_key_key').on(table.projectId, table.attemptKey),
    unique('app_version_project_id_id_key').on(table.projectId, table.id),
    check('app_version_state', sql`${table.state} IN ('sending', 'ready', 'failed', 'pruning')`),
    check(
      'app_version_failed_has_failure',
      sql`${table.state} <> 'failed' OR ${table.failure} IS NOT NULL`,
    ),
    check('app_version_number_positive', sql`${table.number} > 0`),
    check('app_version_digest_form', sql`${table.digest} ~ '^[0-9a-f]{64}$'`),
    ...COMPANY_POLICIES,
  ],
)

export const blob = apps.table(
  'blob',
  {
    companyId: text('company_id').notNull(),
    sha256: text('sha256').notNull(),
    bytes: bytea('bytes').notNull(),
  },
  (table) => [
    primaryKey({ name: 'blob_pkey', columns: [table.companyId, table.sha256] }),
    check('blob_sha256_form', sql`${table.sha256} ~ '^[0-9a-f]{64}$'`),
    check('blob_size', sql`octet_length(${table.bytes}) <= ${sql.raw(String(FILE_MAX_BYTES))}`),
    ...COMPANY_POLICIES,
  ],
)

export const versionFile = apps.table(
  'version_file',
  {
    versionId: text('version_id').notNull(),
    companyId: text('company_id').notNull(),
    path: text('path').notNull(),
    sha256: text('sha256').notNull(),
    size: integer('size').notNull(),
    mediaType: text('media_type').notNull(),
  },
  (table) => [
    primaryKey({ name: 'version_file_pkey', columns: [table.versionId, table.path] }),
    foreignKey({
      name: 'version_file_version_id_fkey',
      columns: [table.versionId],
      foreignColumns: [appVersion.id],
    }).onDelete('cascade'),
    // A file in use keeps its bytes: removing a blob a version still names fails with 23503.
    foreignKey({
      name: 'version_file_blob_fkey',
      columns: [table.companyId, table.sha256],
      foreignColumns: [blob.companyId, blob.sha256],
    }),
    check('version_file_size', sql`${table.size} BETWEEN 0 AND ${sql.raw(String(FILE_MAX_BYTES))}`),
    ...COMPANY_POLICIES,
  ],
)
