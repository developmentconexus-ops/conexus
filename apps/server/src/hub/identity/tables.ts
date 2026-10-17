import { defineRelations, sql } from 'drizzle-orm'
import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgPolicy,
  pgSchema,
  text,
  timestamp,
  unique,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { RUNTIME_LOGIN, SCOPE_ROLES, scoped } from '../../platform/database.ts'

// The models of @better-auth/core 1.7.8 (db/get-tables) and of its organization() and admin()
// plugins: object keys are the library's field names.
export const auth = pgSchema('auth')

function instant(name: string) {
  return timestamp(name, { withTimezone: true })
}

// The row policies of decision 0039: each scope's role reaches only the rows its transaction's
// scope names, and admission still decides what the person may do with them (security S7).
const { companyId, personId, invitationId } = scoped
const OPEN = sql`true`

/**
 * The Hub's login keeps its reach on a company's tables until step 5's second phase, so the release
 * before this one still runs on the migrated database (data D6, the founder's answer H).
 */
export function transition() {
  return pgPolicy('runtime_transition', {
    for: 'all',
    to: RUNTIME_LOGIN,
    using: OPEN,
    withCheck: OPEN,
  })
}

/**
 * The operator's policies hold only for an installation administrator (security S11), answered by
 * the one function that reads auth.user as hub_administrators (migration
 * installation_administrator_check). Provisional until the founder's word.
 */
export const ADMINISTRATOR = sql`auth.is_installation_administrator(${personId})`
const ADMINISTRATORS = 'hub_administrators'

type Rows = ReturnType<typeof sql>
type Verb = 'select' | 'insert' | 'update' | 'delete'

/** A role's policy for one verb: the rows it reads or changes, and the rows it may leave. */
export function policy(role: string, verb: Verb | 'all', rows: Rows) {
  const name = `${role.replace('hub_', '')}_${verb}`
  if (verb === 'select' || verb === 'delete')
    return pgPolicy(name, { for: verb, to: role, using: rows })
  if (verb === 'insert') return pgPolicy(name, { for: verb, to: role, withCheck: rows })
  return pgPolicy(name, { for: verb, to: role, using: rows, withCheck: rows })
}

export const user = auth.table(
  'user',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    emailVerified: boolean('email_verified').notNull().default(false),
    image: text('image'),
    createdAt: instant('created_at').notNull().defaultNow(),
    updatedAt: instant('updated_at').notNull().defaultNow(),
    role: text('role'),
    banned: boolean('banned').default(false),
    banReason: text('ban_reason'),
    banExpires: instant('ban_expires'),
  },
  () => [
    // The login signs people in and reads them for the library, outside any scope.
    // The login signs people in, outside any scope (step 3).
    pgPolicy('runtime_sign_in', { for: 'all', to: RUNTIME_LOGIN, using: OPEN, withCheck: OPEN }),
    policy(
      SCOPE_ROLES.COMPANY,
      'all',
      sql`id = ${personId}
        or exists (select 1 from auth.member m where m.user_id = "user".id and m.company_id = ${companyId})
        or exists (select 1 from auth.invitation i where i.inviter_id = "user".id and i.company_id = ${companyId})`,
    ),
    policy(SCOPE_ROLES.PERSON, 'all', sql`id = ${personId}`),
    policy(
      SCOPE_ROLES.INVITATION,
      'all',
      sql`id = ${personId}
        or exists (select 1 from auth.invitation i where i.id = ${invitationId}
          and (i.inviter_id = "user".id or lower(i.email) = "user".email))`,
    ),
    // The function behind ADMINISTRATOR reads only the administrators.
    pgPolicy('administrators_select', {
      for: 'select',
      to: ADMINISTRATORS,
      using: sql`role = 'admin'`,
    }),
    policy(
      SCOPE_ROLES.OPERATOR,
      'all',
      sql`${ADMINISTRATOR} and (role = 'admin'
        or exists (select 1 from auth.member m where m.user_id = "user".id and m.role = 'owner'))`,
    ),
  ],
)

export const session = auth.table(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: instant('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: instant('created_at').notNull().defaultNow(),
    updatedAt: instant('updated_at').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    activeOrganizationId: text('active_organization_id'),
    impersonatedBy: text('impersonated_by'),
  },
  (table) => [index('session_user_id_idx').on(table.userId)],
)

export const account = auth.table(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: instant('access_token_expires_at'),
    refreshTokenExpiresAt: instant('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: instant('created_at').notNull().defaultNow(),
    updatedAt: instant('updated_at').notNull(),
  },
  (table) => [index('account_user_id_idx').on(table.userId)],
)

export const verification = auth.table(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: instant('expires_at').notNull(),
    createdAt: instant('created_at').notNull().defaultNow(),
    updatedAt: instant('updated_at').notNull().defaultNow(),
  },
  (table) => [index('verification_identifier_idx').on(table.identifier)],
)

export const rateLimit = auth.table('rate_limit', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  count: integer('count').notNull(),
  lastRequest: bigint('last_request', { mode: 'number' }).notNull(),
})

