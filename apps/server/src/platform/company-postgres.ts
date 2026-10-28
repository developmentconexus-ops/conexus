import { createHash } from 'node:crypto'
import type { Manifest } from '@conexus/app-contract'
import { APP_CALL_LIMITS } from '@conexus/app-contract'
import type { ProjectId } from '@conexus/hub-api'
import { appLogin, appLoginPassword } from '@conexus/hub-api'
import { NeonDbError, neon, neonConfig } from '@neondatabase/serverless'
import { cappedText } from './capped-text.ts'
import type { AppLoginKey } from './config.ts'
import { DatabaseUrl } from './database.ts'
import { OUTCOME_AFTER, OUTCOME_BEFORE } from './migration-outcome.ts'
import type { RuleBreak } from './migration-rule.ts'
import { ruleBreak } from './migration-rule.ts'
import { NEON_CALL_BUDGET_MS } from './neon.ts'

export type SqlStatement = Readonly<{ text: string; values?: readonly unknown[] }>
type Row = Readonly<Record<string, unknown>>

/** What PostgreSQL said to one transaction: a SQLSTATE left no effect; silence may have left it. */
export type SqlAnswer =
  | { kind: 'DONE'; value: Row[][] }
  | { kind: 'REFUSED'; code: string; table?: string; column?: string; constraint?: string }
  | { kind: 'NO_ANSWER' }

/** Runs the statements in one transaction as the URL's login, all or none. */
export type SqlTransport = (
  url: DatabaseUrl,
  statements: readonly SqlStatement[],
  signal: AbortSignal,
) => Promise<SqlAnswer>

// Classes 08 and 57P0: the connection or the server went away, and the commit may have happened.
const CONNECTION_LOST = /^(08|57P0)/

/**
 * A SQLSTATE refuses with the names it carries; none, or a lost connection, is silence. Never
 * `detail`, which holds values (code C52, security S40).
 */
export function answerOf(
  error:
    | Readonly<{ code?: string; table?: string; column?: string; constraint?: string }>
    | undefined,
): SqlAnswer {
  const code = error?.code
  if (code === undefined || CONNECTION_LOST.test(code)) return { kind: 'NO_ANSWER' }
  const { table, column, constraint } = error ?? {}
  return { kind: 'REFUSED', code, ...present({ table, column, constraint }) }
}

/** The entries that hold a value: an absent name stays absent, not `undefined`. */
export function present<T extends Record<string, string | undefined>>(
  names: T,
): Partial<Record<keyof T, string>> {
  const held = Object.entries(names).filter(([, value]) => value !== undefined)
  return Object.fromEntries(held) as Partial<Record<keyof T, string>>
}

/** A SQL reply past this is silence: the Hub's own statements read a few rows (code C59). */
const REPLY_CAP_BYTES = 1024 * 1024

/** Neon's reply read only up to the cap; past it the call fails as silence. */
async function cappedFetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
  const response = await fetch(input, init)
  const text = await cappedText(response.body, REPLY_CAP_BYTES)
  if (text === undefined) throw new Error('a Neon reply passed the size cap')
  const type = response.headers.get('content-type') ?? 'application/json'
  return new Response(text, { status: response.status, headers: { 'content-type': type } })
}

// The SDK reads a reply whole, and takes its own fetch only for the whole process.
neonConfig.fetchFunction = cappedFetch

/** The program's transport: Neon's HTTP proxy, one request per transaction (decision 0043). */
export async function neonTransport(
  url: DatabaseUrl,
  statements: readonly SqlStatement[],
  signal: AbortSignal,
): Promise<SqlAnswer> {
  try {
    const sql = neon(url.reveal(), { fetchOptions: { signal } })
    const value: Row[][] = await sql.transaction(
      statements.map(({ text, values }) => sql.query(text, [...(values ?? [])])),
    )
    return { kind: 'DONE', value }
  } catch (error) {
    return answerOf(error instanceof NeonDbError ? error : undefined)
  }
}

type AppMigration = Manifest['migrations'][number]
type MigrateAnswer =
  | { kind: 'DONE'; applied: number }
  | { kind: 'CHANGED'; id: string }
  | { kind: 'REFUSED_BY_RULE'; rule: RuleBreak }
  | Extract<SqlAnswer, { kind: 'REFUSED' | 'NO_ANSWER' }>

