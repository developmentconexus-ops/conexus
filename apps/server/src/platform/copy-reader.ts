import { APP_CALL_LIMITS } from '@conexus/app-contract'
import type { ProjectId, RoleId } from '@conexus/hub-api'
import { appLogin, appLoginPassword } from '@conexus/hub-api'
import type { Context, ReadResult, SqlAnswer, SqlStatement } from './app-sql.ts'
import { missingLogins, quoted, REPLY_CAP_BYTES } from './app-sql.ts'
import {
  budget,
  DUPLICATE_OBJECT,
  ledgerHiddenFromReader,
  READ_LOGIN,
  READERS_LEDGER,
  ROLES_LOCK,
  SYNC_LOGIN,
  SYNC_SCHEMA,
  TICKETS,
  tableOf,
} from './copy-sql.ts'
import { DatabaseUrl } from './database.ts'
import { Failure } from './failure.ts'
import { COMPANY_DATABASE } from './neon.ts'

/** The longest name PostgreSQL keeps for a role, in bytes: a longer one is cut, and two roles would share it. */
const ROLE_NAME_MAX_BYTES = 63

/** The read login of one role of the company, whose id is its row in `auth.organization_role`. */
export function roleLogin(roleId: RoleId): string {
  const login = `conexus_role_${roleId}`
  if (Buffer.byteLength(login) > ROLE_NAME_MAX_BYTES) {
    throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'COPY_READER_NAME' } })
  }
  return login
}

function readSettingsOf(login: string): SqlStatement[] {
  const role = quoted(login)
  return [
    { text: `ALTER ROLE ${role} SET search_path = ${SYNC_SCHEMA}` },
    { text: `ALTER ROLE ${role} SET default_transaction_read_only = on` },
    { text: `ALTER ROLE ${role} SET statement_timeout = ${APP_CALL_LIMITS.statementTimeoutMs}` },
    {
      text: `ALTER ROLE ${role} SET transaction_timeout = ${APP_CALL_LIMITS.transactionTimeoutMs}`,
    },
  ]
}

/**
 * The login that reads the `sync` schema and nothing else, as the company's owner, after
 * `ensureSync`: read-only transactions as its default (depth) and `SELECT` alone as the barrier,
 * on today's tables and later ones. Repeatable, as `ensureReadLogin` of an app.
 */
async function ensureReader(context: Context, owner: DatabaseUrl): Promise<SqlAnswer> {
  const signal = budget()
  async function once() {
    const created = await missingLogins(context, owner, [READ_LOGIN], signal)
    if (!Array.isArray(created)) return created
    const [read, sync] = [READ_LOGIN, SYNC_LOGIN].map(quoted)
    return context.transport(
      owner,
      [
        ROLES_LOCK,
        ...created,
        ...readSettingsOf(READ_LOGIN),
        { text: `SET LOCAL ROLE ${sync}` },
        { text: `GRANT USAGE ON SCHEMA ${SYNC_SCHEMA} TO ${read}` },
        { text: `GRANT SELECT ON ALL TABLES IN SCHEMA ${SYNC_SCHEMA} TO ${read}` },
        ledgerHiddenFromReader(),
        {
          text: `ALTER DEFAULT PRIVILEGES IN SCHEMA ${SYNC_SCHEMA} GRANT SELECT ON TABLES TO ${read}`,
        },
      ],
      signal,
    )
  }
  const first = await once()
  return first.kind === 'REFUSED' && first.code === DUPLICATE_OBJECT ? once() : first
}

/** Where the Hub reaches one of the read logins, from the host it recorded, with no call to Neon. */
async function loginAddress(context: Context, host: string, login: string): Promise<DatabaseUrl> {
  const url = new URL(`postgresql://${host}/${COMPANY_DATABASE}?sslmode=require`)
  url.username = login
  url.password = await appLoginPassword({ key: context.key, login })
  return DatabaseUrl.parse(url.toString())
}

function takeReadersTicket(context: Context, owner: DatabaseUrl): Promise<SqlAnswer> {
  return context.transport(
    owner,
    [
      { text: `SET LOCAL ROLE ${quoted(SYNC_LOGIN)}` },
      { text: `SELECT nextval('${TICKETS}') AS ticket` },
    ],
    budget(),
  )
}

export type WantedReader = Readonly<{ roleId: RoleId; tables: readonly string[] }>
type ReadersAnswer = SqlAnswer | Readonly<{ kind: 'SUPERSEDED' }>

const SUPERSEDED = 'CXR01'

/**
 * SQLSTATEs of another act on the same objects between the look and the act: a login made
 * (`42710`), a catalog row updated (`XX000`), an object made (`23505`, `42P07`), a table dropped
 * (`42P01`). They get one more attempt.
 */
const RACES = new Set([DUPLICATE_OBJECT, 'XX000', '23505', '42P07', '42P01'])

