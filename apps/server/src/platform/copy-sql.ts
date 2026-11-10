import type { ProjectId } from '@conexus/hub-api'
import { appLogin, appLoginPassword } from '@conexus/hub-api'
import type { Context, SqlAnswer, SqlStatement } from './app-sql.ts'
import { missingLogins, quoted } from './app-sql.ts'
import { DatabaseUrl } from './database.ts'
import { COMPANY_DATABASE, NEON_CALL_BUDGET_MS } from './neon.ts'

/** The login that owns the copies in a company's database, and their schema. */
export const SYNC_LOGIN = 'conexus_sync'
const SYNC_SCHEMA = quoted('sync')
/** The column that holds the pass that last wrote each row: the engine's own. Only the Hub's catalog leaves it out; a read of the table itself still returns it (issue 946). */
export const COPY_PASS_COLUMN = '_pass'

/**
 * What the company's database keeps of a copy, as the kit's parsed `CopyDefinition` gives it: the
 * platform never imports the kit (security S36), so it names only the shape it writes.
 */
export type CopyTable = Readonly<{
  name: string
  definition: Readonly<{
    columns: readonly Readonly<{ name: string; type: CopyColumnType }>[]
    key: readonly string[]
    changedSince: Readonly<{ column: string }> | null
    window?: Readonly<{ column: string }>
  }>
}>
type CopyColumnType = 'text' | 'numeric' | 'bigint' | 'date' | 'timestamp' | 'boolean'
export type CopyRows = readonly (readonly (string | null)[])[]

const SQL_TYPE: Readonly<Record<CopyColumnType, string>> = {
  text: 'text',
  numeric: 'numeric',
  bigint: 'bigint',
  date: 'date',
  timestamp: 'timestamp',
  boolean: 'boolean',
}

function tableOf(name: string): string {
  return `${SYNC_SCHEMA}.${quoted(name)}`
}

/** The call's budget, and the caller's signal when it has one (code C57). */
function budget(signal?: AbortSignal): AbortSignal {
  const own = AbortSignal.timeout(NEON_CALL_BUDGET_MS)
  return signal === undefined ? own : AbortSignal.any([signal, own])
}

/** SQLSTATE of a role that exists already: a second act made it between the look and the act. */
const DUPLICATE_OBJECT = '42710'

/**
 * The `sync` schema and the login that owns it, as the company's owner, who holds that login by SET
 * alone, as it holds an app's migration login (decision 0043). What a cut act left is found.
 */
export async function ensureSync(context: Context, owner: DatabaseUrl): Promise<SqlAnswer> {
  const signal = budget()
  async function once() {
    const created = await missingLogins(context, owner, [SYNC_LOGIN], signal)
    if (!Array.isArray(created)) return created
    const sync = quoted(SYNC_LOGIN)
    return context.transport(
      owner,
      [
        ...created,
        { text: `GRANT ${sync} TO CURRENT_USER WITH INHERIT FALSE, SET TRUE` },
        { text: `CREATE SCHEMA IF NOT EXISTS ${SYNC_SCHEMA} AUTHORIZATION ${sync}` },
      ],
      signal,
    )
  }
  const first = await once()
  return first.kind === 'REFUSED' && first.code === DUPLICATE_OBJECT ? once() : first
}

/** Where the Hub reaches the sync login, from the host it recorded, with no call to Neon (as `readAddress`). */
export async function syncAddress(context: Context, host: string): Promise<DatabaseUrl> {
  const url = new URL(`postgresql://${host}/${COMPANY_DATABASE}?sslmode=require`)
  url.username = SYNC_LOGIN
  url.password = await appLoginPassword({ key: context.key, login: SYNC_LOGIN })
  return DatabaseUrl.parse(url.toString())
}

/** The copy's table: its typed columns, its key as primary key, the pass that last wrote each row, the window's index. */
export function ensureCopyTable(
  context: Context,
  sync: DatabaseUrl,
  { name, definition }: CopyTable,
): Promise<SqlAnswer> {
  const columns = definition.columns.map((c) => `${quoted(c.name)} ${SQL_TYPE[c.type]}`)
  const statements: SqlStatement[] = [
    {
      text: `CREATE TABLE IF NOT EXISTS ${tableOf(name)} (${columns.join(', ')},
        ${COPY_PASS_COLUMN} integer NOT NULL, PRIMARY KEY (${definition.key.map(quoted).join(', ')}))`,
    },
  ]
  if (definition.window !== undefined) {
    statements.push({
      text: `CREATE INDEX IF NOT EXISTS ${quoted(`${name}_window`)} ON ${tableOf(name)} (${quoted(definition.window.column)})`,
    })
  }
  return context.transport(sync, statements, budget())
}

/**
 * One page in one transaction: the rows as a JSON array of objects read by `jsonb_to_recordset`
 * with the copy's types, each written with the pass, a row of the same key written over.
 */
