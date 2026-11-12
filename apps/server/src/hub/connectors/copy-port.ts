import type {
  ConnectorId,
  CopyDefinition,
  CopyDefinitionV1,
  CopyDefinitionV2,
  CopyModel,
  CopyPage,
  CopyPosition,
  Operation,
  PageInput,
} from '@conexus/connectors'
import {
  AccountRef,
  CopyPageSchema,
  connectorOf,
  listInputOf,
  listPageOf,
  Rows,
} from '@conexus/connectors'
import type { CompanyId, ConnectionId, PersonId } from '@conexus/hub-api'
import { ConnectorId as HubConnectorId, OperationId } from '@conexus/hub-api'
import { and, eq, inArray } from 'drizzle-orm'
import type { ReadTx } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { speakerOf } from '../identity/public.ts'
import type { OpenedConnection } from './executor.ts'
import type { NotInRole, ReadAnswer } from './read.ts'
import { readThrough } from './read.ts'
import { operationLabel } from './role-kit.ts'
import type { Deps } from './rows.ts'
import { connectorIn, usable } from './rows.ts'
import { lackedDoorRead } from './speaking.ts'
import { connection } from './tables.ts'
import { openedIn } from './testing.ts'

type CopySourceFailure =
  | 'COPY_SOURCE_REFUSED'
  | 'COPY_SOURCE_NEEDS_REAUTH'
  | 'COPY_SOURCE_UNREACHABLE'
  | 'COPY_SOURCE_UNREADABLE'

/** The read's refusal whole, as `readThrough` gave it: the Builder's proof gives it all to the model (C79). */
export type CopyRefusal = Exclude<ReadAnswer, { kind: 'OK' }> | NotInRole

/** One page of a version 1 copy through the connector's paged read, for the run and the Builder's proof. */
type PagedRead =
  | Readonly<{ kind: 'PAGE'; page: CopyPage }>
  | Readonly<{ kind: 'REFUSED'; refusal: CopyRefusal }>
  /** The connection is gone, not ACTIVE, or of a connector that offers no copies. */
  | Readonly<{ kind: 'NO_CONNECTION' }>
  | InLine

/** One page of a copy's source as the run reads it. */
export type CopyRead =
  | Readonly<{ kind: 'PAGE'; page: CopyPage; next: CopyPosition | null; total: number | null }>
  /** The provider answered 429 (decision 0058), or the connector's lane passed its deadline (`waitMs` null). */
  | Readonly<{ kind: 'WAIT'; waitMs: number | null }>
  /** The cursor is older than the read's declared validity: nothing was called, the pass starts again. */
  | Readonly<{ kind: 'STALE' }>
  | Readonly<{ kind: 'FAILED'; code: CopySourceFailure | 'COPY_SOURCE_CEILING' }>
  | Readonly<{ kind: 'NO_CONNECTION' }>

type OfConnection = Readonly<{ companyId: CompanyId; connectionId: ConnectionId }>

function connectorOfRow(deps: Deps, input: OfConnection, personId: PersonId | null) {
  const scope = { kind: 'COMPANY', companyId: input.companyId, personId } as const
  return deps.database.read(scope, async (tx) => {
    const [row] = await tx
      .select({ connector: connection.connectorId })
      .from(connection)
      .where(and(eq(connection.id, input.connectionId), eq(connection.companyId, input.companyId)))
    return row === undefined ? undefined : connectorIn(deps, row.connector)
  })
}

/**
 * The company's connection a copy is turned on from, read in the caller's transaction: its
 * connector and its account (none on a connector whose account is `none`) when it is ACTIVE; none
 * when the company has no such connection.
 */
export async function connectionForCopy(
  tx: ReadTx,
  input: OfConnection,
): Promise<
  | { kind: 'ACTIVE'; connectorId: HubConnectorId; accountRef: AccountRef | null }
  | { kind: 'NOT_ACTIVE' }
  | undefined
> {
  const [row] = await tx
    .select({
      state: connection.state,
      connectorId: connection.connectorId,
      accountRef: connection.accountRef,
    })
    .from(connection)
    .where(and(eq(connection.id, input.connectionId), eq(connection.companyId, input.companyId)))
  if (row === undefined) return undefined
  if (row.state !== 'ACTIVE') return { kind: 'NOT_ACTIVE' }
  const accountRef = row.accountRef === null ? null : AccountRef.parse(row.accountRef)
  return { kind: 'ACTIVE', connectorId: HubConnectorId.parse(row.connectorId), accountRef }
}

/**
 * The label of the first read of the connection's read door the person's role does not hold; none
 * when the role holds them all. The speaker is read in the caller's transaction; the role's answer
 * (`mayUseEach`) opens a transaction of its own. Who turns a proposal on must be able to read what
 * it copies (Capacidade 3).
 */