type Wanted = Readonly<{ login: string; tables: readonly string[] }>

/** A `DO` block takes no parameters: the request reaches it through this setting, local to the transaction. */
const READERS_SETTING = 'conexus.readers'

const CREATE_MISSING = `DO $$ DECLARE made record; BEGIN
  FOR made IN SELECT w.login, w.password
    FROM jsonb_to_recordset(current_setting('${READERS_SETTING}')::jsonb -> 'logins') AS w(login text, password text)
    WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = w.login)
  LOOP
    EXECUTE format('CREATE ROLE %I LOGIN PASSWORD %L', made.login, made.password);
  END LOOP;
END $$`

const GRANT_EXISTING = `DO $$ DECLARE given record; BEGIN
  FOR given IN SELECT w.login, c.relname
    FROM jsonb_to_recordset(current_setting('${READERS_SETTING}')::jsonb -> 'granted') AS w(login text, name text)
    JOIN pg_class c ON c.relname = w.name AND c.relnamespace = 'sync'::regnamespace AND c.relkind IN ('r', 'p')
  LOOP
    EXECUTE format('GRANT SELECT ON ${SYNC_SCHEMA}.%I TO %I', given.relname, given.login);
  END LOOP;
END $$`

/**
 * Logins are the whole server's: another company's holds no USAGE on this `sync`. `DROP ROLE`
 * refuses a login that still holds a grant (`2BP01`), so the REVOKEs come first.
 */
const DROP_LEAVING = `DO $$ DECLARE
  kept text[] := ARRAY(SELECT w ->> 'login' FROM jsonb_array_elements(current_setting('${READERS_SETTING}')::jsonb -> 'logins') AS w);
  gone text;
BEGIN
  FOR gone IN SELECT rolname FROM pg_roles
    WHERE rolname LIKE 'conexus\\_role\\_%' AND has_schema_privilege(oid, 'sync', 'USAGE')
      AND rolname <> ALL (kept)
  LOOP
    SET LOCAL ROLE ${quoted(SYNC_LOGIN)};
    EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA ${SYNC_SCHEMA} FROM %I', gone);
    EXECUTE format('REVOKE USAGE ON SCHEMA ${SYNC_SCHEMA} FROM %I', gone);
    RESET ROLE;
    EXECUTE format('DROP ROLE %I', gone);
  END LOOP;
END $$`

async function reconcileOnce(
  context: Context,
  owner: DatabaseUrl,
  ticket: bigint,
  wanted: readonly Wanted[],
  signal: AbortSignal,
): Promise<SqlAnswer> {
  const sync = quoted(SYNC_LOGIN)
  const request = {
    logins: await Promise.all(
      wanted.map(async ({ login }) => ({
        login,
        password: await appLoginPassword({ key: context.key, login }),
      })),
    ),
    granted: wanted.flatMap(({ login, tables }) => tables.map((name) => ({ login, name }))),
  }
  return context.transport(
    owner,
    [
      ROLES_LOCK,
      {
        text: 'SELECT FROM set_config($1, $2, true)',
        values: [READERS_SETTING, JSON.stringify(request)],
      },
      { text: `SET LOCAL ROLE ${sync}` },
      {
        text: `DO $$ BEGIN
          IF (SELECT ticket FROM ${READERS_LEDGER}) >= ${ticket.toString()} THEN
            RAISE EXCEPTION USING ERRCODE = '${SUPERSEDED}';
          END IF;
        END $$`,
      },
      { text: 'RESET ROLE' },
      { text: CREATE_MISSING },
      ...wanted.flatMap(({ login }) => readSettingsOf(login)),
      { text: `SET LOCAL ROLE ${sync}` },
      ...wanted.flatMap(({ login }) => [
        { text: `REVOKE ALL ON ALL TABLES IN SCHEMA ${SYNC_SCHEMA} FROM ${quoted(login)}` },
        { text: `GRANT USAGE ON SCHEMA ${SYNC_SCHEMA} TO ${quoted(login)}` },
      ]),
      { text: GRANT_EXISTING },
      { text: `UPDATE ${READERS_LEDGER} SET ticket = ${ticket.toString()}` },
      { text: 'RESET ROLE' },
      { text: DROP_LEAVING },
    ],
    signal,
  )
}