export async function writePage(
  context: Context,
  sync: DatabaseUrl,
  input: CopyTable & { pass: number; rows: CopyRows },
  signal: AbortSignal,
): Promise<SqlAnswer> {
  if (input.rows.length === 0) return { kind: 'DONE', value: [] }
  const { columns, key } = input.definition
  const names = columns.map((c) => quoted(c.name))
  const record = columns.map((c) => `${quoted(c.name)} ${SQL_TYPE[c.type]}`)
  const keys = new Set(key)
  const updated = [
    ...columns.filter((c) => !keys.has(c.name)).map((c) => quoted(c.name)),
    COPY_PASS_COLUMN,
  ].map((column) => `${column} = EXCLUDED.${column}`)
  const objects = input.rows.map((row) =>
    Object.fromEntries(columns.map((c, at) => [c.name, row[at] ?? null])),
  )
  return context.transport(
    sync,
    [
      {
        text: `INSERT INTO ${tableOf(input.name)} (${names.join(', ')}, ${COPY_PASS_COLUMN})
          SELECT ${names.map((n) => `r.${n}`).join(', ')}, $2::integer
          FROM jsonb_to_recordset($1::jsonb) AS r(${record.join(', ')})
          ON CONFLICT (${key.map(quoted).join(', ')}) DO UPDATE SET ${updated.join(', ')}`,
        values: [JSON.stringify(objects), input.pass],
      },
    ],
    budget(signal),
  )
}

/**
 * The end of a complete pass: a copy with no change date leaves every row the pass did not write;
 * one with a window, every row of the window the pass did not write; then the count.
 */
export async function closePass(
  context: Context,
  sync: DatabaseUrl,
  input: CopyTable & { pass: number; windowFrom: string | null },
  signal: AbortSignal,
): Promise<{ kind: 'DONE'; rows: number } | Exclude<SqlAnswer, { kind: 'DONE' }>> {
  const { changedSince, window } = input.definition
  const table = tableOf(input.name)
  const gone: SqlStatement[] =
    changedSince === null
      ? [{ text: `DELETE FROM ${table} WHERE ${COPY_PASS_COLUMN} <> $1`, values: [input.pass] }]
      : window !== undefined && input.windowFrom !== null
        ? [
            {
              text: `DELETE FROM ${table} WHERE ${quoted(window.column)} >= $1::date AND ${COPY_PASS_COLUMN} <> $2`,
              values: [input.windowFrom, input.pass],
            },
          ]
        : []
  const answer = await context.transport(
    sync,
    [...gone, { text: `SELECT count(*)::text AS n FROM ${table}` }],
    budget(signal),
  )
  if (answer.kind !== 'DONE') return answer
  return { kind: 'DONE', rows: Number(answer.value.at(-1)?.[0]?.n) }
}

/** What the sync login gives a Projeto's run and read logins, which its owner made first. */
export function grantCopy(
  context: Context,
  sync: DatabaseUrl,
  input: { name: string; projectId: ProjectId },
): Promise<SqlAnswer> {
  const { runLogin, readLogin } = appLogin(input.projectId)
  const logins = [runLogin, readLogin].map(quoted).join(', ')
  return context.transport(
    sync,
    [
      { text: `GRANT USAGE ON SCHEMA ${SYNC_SCHEMA} TO ${logins}` },
      { text: `GRANT SELECT ON ${tableOf(input.name)} TO ${logins}` },
    ],
    budget(),
  )
}

/**
 * SQLSTATEs of nothing left to revoke: no sync login (`28000`, `28P01`), no `sync` schema
 * (`3F000`), no such table (`42P01`), the app's logins already dropped (`42704`).
 */
const NOTHING_TO_REVOKE = new Set(['28000', '28P01', '3F000', '42P01', '42704'])

/**
 * The `REVOKE` of one copy; `ALL`, of every copy and of the schema, so the app's logins can be
 * dropped after (`DROP ROLE` refuses a login that still holds a grant, `2BP01`).
 */
export async function revokeCopy(
  context: Context,
  sync: DatabaseUrl,
  input: { copy: string | 'ALL'; projectId: ProjectId },
): Promise<SqlAnswer> {
  const { runLogin, readLogin } = appLogin(input.projectId)
  const logins = [runLogin, readLogin].map(quoted).join(', ')
  const statements: SqlStatement[] =
    input.copy === 'ALL'
      ? [
          { text: `REVOKE ALL ON ALL TABLES IN SCHEMA ${SYNC_SCHEMA} FROM ${logins}` },
          { text: `REVOKE USAGE ON SCHEMA ${SYNC_SCHEMA} FROM ${logins}` },
        ]
      : [{ text: `REVOKE SELECT ON ${tableOf(input.copy)} FROM ${logins}` }]
  const answer = await context.transport(sync, statements, budget())
  return answer.kind === 'REFUSED' && NOTHING_TO_REVOKE.has(answer.code)
    ? { kind: 'DONE', value: [] }
    : answer
}