// The plugin's model "organization", named "company" by its own modelName option. The attempt key
// is the create's Idempotency-Key (code C37), and the slug is that key too.
export const company = auth.table(
  'company',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    logo: text('logo'),
    metadata: text('metadata'),
    createdAt: instant('created_at').notNull(),
    attemptKey: text('attempt_key').notNull().unique(),
  },
  () => [
    transition(),
    policy(SCOPE_ROLES.COMPANY, 'all', sql`id = ${companyId}`),
    policy(
      SCOPE_ROLES.PERSON,
      'select',
      sql`exists (select 1 from auth.member m where m.company_id = company.id and m.user_id = ${personId})`,
    ),
    policy(
      SCOPE_ROLES.INVITATION,
      'all',
      sql`exists (select 1 from auth.invitation i where i.id = ${invitationId} and i.company_id = company.id)`,
    ),
    policy(SCOPE_ROLES.OPERATOR, 'all', ADMINISTRATOR),
  ],
)

export const member = auth.table(
  'member',
  {
    id: text('id').primaryKey(),
    organizationId: text('company_id')
      .notNull()
      .references(() => company.id, { onDelete: 'restrict' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    role: text('role').notNull(),
    createdAt: instant('created_at').notNull(),
  },
  (table) => [
    unique('member_company_id_user_id_key').on(table.organizationId, table.userId),
    index('member_user_id_idx').on(table.userId),
    transition(),
    policy(SCOPE_ROLES.COMPANY, 'all', sql`company_id = ${companyId}`),
    policy(SCOPE_ROLES.PERSON, 'select', sql`user_id = ${personId}`),
    policy(
      SCOPE_ROLES.INVITATION,
      'insert',
      sql`user_id = ${personId}
        and exists (select 1 from auth.invitation i where i.id = ${invitationId} and i.company_id = member.company_id)`,
    ),
    // Owners for the Central's list; with a company, all its members, for the delete to read.
    policy(
      SCOPE_ROLES.OPERATOR,
      'select',
      sql`${ADMINISTRATOR} and (role = 'owner' or company_id = ${companyId})`,
    ),
    policy(SCOPE_ROLES.OPERATOR, 'delete', sql`${ADMINISTRATOR} and company_id = ${companyId}`),
  ],
)

export const invitation = auth.table(
  'invitation',
  {
    id: text('id').primaryKey(),
    organizationId: text('company_id')
      .notNull()
      .references(() => company.id, { onDelete: 'restrict' }),
    email: text('email').notNull(),
    role: text('role'),
    status: text('status').notNull(),
    expiresAt: instant('expires_at').notNull(),
    createdAt: instant('created_at').notNull(),
    inviterId: text('inviter_id')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    attemptKey: text('attempt_key').notNull(),
    // When the provider answered the invitation's e-mail; NULL until then, so a replay sends it (C64).
    mailedAt: instant('mailed_at'),
    revision: integer('revision').notNull().default(0),
    supersededAt: instant('superseded_at'),
    replaces: jsonb('replaces'),
  },
  (table) => [
    // One open invitation per company and address: the plugin checks before it writes, so two
    // invitations at once would both pass without this index.
    uniqueIndex('invitation_pending_email_key')
      .on(table.organizationId, sql`lower(${table.email})`)
      .where(sql`${table.status} = 'pending'`),
    unique('invitation_company_id_attempt_key_key').on(table.organizationId, table.attemptKey),
    index('invitation_email_idx').on(table.email),
    transition(),
    policy(SCOPE_ROLES.COMPANY, 'all', sql`company_id = ${companyId}`),
    policy(
      SCOPE_ROLES.PERSON,
      'select',
      sql`inviter_id = ${personId}
        or lower(email) = (select u.email from auth."user" u where u.id = ${personId})`,
    ),
    policy(SCOPE_ROLES.INVITATION, 'all', sql`id = ${invitationId}`),
    // First owners' invitations, which the Central sends; with a company, all of its invitations,
    // because PostgreSQL reads a row through the SELECT policy before a filtered DELETE removes it.
    policy(
      SCOPE_ROLES.OPERATOR,
      'select',
      sql`${ADMINISTRATOR} and (role = 'owner' or company_id = ${companyId})`,
    ),
    policy(SCOPE_ROLES.OPERATOR, 'insert', sql`${ADMINISTRATOR} and role = 'owner'`),
    policy(SCOPE_ROLES.OPERATOR, 'update', sql`${ADMINISTRATOR} and role = 'owner'`),
    policy(SCOPE_ROLES.OPERATOR, 'delete', sql`${ADMINISTRATOR} and company_id = ${companyId}`),
  ],
)

/**
 * The joins the library asks for, by the names its relations-v2 adapter looks up: the joined model
 * for one row, the model plus "s" for many (@better-auth/drizzle-adapter dist/relations-v2,
 * getJoinRelationKey). With them each join is one query, never one per row on one connection.
 */
export const relations = defineRelations(
  { user, session, account, verification, rateLimit, company, member, invitation },
  (r) => ({
    user: { accounts: r.many.account() },
    session: { user: r.one.user({ from: r.session.userId, to: r.user.id }) },
    account: { user: r.one.user({ from: r.account.userId, to: r.user.id }) },
    company: { members: r.many.member(), invitations: r.many.invitation() },
    member: {
      user: r.one.user({ from: r.member.userId, to: r.user.id }),
      company: r.one.company({ from: r.member.organizationId, to: r.company.id }),
    },
    invitation: {
      company: r.one.company({ from: r.invitation.organizationId, to: r.company.id }),
    },
  }),
)