async function reconcileReaders(
  context: Context,
  owner: DatabaseUrl,
  ticket: bigint,
  wanted: readonly WantedReader[],
): Promise<ReadersAnswer> {
  const logins = wanted.map(({ roleId, tables }) => ({ login: roleLogin(roleId), tables }))
  const signal = budget()
  const first = await reconcileOnce(context, owner, ticket, logins, signal)
  const answer =
    first.kind === 'REFUSED' && RACES.has(first.code)
      ? await reconcileOnce(context, owner, ticket, logins, signal)
      : first
  return answer.kind === 'REFUSED' && answer.code === SUPERSEDED ? { kind: 'SUPERSEDED' } : answer
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
      ROLES_LOCK,
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
          ROLES_LOCK,
          { text: `REVOKE ALL ON ALL TABLES IN SCHEMA ${SYNC_SCHEMA} FROM ${logins}` },
          { text: `REVOKE USAGE ON SCHEMA ${SYNC_SCHEMA} FROM ${logins}` },
        ]
      : [ROLES_LOCK, { text: `REVOKE SELECT ON ${tableOf(input.copy)} FROM ${logins}` }]
  const answer = await context.transport(sync, statements, budget())
  return answer.kind === 'REFUSED' && NOTHING_TO_REVOKE.has(answer.code)
    ? { kind: 'DONE', value: [] }
    : answer
}

/** What a read of the copies gives: the rows, a refusal by the database, or a failure. */
export type SyncRead =
  | { kind: 'ROWS'; results: readonly ReadResult[] }
  | { kind: 'REFUSED'; sqlstate: string; message: string }
  | { kind: 'NO_LOGIN' }
  | { kind: 'TOO_LARGE' }
  | { kind: 'TIMEOUT' }
  | { kind: 'UNAVAILABLE'; cause?: string }

/** SQLSTATEs of a login that is not there, or whose password is not the derived one. */
const NO_LOGIN = new Set(['28000', '28P01'])

/** Classes of the call's own timeouts: `statement_timeout` and `transaction_timeout`. */
const TIMED_OUT = new Set(['57014', '25P04'])

/**
 * The statements as the read login, in one read-only transaction. What PostgreSQL refuses is
 * refused, whatever the refusal: there is no filter of ours before it.
 */
async function readCopies(
  context: Context,
  reader: DatabaseUrl,
  statements: readonly SqlStatement[],
  signal: AbortSignal,
): Promise<SyncRead> {
  const answer = await context.transport(reader, statements, signal, { readOnly: true })
  switch (answer.kind) {
    case 'READ':
      return Buffer.byteLength(JSON.stringify(answer.results.map(({ rows }) => rows))) >
        REPLY_CAP_BYTES
        ? { kind: 'TOO_LARGE' }
        : { kind: 'ROWS', results: answer.results }
    case 'TOO_LARGE':
      return { kind: 'TOO_LARGE' }
    case 'NO_ANSWER':
      return signal.aborted ? { kind: 'TIMEOUT' } : { kind: 'UNAVAILABLE', cause: answer.cause }
    case 'REFUSED':
      if (NO_LOGIN.has(answer.code)) return { kind: 'NO_LOGIN' }
      if (TIMED_OUT.has(answer.code)) return { kind: 'TIMEOUT' }
      return { kind: 'REFUSED', sqlstate: answer.code, message: answer.message ?? '' }
    default:
      return answer satisfies never
  }
}

/** A copy act of `copy-sql.ts` with the context already given. */
export type Bound<F> = F extends (context: Context, ...rest: infer A) => infer R
  ? (...rest: A) => R
  : never

/** The read login's acts with the context already given. */
export type CopyReader = {
  /** The login that reads the `sync` schema and nothing else, after `ensureSync`; repeatable. */
  ensureReader(owner: DatabaseUrl): Promise<SqlAnswer>
  /** Where the Hub reaches the read login, from the host it recorded, with no call to Neon. */
  readerAddress(host: string): Promise<DatabaseUrl>
  /** A ticket, in a short call: whoever takes one later reads the Hub later. */
  takeReadersTicket(owner: DatabaseUrl): Promise<SqlAnswer>
  /** The database made what the Hub said to the ticket, in one transaction; a ticket not above the ledger's answers `SUPERSEDED`. */
  reconcileReaders(
    owner: DatabaseUrl,
    ticket: bigint,
    wanted: readonly WantedReader[],
  ): Promise<ReadersAnswer>
  /** Where the Hub reaches a role's login, from the host it recorded, with no call to Neon. */
  roleAddress(host: string, roleId: RoleId): Promise<DatabaseUrl>
  /** The statements as the read login, in one read-only transaction. */
  readCopies(
    reader: DatabaseUrl,
    statements: readonly SqlStatement[],
    signal: AbortSignal,
  ): Promise<SyncRead>
}

export function copyReader(context: Context): CopyReader {
  return {
    ensureReader: (owner) => ensureReader(context, owner),
    readerAddress: (host) => loginAddress(context, host, READ_LOGIN),
    takeReadersTicket: (owner) => takeReadersTicket(context, owner),
    reconcileReaders: (owner, ticket, wanted) => reconcileReaders(context, owner, ticket, wanted),
    roleAddress: async (host, roleId) => loginAddress(context, host, roleLogin(roleId)),
    readCopies: (reader, statements, signal) => readCopies(context, reader, statements, signal),
  }
}