export type CompanyPostgres = {
  ensureApp(owner: DatabaseUrl, projectId: ProjectId): Promise<SqlAnswer>
  migrate(
    owner: DatabaseUrl,
    projectId: ProjectId,
    migrations: readonly AppMigration[],
  ): Promise<MigrateAnswer>
  dropApp(owner: DatabaseUrl, projectId: ProjectId): Promise<SqlAnswer>
}

/** An identifier as SQL reads it: the Projeto's id keeps its case. */
function quoted(name: string): string {
  return `"${name.replaceAll('"', '""')}"`
}

/** The ledger of the app's migrations, in its schema; the run login cannot read it. */
const LEDGER = 'conexus_migration'

/** The SHA-256 of a migration's statements, which the ledger keeps (decision 0046). */
function migrationDigest(migration: AppMigration): string {
  return createHash('sha256').update(JSON.stringify(migration.statements)).digest('hex')
}

function appliedOf(row: Row) {
  return { id: String(row.id), sha256: String(row.sha256) }
}

type Context = { transport: SqlTransport; key: string }

/** The address of one of the app's logins, its password derived for this act alone. */
async function asLogin(context: Context, owner: DatabaseUrl, login: string): Promise<DatabaseUrl> {
  const url = new URL(owner.reveal())
  url.username = login
  url.password = await appLoginPassword({ key: context.key, login })
  return DatabaseUrl.parse(url.toString())
}

async function existingRoles(
  context: Context,
  owner: DatabaseUrl,
  names: string[],
  signal: AbortSignal,
) {
  const found = await context.transport(
    owner,
    [{ text: 'SELECT rolname FROM pg_roles WHERE rolname = ANY($1::text[])', values: [names] }],
    signal,
  )
  if (found.kind !== 'DONE') return found
  const existing = new Set(found.value[0]?.map((row) => String(row.rolname)))
  return { kind: 'DONE', names: existing } as const
}

/**
 * The schema's statements: owned by the migration login, which the owner holds by SET alone and
 * never inherits; the ledger is made before the default grants, so the run login never reaches it.
 * Only the run login has the call's timeouts (decision 0047): on the migration login the
 * transaction timeout would cut a version's one migration transaction (decision 0046), so the
 * repair takes back the statement timeout step 9 gave it.
 */
function schemaStatements(projectId: ProjectId): SqlStatement[] {
  const { schema, runLogin, migrateLogin } = appLogin(projectId)
  const [s, run, migrate] = [schema, runLogin, migrateLogin].map(quoted)
  return [
    { text: `GRANT ${migrate} TO CURRENT_USER WITH INHERIT FALSE, SET TRUE` },
    { text: `CREATE SCHEMA IF NOT EXISTS ${s} AUTHORIZATION ${migrate}` },
    { text: `ALTER ROLE ${run} SET search_path = ${s}` },
    { text: `ALTER ROLE ${migrate} SET search_path = ${s}` },
    { text: `ALTER ROLE ${run} SET statement_timeout = ${APP_CALL_LIMITS.statementTimeoutMs}` },
    { text: `ALTER ROLE ${run} SET transaction_timeout = ${APP_CALL_LIMITS.transactionTimeoutMs}` },
    { text: `ALTER ROLE ${migrate} RESET statement_timeout` },
    { text: `SET LOCAL ROLE ${migrate}` },
    {
      text: `CREATE TABLE IF NOT EXISTS ${s}.${LEDGER} (id text PRIMARY KEY, sha256 text NOT NULL,
        applied_at timestamptz NOT NULL DEFAULT statement_timestamp())`,
    },
    { text: `GRANT USAGE ON SCHEMA ${s} TO ${run}` },
    {
      text: `ALTER DEFAULT PRIVILEGES IN SCHEMA ${s} GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${run}`,
    },
    { text: `ALTER DEFAULT PRIVILEGES IN SCHEMA ${s} GRANT USAGE, SELECT ON SEQUENCES TO ${run}` },
  ]
}

/** The schema and both logins, in one transaction; what a cut run left is found, not made twice. */
async function ensureApp(
  context: Context,
  owner: DatabaseUrl,
  projectId: ProjectId,
): Promise<SqlAnswer> {
  const signal = AbortSignal.timeout(NEON_CALL_BUDGET_MS)
  const { runLogin, migrateLogin } = appLogin(projectId)
  const roles = await existingRoles(context, owner, [migrateLogin, runLogin], signal)
  if (roles.kind !== 'DONE') return roles
  const created: SqlStatement[] = []
  for (const login of [migrateLogin, runLogin]) {
    if (roles.names.has(login)) continue
    const password = await appLoginPassword({ key: context.key, login })
    created.push({ text: `CREATE ROLE ${quoted(login)} LOGIN PASSWORD '${password}'` })
  }
  return context.transport(owner, [...created, ...schemaStatements(projectId)], signal)
}