export async function lackedReadOf(
  deps: Pick<Deps, 'identity'>,
  tx: ReadTx,
  input: OfConnection & { connectorId: HubConnectorId; personId: PersonId },
): Promise<string | undefined> {
  const connector = connectorOf(input.connectorId)
  const first = Object.values(connector?.readDoor ?? {})[0]
  const speaker = await speakerOf(tx, input.companyId, input.personId)
  if (connector === undefined || speaker === undefined)
    return first === undefined ? input.connectorId : operationLabel(input.connectorId, first.id)
  const lacked = await lackedDoorRead(deps, input.companyId, speaker, {
    connectionId: input.connectionId,
    connector,
  })
  return lacked === undefined ? undefined : operationLabel(input.connectorId, lacked.id)
}

/** The name and connector of each of the company's connections named; one gone is left out. */
export async function connectionNamesOf(
  tx: ReadTx,
  input: { companyId: CompanyId; ids: readonly ConnectionId[] },
): Promise<Map<string, { name: string; connector: HubConnectorId }>> {
  if (input.ids.length === 0) return new Map()
  const rows = await tx
    .select({ id: connection.id, name: connection.name, connector: connection.connectorId })
    .from(connection)
    .where(and(eq(connection.companyId, input.companyId), inArray(connection.id, [...input.ids])))
  return new Map(
    rows.map((row) => [row.id, { name: row.name, connector: HubConnectorId.parse(row.connector) }]),
  )
}

/** The connection opened for one page when it is ACTIVE; none otherwise. */
function openedForCopy(deps: Deps, input: OfConnection & { enabledBy: PersonId }) {
  const scope = { kind: 'COMPANY', companyId: input.companyId, personId: input.enabledBy } as const
  return deps.database.read(scope, async (tx): Promise<OpenedConnection | undefined> => {
    const [row] = await tx
      .select({ id: connection.id })
      .from(connection)
      .where(
        and(
          eq(connection.id, input.connectionId),
          eq(connection.companyId, input.companyId),
          usable,
        ),
      )
    if (row === undefined) return undefined
    try {
      return await openedIn(deps, tx, input)
    } catch (error) {
      if (error instanceof Failure && error.code === 'CONNECTION_NOT_FOUND') return undefined
      throw error
    }
  })
}

type ReadOf = Readonly<{
  input: OfConnection & { enabledBy: PersonId; signal: AbortSignal }
  opened: OpenedConnection
  operation: Operation<unknown, unknown, 'read'>
  value: unknown
}>

/** The connector's copy lane passed its deadline before the call: nothing was asked. */
type InLine = Readonly<{ kind: 'IN_LINE' }>

/**
 * The read every other reader takes, the connection's turn, its token, the deadline and the log
 * line, speaking as a version that declares only the operation; in the connector's copy lane first
 * when its provider counts the limit by the app.
 */
async function readAsCopy(deps: Deps, a: ReadOf): Promise<ReadAnswer | NotInRole | InLine> {
  const { input, opened, operation } = a
  function read() {
    return readThrough(deps, {
      by: 'copy',
      ids: { companyId: input.companyId },
      viewer: { person: { id: input.enabledBy }, companyId: input.companyId },
      speaker: {
        kind: 'VERSION',
        declared: [
          { connectionId: input.connectionId, operation: OperationId.parse(operation.id) },
        ],
      },
      opened,
      operation,
      input: a.value,
      deadlineMs: deps.callDeadlineMs,
      signal: input.signal,
    })
  }
  if (opened.connector.callLimit?.countedBy !== 'APP') return read()
  const turn = await deps.limits.inCopyTurn(
    opened.connector.id,
    deps.callDeadlineMs,
    async () => ({ kind: 'READ', answer: await read() }) as const,
    input.signal,
  )
  return turn.kind === 'READ' ? turn.answer : { kind: 'IN_LINE' }
}

/**
 * One page of a version 1 copy through the connector's paged read. The one way to `readThrough`
 * for a version 1 copy's run and for the Builder's proof of a proposal (C26).
 */
export async function copyPage(
  deps: Deps,
  input: OfConnection & { enabledBy: PersonId; input: PageInput; signal: AbortSignal },
): Promise<PagedRead> {
  const opened = await openedForCopy(deps, input)
  const read = opened?.connector.copy?.read
  if (opened === undefined || read === undefined) return { kind: 'NO_CONNECTION' }
  const answer = await readAsCopy(deps, { input, opened, operation: read, value: input.input })
  if (answer.kind === 'IN_LINE') return answer
  if (answer.kind === 'OK') return { kind: 'PAGE', page: CopyPageSchema.parse(answer.value) }
  return { kind: 'REFUSED', refusal: answer }
}

function sourceFailureOf(answer: Exclude<CopyRefusal, { kind: 'BUSY' }>): CopySourceFailure {
  switch (answer.kind) {
    case 'REFUSED':
    case 'NOT_IN_ROLE':
      return 'COPY_SOURCE_REFUSED'
    case 'AUTH_REFUSED':
      return 'COPY_SOURCE_NEEDS_REAUTH'
    case 'UNREACHABLE':
    case 'DEADLINE':
      return 'COPY_SOURCE_UNREACHABLE'
    case 'UNREADABLE':
      return 'COPY_SOURCE_UNREADABLE'
    default:
      return answer satisfies never
  }
}

