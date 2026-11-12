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
/** The columns of a copy of accounts, the engine's own beside `_pass`: the provider's account and the company's name for its connection. */
export const COPY_ACCOUNT_COLUMN = '_account'
export const COPY_ACCOUNT_NAME_COLUMN = '_account_name'

/**
 * What the company's database keeps of a copy, as the kit's parsed `CopyDefinition` gives it: the
 * platform never imports the kit (security S36), so it names only the shape it writes.
 */
export type CopyTable = Readonly<{
  name: string
  definition: Readonly<{
    columns: readonly Readonly<{ name: string; type: CopyColumnType; description?: string }>[]
    key: readonly string[]
    changedSince: Readonly<{ column: string }> | null
    window?: Readonly<{ column: string }>
    description?: string
  }>
  /** The connector's account is not `none`: each row carries `_account` and `_account_name`, and the key starts with `_account`. */
  accounts: boolean
  /** OFFSET (version 2): a timestamp is `timestamptz`, a provider's instant with its offset; LOCAL (version 1) keeps a database's local hour. */
  instants: 'LOCAL' | 'OFFSET'
}>
type CopyColumnType = 'text' | 'numeric' | 'bigint' | 'date' | 'timestamp' | 'boolean' | 'json'
export type CopyRows = readonly (readonly (string | null)[])[]
/** The account a page or a pass belongs to, in a copy of accounts; null in one whose connector has none. */
export type CopyAccount = Readonly<{ ref: string; name: string }> | null

const SQL_TYPE: Readonly<Record<CopyColumnType, string>> = {
  text: 'text',
  numeric: 'numeric',
  bigint: 'bigint',
  date: 'date',
  timestamp: 'timestamp',
  boolean: 'boolean',
  json: 'jsonb',
}

function sqlTypeOf(table: CopyTable, type: CopyColumnType): string {
  return type === 'timestamp' && table.instants === 'OFFSET' ? 'timestamptz' : SQL_TYPE[type]
}

function keyOf(table: CopyTable): string[] {
  const key = table.definition.key.map(quoted)
  return table.accounts ? [COPY_ACCOUNT_COLUMN, ...key] : key
}

/**
 * The descriptions as `COMMENT ON`, whose text cannot be a bound parameter: the descriptions travel
 * bound in a setting of the transaction, and `format('%L')` quotes them (data D20).
 */
