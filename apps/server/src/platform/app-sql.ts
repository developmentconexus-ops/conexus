import { appLoginPassword } from '@conexus/hub-api'
import type { DatabaseUrl } from './database.ts'

export type SqlStatement = Readonly<{ text: string; values?: readonly unknown[] }>

export type Row = Readonly<Record<string, unknown>>

/** What PostgreSQL said to one transaction: a SQLSTATE left no effect; silence may have left it. */
export type SqlAnswer =
  | { kind: 'DONE'; value: Row[][] }
  | { kind: 'REFUSED'; code: string; table?: string; column?: string; constraint?: string }
  /** `cause` names what went silent (an error's name or class), never its message. */
  | { kind: 'NO_ANSWER'; cause?: string }
  /** A read whose reply passed the cap: only a read ever gets it (code C59). */
  | { kind: 'TOO_LARGE' }

/** A read-only call's first statement: the columns PostgreSQL named, whatever their names, and rows as arrays. */
export type SqlRead = { kind: 'READ'; columns: string[]; rows: unknown[][] }

/** Runs the statements in one transaction as the URL's login, all or none; a read-only one answers with its columns. */
export type SqlTransport = {
  (url: DatabaseUrl, statements: readonly SqlStatement[], signal: AbortSignal): Promise<SqlAnswer>
  (
    url: DatabaseUrl,
    statements: readonly SqlStatement[],
    signal: AbortSignal,
    options: Readonly<{ readOnly: true }>,
  ): Promise<Exclude<SqlAnswer, { kind: 'DONE' }> | SqlRead>
}

/** A SQL reply past this is silence: the Hub's own statements read a few rows (code C59). */
export const REPLY_CAP_BYTES = 1024 * 1024

/** An identifier as SQL reads it: the Projeto's id keeps its case. */
export function quoted(name: string): string {
  return `"${name.replaceAll('"', '""')}"`
}

/** The ledger of the app's migrations, in its schema; the run login cannot read it. */
export const LEDGER = 'conexus_migration'

export type Context = { transport: SqlTransport; key: string }

export async function existingRoles(
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

/** `CREATE ROLE` for each of the logins the server does not have yet, or the answer that stopped the look. */
export async function missingLogins(
  context: Context,
  owner: DatabaseUrl,
  logins: string[],
  signal: AbortSignal,
) {
  const roles = await existingRoles(context, owner, logins, signal)
  if (roles.kind !== 'DONE') return roles
  const created: SqlStatement[] = []
  for (const login of logins) {
    if (roles.names.has(login)) continue
    const password = await appLoginPassword({ key: context.key, login })
    created.push({ text: `CREATE ROLE ${quoted(login)} LOGIN PASSWORD '${password}'` })
  }
  return created
}