/** A refusal as the run keeps it: 429 is a wait, every other its code. */
function refusedRead(refusal: CopyRefusal): CopyRead {
  return refusal.kind === 'BUSY'
    ? { kind: 'WAIT', waitMs: refusal.waitMs }
    : { kind: 'FAILED', code: sourceFailureOf(refusal) }
}

export type SourcePage = OfConnection & {
  enabledBy: PersonId
  definition: CopyDefinition
  position: CopyPosition | null
  /** The watermark less a day: a day in version 1, an instant in version 2; null on a source's first pass (#940). */
  since: string | null
  windowFrom: string | null
  limit: number
  signal: AbortSignal
}

/** The key of the page's last row, the next page's start; the same position when the page had no row. */
function lastKey(definition: CopyDefinitionV1, page: CopyPage, position: CopyPosition | null) {
  const last = page.rows.at(-1)
  if (last === undefined) return position
  const { columns, key } = definition
  const after = key.map((name) => Number(last[columns.findIndex((column) => column.name === name)]))
  return { kind: 'KEY', after } as const
}

async function pageV1(deps: Deps, a: SourcePage & { definition: CopyDefinitionV1 }) {
  const after = a.position?.kind === 'KEY' ? a.position.after : null
  const { definition, since, windowFrom, limit } = a
  const read = await copyPage(deps, {
    ...a,
    input: { definition, after, since, windowFrom, limit },
  })
  if (read.kind === 'NO_CONNECTION') return read
  if (read.kind === 'IN_LINE') return { kind: 'WAIT', waitMs: null } as const
  if (read.kind === 'REFUSED') return refusedRead(read.refusal)
  const next = lastKey(definition, read.page, a.position)
  return { kind: 'PAGE', page: read.page, next, total: null } as const
}

function isListRead(
  operation: Operation<unknown, unknown>,
  id: string,
): operation is Operation<unknown, unknown, 'read'> {
  return operation.id === id && operation.class === 'read' && operation.list !== undefined
}

async function pageV2(
  deps: Deps,
  a: SourcePage & { definition: CopyDefinitionV2 },
): Promise<CopyRead> {
  const opened = await openedForCopy(deps, a)
  const { definition, position } = a
  const operation = opened?.connector.operations.find((each) =>
    isListRead(each, definition.source.operation),
  )
  const list = operation?.list
  if (opened === undefined || operation === undefined || list === undefined)
    return { kind: 'NO_CONNECTION' }
  const at = deps.now()
  if (
    position?.kind === 'CURSOR' &&
    list.paging.kind === 'CURSOR' &&
    at.getTime() - Date.parse(position.at) > list.paging.ttlMs
  )
    return { kind: 'STALE' }
  const value = listInputOf({ list, definition, position, since: a.since })
  const answer = await readAsCopy(deps, { input: a, opened, operation, value })
  if (answer.kind === 'IN_LINE') return { kind: 'WAIT', waitMs: null }
  if (answer.kind !== 'OK') return refusedRead(answer)
  const rows = Rows.safeParse(answer.value)
  if (!rows.success) return { kind: 'FAILED', code: 'COPY_SOURCE_UNREADABLE' }
  const page = listPageOf({ list, definition, position, rows: rows.data, at })
  switch (page.kind) {
    case 'PAGE': {
      const { rows: cells, more, next, total } = page
      return { kind: 'PAGE', page: { rows: cells, more }, next, total }
    }
    case 'MISFIT':
    case 'UNREADABLE':
      return { kind: 'FAILED', code: 'COPY_SOURCE_UNREADABLE' }
    case 'CEILING':
      return { kind: 'FAILED', code: 'COPY_SOURCE_CEILING' }
    default:
      return page satisfies never
  }
}

/** One page of a copy's source: version 1 through the connector's paged read, version 2 through the list read it names. */
function readPage(deps: Deps, a: SourcePage): Promise<CopyRead> {
  const { definition } = a
  return definition.version === 1
    ? pageV1(deps, { ...a, definition })
    : pageV2(deps, { ...a, definition })
}

/**
 * The copies' door to the outside (decision 0056): the templates of each connector, and one page
 * of a copy's source (`readPage`).
 */
export function createCopyPort(deps: Deps) {
  return Object.freeze({
    async models(input: OfConnection): Promise<readonly CopyModel[] | undefined> {
      return (await connectorOfRow(deps, input, null))?.copy?.models
    },
    catalog(): readonly { connector: ConnectorId; model: CopyModel }[] {
      return deps.catalog.flatMap((connector) =>
        (connector.copy?.models ?? []).map((model) => ({ connector: connector.id, model })),
      )
    },
    readPage: (input: SourcePage): Promise<CopyRead> => readPage(deps, input),
    /** Where the connector's provider counts its call limit; none when it declares no list read. */
    countedBy(connector: string): 'APP' | 'ACCOUNT' | null {
      return connectorIn(deps, connector)?.callLimit?.countedBy ?? null
    },
  })
}