function commentsOf(table: CopyTable): SqlStatement[] {
  const columns = Object.fromEntries(
    table.definition.columns.flatMap((c) => (c.description ? [[c.name, c.description]] : [])),
  )
  const described = table.definition.description
  if (described === undefined && Object.keys(columns).length === 0) return []
  const comments = { name: table.name, table: described ?? null, columns }
  return [
    {
      text: `SELECT set_config('conexus.copy_comments', $1, true)`,
      values: [JSON.stringify(comments)],
    },
    {
      text: `DO $$
        DECLARE c jsonb := current_setting('conexus.copy_comments')::jsonb; e record;
        BEGIN
          IF c->>'table' IS NOT NULL THEN
            EXECUTE format('COMMENT ON TABLE sync.%I IS %L', c->>'name', c->>'table');
          END IF;
          FOR e IN SELECT * FROM jsonb_each_text(c->'columns') LOOP
            EXECUTE format('COMMENT ON COLUMN sync.%I.%I IS %L', c->>'name', e.key, e.value);
          END LOOP;
        END $$`,
    },
  ]
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

/**
 * The copy's table: its typed columns, the account's two columns in a copy of accounts, its key as
 * primary key (after `_account`), the pass that last wrote each row, the window's index and the
 * descriptions.
 */
export function ensureCopyTable(
  context: Context,
  sync: DatabaseUrl,
  table: CopyTable,
): Promise<SqlAnswer> {
  const { name, definition } = table
  const columns = definition.columns.map((c) => `${quoted(c.name)} ${sqlTypeOf(table, c.type)}`)
  const accounts = table.accounts
    ? [`${COPY_ACCOUNT_COLUMN} text NOT NULL`, `${COPY_ACCOUNT_NAME_COLUMN} text NOT NULL`]
    : []
  const statements: SqlStatement[] = [
    {
      text: `CREATE TABLE IF NOT EXISTS ${tableOf(name)} (${[...columns, ...accounts].join(', ')},
        ${COPY_PASS_COLUMN} integer NOT NULL, PRIMARY KEY (${keyOf(table).join(', ')}))`,
    },
    ...commentsOf(table),
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
 * with the copy's types, each written with the pass (and, in a copy of accounts, the page's account
 * and its name), a row of the same key written over.
 */
export async function writePage(
  context: Context,
  sync: DatabaseUrl,
  input: CopyTable & { pass: number; rows: CopyRows; account: CopyAccount },
  signal: AbortSignal,
): Promise<SqlAnswer> {
  if (input.rows.length === 0) return { kind: 'DONE', value: [] }
  const { columns, key } = input.definition
  const names = columns.map((c) => quoted(c.name))
  // A json cell travels as its text and is cast in the SELECT: the database parses it, not the Hub.
  const record = columns.map(
    (c) => `${quoted(c.name)} ${c.type === 'json' ? 'text' : sqlTypeOf(input, c.type)}`,
  )
  const picked = columns.map((c, at) => `r.${names[at]}${c.type === 'json' ? '::jsonb' : ''}`)
  const keys = new Set(key)
  const own = input.account === null ? [] : [COPY_ACCOUNT_COLUMN, COPY_ACCOUNT_NAME_COLUMN]
  const updated = [
    ...columns.filter((c) => !keys.has(c.name)).map((c) => quoted(c.name)),
    ...own.slice(1),
    COPY_PASS_COLUMN,
  ].map((column) => `${column} = EXCLUDED.${column}`)
  const objects = input.rows.map((row) =>
    Object.fromEntries(columns.map((c, at) => [c.name, row[at] ?? null])),
  )
  const accountValues = input.account === null ? [] : [input.account.ref, input.account.name]
  return context.transport(
    sync,
    [
      {
        text: `INSERT INTO ${tableOf(input.name)} (${[...names, ...own, COPY_PASS_COLUMN].join(', ')})
          SELECT ${[...picked, ...own.map((_, at) => `$${at + 3}::text`)].join(', ')}, $2::integer
          FROM jsonb_to_recordset($1::jsonb) AS r(${record.join(', ')})
          ON CONFLICT (${keyOf(input).join(', ')}) DO UPDATE SET ${updated.join(', ')}`,
        values: [JSON.stringify(objects), input.pass, ...accountValues],
      },
    ],
    budget(signal),
  )
}

/** In a copy of accounts, what a pass's close touches is its own account's rows alone. */
function ofAccount(
  account: CopyAccount,
  at: number,
): Readonly<{ where: string; values: string[] }> {
  return account === null
    ? { where: '', values: [] }
    : { where: ` AND ${COPY_ACCOUNT_COLUMN} = $${at}`, values: [account.ref] }
}

/**
 * The end of a complete pass of one source: a copy with no change date leaves every row of the
 * source's account the pass did not write; one with a window, every such row of the window; the
 * account's rows take the connection's name as it is now; then the count of the whole table.
 */
export async function closePass(
  context: Context,
  sync: DatabaseUrl,
  input: CopyTable & { pass: number; windowFrom: string | null; account: CopyAccount },
  signal: AbortSignal,
): Promise<{ kind: 'DONE'; rows: number } | Exclude<SqlAnswer, { kind: 'DONE' }>> {
  const { changedSince, window } = input.definition
  const { account } = input
  const table = tableOf(input.name)
  const whole = ofAccount(account, 2)
  const windowed = ofAccount(account, 3)
  const gone: SqlStatement[] =
    changedSince === null
      ? [
          {
            text: `DELETE FROM ${table} WHERE ${COPY_PASS_COLUMN} <> $1${whole.where}`,
            values: [input.pass, ...whole.values],
          },
        ]
      : window !== undefined && input.windowFrom !== null
        ? [
            {
              text: `DELETE FROM ${table} WHERE ${quoted(window.column)} >= $1::date AND ${COPY_PASS_COLUMN} <> $2${windowed.where}`,
              values: [input.windowFrom, input.pass, ...windowed.values],
            },
          ]
        : []
  const named: SqlStatement[] =
    account === null
      ? []
      : [
          {
            text: `UPDATE ${table} SET ${COPY_ACCOUNT_NAME_COLUMN} = $2
              WHERE ${COPY_ACCOUNT_COLUMN} = $1 AND ${COPY_ACCOUNT_NAME_COLUMN} IS DISTINCT FROM $2`,
            values: [account.ref, account.name],
          },
        ]
  const answer = await context.transport(
    sync,
    [...gone, ...named, { text: `SELECT count(*)::text AS n FROM ${table}` }],
    budget(signal),
  )
  if (answer.kind !== 'DONE') return answer
  return { kind: 'DONE', rows: Number(answer.value.at(-1)?.[0]?.n) }
}

/** SQLSTATE of no such table: a copy's table already dropped, or never made. */
const NO_TABLE = '42P01'

/** One statement as the sync login, within the call's budget. */
function sent(context: Context, sync: DatabaseUrl, statement: SqlStatement, signal?: AbortSignal) {
  return context.transport(sync, [statement], budget(signal))
}

/** An answer that found no table: nothing left to take out. */
function doneWithoutTable(answer: SqlAnswer): SqlAnswer {
  return answer.kind === 'REFUSED' && answer.code === NO_TABLE
    ? { kind: 'DONE', value: [] }
    : answer
}

/** Desligar: the account's rows out of a copy that goes on with other accounts; repeatable. */
export async function dropAccountRows(
  context: Context,
  sync: DatabaseUrl,
  input: { copy: string; ref: string },
): Promise<SqlAnswer> {
  const text = `DELETE FROM ${tableOf(input.copy)} WHERE ${COPY_ACCOUNT_COLUMN} = $1`
  return doneWithoutTable(await sent(context, sync, { text, values: [input.ref] }))
}

/**
 * The run's net under Desligar: the rows whose account is no source's leave, a page a run wrote while
 * its connection was being removed; repeatable.
 */
export async function dropForeignRows(
  context: Context,
  sync: DatabaseUrl,
  input: { copy: string; refs: readonly string[] },
  signal: AbortSignal,
): Promise<SqlAnswer> {
  const text = `DELETE FROM ${tableOf(input.copy)} WHERE ${COPY_ACCOUNT_COLUMN} <> ALL($1::text[])`
  return sent(context, sync, { text, values: [input.refs] }, signal)
}

/** The rows of one account in a copy of accounts, as Desligar tells them before the click. */
export async function accountRows(
  context: Context,
  sync: DatabaseUrl,
  input: { copy: string; ref: string },
): Promise<{ kind: 'DONE'; rows: number } | Exclude<SqlAnswer, { kind: 'DONE' }>> {
  const text = `SELECT count(*)::text AS n FROM ${tableOf(input.copy)} WHERE ${COPY_ACCOUNT_COLUMN} = $1`
  const answer = await sent(context, sync, { text, values: [input.ref] })
  if (answer.kind !== 'DONE') return answer
  return { kind: 'DONE', rows: Number(answer.value.at(-1)?.[0]?.n) }
}

/** The table of a copy that ended: the app logins' `SELECT` goes with it; repeatable. */
export function dropCopyTable(
  context: Context,
  sync: DatabaseUrl,
  input: { copy: string },
): Promise<SqlAnswer> {
  return sent(context, sync, { text: `DROP TABLE IF EXISTS ${tableOf(input.copy)}` })
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
