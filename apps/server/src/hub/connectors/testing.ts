import { AccountRef, connectorOf } from '@conexus/connectors'
import type { CompanyId, ConnectionId, Person, TestResult } from '@conexus/hub-api'
import { and, eq, sql } from 'drizzle-orm'
import type { ReadTx } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { open } from '../../platform/seal.ts'
import type { Checked } from './check.ts'
import { checked } from './check.ts'
import type { OpenedConnection } from './executor.ts'
import type { Deps, OfConnection } from './rows.ts'
import { admitted, columns, ofCompany, scopeOf, sealContext, sealedOf, viewOf } from './rows.ts'
import { connection } from './tables.ts'
import { accessFor } from './tokens.ts'

/**
 * Testar's first step (the failure table): a short command that admits and opens the seal, so no
 * database connection is held while the provider answers (data D22). The row's `linked_at` is kept
 * as the database wrote it, to tell the same row from one linked again meanwhile.
 */
export function opened(deps: Deps, input: OfConnection): Promise<OpenedConnection> {
  return deps.database.command(scopeOf(input), async (tx) => {
    await admitted(deps, tx, input, 'manageConnections')
    return openedIn(deps, tx, input)
  })
}

/** The connection's seal opened inside a transaction the caller admitted (an app call's grant is its admission). */
export async function openedIn(
  deps: Deps,
  tx: ReadTx,
  input: { companyId: CompanyId; connectionId: ConnectionId },
): Promise<OpenedConnection> {
  const [row] = await tx
    .select({
      connector: connection.connectorId,
      linkedAt: sql<string>`${connection.linkedAt}::text`,
      revision: connection.revision,
      accountRef: connection.accountRef,
    })
    .from(connection)
    .where(and(eq(connection.id, input.connectionId), eq(connection.companyId, input.companyId)))
  if (row === undefined) throw new Failure('CONNECTION_NOT_FOUND')
  const connector = connectorOf(row.connector)
  // A connector the kit no longer has cannot rebuild its seal's context: the seal does not open.
  if (connector === undefined)
    throw new Failure('SEAL_REFUSED', { details: { reason: 'connector gone' } })
  const id = input.connectionId
  const context = sealContext({ id, companyId: input.companyId, connector })
  const credential = open(deps.sealKeys, context, await sealedOf(tx, id))
  const accountRef = row.accountRef === null ? null : AccountRef.parse(row.accountRef)
  return { id, linkedAt: row.linkedAt, connector, credential, revision: row.revision, accountRef }
}

const NEXT_STATE = { WORKING: 'ACTIVE', AUTH_REFUSED: 'NEEDS_REAUTH' } as const

type Written = Extract<Checked, { result: 'WORKING' | 'AUTH_REFUSED' }>

/** What a finished test writes: the state, who tested and when. */
function writtenBy(check: Written, tester: Pick<Person, 'id'>) {
  return {
    state: NEXT_STATE[check.result],
    testedAt: sql`statement_timestamp()`,
    testedBy: tester.id,
  }
}

/**
 * Testar's last step: the state is written only on the row the first step opened (its id and
 * `linked_at`); one removed meanwhile is not found and nothing changes. Only a working check and a
 * refused key change the state: the others say nothing about the key.
 */
function recorded(deps: Deps, input: OfConnection, opened: OpenedConnection, check: Checked) {
  return deps.database.command(scopeOf(input), async (tx) => {
    await admitted(deps, tx, input, 'manageConnections')
    const same = and(
      ofCompany(input, input.connectionId),
      sql`${connection.linkedAt} = ${opened.linkedAt}::timestamptz`,
    )
    const written = check.result === 'WORKING' || check.result === 'AUTH_REFUSED' ? check : null
    const [row] =
      written === null
        ? await tx.select(columns).from(connection).where(same)
        : await tx
            .update(connection)
            .set(writtenBy(written, input.person))
            .where(same)
            .returning(columns)
    if (row === undefined) throw new Failure('CONNECTION_NOT_FOUND')
    return viewOf(row)
  })
}

/** Testar: the three steps of the failure table, one check read between them (founder, 2026-10-30). */
export async function test(deps: Deps, input: OfConnection): Promise<TestResult> {
  const open = await opened(deps, input)
  // The connection's turn: an app's call on it finishes first, and the Testar never shares its token with one.
  const turn = await deps.limits.inTurn(open.id, deps.callDeadlineMs, () =>
    checked({ ...deps, access: accessFor(deps, input) }, open),
  )
  const check: Checked = 'kind' in turn ? { result: 'UNREACHABLE', native: null } : turn
  return { ...check, connection: await recorded(deps, input, open, check) }
}
