import { AccountRef, connectorOf } from '@conexus/connectors'
import type { KeptCheck, Person, TestCheck, TestResult } from '@conexus/hub-api'
import { and, sql } from 'drizzle-orm'
import { Failure } from '../../platform/failure.ts'
import { open } from '../../platform/seal.ts'
import type { OpenedConnection } from './executor.ts'
import type { Probed } from './probe.ts'
import { probed } from './probe.ts'
import type { Deps, OfConnection } from './rows.ts'
import { admitted, columns, ofCompany, scopeOf, sealContext, sealedOf, viewOf } from './rows.ts'
import { connection } from './tables.ts'
import { accessFor } from './tokens.ts'

/**
 * Testar's first step (the failure table): a short command that admits and opens the seal, so no
 * database connection is held while the provider answers (data D22). The row's `linked_at` is kept
 * as the database wrote it, to tell the same row from one linked again meanwhile.
 */
function opened(deps: Deps, input: OfConnection): Promise<OpenedConnection> {
  return deps.database.command(scopeOf(input), async (tx) => {
    await admitted(deps, tx, input, 'manageConnections')
    const [row] = await tx
      .select({
        connector: connection.connectorId,
        linkedAt: sql<string>`${connection.linkedAt}::text`,
        revision: connection.revision,
        accountRef: connection.accountRef,
      })
      .from(connection)
      .where(ofCompany(input, input.connectionId))
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
  })
}

const NEXT_STATE = { WORKING: 'ACTIVE', AUTH_REFUSED: 'NEEDS_REAUTH' } as const

/** An item as it is kept: what the provider said stays as its status and code, never its body or message (founder, 2026-10-29). */
function kept(check: TestCheck): KeptCheck {
  if (!('native' in check)) return check
  const { status, code } = check.native
  return { ...check, native: { status, code } }
}

type Written = Extract<Probed, { result: 'WORKING' | 'AUTH_REFUSED' }>

/** What a finished test writes: the state, who tested and when; the items of a working test, nothing of a refused key (founder, X2). */
function writtenBy(probe: Written, tester: Person) {
  return {
    state: NEXT_STATE[probe.result],
    testedAt: sql`statement_timestamp()`,
    testedBy: tester.id,
    lastTest: probe.result === 'WORKING' ? probe.checks.map(kept) : null,
  }
}

/**
 * Testar's last step: the state and the last test are written only on the row the first step
 * opened (its id and `linked_at`); one removed meanwhile is not found and nothing changes. An
 * unreachable provider, one that answered what the kit cannot read, or one that refused the
 * installation's app, changes nothing.
 */
function recorded(deps: Deps, input: OfConnection, opened: OpenedConnection, probe: Probed) {
  return deps.database.command(scopeOf(input), async (tx) => {
    await admitted(deps, tx, input, 'manageConnections')
    const same = and(
      ofCompany(input, input.connectionId),
      sql`${connection.linkedAt} = ${opened.linkedAt}::timestamptz`,
    )
    const written = probe.result === 'WORKING' || probe.result === 'AUTH_REFUSED' ? probe : null
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

/** Testar (criteria 10 to 12): the three steps of the failure table. */
export async function test(deps: Deps, input: OfConnection): Promise<TestResult> {
  const open = await opened(deps, input)
  const probe = await probed({ ...deps, access: accessFor(deps, input) }, open)
  const view = await recorded(deps, input, open, probe)
  return probe.result === 'WORKING'
    ? { result: 'WORKING', checks: probe.checks, connection: view }
    : { ...probe, connection: view }
}