/**
 * Every pending migration in one transaction with its ledger rows, as the migration login; an
 * applied one whose statements changed refuses them all (decision 0046). One the version does not
 * name is a later version's, kept when Voltar put an earlier one back: its tables stay as they are.
 * The transaction commits only if every value saved before is still there and the previous version
 * still reads and writes (B, 2026-10-27).
 */
async function migrate(
  context: Context,
  input: { owner: DatabaseUrl; projectId: ProjectId; migrations: readonly AppMigration[] },
): Promise<MigrateAnswer> {
  const signal = AbortSignal.timeout(NEON_CALL_BUDGET_MS)
  const { schema, migrateLogin } = appLogin(input.projectId)
  const ledger = `${quoted(schema)}.${LEDGER}`
  const url = await asLogin(context, input.owner, migrateLogin)
  const read = await context.transport(url, [{ text: `SELECT id, sha256 FROM ${ledger}` }], signal)
  if (read.kind !== 'DONE') return read
  const digests = new Map(input.migrations.map((one) => [one.id, migrationDigest(one)]))
  const applied = (read.value[0] ?? []).map(appliedOf)
  const changed = applied.find((row) => digests.has(row.id) && digests.get(row.id) !== row.sha256)
  if (changed !== undefined) return { kind: 'CHANGED', id: changed.id }
  const done = new Set(applied.map((row) => row.id))
  const pending = input.migrations.filter((one) => !done.has(one.id))
  if (pending.length === 0) return { kind: 'DONE', applied: 0 }
  // The outcome check cannot see what acts after the transaction: the fixed list refuses it first.
  const rule = ruleBreak(pending)
  if (rule !== undefined) return { kind: 'REFUSED_BY_RULE', rule }
  const ran = await context.transport(
    url,
    [
      OUTCOME_BEFORE,
      ...pending.flatMap((one) => [
        ...one.statements.map((text) => ({ text })),
        {
          text: `INSERT INTO ${ledger} (id, sha256) VALUES ($1, $2)`,
          values: [one.id, digests.get(one.id)],
        },
      ]),
      OUTCOME_AFTER,
    ],
    signal,
  )
  return ran.kind === 'DONE' ? { kind: 'DONE', applied: pending.length } : ran
}

/** The schema with every table of the app, then both logins; what is already gone is skipped. */
async function dropApp(
  context: Context,
  owner: DatabaseUrl,
  projectId: ProjectId,
): Promise<SqlAnswer> {
  const signal = AbortSignal.timeout(NEON_CALL_BUDGET_MS)
  const { schema, runLogin, migrateLogin } = appLogin(projectId)
  const roles = await existingRoles(context, owner, [migrateLogin, runLogin], signal)
  if (roles.kind !== 'DONE') return roles
  const schemaGone: SqlStatement[] = roles.names.has(migrateLogin)
    ? [
        { text: `SET LOCAL ROLE ${quoted(migrateLogin)}` },
        { text: `DROP SCHEMA IF EXISTS ${quoted(schema)} CASCADE` },
        { text: 'RESET ROLE' },
      ]
    : []
  return context.transport(
    owner,
    [
      ...schemaGone,
      { text: `DROP ROLE IF EXISTS ${quoted(runLogin)}` },
      { text: `DROP ROLE IF EXISTS ${quoted(migrateLogin)}` },
    ],
    signal,
  )
}

/**
 * The apps' schemas and logins in a company's database, by SQL as its owner (decision 0043): each
 * act is one transaction, repeatable after a cut, and the app's logins' passwords are derived from
 * the key here, never kept.
 */
export function createCompanyPostgres(deps: {
  transport: SqlTransport
  appLoginKey: AppLoginKey
}): CompanyPostgres {
  const context: Context = { transport: deps.transport, key: deps.appLoginKey.reveal() }
  return Object.freeze({
    ensureApp: (owner, projectId) => ensureApp(context, owner, projectId),
    migrate: (owner, projectId, migrations) => migrate(context, { owner, projectId, migrations }),
    dropApp: (owner, projectId) => dropApp(context, owner, projectId),
  })
}
